# Phase 09: Vocab Cloze Quiz Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Transform vocabulary practice from passive recognition (MCQ) to active production (Cloze fill-in-the-blank sentences) when word stability is >= 3 days.

**Architecture:** Extend `VocabCard` model with AI-generated example sentences via Gemini. Integrate a Levenshtein-based fuzzy matcher for fill-in-the-blank text inputs. In `review-session.service.ts`, dynamically assign `quizMode` (`'cloze'` vs `'mcq'`) based on `fsrs.stability >= 3` and available example sentences. Refactor `QuizPlayer.tsx` into decoupled `MCQCard`, `ClozeCard`, and `QuizFeedback` components.

**Tech Stack:** Next.js 16 (App Router), React 19, TypeScript, Mongoose, Zod, Tailwind CSS, `@/lib/utils/gemini`.

---

## Proposed Changes

### Data & SRS Engine Layer

#### [MODIFY] [vocab.schema.ts](file:///Users/anhtus/Documents/Development/NextJS/aha-tools/src/lib/schemas/vocab.schema.ts)
- Add `exampleSentences` schema: `z.array(z.object({ sentence: z.string(), answer: z.string() })).optional()`.

#### [MODIFY] [VocabCard.ts](file:///Users/anhtus/Documents/Development/NextJS/aha-tools/src/lib/db/models/VocabCard.ts)
- Add `IVocabExampleSentence` interface (`sentence: string`, `answer: string`).
- Add `exampleSentences` array field to `IVocabCard` and `VocabCardSchema`.

#### [NEW] [cloze-scorer.ts](file:///Users/anhtus/Documents/Development/NextJS/aha-tools/src/lib/srs/cloze-scorer.ts)
- Implement pure Levenshtein distance algorithm (zero external dependency).
- Export `isClozeCorrect(userInput: string, answer: string, maxDistance?: number): boolean`.

#### [NEW] [cloze-enricher.ts](file:///Users/anhtus/Documents/Development/NextJS/aha-tools/src/lib/vocab/cloze-enricher.ts)
- Define `GeminiExampleSentenceSchema` with Zod.
- Export `generateAndSaveExampleSentences(cardId: string, word: string, explanation: string, level: string): Promise<void>`.
- Use `geminiService.invokeStructured` to query Gemini in 100% English.

#### [MODIFY] [route.ts](file:///Users/anhtus/Documents/Development/NextJS/aha-tools/src/app/api/vocab/route.ts)
- Trigger non-blocking background sentence generation when saving a new card via `POST /api/vocab`.

#### [NEW] [enrich-vocab-sentences.ts](file:///Users/anhtus/Documents/Development/NextJS/aha-tools/scripts/enrich-vocab-sentences.ts)
- CLI script to batch-process all existing `VocabCard` documents in MongoDB that lack `exampleSentences`.

#### [MODIFY] [review-session.service.ts](file:///Users/anhtus/Documents/Development/NextJS/aha-tools/src/lib/srs/review-session.service.ts)
- Update `QuizQuestion` interface to include `quizMode: 'mcq' | 'cloze'` and `exampleSentences`.
- Set `quizMode = 'cloze'` if `card.fsrs.stability >= 3` AND `card.exampleSentences.length > 0`, else `'mcq'`.

---

### UI & Review Components Layer

#### [NEW] [MCQCard.tsx](file:///Users/anhtus/Documents/Development/NextJS/aha-tools/src/components/vocab/review/MCQCard.tsx)
- Extracted 4-choice Multiple Choice Question card view from `QuizPlayer`.

#### [NEW] [QuizFeedback.tsx](file:///Users/anhtus/Documents/Development/NextJS/aha-tools/src/components/vocab/review/QuizFeedback.tsx)
- Reusable feedback drawer component showing stability gain, next due interval, response latency, and complete example sentence / word family hints.

#### [NEW] [ClozeCard.tsx](file:///Users/anhtus/Documents/Development/NextJS/aha-tools/src/components/vocab/review/ClozeCard.tsx)
- Fill-in-the-blank text input card with auto-focus, submit on Enter, hint display (level), and fuzzy match verification.

#### [MODIFY] [QuizPlayer.tsx](file:///Users/anhtus/Documents/Development/NextJS/aha-tools/src/components/vocab/review/QuizPlayer.tsx)
- Orchestrate between `MCQCard` and `ClozeCard` based on `currentQ.quizMode`.

---

## Implementation Tasks

### Task 1: Levenshtein Fuzzy Match Scorer Utility

**Files:**
- Create: `src/lib/srs/cloze-scorer.ts`

- [ ] **Step 1: Write Levenshtein distance & fuzzy match algorithm**

