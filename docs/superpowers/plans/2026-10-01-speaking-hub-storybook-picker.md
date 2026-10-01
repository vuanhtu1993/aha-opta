# Speaking Hub & Visual Storybook Selector Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Refactor the "Speak Your Mind" module from an abrupt single-question screen into a comprehensive Speaking Hub dashboard at `/vocab/speak-your-mind`, route the deep practice player to `/vocab/speak-your-mind/[id]`, and replace manual MongoDB ObjectId input in `SpeakingQuizGenerator` with an intuitive, searchable `StorybookSelectorModal`.

**Architecture:** 
- **Routing & Navigation:** Adopts the Hub-and-Spoke pattern in Next.js 15 App Router. The Hub (`/vocab/speak-your-mind/page.tsx`) renders overview, PREP pedagogy guide, Daily Challenge, and filterable Challenge Library. The Spoke (`/vocab/speak-your-mind/[id]/page.tsx`) renders `SpeakYourMindPlayer` with a top back-link to the Hub.
- **Visual Storybook Selection:** Introduces `StorybookSelectorModal` querying `GET /api/story-shadowing`, offering instant text search and CEFR/difficulty filtering. Selecting a story automatically populates `storybookId` while displaying a rich summary card with thumbnail and title, keeping database IDs hidden from learners.

**Tech Stack:** Next.js 15 (App Router), React 19, TypeScript, Tailwind CSS, Lucide React, SWR.

---

## File Structure & Responsibilities

| File Path | Role | Responsibility |
| :--- | :--- | :--- |
| `src/components/vocab/speaking/StorybookSelectorModal.tsx` | New Component | Searchable modal dialog displaying storybooks from `GET /api/story-shadowing` |
| `src/components/vocab/speaking/SpeakingQuizGenerator.tsx` | Modified Component | Replace raw ObjectId input with visual trigger button & selected story card preview |
| `src/components/vocab/speaking/SpeakYourMindHub.tsx` | New Component | Main Hub client component: Hero banner, Daily Challenge, Filter chips, Challenge cards grid, AI generator modal |
| `src/app/vocab/speak-your-mind/page.tsx` | Modified Page | Server Component for the Hub, fetches questions via `getSpeakingQuestions()` |
| `src/app/vocab/speak-your-mind/[id]/page.tsx` | New Dynamic Route | Server Component for player, fetches question by ID via `getSpeakingQuestionById(id)` |
| `src/components/vocab/speaking/SpeakYourMindPlayer.tsx` | Modified Component | Add top back navigation `← Thư viện chủ đề` linking to `/vocab/speak-your-mind` |
| `src/components/mobile-shell/mobile-tab-bar.tsx` | Modified Component | Ensure active tab highlighting covers both `/vocab/speak-your-mind` and sub-routes |

---

### Task 1: Create StorybookSelectorModal & Visual Storybook Picker in Quiz Generator

**Files:**
- Create: `src/components/vocab/speaking/StorybookSelectorModal.tsx`
- Modify: `src/components/vocab/speaking/SpeakingQuizGenerator.tsx`

- [ ] **Step 1: Create `StorybookSelectorModal.tsx`**

Write the modal component with search filtering, level tabs, and card layout:

```tsx
"use client";

/**
 * @file StorybookSelectorModal.tsx
 * @description Modal trực quan chọn bài học Storybook từ API thay thế việc nhập ObjectId thủ công
 *
 * Mapped Spec: FR-VOCAB-07 | US-VOCAB-04 | AC-VOCAB-12
 * Made by Anh Tu - Share to be share
 */

import React, { useState } from "react";
import useSWR from "swr";
import { Search, X, BookOpen, Video, FileText, Check, Loader2 } from "lucide-react";
import type { StoryHistory } from "@/lib/story-shadowing/story-shadowing.service";

interface StorybookSelectorModalProps {
  isOpen: boolean;
  selectedId?: string;
  onSelect: (story: StoryHistory) => void;
  onClose: () => void;
}

const fetcher = (url: string) => fetch(url).then((res) => res.json());

export function StorybookSelectorModal({
  isOpen,
  selectedId,
  onSelect,
  onClose,
}: StorybookSelectorModalProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [levelFilter, setLevelFilter] = useState<string>("all");

  const { data: stories, isLoading, error } = useSWR<StoryHistory[]>(
    isOpen ? "/api/story-shadowing" : null,
    fetcher,
    { revalidateOnFocus: false, dedupingInterval: 10000 }
  );

  if (!isOpen) return null;

  const filteredStories = (stories || []).filter((story) => {
    const matchesSearch = story.title.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesLevel = levelFilter === "all" || story.level === levelFilter;
    return matchesSearch && matchesLevel;
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl w-full max-w-lg shadow-xl overflow-hidden flex flex-col max-h-[85vh]">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/80 flex items-center justify-center text-amber-600 dark:text-amber-400">
              <BookOpen className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-black text-slate-900 dark:text-white">
                Chọn Bài Học Storybook
              </h3>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                AI sẽ trích xuất ngữ cảnh và từ vựng từ bài này để tạo thử thách tranh biện
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Search & Filter */}
        <div className="p-3 border-b border-slate-100 dark:border-slate-800 space-y-2 bg-slate-50/50 dark:bg-slate-900/50">
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Tìm theo tiêu đề bài học..."
              className="w-full pl-9 pr-3 py-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-hidden focus:border-amber-500"
            />
          </div>
          <div className="flex gap-1.5 overflow-x-auto text-[11px] font-bold">
            {["all", "easy", "medium", "hard"].map((lvl) => (
              <button
                key={lvl}
                type="button"
                onClick={() => setLevelFilter(lvl)}
                className={`px-2.5 py-1 rounded-lg capitalize transition-colors cursor-pointer ${
                  levelFilter === lvl
                    ? "bg-amber-500 text-slate-950 font-black shadow-xs"
                    : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
                }`}
              >
                {lvl === "all" ? "Tất cả" : lvl}
              </button>
            ))}
          </div>
        </div>

        {/* Story List */}
        <div className="flex-1 overflow-y-auto p-3 space-y-2">
          {isLoading && (
            <div className="py-12 flex flex-col items-center justify-center gap-2 text-slate-400">
              <Loader2 className="w-6 h-6 animate-spin text-amber-500" />
              <span className="text-xs">Đang tải danh sách bài học...</span>
            </div>
          )}

          {error && (
            <div className="p-4 text-center text-xs text-rose-500">
              Không thể tải danh sách bài học. Vui lòng thử lại sau.
            </div>
          )}

          {!isLoading && !error && filteredStories.length === 0 && (
            <div className="py-12 text-center text-xs text-slate-400">
              Không tìm thấy bài học nào phù hợp.
            </div>
          )}

          {!isLoading &&
            filteredStories.map((story) => {
              const isSelected = selectedId === story._id;
              return (
                <div
                  key={story._id}
                  onClick={() => {
                    onSelect(story);
                    onClose();
                  }}
                  className={`flex items-center gap-3 p-2.5 rounded-xl border transition-all cursor-pointer ${
                    isSelected
                      ? "bg-amber-50/80 dark:bg-amber-950/30 border-amber-300 dark:border-amber-700/80 shadow-xs"
                      : "bg-white dark:bg-slate-800/60 border-slate-200/80 dark:border-slate-800 hover:border-amber-300 dark:hover:border-amber-800"
                  }`}
                >
                  {/* Thumbnail / Source Type Icon */}
                  <div className="w-14 h-11 rounded-lg overflow-hidden bg-slate-100 dark:bg-slate-800 flex items-center justify-center shrink-0 border border-slate-200/60 dark:border-slate-700/60">
                    {story.thumbnail ? (
                      <img
                        src={story.thumbnail}
                        alt={story.title}
                        className="w-full h-full object-cover"
                      />
                    ) : story.sourceType === "youtube" ? (
                      <Video className="w-5 h-5 text-red-500" />
                    ) : (
                      <FileText className="w-5 h-5 text-slate-400" />
                    )}
                  </div>

                  {/* Title & Metadata */}
                  <div className="flex-1 min-w-0">
                    <h4 className="text-xs font-bold text-slate-900 dark:text-white truncate">
                      {story.title}
                    </h4>
                    <div className="flex items-center gap-2 mt-1">
                      {story.level && (
                        <span className="px-1.5 py-0.5 rounded-sm bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 text-[10px] font-bold uppercase">
                          {story.level}
                        </span>
                      )}
                      {story.partTitle && (
                        <span className="text-[10px] text-slate-400 truncate">
                          {story.partTitle}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Selection Mark */}
                  {isSelected && (
                    <div className="w-6 h-6 rounded-full bg-amber-500 text-slate-950 flex items-center justify-center shrink-0 shadow-xs">
                      <Check className="w-3.5 h-3.5 stroke-[3]" />
                    </div>
                  )}
                </div>
              );
            })}
        </div>

        {/* Footer info */}
        <div className="p-3 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 flex justify-between items-center text-[11px] text-slate-400">
          <span>{filteredStories.length} bài học có sẵn</span>
          <button
            type="button"
            onClick={onClose}
            className="px-3 py-1 bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 rounded-lg font-bold transition-colors cursor-pointer"
          >
            Đóng
          </button>
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Update `SpeakingQuizGenerator.tsx` to use `StorybookSelectorModal`**

Replace manual input:
```tsx
  const [selectedStory, setSelectedStory] = useState<{
    id: string;
    title: string;
    thumbnail?: string;
    level?: string;
  } | null>(
    initialStorybookId ? { id: initialStorybookId, title: "Bài học đã chọn" } : null
  );
  const [isPickerOpen, setIsPickerOpen] = useState(false);
