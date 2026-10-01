# Speak Your Mind (PREP Speaking Quiz) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [x]`) syntax for tracking.

**Goal:** Triển khai tính năng **Speak Your Mind (`prep_speaking`)** theo đặc tả [`US-VOCAB-03`](file:///Users/anhtus/Documents/Development/NextJS/aha-tools/requirements/modules/vocab/spec.md#us-vocab-03-practice-short-opinion-speaking-speak-your-mind) — chế độ Quiz luyện nói ngắn 30–60s theo khung tư duy PREP (Point, Reason, Example, Point), áp dụng cơ chế giàn giáo (Scaffold-First: ẩn bài mẫu, cung cấp từ nối signposts và từ vựng mục tiêu, mở bài mẫu đối chiếu theo nhu cầu và phát âm audio qua Web Speech API).

**Architecture:** 
1. Định nghĩa miền kiểu dữ liệu `ISpeakingQuestion` độc lập (`src/lib/types/speaking-quiz.ts`).
2. Xây dựng dịch vụ `speaking-quiz.service.ts` cung cấp các câu hỏi mẫu PREP chuẩn sư phạm.
3. Tạo API Route `GET /api/vocab/speak-your-mind` theo chuẩn [`api-contract.md`](file:///Users/anhtus/Documents/Development/NextJS/aha-tools/requirements/modules/vocab/api-contract.md#16-get-apivocabspeak-your-mind).
4. Xây dựng các UI component phân rã (`SpeakingPrepCard`, `SpeakingTimer`, `SpeakYourMindPlayer`) tuân thủ nguyên tắc Progressive Disclosure.
5. Tạo trang thực nghiệm `/vocab/speak-your-mind` và gắn thẻ truy cập từ Tab Vocab (`/vocab`).

**Tech Stack:** Next.js 16 (App Router), React 19, TypeScript 5, Tailwind CSS v4, Lucide Icons, Web Speech API (`SpeechSynthesisUtterance` qua `vocabSpeaker`).

---

### Task 1: Định Nghĩa TypeScript Types Cho `SpeakingQuestion`

**Files:**
- Create: `src/lib/types/speaking-quiz.ts`

- [x] **Step 1: Tạo file `src/lib/types/speaking-quiz.ts`**

```typescript
/**
 * @file speaking-quiz.ts
 * @description Định nghĩa Type & Interface cho chế độ Speaking Quiz (Speak Your Mind - PREP)
 *
 * Made by Anh Tu - Share to be share
 */

export interface ITargetKeyword {
  word: string;
  ipa?: string;
  meaning: string;
}

export interface ISpeakingScaffoldStage {
  stage: "point" | "reason" | "example" | "conclusion";
  title: string;
  signposts: string[];
  hint: string;
  modelAnswer: string;
}

export interface ISpeakingScaffold {
  point: ISpeakingScaffoldStage;
  reason: ISpeakingScaffoldStage;
  example: ISpeakingScaffoldStage;
  conclusion: ISpeakingScaffoldStage;
}

export interface ISpeakingQuestion {
  id: string;
  topic: string;
  question: string;
  level: "B1" | "B2" | "C1";
  targetDurationSeconds: number; // Mặc định 45s (trong khoảng 30-60s)
  targetKeywords: ITargetKeyword[];
  prepScaffold: ISpeakingScaffold;
}
```

- [x] **Step 2: Commit**

```bash
git add src/lib/types/speaking-quiz.ts
git commit -m "feat(vocab): add TypeScript interfaces for Speak Your Mind PREP quiz"
```

---

### Task 2: Xây Dựng Service & Bộ Đề Mẫu Chuẩn PREP

**Files:**
- Create: `src/lib/srs/speaking-quiz.service.ts`

- [x] **Step 1: Tạo file `src/lib/srs/speaking-quiz.service.ts`**

```typescript
/**
 * @file speaking-quiz.service.ts
 * @description Service cung cấp danh sách câu hỏi Speaking PREP phục vụ luyện tập và thử nghiệm.
 *
 * Made by Anh Tu - Share to be share
 */

import { ISpeakingQuestion } from "@/lib/types/speaking-quiz";

export const MOCK_SPEAKING_QUESTIONS: ISpeakingQuestion[] = [
  {
    id: "sq-01",
    topic: "Technology & Education",
    question: "Should AI be allowed to replace human teachers?",
    level: "B2",
    targetDurationSeconds: 45,
    targetKeywords: [
      { word: "empathy", ipa: "/ˈem.pə.θi/", meaning: "Sự thấu cảm, khả năng thấu hiểu cảm xúc" },
      { word: "irreplaceable", ipa: "/ˌɪr.ɪˈpleɪ.sə.bəl/", meaning: "Không thể thay thế được" }
    ],
    prepScaffold: {
      point: {
        stage: "point",
        title: "1. [P] Point (Luận điểm)",
        signposts: ["In my opinion, ...", "I strongly believe that ...", "From my perspective, ..."],
        hint: "Nêu trực diện bạn đồng ý hay phản đối việc AI thay thế giáo viên.",
        modelAnswer: "In my opinion, AI can assist learning effectively but should never fully replace human teachers."
      },
      reason: {
        stage: "reason",
        title: "2. [R] Reason (Lý do cốt lõi)",
        signposts: ["The main reason is that ...", "Because ...", "Since ..."],
        hint: "Chỉ ra ranh giới cốt lõi: giáo dục đòi hỏi sự thấu cảm và kết nối cảm xúc thực thụ.",
        modelAnswer: "The primary reason is that genuine education requires deep empathy and emotional bonding, which algorithms completely lack."
      },
      example: {
        stage: "example",
        title: "3. [E] Example (Ví dụ minh chứng)",
        signposts: ["For instance, ...", "In my personal experience, ...", "Take ... as an example"],
        hint: "Kể một tình huống học sinh gặp khủng hoảng tâm lý và được thầy cô khích lệ.",
        modelAnswer: "For instance, when students struggle with self-doubt or personal adversity, a caring teacher provides inspiration that no automated chatbot can offer."
      },
      conclusion: {
        stage: "conclusion",
        title: "4. [P] Point (Khẳng định lại)",
        signposts: ["Therefore, ...", "That is why ...", "To sum up, ..."],
        hint: "Chốt lại vị thế của AI là trợ lý học tập đắc lực, nhưng bản chất con người là duy nhất.",
        modelAnswer: "Therefore, while AI is an extraordinary instructional assistant, the human essence of teaching remains truly irreplaceable."
      }
    }
  },
  {
    id: "sq-02",
    topic: "Habits & Personal Growth",
    question: "Is daily consistency more important than intense motivation when building new habits?",
    level: "B1",
    targetDurationSeconds: 45,
    targetKeywords: [
      { word: "consistency", ipa: "/kənˈsɪs.tən.si/", meaning: "Sự kiên trì, tính nhất quán hàng ngày" },
      { word: "compound", ipa: "/ˈkɒm.paʊnd/", meaning: "Cộng dồn, nhân lên theo cấp số nhân" }
    ],
    prepScaffold: {
      point: {
        stage: "point",
        title: "1. [P] Point (Luận điểm)",
        signposts: ["I firmly believe that ...", "In my view, ...", "Without a doubt, ..."],
        hint: "Khẳng định sự kiên trì hàng ngày vượt trội hơn cảm hứng nhất thời.",
        modelAnswer: "I firmly believe that daily consistency is vastly more important than intense motivation for lasting success."
      },
      reason: {
        stage: "reason",
        title: "2. [R] Reason (Lý do cốt lõi)",
        signposts: ["This is because ...", "The reason is that ...", "Due to the fact that ..."],
        hint: "Giải thích rằng động lực thường chóng tàn, trong khi thói quen nhỏ tích lũy lâu dài.",
        modelAnswer: "This is because emotional motivation fluctuates quickly, whereas small repetitive actions build automatic neural pathways."
      },
      example: {
        stage: "example",
        title: "3. [E] Example (Ví dụ minh chứng)",
        signposts: ["For example, ...", "Take language learning as an example, ...", "In my case, ..."],
        hint: "So sánh người học 15 phút mỗi ngày với người học dồn 5 tiếng một tuần.",
        modelAnswer: "For example, practicing English for just fifteen minutes every single day produces dramatic compound growth compared to cramming five hours on weekends."
      },
      conclusion: {
        stage: "conclusion",
        title: "4. [P] Point (Khẳng định lại)",
        signposts: ["Therefore, ...", "As a result, ...", "That is why ..."],
        hint: "Chốt lại: kiên trì kỷ luật chính là chìa khóa then chốt.",
        modelAnswer: "Therefore, focusing on disciplined consistency rather than waiting for mood motivation is the true secret of mastery."
      }
    }
  }
];

export async function getSpeakingQuestions(): Promise<ISpeakingQuestion[]> {
  return MOCK_SPEAKING_QUESTIONS;
}

export async function getSpeakingQuestionById(id?: string): Promise<ISpeakingQuestion> {
  if (id) {
    const found = MOCK_SPEAKING_QUESTIONS.find((q) => q.id === id);
    if (found) return found;
  }
  // Mặc định trả về câu hỏi đầu tiên
  return MOCK_SPEAKING_QUESTIONS[0];
}
```

- [x] **Step 2: Commit**

```bash
git add src/lib/srs/speaking-quiz.service.ts
git commit -m "feat(vocab): add speaking quiz service with seed PREP questions"
```

---

### Task 3: Tạo API Route `GET /api/vocab/speak-your-mind`

**Files:**
- Create: `src/app/api/vocab/speak-your-mind/route.ts`

- [x] **Step 1: Tạo file `src/app/api/vocab/speak-your-mind/route.ts`**

```typescript
/**
 * @file route.ts
 * @description API endpoint trả về câu hỏi luyện nói PREP (Speak Your Mind)
 *
 * Mapped Spec: FR-VOCAB-06 | US-VOCAB-03
 * Made by Anh Tu - Share to be share
 */

import { NextRequest, NextResponse } from "next/server";
import { getSpeakingQuestionById, getSpeakingQuestions } from "@/lib/srs/speaking-quiz.service";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");
    const listAll = searchParams.get("all") === "true";

    if (listAll) {
      const questions = await getSpeakingQuestions();
      return NextResponse.json({ questions, total: questions.length });
    }

    const question = await getSpeakingQuestionById(id || undefined);
    return NextResponse.json(question);
  } catch (error) {
    console.error("[API/speak-your-mind GET] Error:", error);
    return NextResponse.json(
      { error: "Không thể tải câu hỏi luyện nói PREP" },
      { status: 500 }
    );
  }
}
```

- [x] **Step 2: Kiểm thử route bằng `curl`**

Chạy command:
```bash
curl -s http://localhost:3000/api/vocab/speak-your-mind | grep "Should AI be allowed"
```
Expected: Tìm thấy chuỗi `"Should AI be allowed to replace human teachers?"`.

- [x] **Step 3: Commit**

```bash
git add src/app/api/vocab/speak-your-mind/route.ts
git commit -m "feat(api): add GET /api/vocab/speak-your-mind route handler"
```

---

### Task 4: Tạo Các Thành Phần UI Giàn Giáo PREP (`SpeakingPrepCard` & `SpeakingTimer`)

**Files:**
- Create: `src/components/vocab/speaking/SpeakingPrepCard.tsx`
- Create: `src/components/vocab/speaking/SpeakingTimer.tsx`

- [x] **Step 1: Tạo component `src/components/vocab/speaking/SpeakingPrepCard.tsx`**

```tsx
"use client";

import React, { useState } from "react";
import { Eye, EyeOff, Volume2, Sparkles, HelpCircle } from "lucide-react";
import { ISpeakingScaffoldStage } from "@/lib/types/speaking-quiz";
import { vocabSpeaker } from "@/lib/services/vocab-speaker";

interface SpeakingPrepCardProps {
  stageData: ISpeakingScaffoldStage;
  themeColor: "emerald" | "blue" | "amber" | "purple";
  isForceRevealed?: boolean;
}

const THEME_STYLES = {
  emerald: {
    border: "border-emerald-200 dark:border-emerald-800/60",
    bg: "bg-emerald-50/50 dark:bg-emerald-950/20",
    badge: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/60 dark:text-emerald-200",
    chip: "bg-white dark:bg-slate-800 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800",
    revealBtn: "text-emerald-600 dark:text-emerald-400 hover:bg-emerald-100/60 dark:hover:bg-emerald-900/40",
    modelBox: "bg-emerald-100/40 dark:bg-emerald-900/30 border-emerald-300 dark:border-emerald-700",
  },
  blue: {
    border: "border-blue-200 dark:border-blue-800/60",
    bg: "bg-blue-50/50 dark:bg-blue-950/20",
    badge: "bg-blue-100 text-blue-800 dark:bg-blue-900/60 dark:text-blue-200",
    chip: "bg-white dark:bg-slate-800 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-800",
    revealBtn: "text-blue-600 dark:text-blue-400 hover:bg-blue-100/60 dark:hover:bg-blue-900/40",
    modelBox: "bg-blue-100/40 dark:bg-blue-900/30 border-blue-300 dark:border-blue-700",
  },
  amber: {
    border: "border-amber-200 dark:border-amber-800/60",
    bg: "bg-amber-50/50 dark:bg-amber-950/20",
    badge: "bg-amber-100 text-amber-800 dark:bg-amber-900/60 dark:text-amber-200",
    chip: "bg-white dark:bg-slate-800 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800",
    revealBtn: "text-amber-600 dark:text-amber-400 hover:bg-amber-100/60 dark:hover:bg-amber-900/40",
    modelBox: "bg-amber-100/40 dark:bg-amber-900/30 border-amber-300 dark:border-amber-700",
  },
  purple: {
    border: "border-purple-200 dark:border-purple-800/60",
    bg: "bg-purple-50/50 dark:bg-purple-950/20",
    badge: "bg-purple-100 text-purple-800 dark:bg-purple-900/60 dark:text-purple-200",
    chip: "bg-white dark:bg-slate-800 text-purple-700 dark:text-purple-300 border-purple-200 dark:border-purple-800",
    revealBtn: "text-purple-600 dark:text-purple-400 hover:bg-purple-100/60 dark:hover:bg-purple-900/40",
    modelBox: "bg-purple-100/40 dark:bg-purple-900/30 border-purple-300 dark:border-purple-700",
  },
};

export function SpeakingPrepCard({
  stageData,
  themeColor,
  isForceRevealed = false,
}: SpeakingPrepCardProps) {
  const [isRevealed, setIsRevealed] = useState(false);
  const theme = THEME_STYLES[themeColor];
  const showModel = isForceRevealed || isRevealed;

  const handleSpeak = (e: React.MouseEvent) => {
    e.stopPropagation();
    vocabSpeaker.speak(stageData.modelAnswer);
  };

  return (
    <div
      className={`border ${theme.border} ${theme.bg} rounded-2xl p-3.5 space-y-2.5 transition-all shadow-2xs`}
    >
      {/* 1. Header & Stage Title */}
      <div className="flex items-center justify-between gap-2">
        <span className={`text-[11px] font-black uppercase tracking-wider px-2 py-0.5 rounded-lg ${theme.badge}`}>
          {stageData.title}
        </span>

        {/* Toggle Reveal Button */}
        <button
          onClick={() => setIsRevealed(!isRevealed)}
          className={`flex items-center gap-1 text-[11px] font-bold px-2 py-1 rounded-lg transition-colors cursor-pointer ${theme.revealBtn}`}
          title={showModel ? "Ẩn câu mẫu" : "Xem câu mẫu đối chiếu"}
        >
          {showModel ? (
            <>
              <EyeOff className="w-3.5 h-3.5" />
              <span>Ẩn câu mẫu</span>
            </>
          ) : (
            <>
              <Eye className="w-3.5 h-3.5" />
              <span>Xem câu mẫu</span>
            </>
          )}
        </button>
      </div>

      {/* 2. Conceptual Hint */}
      <div className="flex items-start gap-1.5 text-xs text-slate-700 dark:text-slate-300">
        <HelpCircle className="w-3.5 h-3.5 text-slate-400 shrink-0 mt-0.5" />
        <span className="leading-snug">{stageData.hint}</span>
      </div>

      {/* 3. Signpost Chips (Từ mồi tư duy) */}
      <div className="space-y-1">
        <div className="text-[10px] font-extrabold uppercase text-slate-600 dark:text-slate-400">
          Từ nối gợi ý (Signposts):
        </div>
        <div className="flex flex-wrap gap-1.5">
          {stageData.signposts.map((signpost, idx) => (
            <span
              key={idx}
              className={`text-[11px] font-semibold px-2 py-0.5 rounded-md border ${theme.chip} shadow-3xs`}
            >
              {signpost}
            </span>
          ))}
        </div>
      </div>

      {/* 4. Model Answer (Accordion / Concealed by default) */}
      {showModel && (
        <div
          className={`mt-2 p-3 rounded-xl border ${theme.modelBox} space-y-1.5 transition-all animate-fadeIn`}
        >
          <div className="flex items-center justify-between gap-2">
            <span className="text-[10px] font-black uppercase text-slate-600 dark:text-slate-400 flex items-center gap-1">
              <Sparkles className="w-3 h-3 text-amber-500" />
              <span>Câu mẫu đối chiếu:</span>
            </span>
            <button
              onClick={handleSpeak}
              className="p-1 rounded-lg bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:text-amber-500 dark:hover:text-amber-400 transition-colors shadow-2xs cursor-pointer"
              title="Nghe phát âm chuẩn (Web Speech)"
            >
              <Volume2 className="w-3.5 h-3.5" />
            </button>
          </div>
          <p className="text-xs text-slate-900 dark:text-white font-medium leading-relaxed italic">
            "{stageData.modelAnswer}"
          </p>
        </div>
      )}
    </div>
  );
}
```

- [x] **Step 2: Tạo component `src/components/vocab/speaking/SpeakingTimer.tsx`**

```tsx
"use client";

import React, { useState, useEffect } from "react";
import { Play, Pause, RotateCcw, Clock } from "lucide-react";

interface SpeakingTimerProps {
  durationSeconds?: number;
  onTimeEnd?: () => void;
}

export function SpeakingTimer({
  durationSeconds = 45,
  onTimeEnd,
}: SpeakingTimerProps) {
  const [timeLeft, setTimeLeft] = useState(durationSeconds);
  const [isActive, setIsActive] = useState(false);

  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;
    if (isActive && timeLeft > 0) {
      interval = setInterval(() => {
        setTimeLeft((prev) => prev - 1);
      }, 1000);
    } else if (timeLeft === 0 && isActive) {
      setIsActive(false);
      if (onTimeEnd) onTimeEnd();
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isActive, timeLeft, onTimeEnd]);

  const toggleTimer = () => setIsActive(!isActive);

  const resetTimer = () => {
    setIsActive(false);
    setTimeLeft(durationSeconds);
  };

  const progressPercent = ((durationSeconds - timeLeft) / durationSeconds) * 100;
  const isUrgent = timeLeft <= 10;

  return (
    <div className="bg-slate-900 text-white p-3.5 rounded-2xl flex items-center justify-between gap-3 shadow-md border border-slate-800">
      <div className="flex items-center gap-2.5 min-w-0">
        <div className={`p-2 rounded-xl shrink-0 ${isUrgent ? "bg-rose-500 animate-pulse" : "bg-amber-500"}`}>
          <Clock className="w-4 h-4 text-white" />
        </div>
        <div>
          <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
            Thời gian nói mục tiêu
          </div>
          <div className={`text-lg font-black tracking-tight font-mono ${isUrgent ? "text-rose-400" : "text-white"}`}>
            00:{timeLeft < 10 ? `0${timeLeft}` : timeLeft}s
            <span className="text-[11px] font-normal text-slate-400 ml-1.5">
              / {durationSeconds}s
            </span>
          </div>
        </div>
      </div>

      {/* Progress & Controls */}
      <div className="flex items-center gap-2">
        <button
          onClick={resetTimer}
          className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors cursor-pointer"
          title="Đặt lại đồng hồ"
        >
          <RotateCcw className="w-4 h-4" />
        </button>

        <button
          onClick={toggleTimer}
          className={`px-3.5 py-2 rounded-xl font-black text-xs flex items-center gap-1.5 transition-all shadow-xs active:scale-95 cursor-pointer ${
            isActive
              ? "bg-rose-600 hover:bg-rose-700 text-white"
              : "bg-amber-500 hover:bg-amber-600 text-slate-950"
          }`}
        >
          {isActive ? (
            <>
              <Pause className="w-3.5 h-3.5 fill-current" />
              <span>Tạm dừng</span>
            </>
          ) : (
            <>
              <Play className="w-3.5 h-3.5 fill-current" />
              <span>Bấm giờ tự nói</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
}
```

- [x] **Step 3: Commit**

```bash
git add src/components/vocab/speaking/SpeakingPrepCard.tsx src/components/vocab/speaking/SpeakingTimer.tsx
git commit -m "feat(ui): create SpeakingPrepCard and SpeakingTimer components"
```

---

### Task 5: Xây Dựng Component Chính `SpeakYourMindPlayer.tsx`

**Files:**
- Create: `src/components/vocab/speaking/SpeakYourMindPlayer.tsx`

- [x] **Step 1: Tạo file `src/components/vocab/speaking/SpeakYourMindPlayer.tsx`**

```tsx
"use client";

import React, { useState } from "react";
import { Mic, Sparkles, Eye, EyeOff, BookOpen, Volume2, ArrowLeft } from "lucide-react";
import Link from "next/link";
import { ISpeakingQuestion } from "@/lib/types/speaking-quiz";
import { SpeakingPrepCard } from "./SpeakingPrepCard";
import { SpeakingTimer } from "./SpeakingTimer";
import { vocabSpeaker } from "@/lib/services/vocab-speaker";

interface SpeakYourMindPlayerProps {
  question: ISpeakingQuestion;
}

export function SpeakYourMindPlayer({ question }: SpeakYourMindPlayerProps) {
  const [revealAll, setRevealAll] = useState(false);

  const handleSpeakWord = (word: string) => {
    vocabSpeaker.speak(word);
  };

  return (
    <div className="space-y-4 max-w-xl mx-auto pb-16">
      {/* 1. Header Navigation */}
      <div className="flex items-center justify-between gap-2">
        <Link
          href="/vocab"
          className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Quay lại Vocab</span>
        </Link>
        <span className="px-2.5 py-0.5 rounded-full bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 font-extrabold text-[10px] tracking-wider uppercase border border-amber-200 dark:border-amber-800">
          Level {question.level} • 30-60s PREP
        </span>
      </div>

      {/* 2. Challenge Question Card */}
      <div className="bg-gradient-to-br from-amber-500/10 via-orange-500/10 to-rose-500/10 border border-amber-200/80 dark:border-amber-800/80 rounded-3xl p-4 space-y-3 shadow-xs">
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-xl bg-amber-500 text-slate-950 shrink-0 font-black shadow-xs">
            <Mic className="w-4 h-4" />
          </div>
          <div>
            <div className="text-[10px] font-extrabold text-amber-700 dark:text-amber-400 uppercase tracking-wider">
              {question.topic}
            </div>
            <h2 className="text-base font-black text-slate-900 dark:text-white leading-snug">
              {question.question}
            </h2>
          </div>
        </div>

        {/* Target Mandatory Vocabulary Badges */}
        <div className="pt-2 border-t border-amber-200/60 dark:border-amber-800/60 space-y-1.5">
          <div className="text-[10px] font-bold text-slate-500 dark:text-slate-400 flex items-center gap-1">
            <BookOpen className="w-3 h-3 text-amber-500" />
            <span>Từ vựng FSRS bắt buộc lồng vào bài nói:</span>
          </div>
          <div className="flex flex-wrap gap-2">
            {question.targetKeywords.map((item, idx) => (
              <div
                key={idx}
                onClick={() => handleSpeakWord(item.word)}
                className="group flex items-center gap-1.5 bg-white dark:bg-slate-800 border border-amber-200 dark:border-slate-700 px-2.5 py-1 rounded-xl text-xs shadow-3xs cursor-pointer hover:border-amber-400 transition-colors"
                title="Bấm để nghe phát âm"
              >
                <span className="font-extrabold text-amber-600 dark:text-amber-400">
                  {item.word}
                </span>
                {item.ipa && (
                  <span className="text-[10px] text-slate-400 font-mono">
                    {item.ipa}
                  </span>
                )}
                <Volume2 className="w-3 h-3 text-slate-400 group-hover:text-amber-500 transition-colors" />
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* 3. Timer Control Bar */}
      <SpeakingTimer durationSeconds={question.targetDurationSeconds} />

      {/* 4. Global Reveal / Hide All Model Answers Button */}
      <div className="flex items-center justify-between px-1">
        <span className="text-xs font-bold text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
          <Sparkles className="w-3.5 h-3.5 text-amber-500" />
          <span>Khung lập luận PREP (Tự nói trước khi mở đáp án)</span>
        </span>
        <button
          onClick={() => setRevealAll(!revealAll)}
          className="text-xs font-bold text-amber-600 dark:text-amber-400 hover:underline flex items-center gap-1 cursor-pointer"
        >
          {revealAll ? (
            <>
              <EyeOff className="w-3.5 h-3.5" />
              <span>Ẩn toàn bộ bài mẫu</span>
            </>
          ) : (
            <>
              <Eye className="w-3.5 h-3.5" />
              <span>Mở toàn bộ bài mẫu</span>
            </>
          )}
        </button>
      </div>

      {/* 5. Four PREP Scaffold Cards */}
      <div className="space-y-2.5">
        <SpeakingPrepCard
          stageData={question.prepScaffold.point}
          themeColor="emerald"
          isForceRevealed={revealAll}
        />
        <SpeakingPrepCard
          stageData={question.prepScaffold.reason}
          themeColor="blue"
          isForceRevealed={revealAll}
        />
        <SpeakingPrepCard
          stageData={question.prepScaffold.example}
          themeColor="amber"
          isForceRevealed={revealAll}
        />
        <SpeakingPrepCard
          stageData={question.prepScaffold.conclusion}
          themeColor="purple"
          isForceRevealed={revealAll}
        />
      </div>
    </div>
  );
}
```

- [x] **Step 2: Commit**

```bash
git add src/components/vocab/speaking/SpeakYourMindPlayer.tsx
git commit -m "feat(ui): implement SpeakYourMindPlayer container component"
```

---

### Task 6: Tạo Trang Thử Nghiệm `/vocab/speak-your-mind` & Nút Truy Cập Tại `/vocab`

**Files:**
- Create: `src/app/vocab/speak-your-mind/page.tsx`
- Modify: `src/app/vocab/page.tsx`

- [x] **Step 1: Tạo file `src/app/vocab/speak-your-mind/page.tsx`**

```tsx
import React from "react";
import { getSpeakingQuestionById } from "@/lib/srs/speaking-quiz.service";
import { SpeakYourMindPlayer } from "@/components/vocab/speaking/SpeakYourMindPlayer";

export const dynamic = "force-dynamic";

export default async function SpeakYourMindPage({
  searchParams,
}: {
  searchParams: Promise<{ id?: string }>;
}) {
  const { id } = await searchParams;
  const question = await getSpeakingQuestionById(id);

  return (
    <div className="p-4 pt-2">
      <SpeakYourMindPlayer question={question} />
    </div>
  );
}
```

- [x] **Step 2: Gắn thẻ truy cập Speak Your Mind vào `src/app/vocab/page.tsx`**

Chèn banner điều hướng vào giữa `VocabClozeBatchBanner` và danh sách từ vựng:

```tsx
      {/* 3. Interactive Batch Cloze AI Banner */}
      <VocabClozeBatchBanner />

      {/* 3.5 Speak Your Mind (PREP Speaking Quiz) CTA Card */}
      <div className="bg-gradient-to-r from-amber-500/10 via-orange-500/10 to-rose-500/10 border border-amber-200 dark:border-amber-800/80 rounded-2xl p-4 flex items-center justify-between gap-3 shadow-2xs">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="p-2 rounded-xl bg-amber-500 text-slate-950 shrink-0 font-black shadow-xs">
            <span className="text-sm">🎤</span>
          </div>
          <div>
            <h4 className="text-xs font-black text-slate-900 dark:text-white flex items-center gap-1.5">
              <span>Speak Your Mind</span>
              <span className="px-2 py-0.5 rounded-full bg-amber-100 dark:bg-amber-900/60 text-amber-800 dark:text-amber-300 text-[10px] font-bold">
                PREP Quiz
              </span>
            </h4>
            <p className="text-[11px] text-slate-600 dark:text-slate-400 mt-0.5">
              Luyện phản xạ nói quan điểm 30–60s theo khung PREP chuẩn sư phạm.
            </p>
          </div>
        </div>
        <a
          href="/vocab/speak-your-mind"
          className="shrink-0 px-3.5 py-2 bg-amber-500 hover:bg-amber-600 text-slate-950 font-black text-xs rounded-xl shadow-xs transition-all active:scale-95 cursor-pointer flex items-center gap-1"
        >
          <span>Luyện nói</span>
          <span>→</span>
        </a>
      </div>
```

- [x] **Step 3: Commit**

```bash
git add src/app/vocab/speak-your-mind/page.tsx src/app/vocab/page.tsx
git commit -m "feat(vocab): add Speak Your Mind trial page and banner entry in /vocab"
```

---

### Task 7: Kiểm Thử Toàn Diện & Tự Đánh Giá (Self-Review)

**Files:**
- Execute: Build & Lint commands
- Verify: Interactive Browser Flow

- [x] **Step 1: Chạy Next.js build để kiểm tra kiểu dữ liệu và cú pháp**

Run: `npm run build`
Expected: Compile thành công không có lỗi TypeScript hoặc lint.

- [x] **Step 2: Kiểm thử thủ công trên trình duyệt tại `/vocab/speak-your-mind`**
  - Mở URL `http://localhost:3000/vocab/speak-your-mind`.
  - Kiểm tra 4 thẻ PREP hiển thị đầy đủ hint và signposts; bài mẫu bị ẩn mặc định ([`AC-VOCAB-06`](file:///Users/anhtus/Documents/Development/NextJS/aha-tools/requirements/modules/vocab/acceptance-criteria.md#ac-vocab-06-scaffolded-prep-display--concealed-model-answer)).
  - Bấm nút "Bấm giờ tự nói" xem đồng hồ đếm ngược có chạy mượt mà không.
  - Bấm nút "Xem câu mẫu" trên từng thẻ và "Mở toàn bộ bài mẫu" để kiểm tra tính năng mở đáp án.
  - Bấm vào biểu tượng loa để nghe thử giọng đọc Web Speech API ([`AC-VOCAB-07`](file:///Users/anhtus/Documents/Development/NextJS/aha-tools/requirements/modules/vocab/acceptance-criteria.md#ac-vocab-07-offline-speech-synthesis-playback-for-model-sentences)).

- [x] **Step 3: Commit hoàn tất Phase 1**

```bash
git commit --allow-empty -m "docs: complete verification for US-VOCAB-03 Speak Your Mind MVP"
```

---

*Made by Anh Tu - Share to be share*