Create `src/lib/srs/cloze-scorer.ts`:
```ts
/**
 * Calculates Levenshtein distance between two strings.
 */
export function getLevenshteinDistance(a: string, b: string): number {
  const matrix: number[][] = [];

  for (let i = 0; i <= b.length; i++) {
    matrix[i] = [i];
  }
  for (let j = 0; j <= a.length; j++) {
    matrix[0][j] = j;
  }

  for (let i = 1; i <= b.length; i++) {
    for (let j = 1; j <= a.length; j++) {
      if (b.charAt(i - 1) === a.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1, // substitution
          matrix[i][j - 1] + 1,     // insertion
          matrix[i - 1][j] + 1      // deletion
        );
      }
    }
  }

  return matrix[b.length][a.length];
}

/**
 * Checks if user answer matches target answer within max edit distance (default <= 2).
 * Normalizes case and trims whitespace.
 */
export function isClozeCorrect(
  userInput: string,
  answer: string,
  maxDistance: number = 2
): boolean {
  const normInput = userInput.trim().toLowerCase();
  const normAnswer = answer.trim().toLowerCase();

  if (!normInput || !normAnswer) return false;
  if (normInput === normAnswer) return true;

  return getLevenshteinDistance(normInput, normAnswer) <= maxDistance;
}
```

- [ ] **Step 2: Commit**

```bash
git add src/lib/srs/cloze-scorer.ts
git commit -m "feat(vocab): add Levenshtein fuzzy match scorer utility"
```

---

### Task 2: Vocab Card Schema & Mongoose Model Extension

**Files:**
- Modify: `src/lib/schemas/vocab.schema.ts`
- Modify: `src/lib/db/models/VocabCard.ts`

- [ ] **Step 1: Update Zod Schema**

In `src/lib/schemas/vocab.schema.ts`, update `saveVocabCardSchema`:
```ts
export const exampleSentenceSchema = z.object({
  sentence: z.string(),
  answer: z.string(),
});

export const saveVocabCardSchema = z.object({
  word: z.string().min(1, "Word is required"),
  ipa: z.string().optional(),
  explanation: z.string().min(1, "Explanation is required"),
  level: z.enum(["A1", "A2", "B1", "B2", "C1", "C2"]).default("B1"),
  audioUrl: z.string().optional(),
  exampleSentences: z.array(exampleSentenceSchema).optional(),
  wordFamily: z
    .array(
      z.object({
        word: z.string(),
        partOfSpeech: z.string().optional(),
        ipa: z.string().optional(),
        explanation: z.string(),
      })
    )
    .optional(),
  collocations: z
    .array(
      z.object({
        collocation: z.string(),
        explanation: z.string(),
      })
    )
    .optional(),
  sourceStorybookId: z.string().optional(),
  sourceStorybookTitle: z.string().optional(),
});
```

- [ ] **Step 2: Update Mongoose Model**

In `src/lib/db/models/VocabCard.ts`:
Add `IVocabExampleSentence` interface:
```ts
export interface IVocabExampleSentence {
  sentence: string;
  answer: string;
}
```

Add to `IVocabCard`:
```ts
exampleSentences?: IVocabExampleSentence[];
```

Add schema definition before `VocabCardSchema`:
```ts
const VocabExampleSentenceSchema = new Schema<IVocabExampleSentence>(
  {
    sentence: { type: String, required: true },
    answer: { type: String, required: true },
  },
  { _id: false }
);
```

In `VocabCardSchema`, add field:
```ts
exampleSentences: { type: [VocabExampleSentenceSchema], required: false },
```

- [ ] **Step 3: Commit**

```bash
git add src/lib/schemas/vocab.schema.ts src/lib/db/models/VocabCard.ts
git commit -m "feat(vocab): extend VocabCard schema with exampleSentences"
```

---

### Task 3: Cloze Sentence Generator Service & API Hook

**Files:**
- Create: `src/lib/vocab/cloze-enricher.ts`
- Modify: `src/app/api/vocab/route.ts`

- [ ] **Step 1: Create Cloze Enricher Utility**

Create `src/lib/vocab/cloze-enricher.ts`:
```ts
import { z } from "zod";
import { geminiService } from "@/lib/utils/gemini";
import { connectDB } from "@/lib/db/mongoose";
import VocabCard from "@/lib/db/models/VocabCard";

export const GeminiExampleSentencesSchema = z.object({
  sentences: z.array(
    z.object({
      sentence: z.string().describe("Sentence with the word replaced by ___"),
      answer: z.string().describe("The exact target word"),
    })
  ),
});

export async function generateExampleSentences(
  word: string,
  explanation: string,
  level: string = "B1"
): Promise<Array<{ sentence: string; answer: string }>> {
  const prompt = `You are an English vocabulary teacher. Generate exactly 3 fill-in-the-blank sentences for the target word "${word}" (${level} level).

