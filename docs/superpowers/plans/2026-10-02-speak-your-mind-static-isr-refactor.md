# Speak Your Mind Hub Static ISR Refactoring Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Refactor Speak Your Mind Hub (`/vocab/speak-your-mind`) from Pure Dynamic SSR to Static Pre-rendering with On-Demand ISR and Tag Revalidation, resolving the architectural conflict with `revalidatePath` and enabling instant (0ms) client-side level filtering.

**Architecture:** 
1. Remove `export const dynamic = "force-dynamic"` and Server `searchParams` parsing from `src/app/vocab/speak-your-mind/page.tsx`, allowing Next.js to prerender the page as a pure Static Route (`○ Static`).
2. Convert `SpeakYourMindHub.tsx` into a Client Component using React state (`useState`) for level filtering, eliminating redundant server round-trips when switching levels.
3. Update `fetchSpeakingQuestionsList` in `src/lib/services/speaking-quiz-client.ts` from `cache: "no-store"` to Next.js tag-based caching (`next: { tags: ["speaking-quiz-questions"] }`).
4. Enhance `revalidateSpeakingHub` in `src/lib/actions/speaking-quiz.actions.ts` to purge both the route cache (`revalidatePath`) and the data cache (`revalidateTag`).

**Tech Stack:** Next.js 16 (App Router), React 19, TypeScript, Tailwind CSS, Lucide React

---

### Task 1: Record Architectural Decision in OpenLore

**Files:**
- Command: `npx openlore decisions record`

- [ ] **Step 1: Record decision via OpenLore CLI**

Run:
```bash
npx openlore decisions record \
  --title "Adopt On-Demand ISR for Speak Your Mind Hub" \
  --rationale "Removing force-dynamic and client-side filtering restores Next.js static-first philosophy, aligns with revalidatePath on quiz creation, and drops TTFB from ~200ms to sub-50ms" \
  --consequences "Page is pre-rendered at build time; level filtering is instant client-side state; cache is purged on-demand via revalidatePath and revalidateTag" \
  --files "src/app/vocab/speak-your-mind/page.tsx,src/components/vocab/speaking/SpeakYourMindHub.tsx,src/lib/services/speaking-quiz-client.ts,src/lib/actions/speaking-quiz.actions.ts"
```
Expected: Decision recorded with draft ID.

- [ ] **Step 2: Verify OpenLore decisions list**

Run:
```bash
npx openlore decisions --list
```
Expected: The new draft decision is listed.

---

### Task 2: Update Data Fetching & Caching Strategy

**Files:**
- Modify: `src/lib/services/speaking-quiz-client.ts:125-135`
- Modify: `src/lib/actions/speaking-quiz.actions.ts:10-25`

- [ ] **Step 1: Update `fetchSpeakingQuestionsList` to use Next.js Cache Tag**

In `src/lib/services/speaking-quiz-client.ts`, replace `cache: "no-store"` with `next: { tags: ["speaking-quiz-questions"] }`:

```typescript
  const query = params.toString() ? `?${params.toString()}` : "";
  const res = await fetch(`${baseUrl}/agents/speaking-quiz/questions${query}`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
    },
    next: {
      tags: ["speaking-quiz-questions"],
    },
  });
```

- [ ] **Step 2: Update `revalidateSpeakingHub` in Server Actions**

In `src/lib/actions/speaking-quiz.actions.ts`, import `revalidateTag` and invalidate both path and tag:

```typescript
"use server";

/**
 * @file speaking-quiz.actions.ts
 * @description Server Actions for Speak Your Mind (PREP Speaking).
 * Handles server-driven cache revalidation for the hub.
 *
 * Mapped Spec: FR-VOCAB-06 | FR-VOCAB-07 | US-VOCAB-03 | US-VOCAB-04
 * Made by Anh Tu - Share to be share
 */

import { revalidatePath, revalidateTag } from "next/cache";

/**
 * Revalidates the Speak Your Mind Hub route and data cache on the server.
 * Purges static / server cache and ensures the new question appears immediately.
 */
export async function revalidateSpeakingHub(): Promise<void> {
  try {
    revalidatePath("/vocab/speak-your-mind");
    revalidateTag("speaking-quiz-questions");
  } catch (error) {
    console.error("[revalidateSpeakingHub] Error revalidating path/tag:", error);
  }
}
```

