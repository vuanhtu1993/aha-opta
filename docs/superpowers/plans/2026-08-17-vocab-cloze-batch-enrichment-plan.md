# Vocab Cloze Batch Enrichment Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Refactor Cloze sentence generation from 1-by-1 single LLM calls to a batch generation architecture (15 words per Gemini request), reducing API calls by ~93%. Expose a manual batch generation API endpoint and a user-controlled UI banner in `/vocab`.

**Architecture:** Implement `generateBatchExampleSentences` in `cloze-enricher.ts` using structured Zod schema `GeminiBatchClozeSchema`. Add `POST /api/vocab/generate-cloze-batch` to allow single-click manual batch processing. Refactor `scripts/enrich-vocab-sentences.ts` to process cards in chunks of 15. Add `VocabClozeBatchBanner.tsx` interactive Client Component inside the `/vocab` page.

**Tech Stack:** Next.js 16 (App Router), TypeScript, Mongoose, Zod, Gemini API via `@/lib/utils/gemini`, Tailwind CSS, SWR.

---

## Proposed Changes

### Service & API Layer

#### [MODIFY] [cloze-enricher.ts](file:///Users/anhtus/Documents/Development/NextJS/aha-tools/src/lib/vocab/cloze-enricher.ts)
- Define `GeminiBatchClozeSchema` Zod schema.
- Export `generateBatchExampleSentences(items: Array<{ id: string; word: string; explanation: string; level?: string }>)`.
- Refactor single `generateExampleSentences` to delegate to `generateBatchExampleSentences`.

#### [NEW] [route.ts](file:///Users/anhtus/Documents/Development/NextJS/aha-tools/src/app/api/vocab/generate-cloze-batch/route.ts)
- `GET /api/vocab/generate-cloze-batch`: returns `{ pendingCount: number }` (count of cards missing `exampleSentences`).
- `POST /api/vocab/generate-cloze-batch`: accepts optional `{ cardIds?: string[], limit?: number }`, fetches target cards without `exampleSentences`, chunks into 15 words per LLM call, calls `generateBatchExampleSentences`, updates MongoDB in bulk, returns status and count.

#### [MODIFY] [enrich-vocab-sentences.ts](file:///Users/anhtus/Documents/Development/NextJS/aha-tools/scripts/enrich-vocab-sentences.ts)
- Update script to chunk 130+ target cards into groups of 15.
- Call `generateBatchExampleSentences` per chunk and log batch progress.

---

### UI & Component Layer

#### [NEW] [VocabClozeBatchBanner.tsx](file:///Users/anhtus/Documents/Development/NextJS/aha-tools/src/components/vocab/VocabClozeBatchBanner.tsx)
- Client component using SWR to fetch pending Cloze cards count from `GET /api/vocab/generate-cloze-batch`.
- Renders an interactive banner when pending cards > 0: `✨ Có N từ vựng chưa có câu ví dụ Cloze [ 🤖 Tạo câu Cloze bằng AI ]`.
- Handles loading/generating state with spinner & progress bar.
- On completion, mutate SWR data to refresh vocab cards and stats.

#### [MODIFY] [page.tsx](file:///Users/anhtus/Documents/Development/NextJS/aha-tools/src/app/vocab/page.tsx)
- Mount `<VocabClozeBatchBanner />` between `VocabStatsBar` and `VocabCardDataLoader`.

---

## Implementation Tasks

### Task 1: Batch Cloze Generation Service in `cloze-enricher.ts`

**Files:**
- Modify: `src/lib/vocab/cloze-enricher.ts`

- [ ] **Step 1: Define GeminiBatchClozeSchema and implement generateBatchExampleSentences**

In `src/lib/vocab/cloze-enricher.ts`:
```ts
import { z } from "zod";
import { geminiService } from "@/lib/utils/gemini";
import { connectDB } from "@/lib/db/mongoose";
import VocabCard from "@/lib/db/models/VocabCard";

export const GeminiBatchClozeSchema = z.object({
  results: z.array(
    z.object({
      word: z.string().describe("Exact word from the prompt"),
      sentences: z.array(
        z.object({
          sentence: z.string().describe("Sentence with the word replaced by ___"),
          answer: z.string().describe("The exact target word"),
        })
      ),
    })
  ),
});

export interface BatchWordItem {
  id: string;
  word: string;
  explanation: string;
  level?: string;
}

export async function generateBatchExampleSentences(
  items: BatchWordItem[]
): Promise<Map<string, Array<{ sentence: string; answer: string }>>> {
  const resultMap = new Map<string, Array<{ sentence: string; answer: string }>>();
  if (!items || items.length === 0) return resultMap;

  const itemsFormatted = items
    .map(
      (item, idx) =>
        `[${idx + 1}] Word: "${item.word}" (${item.level || "B1"})\n    Definition: "${item.explanation}"`
    )
    .join("\n");

  const prompt = `You are an English vocabulary teacher. Generate fill-in-the-blank sentences for the following list of vocabulary items.