Word Definition: "${explanation}"

Requirements:
1. Each sentence must be natural, native-speaker quality.
2. The target word "${word}" must be replaced with "___" (three underscores).
3. The sentences should reflect real professional, IT, academic, or daily conversation context.
4. Keep the target word exact as "${word}" for the answer field.

Return valid JSON with the specified schema.`;

  try {
    const result = await geminiService.invokeStructured(
      GeminiExampleSentencesSchema,
      [{ role: "user", content: prompt }]
    );

    return result.sentences || [];
  } catch (err) {
    console.error(`[ClozeEnricher] Failed to generate sentences for "${word}":`, err);
    return [];
  }
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

- [ ] **Step 2: Update POST /api/vocab Handler**

In `src/app/api/vocab/route.ts`, import `generateAndSaveExampleSentences` and trigger background generation after creating card:
```ts
import { generateAndSaveExampleSentences } from "@/lib/vocab/cloze-enricher";
```

After `const newCard = await VocabCard.create(...)`:
```ts
// Background non-blocking enrichment
generateAndSaveExampleSentences(
  newCard._id.toString(),
  newCard.word,
  newCard.explanation,
  newCard.level
).catch((err) => console.error("[API/vocab] Background enrich error:", err));
```

- [ ] **Step 3: Commit**

```bash
git add src/lib/vocab/cloze-enricher.ts src/app/api/vocab/route.ts
git commit -m "feat(vocab): add Cloze sentence generator service and background API hook"
```

---

### Task 4: Backfill Script for Existing Vocab Cards

**Files:**
- Create: `scripts/enrich-vocab-sentences.ts`

- [ ] **Step 1: Write CLI Backfill Script**

Create `scripts/enrich-vocab-sentences.ts`:
```ts
import mongoose from "mongoose";
import * as dotenv from "dotenv";
dotenv.config();

import { connectDB } from "../src/lib/db/mongoose";
import VocabCard from "../src/lib/db/models/VocabCard";
import { generateExampleSentences } from "../src/lib/vocab/cloze-enricher";