```
In the form, when `mode === "storybook"`:
- If `!selectedStory`: render dashed button "Chọn bài học từ Storybook của bạn".
- If `selectedStory`: render rich preview card with thumbnail, title, level, "Đổi bài khác" button, and "Xoá" button.
- Pass `storybookId: selectedStory?.id` to `startJob`.

- [ ] **Step 3: Run TypeScript check to ensure clean compilation**

Run: `npx tsc --noEmit`
Expected: 0 errors.

- [ ] **Step 4: Commit Task 1**

```bash
git add src/components/vocab/speaking/StorybookSelectorModal.tsx src/components/vocab/speaking/SpeakingQuizGenerator.tsx
git commit -m "feat(vocab): add visual storybook selector modal to speaking quiz generator"
```

---

### Task 2: Build SpeakYourMindHub Component & Daily Challenge Card

**Files:**
- Create: `src/components/vocab/speaking/SpeakYourMindHub.tsx`

- [ ] **Step 1: Implement `SpeakYourMindHub.tsx`**

Build the Hub component with:
1. Hero banner explaining PREP:
   - **P** (Point): Nêu quan điểm trực diện.
   - **R** (Reason): Lý giải nguyên nhân nền tảng.
   - **E** (Example): Dẫn chứng hoặc ví dụ cụ thể.
   - **P** (Point): Tái khẳng định và kết luận logic.
2. Prominent CTA: "Tạo bài nói mới bằng AI (AI Debate Generator)" -> opens `SpeakingQuizGenerator` modal. On ready, routes to `/vocab/speak-your-mind/${newQuestion.id}`.
3. Daily Featured Challenge Card:
   - Highlighting `questions[0]`.
   - Badges: Topic, Level (B2), Target Keywords.
   - Link/Button: "Luyện nói ngay (45s)" -> `/vocab/speak-your-mind/${questions[0].id}`.
4. Challenge Library:
   - CEFR level filter chips (`Tất cả`, `B1`, `B2`, `C1`).
   - Cards grid with Topic, Dilemma title, Level badge, Target Vocabulary pills, and "Vào phòng luyện" action.

- [ ] **Step 2: Run TypeScript check**

Run: `npx tsc --noEmit`
Expected: 0 errors.

- [ ] **Step 3: Commit Task 2**

```bash
git add src/components/vocab/speaking/SpeakYourMindHub.tsx
git commit -m "feat(vocab): create speak your mind hub with daily challenge and library"
```

---

### Task 3: Refactor Speak Your Mind Routing & Navigation Hierarchy

**Files:**
- Modify: `src/app/vocab/speak-your-mind/page.tsx`
- Create: `src/app/vocab/speak-your-mind/[id]/page.tsx`
- Modify: `src/components/vocab/speaking/SpeakYourMindPlayer.tsx`
- Modify: `src/components/mobile-shell/mobile-tab-bar.tsx`

- [ ] **Step 1: Refactor `src/app/vocab/speak-your-mind/page.tsx` into Hub**

```tsx
import React from "react";
import { getSpeakingQuestions } from "@/lib/srs/speaking-quiz.service";
import { SpeakYourMindHub } from "@/components/vocab/speaking/SpeakYourMindHub";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function SpeakYourMindPage() {
  const questions = await getSpeakingQuestions();

  return (
    <div className="p-4 pt-2">
      <SpeakYourMindHub questions={questions} />
    </div>
  );
}
```

- [ ] **Step 2: Create `src/app/vocab/speak-your-mind/[id]/page.tsx` for Player**

```tsx
import React from "react";
import { getSpeakingQuestionById } from "@/lib/srs/speaking-quiz.service";
import { SpeakYourMindPlayer } from "@/components/vocab/speaking/SpeakYourMindPlayer";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function SpeakYourMindPlayerPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const question = await getSpeakingQuestionById(id);

  return (
    <div className="p-4 pt-2">
      <SpeakYourMindPlayer question={question} />
    </div>
  );
}
```

- [ ] **Step 3: Enhance `SpeakYourMindPlayer.tsx` with Back Navigation**

Add a top navigation row:
```tsx
<Link
  href="/vocab/speak-your-mind"
  className="inline-flex items-center gap-1 text-xs font-bold text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white transition-colors py-1 cursor-pointer"