${itemsFormatted}

Requirements for EACH item:
1. Generate exactly 3 fill-in-the-blank sentences per word.
2. The target word must appear replaced with "___" (three underscores).
3. Sentences must be natural, native-speaker quality, reflecting real professional, IT, academic, or daily conversation context.
4. Set "word" to the exact input word and "answer" to the exact input word.

Return valid JSON with the specified schema.`;

  try {
    const response = await geminiService.invokeStructured(
      GeminiBatchClozeSchema,
      [{ role: "user", content: prompt }]
    );

    if (response && response.results) {
      for (const res of response.results) {
        if (res.word && res.sentences) {
          resultMap.set(res.word.toLowerCase(), res.sentences);
        }
      }
    }
  } catch (err) {
    console.error("[ClozeEnricher] Batch generation error:", err);
  }

  return resultMap;
}

export async function generateExampleSentences(
  word: string,
  explanation: string,
  level: string = "B1"
): Promise<Array<{ sentence: string; answer: string }>> {
  const map = await generateBatchExampleSentences([{ id: "1", word, explanation, level }]);
  return map.get(word.toLowerCase()) || [];
}

export async function generateAndSaveExampleSentences(
  cardId: string,
  word: string,
  explanation: string,
  level: string = "B1"
): Promise<void> {
  const sentences = await generateExampleSentences(word, explanation, level);
  if (!sentences || sentences.length === 0) return;

  await connectDB();
  await VocabCard.findByIdAndUpdate(cardId, {
    $set: { exampleSentences: sentences },
  });
}
```

- [ ] **Step 2: Verify Type-check**

Run: `npx tsc --noEmit`
Expected: 0 errors

- [ ] **Step 3: Commit**

```bash
git add src/lib/vocab/cloze-enricher.ts
git commit -m "feat(vocab): add generateBatchExampleSentences for batch cloze generation"
```

---

### Task 2: Create API Route `POST /api/vocab/generate-cloze-batch`

**Files:**
- Create: `src/app/api/vocab/generate-cloze-batch/route.ts`

- [ ] **Step 1: Write GET and POST handlers in route.ts**

Create `src/app/api/vocab/generate-cloze-batch/route.ts`:
```ts
import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db/mongoose";
import VocabCard from "@/lib/db/models/VocabCard";
import { generateBatchExampleSentences, BatchWordItem } from "@/lib/vocab/cloze-enricher";

export const dynamic = "force-dynamic";
export const revalidate = 0;

/**
 * GET /api/vocab/generate-cloze-batch
 * Returns pending count of cards without exampleSentences
 */
export async function GET() {
  try {
    await connectDB();
    const pendingCount = await VocabCard.countDocuments({
      $or: [
        { exampleSentences: { $exists: false } },
        { exampleSentences: { $size: 0 } },
      ],
    });

    return NextResponse.json({ pendingCount });
  } catch (err: any) {
    console.error("[API/generate-cloze-batch GET]", err);
    return NextResponse.json(
      { error: "Lỗi khi lấy số lượng từ thiếu Cloze" },
      { status: 500 }
    );
  }
}

/**
 * POST /api/vocab/generate-cloze-batch
 * Batch process cards missing exampleSentences (Chunk size: 15 words)
 */
export async function POST(request: NextRequest) {
  try {
    await connectDB();
    let body: any = {};
    try {
      body = await request.json();
    } catch {
      // Empty body allowed
    }

    const limit = Math.min(Math.max(1, body.limit || 45), 100);

    let query: Record<string, any> = {
      $or: [
        { exampleSentences: { $exists: false } },
        { exampleSentences: { $size: 0 } },
      ],
    };

    if (body.cardIds && Array.isArray(body.cardIds) && body.cardIds.length > 0) {
      query = { _id: { $in: body.cardIds } };
    }

    const targetCards = await VocabCard.find(query).limit(limit).lean();

    if (targetCards.length === 0) {
      return NextResponse.json({
        success: true,
        message: "Tất cả từ vựng đã có câu ví dụ Cloze!",
        processedCount: 0,
        updatedCount: 0,
      });
    }

    // Chunk size: 15 words per Gemini call
    const CHUNK_SIZE = 15;
    let updatedCount = 0;

    for (let i = 0; i < targetCards.length; i += CHUNK_SIZE) {
      const chunk = targetCards.slice(i, i + CHUNK_SIZE);
      const batchItems: BatchWordItem[] = chunk.map((c: any) => ({
        id: c._id.toString(),
        word: c.word,
        explanation: c.explanation,
        level: c.level || "B1",
      }));

      const resultMap = await generateBatchExampleSentences(batchItems);

      // Bulk update DB for this chunk
      for (const card of chunk) {
        const sentences = resultMap.get(card.word.toLowerCase());
        if (sentences && sentences.length > 0) {
          await VocabCard.findByIdAndUpdate(card._id, {
            $set: { exampleSentences: sentences },
          });
          updatedCount++;
        }
      }
    }

    return NextResponse.json({
      success: true,
      message: `Đã hoàn tất sinh câu Cloze cho ${updatedCount}/${targetCards.length} từ vựng!`,
      processedCount: targetCards.length,
      updatedCount,
    });
  } catch (err: any) {
    console.error("[API/generate-cloze-batch POST]", err);
    return NextResponse.json(
      { error: "Có lỗi xảy ra khi tạo câu hỏi Cloze theo batch." },
      { status: 500 }
    );
  }
}
```