async function main() {
  console.log("🚀 Starting Vocab Example Sentences Backfill Script...");
  await connectDB();

  // Find cards missing exampleSentences or empty array
  const targetCards = await VocabCard.find({
    $or: [
      { exampleSentences: { $exists: false } },
      { exampleSentences: { $size: 0 } },
    ],
  });

  console.log(`Found ${targetCards.length} vocab cards needing example sentences.`);

  let count = 0;
  for (const card of targetCards) {
    count++;
    console.log(`[${count}/${targetCards.length}] Processing word: "${card.word}"...`);

    const sentences = await generateExampleSentences(
      card.word,
      card.explanation,
      card.level || "B1"
    );

    if (sentences.length > 0) {
      await VocabCard.findByIdAndUpdate(card._id, {
        $set: { exampleSentences: sentences },
      });
      console.log(`  └─ Success: Generated ${sentences.length} sentences.`);
    } else {
      console.log(`  └─ Skipped/Failed to generate sentences.`);
    }

    // Rate-limiting delay to avoid hitting Gemini quota
    await new Promise((r) => setTimeout(r, 200));
  }

  console.log("✅ Backfill completed successfully!");
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
git commit -m "feat(vocab): add backfill script for example sentence generation"
```

---

### Task 5: SRS Review Session Cloze Mode Integration

**Files:**
- Modify: `src/lib/srs/review-session.service.ts`

- [ ] **Step 1: Update QuizQuestion interface & Question mapping**

In `src/lib/srs/review-session.service.ts`:

Add `exampleSentences` and `quizMode` to `QuizQuestion`:
```ts
export interface QuizQuestion {
  cardId: string;
  word: string;
  ipa?: string;
  level: string;
  wordFamily?: any[];
  collocations?: any[];
  sourceStorybookTitle?: string;
  explanation: string;
  options: QuizOption[];
  exampleSentences?: Array<{ sentence: string; answer: string }>;
  quizMode: "mcq" | "cloze";
  fsrsState: {
    due: string;
    reps: number;
    stability: number;
  };
}
```

In `getReviewSessionQuestions`, update the mapping logic:
```ts
    const stability = card.fsrs?.stability ?? 0;
    const exampleSentences = card.exampleSentences || [];
    
    // Stability >= 3 days triggers Cloze mode (if sentences available)
    const CLOZE_THRESHOLD_STABILITY = 3;
    const quizMode: "mcq" | "cloze" =
      stability >= CLOZE_THRESHOLD_STABILITY && exampleSentences.length > 0
        ? "cloze"
        : "mcq";

    return {
      cardId: card._id.toString(),
      word: card.word,
      ipa: card.ipa || "",
      level: card.level || "A1",
      wordFamily: card.wordFamily || [],
      collocations: card.collocations || [],
      sourceStorybookTitle: card.sourceStorybookTitle || "",
      explanation: card.explanation || "",
      options: shuffledOptions,
      exampleSentences: exampleSentences,
      quizMode: quizMode,
      fsrsState: {
        due: card.fsrs?.due ? new Date(card.fsrs.due).toISOString() : new Date().toISOString(),
        reps: card.fsrs?.reps ?? 0,
        stability: card.fsrs?.stability ?? 0,
      },
    };
```

- [ ] **Step 2: Commit**

```bash
git add src/lib/srs/review-session.service.ts
git commit -m "feat(srs): add Cloze quiz mode logic based on stability threshold >= 3d"
```

---

### Task 6: Refactor MCQCard & Create Shared QuizFeedback Components

**Files:**
- Create: `src/components/vocab/review/MCQCard.tsx`
- Create: `src/components/vocab/review/QuizFeedback.tsx`

- [ ] **Step 1: Create MCQCard**

Create `src/components/vocab/review/MCQCard.tsx`:
```tsx
"use client";

import React from "react";
import { Volume2, CheckCircle2, XCircle } from "lucide-react";
import type { QuizQuestion } from "@/lib/srs/review-session.service";

interface MCQCardProps {
  question: QuizQuestion;
  selectedOptionId: string | null;
  isAnswered: boolean;
  onSelectOption: (optionId: string, isCorrect: boolean) => void;
  onPlayAudio: (word: string) => void;
}

export function MCQCard({
  question,
  selectedOptionId,
  isAnswered,
  onSelectOption,
  onPlayAudio,
}: MCQCardProps) {
  return (
    <div className="space-y-5 my-auto py-4">
      {/* Word Prompt Box */}
      <div className="bg-white dark:bg-slate-800 rounded-3xl p-5 border border-slate-200/80 dark:border-slate-700 shadow-sm text-center space-y-2">
        <div className="flex items-center justify-center gap-2">
          <span className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">
            {question.word}
          </span>
          <button
            onClick={() => onPlayAudio(question.word)}
            className="p-1.5 text-amber-500 hover:text-amber-600 bg-amber-50 dark:bg-amber-950/40 rounded-full transition-transform active:scale-90"
            title="Phát âm"
          >
            <Volume2 className="w-4 h-4" />
          </button>
        </div>

        {question.ipa && (
          <div className="font-mono text-xs text-slate-400 font-normal">
            {question.ipa}
          </div>
        )}

        {question.level && (
          <div className="pt-1">
            <span className="px-2 py-0.5 rounded-md bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 text-[10px] font-extrabold border border-amber-200 dark:border-amber-900">
              {question.level}
            </span>
          </div>
        )}
      </div>

      {/* 4 English Answer Choices */}
      <div className="space-y-2.5">
        {question.options.map((opt) => {
          const isSelected = selectedOptionId === opt.id;
          let btnStyle =
            "bg-white dark:bg-slate-800 border-slate-200/80 dark:border-slate-700 text-slate-800 dark:text-slate-200 hover:border-amber-400 dark:hover:border-amber-500";

          if (isAnswered) {
            if (opt.isCorrect) {
              btnStyle =
                "bg-emerald-50 dark:bg-emerald-950/50 border-emerald-500 text-emerald-800 dark:text-emerald-300 font-bold shadow-xs";
            } else if (isSelected && !opt.isCorrect) {
              btnStyle =
                "bg-rose-50 dark:bg-rose-950/50 border-rose-500 text-rose-800 dark:text-rose-300";
            } else {
              btnStyle =
                "bg-slate-50/50 dark:bg-slate-850 border-slate-100 dark:border-slate-800 text-slate-400 dark:text-slate-500 opacity-60";
            }
          }

          return (
            <button
              key={opt.id}
              onClick={() => onSelectOption(opt.id, opt.isCorrect)}
              disabled={isAnswered}
              className={`w-full p-4 rounded-2xl border text-left text-xs transition-all duration-200 flex items-start gap-3 shadow-2xs ${btnStyle}`}
            >
              <span className="w-5 h-5 rounded-full bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 text-[11px] font-black flex items-center justify-center shrink-0">
                {opt.id}
              </span>
              <span className="flex-1 leading-relaxed">{opt.text}</span>
              {isAnswered && opt.isCorrect && (
                <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
              )}
              {isAnswered && isSelected && !opt.isCorrect && (
                <XCircle className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Create QuizFeedback**

Create `src/components/vocab/review/QuizFeedback.tsx`:
```tsx
"use client";

import React from "react";
import type { QuizQuestion } from "@/lib/srs/review-session.service";

interface ReviewResult {
  cardId: string;
  word: string;
  isCorrect: boolean;
  rating: number;
  responseTimeMs: number;
  nextDue: string;
  stability: number;
}

interface QuizFeedbackProps {
  question: QuizQuestion;
  result: ReviewResult;
  completedSentence?: string;
}

export function QuizFeedback({
  question,
  result,
  completedSentence,
}: QuizFeedbackProps) {
  const getRatingBadge = (rating: number) => {
    switch (rating) {
      case 4:
        return { label: "Easy (Dễ)", color: "bg-emerald-50 text-emerald-600 border-emerald-200" };
      case 3:
        return { label: "Good (Tốt)", color: "bg-blue-50 text-blue-600 border-blue-200" };
      case 2:
        return { label: "Hard (Khó)", color: "bg-amber-50 text-amber-600 border-amber-200" };
      case 1:
      default:
        return { label: "Again (Ôn lại)", color: "bg-rose-50 text-rose-600 border-rose-200" };
    }
  };

  const formatIntervalDays = (nextDueStr?: string) => {
    if (!nextDueStr) return "";
    const due = new Date(nextDueStr);
    const now = new Date();
    const diffMs = due.getTime() - now.getTime();
    if (diffMs <= 0) return "Hôm nay";
    const diffMinutes = Math.round(diffMs / (1000 * 60));
    if (diffMinutes < 60) return `${diffMinutes} phút`;
    const diffHours = Math.round(diffMs / (1000 * 60 * 60));
    if (diffHours < 24) return `${diffHours} giờ`;
    const days = Math.round(diffHours / 24);
    return `${days} ngày`;
  };

  const badge = getRatingBadge(result.rating);

  return (
    <div className="bg-slate-50 dark:bg-slate-800/80 rounded-2xl p-4 border border-slate-200/80 dark:border-slate-700 space-y-3 animate-in fade-in slide-in-from-bottom-2 duration-300">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className={`px-2 py-0.5 rounded-md text-[10px] font-extrabold border ${badge.color}`}>
            {badge.label}
          </span>
          <span className="text-[11px] text-slate-500 dark:text-slate-400">
            ⚡ {Math.round(result.responseTimeMs / 100) / 10}s
          </span>
        </div>

        <div className="text-[11px] font-bold text-amber-600 dark:text-amber-400">
          Ôn lại: +{formatIntervalDays(result.nextDue)}
        </div>
      </div>

      {/* Completed Sentence for Cloze Mode */}
      {completedSentence && (
        <div className="p-3 bg-amber-50/60 dark:bg-amber-950/40 rounded-xl border border-amber-200/60 dark:border-amber-900/60 text-xs text-amber-950 dark:text-amber-200 font-medium">
          <div className="text-[10px] font-bold text-amber-600 dark:text-amber-400 mb-1 uppercase tracking-wider">
            Sentence in context:
          </div>
          <p className="italic">{completedSentence}</p>
        </div>
      )}

      {/* Word Family / Collocations hint */}
      {question.wordFamily && question.wordFamily.length > 0 && (
        <div className="text-[11px] text-slate-500 dark:text-slate-400 border-t border-slate-200/60 dark:border-slate-700/60 pt-2">
          <span className="font-bold text-slate-700 dark:text-slate-300">
            👨‍👩‍👧‍👦 Family:{" "}
          </span>
          {question.wordFamily.map((wf: any) => wf.word).join(", ")}
        </div>
      )}
    </div>
  );
}
```

- [ ] **Step 3: Commit**

```bash
git add src/components/vocab/review/MCQCard.tsx src/components/vocab/review/QuizFeedback.tsx
git commit -m "refactor(review): extract MCQCard and QuizFeedback component"
```

---

### Task 7: Create ClozeCard Component

**Files:**
- Create: `src/components/vocab/review/ClozeCard.tsx`

- [ ] **Step 1: Write ClozeCard Component**

Create `src/components/vocab/review/ClozeCard.tsx`:
```tsx
"use client";

import React, { useState, useEffect, useRef } from "react";
import { Volume2, Sparkles, Send } from "lucide-react";
import type { QuizQuestion } from "@/lib/srs/review-session.service";
import { isClozeCorrect } from "@/lib/srs/cloze-scorer";

interface ClozeCardProps {
  question: QuizQuestion;
  isAnswered: boolean;
  onSubmitAnswer: (userInput: string, isCorrect: boolean) => void;
  onPlayAudio: (word: string) => void;
}

export function ClozeCard({
  question,
  isAnswered,
  onSubmitAnswer,
  onPlayAudio,
}: ClozeCardProps) {
  const [userInput, setUserInput] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  // Pick the first example sentence available
  const activeSentence =
    question.exampleSentences && question.exampleSentences.length > 0
      ? question.exampleSentences[0]
      : { sentence: "___", answer: question.word };

  useEffect(() => {
    setUserInput("");
    if (!isAnswered) {
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [question, isAnswered]);

  const handleSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (isAnswered || !userInput.trim()) return;

    const correct = isClozeCorrect(userInput, activeSentence.answer);
    onSubmitAnswer(userInput, correct);
  };

  return (
    <div className="space-y-5 my-auto py-4">
      {/* Cloze Sentence Box */}
      <div className="bg-white dark:bg-slate-800 rounded-3xl p-6 border border-slate-200/80 dark:border-slate-700 shadow-sm text-center space-y-4">
        <div className="flex items-center justify-center gap-1.5 text-xs font-black text-indigo-500 bg-indigo-50 dark:bg-indigo-950/40 px-3 py-1 rounded-full border border-indigo-200 dark:border-indigo-900 w-fit mx-auto">
          <Sparkles className="w-3.5 h-3.5" />
          <span>Fill in the Blank</span>
        </div>

        {/* Sentence Prompt */}
        <p className="text-base font-medium text-slate-800 dark:text-slate-100 leading-relaxed px-2">
          {activeSentence.sentence.split("___").map((part, i, arr) => (
            <React.Fragment key={i}>
              {part}
              {i < arr.length - 1 && (
                <span className="inline-block px-3 py-0.5 mx-1 border-b-2 border-indigo-500 bg-indigo-50/80 dark:bg-indigo-950/80 text-indigo-700 dark:text-indigo-300 font-bold rounded">
                  {isAnswered ? activeSentence.answer : userInput || "___"}
                </span>
              )}
            </React.Fragment>
          ))}
        </p>

        {/* Word Explanation & Level Hint */}
        <div className="pt-2 border-t border-slate-100 dark:border-slate-700/60 flex items-center justify-between text-xs text-slate-500">
          <div className="flex items-center gap-1.5">
            <span className="font-semibold text-slate-700 dark:text-slate-300">
              Nghĩa:
            </span>
            <span className="line-clamp-1 max-w-[200px] text-left">
              {question.explanation}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => onPlayAudio(question.word)}
              className="p-1 text-slate-400 hover:text-indigo-500 transition-colors"
              title="Nghe từ"
            >
              <Volume2 className="w-4 h-4" />
            </button>
            <span className="px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-700 text-[10px] font-bold">
              {question.level}
            </span>
          </div>
        </div>
      </div>

      {/* Input Form */}
      {!isAnswered && (
        <form onSubmit={handleSubmit} className="space-y-3">
          <div className="relative">
            <input
              ref={inputRef}
              type="text"
              value={userInput}
              onChange={(e) => setUserInput(e.target.value)}
              placeholder="Nhập từ vựng tiếng Anh..."
              className="w-full py-4 pl-4 pr-12 text-sm bg-white dark:bg-slate-800 border-2 border-indigo-200 dark:border-indigo-900 rounded-2xl focus:outline-none focus:border-indigo-500 dark:focus:border-indigo-400 font-semibold text-slate-900 dark:text-white shadow-sm transition-all"
              autoCapitalize="none"
              autoComplete="off"
              autoCorrect="off"
            />
            <button
              type="submit"
              disabled={!userInput.trim()}
              className="absolute right-2 top-2 bottom-2 px-3.5 bg-indigo-500 hover:bg-indigo-600 disabled:opacity-40 text-white rounded-xl font-extrabold flex items-center justify-center transition-all active:scale-95"
            >
              <Send className="w-4 h-4" />
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add src/components/vocab/review/ClozeCard.tsx
git commit -m "feat(review): create ClozeCard component for fill-in-the-blank quiz"
```

---

### Task 8: QuizPlayer Orchestration

**Files:**
- Modify: `src/components/vocab/review/QuizPlayer.tsx`

- [ ] **Step 1: Wire ClozeCard and MCQCard in QuizPlayer**

Update `src/components/vocab/review/QuizPlayer.tsx`:
1. Import `MCQCard`, `ClozeCard`, and `QuizFeedback`.
2. Track `completedSentence` state for feedback drawer when in Cloze mode.
3. Render `ClozeCard` when `currentQ.quizMode === 'cloze'`, else render `MCQCard`.
4. Render shared `QuizFeedback` when `isAnswered && currentResult`.

```tsx
"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { mutate } from "swr";
import {
  X,
  ArrowRight,
  Sparkles,
  Trophy,
  BookOpen,
  GraduationCap,
  CheckCircle2,
  XCircle,
} from "lucide-react";
import type { QuizQuestion } from "@/lib/srs/review-session.service";
import { MCQCard } from "./MCQCard";
import { ClozeCard } from "./ClozeCard";
import { QuizFeedback } from "./QuizFeedback";

interface ReviewResult {
  cardId: string;
  word: string;
  isCorrect: boolean;
  rating: number;
  responseTimeMs: number;
  nextDue: string;
  stability: number;
}

interface QuizPlayerProps {
  initialQuestions: QuizQuestion[];
}

export function QuizPlayer({ initialQuestions }: QuizPlayerProps) {
  const router = useRouter();

  const [questions] = useState<QuizQuestion[]>(initialQuestions);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedOptionId, setSelectedOptionId] = useState<string | null>(null);
  const [isAnswered, setIsAnswered] = useState(false);
  const [currentResult, setCurrentResult] = useState<ReviewResult | null>(null);
  const [sessionResults, setSessionResults] = useState<ReviewResult[]>([]);
  const [isFinished, setIsFinished] = useState(false);
  const [completedSentence, setCompletedSentence] = useState<string | undefined>(undefined);

  const questionStartTimeRef = useRef<number>(Date.now());

  useEffect(() => {
    if (questions.length > 0 && currentIndex < questions.length) {
      questionStartTimeRef.current = Date.now();
      setSelectedOptionId(null);
      setIsAnswered(false);
      setCurrentResult(null);
      setCompletedSentence(undefined);
    }
  }, [currentIndex, questions]);

  const currentQ = questions[currentIndex];

  const playAudio = (word: string) => {
    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      const utterance = new SpeechSynthesisUtterance(word);
      utterance.lang = "en-US";
      utterance.rate = 0.9;
      window.speechSynthesis.speak(utterance);
    }
  };

  const submitReview = async (isCorrect: boolean) => {
    if (isAnswered || !currentQ) return;

    const responseTimeMs = Date.now() - questionStartTimeRef.current;
    setIsAnswered(true);

    try {
      const res = await fetch("/api/vocab/review", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          cardId: currentQ.cardId,
          isCorrect,
          responseTimeMs,
        }),
      });

      const data = await res.json();
      if (res.ok) {
        const result: ReviewResult = {
          cardId: currentQ.cardId,
          word: currentQ.word,
          isCorrect,
          rating: data.rating,
          responseTimeMs,
          nextDue: data.nextDue,
          stability: data.stability,
        };
        setCurrentResult(result);
        setSessionResults((prev) => [...prev, result]);
        mutate("/api/vocab/due-count");
      }
    } catch (err) {
      console.error("Failed to submit review", err);
    }
  };

  const handleSelectOption = (optionId: string, isCorrect: boolean) => {
    setSelectedOptionId(optionId);
    submitReview(isCorrect);
  };

  const handleSubmitCloze = (userInput: string, isCorrect: boolean) => {
    if (currentQ.exampleSentences && currentQ.exampleSentences.length > 0) {
      const full = currentQ.exampleSentences[0].sentence.replace(
        "___",
        currentQ.word
      );
      setCompletedSentence(full);
    }
    submitReview(isCorrect);
  };

  const handleNextQuestion = () => {
    if (currentIndex + 1 < questions.length) {
      setCurrentIndex((prev) => prev + 1);
    } else {
      setIsFinished(true);
      mutate("/api/vocab/due-count");
      router.refresh();
    }
  };

  const handleExit = (href: string = "/vocab") => {
    mutate("/api/vocab/due-count");
    router.push(href);
    router.refresh();
  };

  // Finished Screen (unchanged logic)
  if (isFinished || questions.length === 0) {
    const totalAnswered = sessionResults.length;
    const correctCount = sessionResults.filter((r) => r.isCorrect).length;
    const accuracy = totalAnswered > 0 ? Math.round((correctCount / totalAnswered) * 100) : 100;

    return (
      <div className="p-4 min-h-screen flex flex-col justify-between max-w-[480px] mx-auto pb-10">
        <div className="space-y-6 pt-8">
          <div className="text-center space-y-3">
            <div className="w-20 h-20 rounded-3xl bg-amber-100 dark:bg-amber-950/60 text-amber-500 flex items-center justify-center mx-auto shadow-inner animate-bounce">
              <Trophy className="w-10 h-10" />
            </div>
            <h1 className="text-2xl font-black text-slate-900 dark:text-white">
              {totalAnswered > 0 ? "Hoàn thành phiên ôn tập!" : "Chưa có từ nào cần ôn"}
            </h1>
            <p className="text-xs text-slate-500 dark:text-slate-400 max-w-xs mx-auto">
              {totalAnswered > 0
                ? "Bộ não của bạn vừa kích hoạt lại các liên kết thần kinh cho các từ vựng này."
                : "Tất cả từ vựng đang ở chu kỳ ghi nhớ tốt hoặc bạn chưa lưu từ vựng nào."}
            </p>
          </div>

          {totalAnswered > 0 && (
            <div className="bg-white dark:bg-slate-800 rounded-3xl p-5 border border-slate-200/80 dark:border-slate-700 shadow-sm space-y-4">
              <div className="grid grid-cols-3 gap-2 text-center">
                <div className="p-3 bg-slate-50 dark:bg-slate-750 rounded-2xl">
                  <div className="text-[10px] font-bold text-slate-400">Đã ôn</div>
                  <div className="text-lg font-black text-slate-900 dark:text-white">
                    {totalAnswered}
                  </div>
                </div>
                <div className="p-3 bg-emerald-50 dark:bg-emerald-950/40 rounded-2xl">
                  <div className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400">
                    Chính xác
                  </div>
                  <div className="text-lg font-black text-emerald-600 dark:text-emerald-400">
                    {accuracy}%
                  </div>
                </div>
                <div className="p-3 bg-amber-50 dark:bg-amber-950/40 rounded-2xl">
                  <div className="text-[10px] font-bold text-amber-600 dark:text-amber-400">
                    Đúng
                  </div>
                  <div className="text-lg font-black text-amber-600 dark:text-amber-400">
                    {correctCount}/{totalAnswered}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="space-y-2 pt-6">
          <button
            onClick={() => handleExit("/vocab")}
            className="w-full py-3.5 bg-amber-400 hover:bg-amber-500 text-slate-900 font-extrabold rounded-2xl transition-all text-xs shadow-sm flex items-center justify-center gap-2"
          >
            <GraduationCap className="w-4 h-4" />
            <span>Về Kho Từ Vựng</span>
          </button>
        </div>
      </div>
    );
  }

  const progressPercent = Math.round(((currentIndex + 1) / questions.length) * 100);

  return (
    <div className="min-h-screen flex flex-col justify-between p-4 max-w-[480px] mx-auto pb-10">
      {/* Top Header Bar */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <button
            onClick={() => handleExit("/vocab")}
            className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500 hover:text-slate-900 dark:hover:text-white flex items-center justify-center transition-colors"
          >
            <X className="w-4 h-4" />
          </button>

          <div className="flex items-center gap-1 text-xs font-black text-amber-500 bg-amber-50 dark:bg-amber-950/40 px-2.5 py-1 rounded-full border border-amber-200 dark:border-amber-900">
            <Sparkles className="w-3.5 h-3.5" />
            <span>{currentQ.quizMode === "cloze" ? "Cloze Sentence" : "FSRS Quiz"}</span>
          </div>

          <div className="text-xs font-bold text-slate-400">
            {currentIndex + 1} / {questions.length}
          </div>
        </div>

        <div className="w-full h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
          <div
            className="h-full bg-amber-400 transition-all duration-300 rounded-full"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
      </div>

      {/* Main Question View (Conditional Render based on quizMode) */}
      {currentQ.quizMode === "cloze" ? (
        <ClozeCard
          question={currentQ}
          isAnswered={isAnswered}
          onSubmitAnswer={handleSubmitCloze}
          onPlayAudio={playAudio}
        />
      ) : (
        <MCQCard
          question={currentQ}
          selectedOptionId={selectedOptionId}
          isAnswered={isAnswered}
          onSelectOption={handleSelectOption}
          onPlayAudio={playAudio}
        />
      )}

      {/* Feedback Drawer */}
      {isAnswered && currentResult && (
        <QuizFeedback
          question={currentQ}
          result={currentResult}
          completedSentence={completedSentence}
        />
      )}

      {/* Bottom Continue Button */}
      {isAnswered && (
        <div className="pt-4">
          <button
            onClick={handleNextQuestion}
            className="w-full py-4 bg-amber-400 hover:bg-amber-500 text-slate-900 font-extrabold rounded-2xl transition-all text-xs shadow-md flex items-center justify-center gap-2 active:scale-98"
          >
            <span>
              {currentIndex + 1 < questions.length
                ? "Tiếp theo"
                : "Xem kết quả tổng kết"}
            </span>
            <ArrowRight className="w-4 h-4 stroke-[2.5]" />
          </button>
        </div>
      )}
    </div>
  );
}
```

- [ ] **Step 2: Verify project builds with zero TypeScript errors**

Run: `npx tsc --noEmit`
Expected: 0 errors

- [ ] **Step 3: Commit**

```bash
git add src/components/vocab/review/QuizPlayer.tsx
git commit -m "feat(review): integrate ClozeCard and MCQCard orchestration in QuizPlayer"
```

---

## Verification Plan

### Automated Build Verification
1. Run `npx tsc --noEmit` to verify type checking across all files.
2. Run `npm run build` or `pnpm build` to verify Next.js bundle compiles cleanly.

### Manual Verification
1. Start dev server: `pnpm dev`
2. Test Cloze Card UI directly by triggering a review session with a card stability >= 3.
3. Test fuzzy matching logic with inputs (exact, typo within 2 characters, wrong answer).