- [ ] **Step 3: Run TypeScript check to verify types**

Run:
```bash
npx tsc --noEmit
```
Expected: Exit code 0 (no errors).

- [ ] **Step 4: Commit changes for Task 2**

```bash
git add src/lib/services/speaking-quiz-client.ts src/lib/actions/speaking-quiz.actions.ts
git commit -m "perf(vocab): switch speaking quiz fetch to tag-based on-demand cache"
```

---

### Task 3: Refactor `SpeakYourMindHub.tsx` to Client Component with Instant Filtering

**Files:**
- Modify: `src/components/vocab/speaking/SpeakYourMindHub.tsx`

- [ ] **Step 1: Update component to use `"use client"` and React state for levels**

In `src/components/vocab/speaking/SpeakYourMindHub.tsx`:
1. Add `"use client";` at line 1.
2. Import `useState` from `"react"`.
3. Change `currentLevel` in props to optional `initialLevel = "all"`.
4. Use `const [selectedLevel, setSelectedLevel] = useState<string>(initialLevel);`.
5. Update `filteredQuestions` to filter against `selectedLevel`.
6. Replace `<Link>` filter chips with `<button>` elements that call `setSelectedLevel(lvl)`.

Full modified component structure:
```tsx
"use client";

import React, { useState } from "react";
import Link from "next/link";
import { Plus, ArrowRight } from "lucide-react";
import { ISpeakingQuestion } from "@/lib/types/speaking-quiz";

/**
 * @file SpeakYourMindHub.tsx
 * @description Interactive Client Component for Speak Your Mind Hub Dashboard.
 * Supports instant (0ms) client-side level filtering without server round-trips.
 *
 * Mapped Spec: FR-VOCAB-06 | FR-VOCAB-07 | US-VOCAB-03 | US-VOCAB-04 | AC-VOCAB-11
 * Made by Anh Tu - Share to be share
 */

interface SpeakYourMindHubProps {
  questions: ISpeakingQuestion[];
  initialLevel?: string;
}

export function SpeakYourMindHub({
  questions = [],
  initialLevel = "all",
}: SpeakYourMindHubProps) {
  const [selectedLevel, setSelectedLevel] = useState<string>(initialLevel);

  const dailyChallenge = questions.length > 0 ? questions[0] : null;

  const filteredQuestions = questions.filter((q) => {
    if (!selectedLevel || selectedLevel === "all") return true;
    return q.level === selectedLevel;
  });

  return (
    <div className="space-y-6 max-w-xl mx-auto pb-28">
      {/* 1. Header Shell: Synchronized with Story Shadowing & Vocab */}
      <div className="flex items-center justify-between pt-1">
        <div>
          <h1 className="text-xl font-black text-slate-900 dark:text-white tracking-tight">
            Speak Your Mind
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            PREP Framework • Critical Thinking & Speaking
          </p>
        </div>

        <Link
          href="/vocab/speak-your-mind/create"
          className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-[#FFBA49] hover:bg-[#e6a640] text-slate-900 font-bold text-xs rounded-xl shadow-xs transition-colors active:scale-98 cursor-pointer"
        >
          <Plus className="w-4 h-4" /> Create
        </Link>
      </div>

      {/* 2. Hero Methodology Guide (PREP Framework) */}
      <div className="bg-slate-50 dark:bg-slate-900/60 border border-slate-200/80 dark:border-slate-800 rounded-2xl p-4 space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-xs font-black text-slate-900 dark:text-white uppercase tracking-wider">
            PREP Argumentation Framework
          </span>
          <span className="text-[11px] text-slate-400 font-medium">
            30–60s per turn
          </span>
        </div>

        <div className="grid grid-cols-2 gap-2 text-[11px]">
          <div className="p-2.5 rounded-xl bg-white dark:bg-slate-800/80 border border-slate-200/60 dark:border-slate-700/60 space-y-0.5">
            <div className="font-black text-amber-600 dark:text-amber-400 text-xs">
              P • Point
            </div>
            <p className="text-slate-600 dark:text-slate-300 leading-tight">
              Direct stance statement (Agree / Disagree).
            </p>
          </div>

          <div className="p-2.5 rounded-xl bg-white dark:bg-slate-800/80 border border-slate-200/60 dark:border-slate-700/60 space-y-0.5">
            <div className="font-black text-blue-600 dark:text-blue-400 text-xs">
              R • Reason
            </div>
            <p className="text-slate-600 dark:text-slate-300 leading-tight">
              Core rationale and logical justification.
            </p>
          </div>

          <div className="p-2.5 rounded-xl bg-white dark:bg-slate-800/80 border border-slate-200/60 dark:border-slate-700/60 space-y-0.5">
            <div className="font-black text-emerald-600 dark:text-emerald-400 text-xs">
              E • Example
            </div>
            <p className="text-slate-600 dark:text-slate-300 leading-tight">
              Concrete evidence, fact, or personal anecdote.
            </p>
          </div>

          <div className="p-2.5 rounded-xl bg-white dark:bg-slate-800/80 border border-slate-200/60 dark:border-slate-700/60 space-y-0.5">
            <div className="font-black text-purple-600 dark:text-purple-400 text-xs">
              P • Point
            </div>
            <p className="text-slate-600 dark:text-slate-300 leading-tight">
              Concluding synthesis and key takeaway.
            </p>
          </div>
        </div>
      </div>

      {/* 3. Daily Featured Challenge Card */}
      {dailyChallenge && (
        <div className="bg-white dark:bg-slate-900 border-2 border-amber-500/80 dark:border-amber-500/60 rounded-2xl p-4.5 space-y-3 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="px-2.5 py-0.5 rounded-full bg-amber-500 text-slate-950 font-black text-[10px] uppercase tracking-wider">
              Daily Featured Challenge
            </span>
            <span className="px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-extrabold text-[10px] uppercase border border-slate-200 dark:border-slate-700">
              {dailyChallenge.level}
            </span>
          </div>

          <div className="space-y-1">
            <span className="text-[10px] font-bold text-amber-600 dark:text-amber-400 uppercase tracking-wider">
              {dailyChallenge.topic}
            </span>
            <h2 className="text-sm font-black text-slate-900 dark:text-white leading-snug">
              {dailyChallenge.question}
            </h2>
          </div>

          {dailyChallenge.targetKeywords && dailyChallenge.targetKeywords.length > 0 && (
            <div className="flex flex-wrap gap-1.5 pt-1">
              {dailyChallenge.targetKeywords.map((kw, idx) => (
                <span
                  key={idx}
                  className="px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-[11px] font-semibold border border-slate-200 dark:border-slate-700"
                >
                  <strong className="text-amber-700 dark:text-amber-400">{kw.word}</strong>
                  {kw.ipa && (
                    <span className="text-slate-500 dark:text-slate-400 text-[10px] ml-1">
                      {kw.ipa}
                    </span>
                  )}
                </span>
              ))}
            </div>
          )}

          <div className="pt-2">
            <Link
              href={`/vocab/speak-your-mind/${dailyChallenge.id}`}
              className="inline-flex items-center justify-center gap-1.5 w-full py-2.5 px-4 bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-bold text-xs rounded-xl shadow-xs hover:bg-slate-800 dark:hover:bg-slate-100 transition-colors cursor-pointer"
            >
              Start PREP Practice <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      )}

      {/* 4. Filter & Questions List */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-xs font-black text-slate-900 dark:text-white uppercase tracking-wider">
            Practice Topics ({filteredQuestions.length})
          </span>

          {/* Filter Chips: Instant Client-side Buttons */}
          <div className="flex items-center gap-1 text-[11px] font-bold">
            {["all", "B1", "B2", "C1"].map((lvl) => {
              const isActive = selectedLevel === lvl;

              return (
                <button
                  key={lvl}
                  type="button"
                  onClick={() => setSelectedLevel(lvl)}
                  className={`px-2.5 py-0.5 rounded-lg transition-colors capitalize cursor-pointer ${
                    isActive
                      ? "bg-slate-900 text-white dark:bg-white dark:text-slate-900 font-black"
                      : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
                  }`}
                >
                  {lvl === "all" ? "All" : lvl}
                </button>
              );
            })}
          </div>
        </div>

        {/* Questions Grid */}
        <div className="space-y-2.5">
          {filteredQuestions.map((q) => (
            <Link
              key={q.id}
              href={`/vocab/speak-your-mind/${q.id}`}
              className="block bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 hover:border-amber-400 dark:hover:border-amber-600/80 rounded-2xl p-4 transition-all group shadow-2xs hover:shadow-xs"
            >
              <div className="flex items-center justify-between gap-2 mb-1.5">
                <span className="text-[10px] font-bold text-amber-600 dark:text-amber-400 uppercase tracking-wider truncate">
                  {q.topic}
                </span>
                <span className="px-1.5 py-0.5 rounded-sm bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 text-[10px] font-bold uppercase border border-slate-200 dark:border-slate-700">
                  {q.level}
                </span>
              </div>

              <h3 className="text-xs font-bold text-slate-900 dark:text-white leading-snug group-hover:text-amber-600 dark:group-hover:text-amber-400 transition-colors">
                {q.question}
              </h3>

              {q.targetKeywords && q.targetKeywords.length > 0 && (
                <div className="flex flex-wrap gap-1 mt-2.5">
                  {q.targetKeywords.map((kw, kidx) => (
                    <span
                      key={kidx}
                      className="px-1.5 py-0.5 rounded bg-slate-50 dark:bg-slate-800/60 text-slate-600 dark:text-slate-300 text-[10px] border border-slate-200/60 dark:border-slate-700/60"
                    >
                      {kw.word}
                    </span>
                  ))}
                </div>
              )}
            </Link>
          ))}

          {filteredQuestions.length === 0 && (
            <div className="p-8 text-center bg-slate-50 dark:bg-slate-900/40 rounded-2xl border border-dashed border-slate-200 dark:border-slate-800 text-slate-500 text-xs">
              No questions found for level <span className="font-bold">{selectedLevel}</span>.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Run TypeScript check to verify SpeakYourMindHub**

Run:
```bash
npx tsc --noEmit
```
Expected: Exit code 0 (no errors).

- [ ] **Step 3: Commit changes for Task 3**

```bash
git add src/components/vocab/speaking/SpeakYourMindHub.tsx
git commit -m "feat(vocab): convert SpeakYourMindHub to client component with instant level filtering"
```

---

### Task 4: Clean up `page.tsx` for Pure Static Pre-rendering

**Files:**
- Modify: `src/app/vocab/speak-your-mind/page.tsx`

- [ ] **Step 1: Simplify `page.tsx` to pure Static Server Component**

Replace `src/app/vocab/speak-your-mind/page.tsx` with:

```tsx
import React from "react";
import { getSpeakingQuestions } from "@/lib/srs/speaking-quiz.service";
import { SpeakYourMindHub } from "@/components/vocab/speaking/SpeakYourMindHub";