- [ ] **Step 2: Commit**

```bash
git add src/app/api/vocab/generate-cloze-batch/route.ts
git commit -m "feat(api): create POST /api/vocab/generate-cloze-batch endpoint"
```

---

### Task 3: Refactor Backfill Script `scripts/enrich-vocab-sentences.ts`

**Files:**
- Modify: `scripts/enrich-vocab-sentences.ts`

- [ ] **Step 1: Refactor script to use batch processing**

Update `scripts/enrich-vocab-sentences.ts`:
```ts
import * as dotenv from "dotenv";
import path from "path";

dotenv.config({ path: path.resolve(process.cwd(), ".env.local") });
dotenv.config({ path: path.resolve(process.cwd(), ".env") });

import mongoose from "mongoose";
import { connectDB } from "../src/lib/db/mongoose";
import VocabCard from "../src/lib/db/models/VocabCard";

async function main() {
  console.log("🚀 Starting Batch Vocab Example Sentences Backfill Script...");
  await connectDB();

  const { generateBatchExampleSentences, BatchWordItem } = await import(
    "../src/lib/vocab/cloze-enricher"
  );

  const targetCards = await VocabCard.find({
    $or: [
      { exampleSentences: { $exists: false } },
      { exampleSentences: { $size: 0 } },
    ],
  }).lean();

  console.log(`Found ${targetCards.length} vocab cards needing example sentences.`);
  if (targetCards.length === 0) {
    console.log("✅ All cards already have example sentences!");
    await mongoose.disconnect();
    process.exit(0);
  }

  const BATCH_SIZE = 15;
  let successCount = 0;
  const totalBatches = Math.ceil(targetCards.length / BATCH_SIZE);

  for (let b = 0; b < totalBatches; b++) {
    const chunk = targetCards.slice(b * BATCH_SIZE, (b + 1) * BATCH_SIZE);
    console.log(
      `\n📦 Processing Batch [${b + 1}/${totalBatches}] (${chunk.length} words: ${chunk.map((c: any) => c.word).join(", ")})...`
    );

    const items: BatchWordItem[] = chunk.map((c: any) => ({
      id: c._id.toString(),
      word: c.word,
      explanation: c.explanation,
      level: c.level || "B1",
    }));

    const resultMap = await generateBatchExampleSentences(items);

    for (const card of chunk) {
      const sentences = resultMap.get(card.word.toLowerCase());
      if (sentences && sentences.length > 0) {
        await VocabCard.findByIdAndUpdate(card._id, {
          $set: { exampleSentences: sentences },
        });
        successCount++;
        console.log(`  └─ ✅ "${card.word}": ${sentences.length} sentences generated.`);
      } else {
        console.log(`  └─ ⚠️ "${card.word}": Failed to match sentences in batch response.`);
      }
    }

    // Small delay between batches to respect rate limits safely
    await new Promise((r) => setTimeout(r, 500));
  }

  console.log(`\n🎉 Backfill completed! Enriched ${successCount}/${targetCards.length} cards.`);
  await mongoose.disconnect();
  process.exit(0);
}

main().catch((err) => {
  console.error("❌ Fatal Error in backfill script:", err);
  process.exit(1);
});
```

- [ ] **Step 2: Commit**

```bash
git add scripts/enrich-vocab-sentences.ts
git commit -m "refactor(script): rewrite backfill script to process cards in batches of 15"
```

---

### Task 4: UI Banner Component `VocabClozeBatchBanner.tsx` in `/vocab`

**Files:**
- Create: `src/components/vocab/VocabClozeBatchBanner.tsx`
- Modify: `src/app/vocab/page.tsx`

- [ ] **Step 1: Create VocabClozeBatchBanner component**