>
  <ArrowLeft className="w-3.5 h-3.5" />
  <span>Quay lại thư viện chủ đề</span>
</Link>
```

- [ ] **Step 4: Check `mobile-tab-bar.tsx` for proper active state and route isolation**

Ensure tab Speak continues to highlight when on `/vocab/speak-your-mind` or `/vocab/speak-your-mind/*`.

- [ ] **Step 5: Run TypeScript check**

Run: `npx tsc --noEmit`
Expected: 0 errors.

- [ ] **Step 6: Commit Task 3**

```bash
git add src/app/vocab/speak-your-mind/page.tsx src/app/vocab/speak-your-mind/[id]/page.tsx src/components/vocab/speaking/SpeakYourMindPlayer.tsx src/components/mobile-shell/mobile-tab-bar.tsx
git commit -m "refactor(vocab): split speak-your-mind into hub and dynamic [id] player route"
```

---

### Task 4: Full Build Verification & OpenLore Decision Sync

**Files:**
- Verified: All project routes and components

- [ ] **Step 1: Execute Next.js production build**

Run: `npm run build`
Expected: Clean build with 29/29 routes generated successfully.

- [ ] **Step 2: Sync OpenLore architectural decisions**

Run: `npx openlore decisions --consolidate`
Verify: Decision `6d25d3ee` is verified and consolidated.

- [ ] **Step 3: Final Git status and commit**

Run: `git status -s`
Ensure clean working tree on `feature-speaking-quiz-agent`.

---

*Made by Anh Tu - Share to be share*