/**
 * @file page.tsx
 * @description Static Pre-rendered Page with On-Demand Revalidation for Speak Your Mind Hub.
 * Uses On-Demand ISR: fully cached and instantly served from CDN/Server cache,
 * regenerated only when new questions are added via revalidateSpeakingHub().
 *
 * Mapped Spec: FR-VOCAB-06 | FR-VOCAB-07 | US-VOCAB-03
 * Made by Anh Tu - Share to be share
 */

export default async function SpeakYourMindPage() {
  const questions = await getSpeakingQuestions();

  return (
    <div className="p-4 pt-2">
      <SpeakYourMindHub questions={questions} />
    </div>
  );
}
```

- [ ] **Step 2: Run TypeScript check**

Run:
```bash
npx tsc --noEmit
```
Expected: Exit code 0 (no errors).

- [ ] **Step 3: Commit changes for Task 4**

```bash
git add src/app/vocab/speak-your-mind/page.tsx
git commit -m "refactor(vocab): convert Speak Your Mind Hub page to static ISR component"
```

---

### Task 5: End-to-End Build & Validation

**Files:**
- Verification only

- [ ] **Step 1: Run production build to verify Route Classification**

Run:
```bash
npm run build
```
Expected:
1. Build succeeds with 0 errors.
2. Under "Route (app)", verify `/vocab/speak-your-mind` is marked as:
   `○ /vocab/speak-your-mind   (Static)` instead of `ƒ /vocab/speak-your-mind   (Dynamic)`.

- [ ] **Step 2: Sync and verify OpenLore architectural decisions**

Run:
```bash
npx openlore decisions --consolidate
```
Expected: Consolidation completes without errors.

---
*Made by Anh Tu - Share to be share*