Create `src/components/vocab/VocabClozeBatchBanner.tsx`:
```tsx
"use client";

import React, { useState } from "react";
import useSWR, { mutate } from "swr";
import { Sparkles, Loader2, CheckCircle2 } from "lucide-react";

const fetcher = (url: string) => fetch(url).then((res) => res.json());

export default function VocabClozeBatchBanner() {
  const { data, isLoading } = useSWR("/api/vocab/generate-cloze-batch", fetcher);
  const [isGenerating, setIsGenerating] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const pendingCount = data?.pendingCount ?? 0;

  if (isLoading || (pendingCount === 0 && !successMessage)) {
    return null; // Don't show banner if no cards need Cloze generation
  }

  const handleGenerateBatch = async () => {
    try {
      setIsGenerating(true);
      setSuccessMessage(null);

      const res = await fetch("/api/vocab/generate-cloze-batch", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ limit: 45 }),
      });

      const result = await res.json();

      if (res.ok && result.success) {
        setSuccessMessage(result.message);
        // Refresh SWR state for pending count, due count, and cards list
        mutate("/api/vocab/generate-cloze-batch");
        mutate("/api/vocab/due-count");
        mutate("/api/vocab");
      }
    } catch (err) {
      console.error("Failed to generate cloze batch", err);
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="bg-gradient-to-r from-indigo-500/10 via-purple-500/10 to-pink-500/10 dark:from-indigo-950/40 dark:via-purple-950/40 dark:to-pink-950/40 border border-indigo-200/80 dark:border-indigo-800/80 rounded-2xl p-4 space-y-2 shadow-2xs">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2 min-w-0">
          <div className="p-2 rounded-xl bg-indigo-500 text-white shrink-0 shadow-xs">
            <Sparkles className="w-4 h-4" />
          </div>
          <div className="min-w-0">
            <h4 className="text-xs font-black text-slate-900 dark:text-white flex items-center gap-1.5">
              <span>Tối ưu câu Cloze với AI</span>
              <span className="px-2 py-0.5 rounded-full bg-indigo-100 dark:bg-indigo-900/60 text-indigo-700 dark:text-indigo-300 text-[10px]">
                Batch AI
              </span>
            </h4>
            <p className="text-[11px] text-slate-600 dark:text-slate-300 line-clamp-1 mt-0.5">
              {successMessage ? (
                <span className="text-emerald-600 dark:text-emerald-400 font-bold flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5 inline" /> {successMessage}
                </span>
              ) : (
                `Có ${pendingCount} từ vựng chưa có câu ví dụ Cloze ngữ cảnh.`
              )}
            </p>
          </div>
        </div>

        {!successMessage && (
          <button
            onClick={handleGenerateBatch}
            disabled={isGenerating}
            className="shrink-0 px-3.5 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-extrabold text-xs rounded-xl shadow-xs transition-all active:scale-95 flex items-center gap-1.5"
          >
            {isGenerating ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                <span>Đang sinh câu...</span>
              </>
            ) : (
              <>
                <Sparkles className="w-3.5 h-3.5" />
                <span>Tạo câu Cloze ({pendingCount})</span>
              </>
            )}
          </button>
        )}
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Mount VocabClozeBatchBanner in `/vocab/page.tsx`**

In `src/app/vocab/page.tsx`:
```tsx
import VocabClozeBatchBanner from "@/components/vocab/VocabClozeBatchBanner";
```

Update `VocabPage`:
```tsx
export default function VocabPage() {
  return (
    <div className="p-4 space-y-5 pb-28">
      {/* 1. Static Header Shell */}
      <VocabHeader />

      {/* 2. Dynamic Hole: SRS Statistics & Due Banner */}
      <Suspense fallback={<VocabStatsSkeleton />}>
        <VocabStatsBar />
      </Suspense>

      {/* 3. Interactive Batch Cloze AI Banner */}
      <VocabClozeBatchBanner />

      {/* 4. Dynamic Hole: Vocabulary Interactive Section */}
      <Suspense fallback={<VocabListSkeleton />}>
        <VocabCardDataLoader />
      </Suspense>
    </div>
  );
}
```

- [ ] **Step 3: Verify Type-check & Build**

Run: `npx tsc --noEmit`
Expected: 0 errors

- [ ] **Step 4: Commit**

```bash
git add src/components/vocab/VocabClozeBatchBanner.tsx src/app/vocab/page.tsx
git commit -m "feat(vocab): add VocabClozeBatchBanner interactive component in /vocab"
```

---

## Verification Plan

### Automated Build Verification
1. Run `npx tsc --noEmit` to verify type safety.
2. Run `npm run build` to confirmNext.js bundle builds without errors.

### Manual Verification
1. Run `npx tsx scripts/enrich-vocab-sentences.ts` in terminal to test the batch script on existing 130+ cards.
2. Open `http://localhost:3000/vocab` in browser and test the interactive Batch AI banner.
