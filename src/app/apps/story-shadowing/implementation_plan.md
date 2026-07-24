# AI Story Shadowing — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Thêm một micro-app "Story Shadowing" vào workspace `aha-tools`, cho phép người dùng nhập đoạn văn bản tiếng Anh, AI sẽ chia câu, tổng hợp giọng đọc (TTS), và phát theo kiểu Shadowing (AI đọc → dừng → người dùng lặp lại).

**Architecture:** Frontend dùng Next.js App Router với một Custom Hook `useShadowingPlayer` quản lý State Machine. Backend dùng Next.js API Routes để gọi Gemini Flash (chia câu + phân tích độ khó) và Google Cloud TTS (tổng hợp âm thanh). LangGraph orchestrate pipeline AI 2 bước: sentence-splitter → tts-generator.

**Tech Stack:** Next.js 16 (App Router), React 19, TailwindCSS v4, `@langchain/langgraph` v1.3.6, `@langchain/google-genai` v2, Google Cloud TTS API, Zod v4, SWR v2, MongoDB (Mongoose).

---

## 📊 Đánh giá Khả thi (Feasibility Assessment)

### ✅ Điểm THUẬN LỢI (Green Flags)

| Yếu tố | Nhận xét |
|---|---|
| **LangGraph đã được cài sẵn** | `@langchain/langgraph@1.3.6` và `@langchain/google-genai` đều có trong `package.json`. Không cần cài thêm gì. |
| **Pattern LangGraph đã có sẵn** | Dự án đã có `opta-agent` với `graph.ts` + `state.ts` + `nodes/`. Pipeline shadowing chỉ cần copy pattern này. |
| **Next.js API Routes** | Kiến trúc hiện tại đã có `src/app/api/` — Backend logic không cần server riêng. |
| **Codebase có Shadcn UI** | `components.json` xác nhận Shadcn đã được thiết lập, có thể dùng ngay các component `Card`, `Button`, `Slider`, `Progress`. |
| **Giai đoạn 1 không cần PDF** | Chỉ nhập text thô → giảm thiểu rủi ro, khả thi ngay trong tuần đầu. |

### ⚠️ Rủi ro cần quản lý (Risk Management)

| Rủi ro | Mức độ | Cách giảm thiểu |
|---|---|---|
| **Google Cloud TTS billing** | Cao | Dùng `Standard` voice thay vì `WaveNet` (rẻ hơn 4x). Giới hạn text input ≤ 500 ký tự/session. |
| **Latency TTS** | Trung bình | Pre-generate toàn bộ audio **trước khi** phát — không stream realtime. Hiển thị loading spinner. |
| **Audio `duration` chưa load** | Cao (edge case) | Chờ event `loadedmetadata` trước khi tính toán `setTimeout`, có fallback tính theo ký tự (100ms/ký tự). |
| **Memory leak (setTimeout)** | Trung bình | Custom Hook phải `clearTimeout` trong `useEffect` cleanup và khi user bấm Pause. |
| **Gemini JSON hallucination** | Thấp | Dùng `response_mime_type: "application/json"` + Zod schema để validate output. |

---

## 🗂️ Cấu trúc File (File Structure Map)

```
src/
├── app/
│   ├── apps/
│   │   └── story-shadowing/                         [NEW DIR]
│   │       ├── page.tsx                        [NEW] — Trang nhập text + nút "Generate"
│   │       └── player/
│   │           └── page.tsx                   [NEW] — Trang Shadowing Player
│   └── api/
│       └── story-shadowing/                         [NEW DIR]
│           ├── process/
│           │   └── route.ts                   [NEW] — POST: nhận text, chạy LangGraph pipeline
│           └── tts/
│               └── route.ts                   [NEW] — POST: nhận 1 câu, trả về audio base64
├── lib/
│   ├── agents/
│   │   └── story-shadowing-agent/                   [NEW DIR]
│   │       ├── state.ts                       [NEW] — LangGraph State schema
│   │       ├── graph.ts                       [NEW] — Graph orchestrator
│   │       └── nodes/
│   │           ├── sentence-splitter.node.ts  [NEW] — Gemini Flash: chia câu
│   │           └── tts-generator.node.ts      [NEW] — Google Cloud TTS: tổng hợp audio
│   └── schemas/
│       └── story-shadowing.schema.ts               [NEW] — Zod schemas dùng chung
└── components/
    └── story-shadowing/                             [NEW DIR]
        ├── text-input-form.tsx               [NEW] — Form nhập text
        ├── shadowing-player.tsx              [NEW] — Component player chính
        ├── sentence-card.tsx                 [NEW] — Hiển thị 1 câu (có highlight)
        └── progress-countdown.tsx            [NEW] — Progress bar đếm ngược
```

**File bị modify:**
- `src/app/page.tsx` — Thêm card "AI Story Shadowing" vào danh sách micro-apps
- `src/app/api/story-shadowing/route.ts` — Thêm field `level` vào projection
- `src/lib/db/models/Storybook.ts` — Thêm fields `level`, `voice`
- `src/lib/schemas/story-shadowing.schema.ts` — Thêm `level` vào Gemini schema
- `src/lib/agents/story-shadowing-agent/state.ts` — Thêm `voice`, `level` vào State
- `src/lib/agents/story-shadowing-agent/graph.ts` — Nhận `voice` input, trả về `level`
- `src/lib/agents/story-shadowing-agent/nodes/sentence-splitter.node.ts` — Cập nhật prompt phân tích độ khó
- `src/lib/agents/story-shadowing-agent/nodes/tts-generator.node.ts` — Dynamic voice selection
- `src/app/api/story-shadowing/process/route.ts` — Nhận `voice`, lưu metadata
- `src/app/apps/story-shadowing/create/page.tsx` — Thêm voice select dropdown
- `src/app/apps/story-shadowing/page.tsx` — Hiển thị badge level
- `src/app/apps/story-shadowing/player/[id]/page.tsx` — Hiển thị title, level
- `src/components/story-shadowing/shadowing-player.tsx` — Tích hợp header + sticky controls

---

## 🏗️ Task Breakdown

### Task 1: Zod Schemas & Types (Foundation)

**Files:**
- Create: `src/lib/schemas/story-shadowing.schema.ts`

- [x] **Step 1: Viết Zod schema cho toàn bộ domain**

```typescript
// src/lib/schemas/story-shadowing.schema.ts
import { z } from "zod";

// Schema cho 1 câu đã được xử lý (có text + audio)
export const SentenceSchema = z.object({
  id: z.number(),           // Thứ tự câu (0-indexed)
  text: z.string(),         // Nội dung câu
  audioBase64: z.string().optional(), // Base64 audio (MP3), gán sau khi TTS xong
});

export type Sentence = z.infer<typeof SentenceSchema>;

// Schema response từ API /api/story-shadowing/process
export const ProcessResponseSchema = z.object({
  sentences: z.array(SentenceSchema),
  totalCount: z.number(),
});

export type ProcessResponse = z.infer<typeof ProcessResponseSchema>;

// Schema request vào API /api/story-shadowing/tts
export const TtsRequestSchema = z.object({
  text: z.string().max(500, "Câu quá dài"),
  languageCode: z.string().default("en-US"),
});

// Schema trả về từ Gemini khi chia câu (raw, chưa có audio)
export const GeminiSentenceListSchema = z.object({
  sentences: z.array(z.object({
    id: z.number(),
    text: z.string(),
  })),
});
```
---

### Task 2: LangGraph State

**Files:**
- Create: `src/lib/agents/story-shadowing-agent/state.ts`

- [x] **Step 1: Viết State cho story-shadowing-agent**

```typescript
// src/lib/agents/story-shadowing-agent/state.ts
import { Annotation } from "@langchain/langgraph";

// "Bộ nhớ" của Agent — truyền qua lại giữa các Node
export const StoryShadowingAgentState = Annotation.Root({
  // === INPUT ===
  rawText: Annotation<string>(),       // Văn bản thô do người dùng nhập

  // === Node 1 Output: SentenceSplitter ===
  rawSentences: Annotation<Array<{ id: number; text: string }>>({
    reducer: (_, y) => y,              // Overwrite toàn bộ mảng (không concat)
  }),

  // === Node 2 Output: TtsGenerator ===
  // Mảng câu đã kèm audio base64
  sentences: Annotation<Array<{ id: number; text: string; audioBase64: string }>>({
    reducer: (_, y) => y,
  }),

  // === Metadata ===
  error: Annotation<string | null>(),  // Lỗi nếu có
});

export type StoryShadowingStateType = typeof StoryShadowingAgentState.State;
```
---

### Task 3: Node 1 — Sentence Splitter (Gemini Flash)

**Files:**
- Create: `src/lib/agents/story-shadowing-agent/nodes/sentence-splitter.node.ts`

**Yêu cầu trước:** `GEMINI_API_KEY` phải có trong `.env.local`.

- [x] **Step 1: Viết node gọi Gemini Flash để chia câu**

```typescript
// src/lib/agents/story-shadowing-agent/nodes/sentence-splitter.node.ts
import { ChatGoogleGenerativeAI } from "@langchain/google-genai";
import { GeminiSentenceListSchema } from "@/lib/schemas/story-shadowing.schema";
import { StoryShadowingStateType } from "../state";

const model = new ChatGoogleGenerativeAI({
  model: "gemini-2.5-flash",
  apiKey: process.env.GEMINI_API_KEY!,
  // Yêu cầu output JSON thuần túy — tránh hallucination format
  generationConfig: {
    responseMimeType: "application/json",
  },
});

const SYSTEM_PROMPT = `You are a language learning assistant.
Split the given English text into individual sentences for shadowing practice.
Rules:
- Each sentence must be complete and independent
- Max 20 words per sentence. If a sentence is longer, split it at a natural pause (comma, conjunction).
- Keep the original wording exactly — do NOT paraphrase
- Return ONLY valid JSON in this exact format:
{"sentences": [{"id": 0, "text": "First sentence."}, {"id": 1, "text": "Second sentence."}]}`;

export async function sentenceSplitterNode(state: StoryShadowingStateType): Promise<Partial<StoryShadowingStateType>> {
  try {
    const response = await model.invoke([
      { role: "system", content: SYSTEM_PROMPT },
      { role: "user", content: state.rawText },
    ]);

    // Parse và validate với Zod — throw nếu format sai
    const parsed = GeminiSentenceListSchema.parse(
      JSON.parse(response.content as string)
    );

    return { rawSentences: parsed.sentences };
  } catch (err) {
    console.error("[SentenceSplitter] Error:", err);
    return { error: "Không thể chia câu. Vui lòng thử lại." };
  }
}
```

---

### Task 4: Node 2 — TTS Generator (Google Cloud TTS)

**Files:**
- Create: `src/lib/agents/story-shadowing-agent/nodes/tts-generator.node.ts`

**Yêu cầu trước:** `GOOGLE_TTS_API_KEY` trong `.env.local`.

> [!IMPORTANT]
> Dùng Google Cloud TTS REST API (không cần SDK nặng). Voice được dùng: `en-US-Standard-D` (nam, tự nhiên, miễn phí trong quota).

- [x] **Step 1: Viết node gọi Google Cloud TTS cho từng câu**

```typescript
// src/lib/agents/story-shadowing-agent/nodes/tts-generator.node.ts
import { StoryShadowingStateType } from "../state";

const TTS_URL = `https://texttospeech.googleapis.com/v1/text:synthesize?key=${process.env.GOOGLE_TTS_API_KEY}`;

async function synthesize(text: string): Promise<string> {
  const response = await fetch(TTS_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      input: { text },
      voice: {
        languageCode: "en-US",
        name: "en-US-Standard-D", // Standard = rẻ hơn WaveNet 4x
        ssmlGender: "MALE",
      },
      audioConfig: {
        audioEncoding: "MP3",
        speakingRate: 0.9,   // Đọc chậm hơn 10% — dễ shadow hơn
        pitch: 0,
      },
    }),
  });

  if (!response.ok) {
    throw new Error(`TTS API error: ${response.status}`);
  }

  const data = await response.json();
  // API trả về { audioContent: "base64string" }
  return data.audioContent as string;
}

export async function ttsGeneratorNode(state: StoryShadowingStateType): Promise<Partial<StoryShadowingStateType>> {
  if (state.error || !state.rawSentences?.length) {
    return {}; // Dừng nếu Node trước gặp lỗi
  }

  try {
    // Gọi TTS song song cho tất cả câu để giảm latency
    const results = await Promise.all(
      state.rawSentences.map(async (s) => ({
        id: s.id,
        text: s.text,
        audioBase64: await synthesize(s.text),
      }))
    );

    return { sentences: results };
  } catch (err) {
    console.error("[TtsGenerator] Error:", err);
    return { error: "Không thể tổng hợp âm thanh. Kiểm tra TTS API key." };
  }
}
```

---

### Task 5: LangGraph Graph Orchestrator

**Files:**
- Create: `src/lib/agents/story-shadowing-agent/graph.ts`

- [x] **Step 1: Kết nối 2 Node thành pipeline**

```typescript
// src/lib/agents/story-shadowing-agent/graph.ts
import { StateGraph, START, END } from "@langchain/langgraph";
import { StoryShadowingAgentState } from "./state";
import { sentenceSplitterNode } from "./nodes/sentence-splitter.node";
import { ttsGeneratorNode } from "./nodes/tts-generator.node";

// 1. Khởi tạo Graph
const graphBuilder = new StateGraph<typeof StoryShadowingAgentState, any, any, string>(StoryShadowingAgentState);

// 2. Thêm Node
graphBuilder.addNode("sentenceSplitter", sentenceSplitterNode);
graphBuilder.addNode("ttsGenerator", ttsGeneratorNode);

// 3. Định nghĩa luồng: START → chia câu → tạo audio → END
graphBuilder.addEdge(START, "sentenceSplitter");
graphBuilder.addEdge("sentenceSplitter", "ttsGenerator");
graphBuilder.addEdge("ttsGenerator", END);

// 4. Compile
export const storyShadowingAgentGraph = graphBuilder.compile();

/**
 * Public API: Chạy toàn bộ pipeline cho 1 đoạn văn bản
 */
export async function runStoryShadowingPipeline(rawText: string) {
  const finalState = await storyShadowingAgentGraph.invoke({ rawText });

  if (finalState.error) {
    throw new Error(finalState.error);
  }

  return finalState.sentences;
}
```

---

### Task 6: API Route — POST /api/story-shadowing/process

**Files:**
- Create: `src/app/api/story-shadowing/process/route.ts`

- [x] **Step 1: Viết API endpoint nhận text và chạy pipeline**

```typescript
// src/app/api/story-shadowing/process/route.ts
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { runStoryShadowingPipeline } from "@/lib/agents/story-shadowing-agent/graph";
import { connectDB } from "@/lib/db/mongoose";
import Storybook from "@/lib/db/models/Storybook";

// Validate input với Zod
const RequestSchema = z.object({
  text: z.string()
    .min(10, "Văn bản quá ngắn (tối thiểu 10 ký tự)")
    .max(5000, "Văn bản quá dài (tối đa 5000 ký tự)"),
  title: z.string().optional(),
  thumbnail: z.string().url("URL ảnh không hợp lệ").optional().or(z.literal("")),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { text, title, thumbnail } = RequestSchema.parse(body);

    // Chạy LangGraph pipeline (blocking ~5-10s do TTS)
    const sentences = await runStoryShadowingPipeline(text);

    // Lưu vào database
    await connectDB();

    // Tự động tạo title từ 6 từ đầu tiên nếu không có title
    let finalTitle = title?.trim();
    if (!finalTitle) {
      const words = text.split(/\s+/).filter(w => w.length > 0);
      finalTitle = words.slice(0, 6).join(" ") + (words.length > 6 ? "..." : "");
    }

    const newStory = await Storybook.create({
      title: finalTitle,
      thumbnail: thumbnail || undefined,
      originalText: text,
      sentences: sentences,
    });

    return NextResponse.json({
      id: newStory._id,
      totalCount: sentences.length
    });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json(
        { error: err.issues[0].message },
        { status: 400 }
      );
    }
    console.error("[API/story-shadowing/process]", err);
    return NextResponse.json(
      { error: "Đã có lỗi xảy ra. Vui lòng thử lại." },
      { status: 500 }
    );
  }
}
```

- [x] **Step 2: Test thủ công bằng curl**

```bash
curl -X POST http://localhost:3000/api/story-shadowing/process \
  -H "Content-Type: application/json" \
  -d '{"text": "The quick brown fox jumps over the lazy dog. It was a bright sunny day."}'
```

Expected response:
```json
{
  "id": "60d5ecb8b392d700153c3d5a",
  "totalCount": 2
}
```

---

### Task 7: Custom Hook `useShadowingPlayer`

**Files:**
- Create: `src/lib/hooks/use-shadowing-player.ts`

> [!IMPORTANT]
> Đây là **trái tim của ứng dụng**. State Machine có 3 trạng thái: `IDLE` → `AI_SPEAKING` → `USER_SHADOWING` → (lặp lại).

- [x] **Step 1: Viết Custom Hook với State Machine**

```typescript
// src/lib/hooks/use-shadowing-player.ts
"use client";
import { useState, useRef, useCallback, useEffect } from "react";
import type { Sentence } from "@/lib/schemas/story-shadowing.schema";

type PlayerState = "IDLE" | "AI_SPEAKING" | "USER_SHADOWING" | "PAUSED" | "DONE";

export function useShadowingPlayer(sentences: Sentence[]) {
  const [playerState, setPlayerState] = useState<PlayerState>("IDLE");
  const [currentIndex, setCurrentIndex] = useState(0);
  const [countdown, setCountdown] = useState(0); // ms còn lại để đọc theo

  // Refs để tránh stale closure trong setTimeout
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const shadowTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const countdownIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Cleanup helper — dùng mọi lúc cần dừng
  const clearTimers = useCallback(() => {
    if (shadowTimeoutRef.current) clearTimeout(shadowTimeoutRef.current);
    if (countdownIntervalRef.current) clearInterval(countdownIntervalRef.current);
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.src = ""; // Giải phóng memory
    }
  }, []);

  // Phát 1 câu theo index
  const playSentence = useCallback((index: number) => {
    if (index >= sentences.length) {
      setPlayerState("DONE");
      return;
    }

    const sentence = sentences[index];
    if (!sentence.audioBase64) return;

    setCurrentIndex(index);
    setPlayerState("AI_SPEAKING");

    // Tạo Audio object từ base64
    const audio = new Audio(`data:audio/mp3;base64,${sentence.audioBase64}`);
    audioRef.current = audio;

    // Chờ metadata load để lấy chính xác duration
    audio.addEventListener("loadedmetadata", () => {
      audio.play();
    });

    audio.addEventListener("ended", () => {
      // Audio kết thúc → chuyển sang trạng thái USER_SHADOWING
      const userTime = (audio.duration * 1000) + 1500; // audio duration + 1.5s buffer
      setPlayerState("USER_SHADOWING");
      setCountdown(Math.round(userTime));

      // Đếm ngược countdown
      const startTime = Date.now();
      countdownIntervalRef.current = setInterval(() => {
        const remaining = Math.max(0, userTime - (Date.now() - startTime));
        setCountdown(Math.round(remaining));
        if (remaining <= 0) {
          clearInterval(countdownIntervalRef.current!);
        }
      }, 100);

      // Sau thời gian đó → tự động phát câu tiếp
      shadowTimeoutRef.current = setTimeout(() => {
        playSentence(index + 1);
      }, userTime);
    });

    audio.addEventListener("error", () => {
      console.error("[Player] Audio load error");
      setPlayerState("IDLE");
    });
  }, [sentences]);

  const play = useCallback(() => {
    if (playerState === "PAUSED") {
      playSentence(currentIndex);
    } else {
      playSentence(0);
    }
  }, [playerState, currentIndex, playSentence]);

  const pause = useCallback(() => {
    clearTimers();
    setPlayerState("PAUSED");
  }, [clearTimers]);

  const goToNext = useCallback(() => {
    clearTimers();
    playSentence(currentIndex + 1);
  }, [clearTimers, currentIndex, playSentence]);

  const goToPrev = useCallback(() => {
    clearTimers();
    playSentence(Math.max(0, currentIndex - 1));
  }, [clearTimers, currentIndex, playSentence]);

  // CRITICAL: Cleanup khi component unmount — tránh memory leak
  useEffect(() => {
    return () => {
      clearTimers();
    };
  }, [clearTimers]);

  return {
    playerState,
    currentIndex,
    countdown,
    play,
    pause,
    goToNext,
    goToPrev,
    isPlaying: playerState === "AI_SPEAKING" || playerState === "USER_SHADOWING",
  };
}
```
---

### Task 8: UI Components

**Files:**
- Create: `src/components/story-shadowing/sentence-card.tsx`
- Create: `src/components/story-shadowing/progress-countdown.tsx`
- Create: `src/components/story-shadowing/shadowing-player.tsx`

- [x] **Step 1: Viết SentenceCard — hiển thị 1 câu với highlight**

```typescript
// src/components/story-shadowing/sentence-card.tsx
"use client";
import { cn } from "@/lib/utils";
import type { Sentence } from "@/lib/schemas/story-shadowing.schema";

interface SentenceCardProps {
  sentence: Sentence;
  isActive: boolean;
  isDone: boolean;
}

export function SentenceCard({ sentence, isActive, isDone }: SentenceCardProps) {
  return (
    <div
      className={cn(
        "px-6 py-4 rounded-xl text-xl font-medium transition-all duration-300",
        isActive && "bg-indigo-600 text-white scale-[1.02] shadow-lg shadow-indigo-500/30",
        !isActive && isDone && "text-slate-400 line-through",
        !isActive && !isDone && "text-slate-500"
      )}
    >
      <span className="text-sm font-normal opacity-60 mr-3">#{sentence.id + 1}</span>
      {sentence.text}
    </div>
  );
}
```

- [x] **Step 2: Viết ProgressCountdown — thanh đếm ngược**

```typescript
// src/components/story-shadowing/progress-countdown.tsx
"use client";

interface ProgressCountdownProps {
  totalMs: number;
  remainingMs: number;
  isActive: boolean;
}

export function ProgressCountdown({ totalMs, remainingMs, isActive }: ProgressCountdownProps) {
  const percentage = totalMs > 0 ? ((totalMs - remainingMs) / totalMs) * 100 : 0;

  return (
    <div className="w-full space-y-1">
      <div className="flex justify-between text-xs text-slate-500">
        <span>{isActive ? "🎤 Đang đọc theo..." : "⏸ Chờ..."}</span>
        <span>{(remainingMs / 1000).toFixed(1)}s</span>
      </div>
      <div className="h-2 bg-slate-200 rounded-full overflow-hidden">
        <div
          className="h-full bg-indigo-500 rounded-full transition-all duration-100 ease-linear"
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
}
```

- [x] **Step 3: Viết ShadowingPlayer — component player tổng hợp**

```typescript
// src/components/story-shadowing/shadowing-player.tsx
"use client";
import { useShadowingPlayer } from "@/lib/hooks/use-shadowing-player";
import { SentenceCard } from "./sentence-card";
import { ProgressCountdown } from "./progress-countdown";
import type { Sentence } from "@/lib/schemas/story-shadowing.schema";

interface ShadowingPlayerProps {
  sentences: Sentence[];
}

export function ShadowingPlayer({ sentences }: ShadowingPlayerProps) {
  const { playerState, currentIndex, countdown, play, pause, goToNext, goToPrev, isPlaying } =
    useShadowingPlayer(sentences);

  // Tổng thời gian đọc theo = duration audio + 1500ms
  const totalCountdownMs = countdown > 0 ? countdown + (countdown * 0) : 0; // sẽ tính lại khi cần
  
  return (
    <div className="space-y-6">
      {/* Trạng thái hiện tại */}
      <div className="text-center">
        <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-semibold ${
          playerState === "AI_SPEAKING" ? "bg-blue-100 text-blue-700" :
          playerState === "USER_SHADOWING" ? "bg-green-100 text-green-700" :
          playerState === "DONE" ? "bg-slate-100 text-slate-600" :
          "bg-slate-100 text-slate-500"
        }`}>
          {playerState === "AI_SPEAKING" && <><span className="animate-pulse">🔊</span> AI đang đọc</>}
          {playerState === "USER_SHADOWING" && <><span className="animate-bounce">🎤</span> Lặp lại nào!</>}
          {playerState === "IDLE" && "⏸ Nhấn Play để bắt đầu"}
          {playerState === "PAUSED" && "⏸ Đã tạm dừng"}
          {playerState === "DONE" && "✅ Hoàn thành!"}
        </div>
      </div>

      {/* Progress countdown (chỉ hiện khi USER_SHADOWING) */}
      {playerState === "USER_SHADOWING" && (
        <ProgressCountdown
          totalMs={countdown + 1000}
          remainingMs={countdown}
          isActive={true}
        />
      )}

      {/* Danh sách câu */}
      <div className="space-y-2 max-h-[400px] overflow-y-auto pr-2">
        {sentences.map((s, i) => (
          <SentenceCard
            key={s.id}
            sentence={s}
            isActive={i === currentIndex && isPlaying}
            isDone={i < currentIndex}
          />
        ))}
      </div>

      {/* Controls */}
      <div className="flex justify-center items-center gap-4">
        <button
          onClick={goToPrev}
          disabled={currentIndex === 0}
          className="p-3 rounded-full bg-slate-100 hover:bg-slate-200 disabled:opacity-30 transition-colors"
          aria-label="Câu trước"
        >
          ⏮
        </button>

        {isPlaying ? (
          <button
            onClick={pause}
            className="px-8 py-3 rounded-full bg-indigo-600 text-white font-bold hover:bg-indigo-700 transition-colors shadow-lg"
            aria-label="Tạm dừng"
          >
            ⏸ Tạm dừng
          </button>
        ) : (
          <button
            onClick={play}
            className="px-8 py-3 rounded-full bg-indigo-600 text-white font-bold hover:bg-indigo-700 transition-colors shadow-lg"
            aria-label="Phát"
          >
            ▶ {playerState === "PAUSED" ? "Tiếp tục" : "Bắt đầu"}
          </button>
        )}

        <button
          onClick={goToNext}
          disabled={currentIndex >= sentences.length - 1}
          className="p-3 rounded-full bg-slate-100 hover:bg-slate-200 disabled:opacity-30 transition-colors"
          aria-label="Câu tiếp"
        >
          ⏭
        </button>
      </div>

      {/* Progress tổng */}
      <div className="text-center text-sm text-slate-400">
        Câu {Math.min(currentIndex + 1, sentences.length)} / {sentences.length}
      </div>
    </div>
  );
}
```
---

### Task 9: Pages — Homepage, Text Input & Player

**Files:**
- Create: `src/app/apps/story-shadowing/page.tsx`
- Create: `src/app/apps/story-shadowing/create/page.tsx`
- Create: `src/app/apps/story-shadowing/player/[id]/page.tsx`

- [x] **Step 1: Viết trang chủ hiển thị danh sách bài tập**
(File: `src/app/apps/story-shadowing/page.tsx` - Fetch từ `/api/story-shadowing` để lấy lịch sử)

- [x] **Step 2: Viết trang nhập text (form)**

```typescript
// src/app/apps/story-shadowing/create/page.tsx
"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function CreatePlayerPage() {
  const [title, setTitle] = useState("");
  const [thumbnail, setThumbnail] = useState("");
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/story-shadowing/process", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text, title, thumbnail }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error ?? "Lỗi không xác định");
      }

      const data = await res.json();
      router.push(`/apps/story-shadowing/player/${data.id}`);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  return <div>{/* Form UI: Textarea 5000 ký tự, input Title, Thumbnail */}</div>;
}
```

- [x] **Step 3: Viết trang Player theo ID**

```typescript
// src/app/apps/story-shadowing/player/[id]/page.tsx
// Lấy data bằng cách gọi API fetch từ DB dựa trên params.id
```

---

### Task 10: Cập nhật Homepage & ENV

**Files:**
- Modify: `src/app/page.tsx`
- Modify: `.env.local` (thêm keys)

- [x] **Step 1: Thêm card vào trang chủ**

Trong `src/app/page.tsx`, thêm Card mới vào grid (sau card `aha-opta`):

```tsx
{/* App 3: AI Story Shadowing */}
<Card className="hover:shadow-lg transition-shadow duration-300 border-indigo-200 bg-gradient-to-br from-indigo-50 to-violet-50">
  <CardHeader>
    <div className="text-4xl mb-2">📖</div>
    <CardTitle className="text-indigo-800">AI Story Shadowing</CardTitle>
    <CardDescription>
      Luyện phát âm tiếng Anh qua phương pháp Shadowing — AI đọc mẫu, bạn đọc theo.
    </CardDescription>
  </CardHeader>
  <CardContent>
    <Link
      href="/apps/story-shadowing"
      className={cn(buttonVariants({ variant: "default" }), "w-full bg-indigo-600 hover:bg-indigo-700 text-white text-center")}
    >
      Bắt đầu luyện tập
    </Link>
  </CardContent>
</Card>
```

- [x] **Step 2: Thêm API Keys vào .env.local**

```bash
# .env.local (thêm 2 dòng sau)
GEMINI_API_KEY=your_gemini_api_key_here
GOOGLE_TTS_API_KEY=your_google_cloud_tts_api_key_here
```

---

## 🆕 Phase 2: Voice Metadata & AI Leveling

> Nâng cấp thêm sau khi Phase 1 hoàn thành. Thêm khả năng chọn giọng đọc và AI tự động đánh giá độ khó văn bản.

### Approach: Option A — AI-driven Labeling

Gemini đảm nhận vai trò **chuyên gia ngôn ngữ**: phân tích từ vựng và ngữ pháp, tự động gán nhãn `level` cho toàn bộ đoạn văn. Frontend chỉ việc hiển thị kết quả.

**Trade-off đã chọn:**
- ✅ Không thay đổi tốc độ đọc (speakingRate luôn = 1.0) — vì tốc độ cao gây mất chữ, không tự nhiên.
- ✅ Độ khó chỉ phản ánh qua từ vựng & ngữ pháp (Easy/Medium/Hard), không ảnh hưởng audio.

### Task 11: DB Model Update

**Files:**
- Modify: `src/lib/db/models/Storybook.ts`

- [x] Thêm fields: `level: String (enum: easy/medium/hard)`, `voice: String`

### Task 12: Schema & State Update

**Files:**
- Modify: `src/lib/schemas/story-shadowing.schema.ts`
- Modify: `src/lib/agents/story-shadowing-agent/state.ts`

- [x] Thêm `level` vào `GeminiSentenceListSchema` (Zod)
- [x] Thêm `voice`, `level` vào `StorybookAgentState`

### Task 13: AI Leveling — Sentence Splitter Upgrade

**Files:**
- Modify: `src/lib/agents/story-shadowing-agent/nodes/sentence-splitter.node.ts`

- [x] Cập nhật System Prompt: yêu cầu Gemini đóng vai chuyên gia ngôn ngữ, phân tích và trả về thêm trường `level` (`easy` / `medium` / `hard`) cho toàn bộ đoạn văn.

**Tiêu chí đánh giá level:**
| Level | Tiêu chí |
|---|---|
| `easy` | Từ vựng A1–A2, câu ngắn, cấu trúc đơn giản |
| `medium` | Từ vựng B1–B2, một số idiom, câu phức |
| `hard` | Từ vựng C1+, thuật ngữ chuyên ngành, câu phức tạp |

### Task 14: Voice Selection — TTS Generator Upgrade

**Files:**
- Modify: `src/lib/agents/story-shadowing-agent/nodes/tts-generator.node.ts`

- [x] Nhận `state.voice` từ Pipeline State và map sang Google Cloud TTS model name.
- [x] `speakingRate` cố định = `1.0` (bỏ điều chỉnh theo level để giữ chất lượng audio tự nhiên).

**Danh sách Voice được hỗ trợ (UI):**
| Nhóm | Voice ID | Mô tả |
|---|---|---|
| Journey (Cao cấp) | `en-US-Journey-F` | Nữ - Tự nhiên, biểu cảm (Default) |
| Journey (Cao cấp) | `en-US-Journey-D` | Nam - Tự nhiên, biểu cảm |
| Standard | `en-US-Standard-C` | Nữ - Tiêu chuẩn |
| Standard | `en-US-Standard-D` | Nam - Tiêu chuẩn |
| Neural2 | `en-US-Neural2-H` | Nữ - Ấm áp |
| Neural2 | `en-US-Neural2-J` | Nam - Trầm ấm |

### Task 15: API Route & Graph Update

**Files:**
- Modify: `src/app/api/story-shadowing/process/route.ts`
- Modify: `src/lib/agents/story-shadowing-agent/graph.ts`

- [x] API nhận thêm `voice` từ request body (default: `en-US-Journey-F`).
- [x] Pipeline trả về `level` từ Gemini để lưu vào DB.
- [x] Thêm **console.log chi tiết** tại các bước để dễ theo dõi tiến trình (cần thiết vì quá trình TTS có thể mất 3-4 phút với bài dài).

**Log format:**
```
==========================================
[API Process] Nhận yêu cầu tạo bài mới...
[Sentence Splitter] Bắt đầu phân tích (1200 ký tự)...
[Sentence Splitter] ✅ 45 câu. Độ khó: HARD
[TTS Generator] Bắt đầu (45 câu, Journey-D, 1.0x)...
[TTS Generator] Đang xử lý câu 1/45...
...
[TTS Generator] ✅ Hoàn thành!
[API Process] ✅ Đã lưu DB (ID: ...)
==========================================
```

### Task 16: UI/UX Upgrades

**Files:**
- Modify: `src/app/apps/story-shadowing/create/page.tsx`
- Modify: `src/app/apps/story-shadowing/page.tsx`
- Modify: `src/components/story-shadowing/shadowing-player.tsx`
- Modify: `src/app/api/story-shadowing/route.ts`

- [x] **Create Page:** Thêm Dropdown chọn Voice (6 options, chia nhóm bằng `<optgroup>`).
- [x] **History List (page.tsx):** Hiển thị badge màu Easy/Medium/Hard trên mỗi card bài học.
- [x] **Player Component Refactor:** Gộp toàn bộ Header (Back, Title, PlayerState, Level) vào trong `ShadowingPlayer`.
  - `playerState` badge nằm **ngang hàng với Title** (cùng 1 dòng).
  - Controls (Play/Pause, Prev/Next) **ghim cứng (sticky/fixed) ở đáy màn hình** trên Mobile — người dùng không cần scroll để tìm nút.
  - Vùng hiển thị câu được tối ưu: `max-h-[calc(100vh-320px)]` trên mobile.

---

## ✅ Verification Plan

### Automated Build Check
```bash
npx tsc --noEmit
# Expected: exit code 0, no TypeScript errors
```

### Manual Verification Flow

1. **Happy Path:** Chạy `pnpm dev` → Vào `http://localhost:3000/apps/story-shadowing` → Bấm "Tạo bài luyện tập" → Nhập đoạn văn 3-5 câu → Chọn giọng → Bấm Submit → Đợi theo dõi log Terminal → Chuyển sang trang Player → Bấm Play → Nghe AI đọc → Đọc theo trong khoảng dừng.

2. **AI Leveling:** Tạo 2 bài: 1 bài text đơn giản (trẻ em), 1 bài text IELTS. Kiểm tra badge level trên card và trong Player có đúng không.

3. **Voice Selection:** Tạo bài với các giọng khác nhau (Journey-F, Neural2-J...). Kiểm tra âm thanh phát ra đúng giọng.

4. **Mobile UX:** Thu nhỏ trình duyệt hoặc dùng DevTools (iPhone SE). Kiểm tra Controls luôn hiển thị ở dưới màn hình, không cần scroll.

5. **Edge Case — Pause:** Bấm Pause giữa chừng → kiểm tra audio dừng ngay lập tức.

6. **Edge Case — Navigate:** Bấm Next/Prev → kiểm tra câu highlight đổi đúng.


---

## 🆕 Phase 3: IPA Phonetic Transcription

> Mỗi từ trong câu được Gemini phiên âm IPA. Khi câu đang active (AI đang đọc / User lặp lại), các từ hiển thị theo kiểu Ruby annotation (từ ở trên, IPA nhỏ ở dưới) — giúp người học đọc chuẩn phát âm ngay khi nghe.

### Architecture Decision: Gemini làm nguồn IPA

**Lý do chọn Gemini thay vì Dictionary API hay npm package:**
- ✅ Đã tích hợp sẵn, không cần API key mới
- ✅ Hiểu ngữ cảnh: "read" (present /riːd/) vs "read" (past /rɛd/) phiên âm đúng
- ✅ Cover tên riêng, từ mới, slang (Dictionary API không có)
- ⚠️ Trade-off: Response lớn hơn (~2-3s chậm hơn) — chấp nhận được vì TTS mới là bottleneck chính

### Task 17: Schema & DB Update

**Files:**
- Modify: `src/lib/schemas/story-shadowing.schema.ts`
- Modify: `src/lib/db/models/Storybook.ts`

- [x] Thêm `WordSchema: {word, ipa}` vào Zod schemas.
- [x] Thêm `words?: WordSchema[]` vào `SentenceSchema` (optional để backward-compatible với bài cũ).
- [x] Thêm `GeminiSentenceListSchema` yêu cầu `words[]` từ Gemini.
- [x] Thêm `words` field vào Mongoose `StorybookSentenceSchema`.

### Task 18: LangGraph State Update

**Files:**
- Modify: `src/lib/agents/story-shadowing-agent/state.ts`

- [x] Cập nhật kiểu `rawSentences` để bao gồm `words: {word, ipa}[]`.
- [x] Cập nhật kiểu `sentences` output để bao gồm `words?: {word, ipa}[]`.

### Task 19: Sentence Splitter Prompt Upgrade

**Files:**
- Modify: `src/lib/agents/story-shadowing-agent/nodes/sentence-splitter.node.ts`

- [x] Cập nhật System Prompt: Gemini đóng vai **chuyên gia ngữ âm học**, yêu cầu trả về `words: [{word, ipa}]` cho mỗi câu.
- [x] Sử dụng **broad transcription** (phiên âm rộng, chuẩn từ điển quốc tế).
- [x] Quy tắc xử lý dấu câu: dấu câu gắn vào từ đứng trước.

**JSON format mẫu Gemini trả về:**
```json
{
  "level": "medium",
  "sentences": [{
    "id": 0,
    "text": "Hello world.",
    "words": [
      {"word": "Hello", "ipa": "/həˈləʊ/"},
      {"word": "world", "ipa": "/wɜːld/"}
    ]
  }]
}
```

### Task 20: TTS Generator — Pass-through IPA

**Files:**
- Modify: `src/lib/agents/story-shadowing-agent/nodes/tts-generator.node.ts`

- [x] Sau khi fetch TTS audio xong, merge `words[]` từ `rawSentences` vào object kết quả.
- [x] Không có thay đổi gì về logic TTS — chỉ truyền dữ liệu qua.

### Task 21: UI — Ruby Annotation trong SentenceCard

**Files:**
- Modify: `src/components/story-shadowing/sentence-card.tsx`

- [x] Khi `isActive = true` VÀ `sentence.words` có dữ liệu → render **Ruby annotation**.
- [x] Khi không active → render text thông thường (performance).
- [x] Dùng HTML `<ruby>/<rt>` chuẩn, hỗ trợ tốt trên mọi trình duyệt.

**Ruby UI Structure:**
```html
<ruby>
  beautiful
  <rt>/ˈbjuːtɪfəl/</rt>
</ruby>
```

**Visual:** Từ gốc `text-xl font-bold`, IPA `text-[11px] text-slate-700/70` — hiển thị phía dưới khi câu đang được phát.

---

## ✅ Verification Plan

### Automated Build Check
```bash
npx tsc --noEmit
# Expected: exit code 0, no TypeScript errors
```

### Manual Verification Flow

1. **Happy Path:** Chạy `pnpm dev` → Vào `http://localhost:3000/apps/story-shadowing` → Bấm "Tạo bài luyện tập" → Nhập đoạn văn 3-5 câu → Chọn giọng → Bấm Submit → Đợi theo dõi log Terminal → Chuyển sang trang Player → Bấm Play → Nghe AI đọc → Đọc theo trong khoảng dừng.

2. **IPA Verification:** Trong Player, khi câu đang active → kiểm tra mỗi từ hiển thị IPA nhỏ bên dưới dạng ruby annotation. Khi câu kết thúc (chuyển sang câu tiếp) → IPA biến mất, trở về text thường.

3. **AI Leveling:** Tạo 2 bài: 1 bài text đơn giản (trẻ em), 1 bài text IELTS. Kiểm tra badge level trên card và trong Player có đúng không.

4. **Voice Selection:** Tạo bài với các giọng khác nhau (Journey-F, Neural2-J...). Kiểm tra âm thanh phát ra đúng giọng.

5. **Mobile UX:** Thu nhỏ trình duyệt hoặc dùng DevTools (iPhone SE). Kiểm tra Controls luôn hiển thị ở dưới màn hình, không cần scroll.

6. **Edge Case — Pause:** Bấm Pause giữa chừng → kiểm tra audio dừng ngay lập tức.

7. **Edge Case — Navigate:** Bấm Next/Prev → kiểm tra câu highlight đổi đúng.

8. **Backward Compatibility:** Mở bài luyện tập cũ (tạo trước khi có IPA) → Kiểm tra vẫn phát bình thường, không bị crash (do `words` là optional).


---

## 🆕 Phase 4: Import from Article URL

> Thay vì phải điền từng trường (Title, Image, Content), người dùng chỉ cần dán link một bài báo (article). Hệ thống sẽ tự động trích xuất nội dung (Scrape) và điền vào form để người dùng duyệt (Review) trước khi tạo bài luyện tập.

### Architecture Decision: Web Scraping
Sử dụng thư viện `@mozilla/readability` và `jsdom` để bóc tách nội dung tĩnh từ URL. Đây là công nghệ đằng sau tính năng "Reader View" của Firefox, đảm bảo bóc tách chính xác nội dung bài viết, loại bỏ hoàn toàn quảng cáo, menu, và footer.
- Cài đặt thêm: `pnpm add @mozilla/readability jsdom` và types tương ứng.
- Phân tích DOM bằng `JSDOM`.
- Lấy Title, Text Content thông qua `Readability(doc).parse()`.
- Lấy Thumbnail thông qua fallback DOM query (`<meta property="og:image">`) vì Readability không cung cấp ảnh cover.

### Task 22: API Route — GET /api/story-shadowing/scrape

**Files:**
- Create: `src/app/api/story-shadowing/scrape/route.ts`

- [ ] **Step 1: Viết API endpoint nhận tham số `?url=...`**
- [ ] **Step 2: Lấy dữ liệu với fetch + Readability**
  - Fetch HTML thô, nạp vào `JSDOM`.
  - Dùng `Readability` parse để lấy `title`, `textContent`.
  - Fallback query ảnh thumbnail.
  - Trả về JSON `{ title, thumbnail, text }`.

### Task 23: UI — Cập nhật Create Page

**Files:**
- Modify: `src/app/apps/story-shadowing/create/page.tsx`

- [ ] **Step 1: Thêm Toggle/Tab chọn phương thức nhập liệu**
  - Chia UI làm 2 phần: "Nhập thủ công" và "Nhập từ Link".
- [ ] **Step 2: Flow "Nhập từ Link"**
  - Hiển thị Input nhập URL + Nút "Phân tích link".
  - Gọi API `/scrape` với hiệu ứng loading.
- [ ] **Step 3: Bước duyệt nội dung (Review)**
  - Tự động điền dữ liệu trả về từ API vào form (Title, Thumbnail, Text).
  - Bấm "Tạo bài luyện tập" để gọi flow tạo agent như cũ.

---

## 🆕 Phase 5: Core Vocabulary Extraction & Two-Step Player

> Nhằm đảm bảo người học hiểu được cốt lõi bài viết trước khi luyện phát âm, hệ thống sẽ tự động trích xuất các từ khóa khó (Medium/Hard) và giải thích bằng tiếng Anh đơn giản (B1 level). Giao diện Player được chia thành 2 bước: Học từ vựng -> Shadowing.

### Task 24: Schema & DB Update

**Files:**
- Modify: `src/lib/schemas/story-shadowing.schema.ts`
- Modify: `src/lib/db/models/Storybook.ts`

- [x] Tạo `KeywordSchema` trong Zod.
- [x] Cập nhật Mongoose Schema `StorybookKeywordSchema` để lưu `keywords`.

### Task 25: LangGraph Parallel Execution

**Files:**
- Create: `src/lib/agents/story-shadowing-agent/nodes/keyword-extractor.node.ts`
- Modify: `src/lib/agents/story-shadowing-agent/graph.ts`

- [x] Viết `keywordExtractorNode` gọi Gemini để trích xuất 5-10 từ vựng.
- [x] Cập nhật `graph.ts` để chạy song song `sentenceSplitter` và `keywordExtractor` từ `START`.
- [x] Quản lý Gemini Rate Limit (thêm sleep 1s và maxRetries).

### Task 26: API Updates

**Files:**
- Modify: `src/app/api/story-shadowing/process/route.ts`

- [x] Nhận `keywords` từ pipeline và lưu vào MongoDB trong lúc tạo Storybook.

### Task 27: UI Updates (Player Page)

**Files:**
- Modify: `src/app/apps/story-shadowing/player/[id]/page.tsx`

- [x] Thiết lập State `step: "vocab" | "shadowing"`.
- [x] Xây dựng UI Danh sách từ vựng.
- [x] Thêm nút chuyển sang bước Shadowing.

---

## 🆕 Phase 5.1: Deep Vocabulary (Word Family & Collocations) - Option 1: Accordion UI

> Nâng cấp tính năng trích xuất từ vựng bằng cách áp dụng phương pháp học theo họ từ (Word Family) và cụm từ cố định (Collocations). Thay vì học từ đơn lẻ, người học sẽ nắm được cách sử dụng từ trong ngữ cảnh tự nhiên như người bản ngữ. Option UI được chọn là **Accordion** để tránh quá tải nhận thức.

### Task 28: Mở rộng Schema & Database

**Files:**
- Modify: `src/lib/schemas/story-shadowing.schema.ts`
- Modify: `src/lib/db/models/Storybook.ts`

- [x] Cập nhật `KeywordSchema` và `StorybookKeywordSchema` bổ sung `wordFamily: string[]` và `collocations: string[]`.

### Task 29: Nâng cấp AI Prompt

**Files:**
- Modify: `src/lib/agents/story-shadowing-agent/nodes/keyword-extractor.node.ts`

- [x] Giảm số lượng từ xuống 3-5 từ cốt lõi nhất.
- [x] Yêu cầu Gemini đóng vai chuyên gia ngôn ngữ, trả về thêm các dạng từ phái sinh (Word Family) và các cụm từ cố định liên quan (Collocations).

### Task 30: Accordion UI cho Player

**Files:**
- Modify: `src/app/apps/story-shadowing/player/[id]/page.tsx`

- [x] Cập nhật UI màn hình "Học từ vựng" sử dụng component Accordion (hoặc logic expand/collapse tự viết bằng React State) để ẩn/hiện Word Family & Collocations. Mặc định chỉ hiển thị Word và Explanation để tránh ngợp.

*Made by Anh Tu - Share to be share*

---

## 🆕 Phase 6: YouTube Video Shadowing (Real-world Audio Source)

> Thay vì dựa vào Text-to-Speech (TTS) khô khan, người dùng có thể dán link một video YouTube tiếng Anh. Hệ thống sẽ tự động bóc băng phụ đề (Transcript), gộp câu chuẩn xác nhờ AI, và biến video đó thành tài liệu Shadowing thực tế.

### 📊 Phân tích Khả thi (Feasibility)

**1. Bóc tách Phụ đề (Transcript):** KHẢ THI CAO
- Sử dụng package `youtube-transcript` (hoặc tương đương) ở phía server để lấy phụ đề tiếng Anh kèm theo timestamps (`offset`, `duration`). Hoàn toàn miễn phí, không cần API Key của Google.

**2. Điều khiển Video (Playback Control):** KHẢ THI CAO
- Sử dụng `react-youtube` (wrap của YouTube IFrame API) trên Client. Cho phép lập trình viên Play, Pause, và Seek đến khoảng thời gian bất kỳ bằng JavaScript.

**3. Khớp câu chuẩn xác (Sentence Consolidation):** KHẢ THI
- *Vấn đề:* Phụ đề YouTube thường bị ngắt đoạn ngẫu nhiên theo nhịp thở (ví dụ: Block 1: "This is a", Block 2: "simple test.").
- *Giải pháp:* Dùng Gemini đóng vai biên tập viên, gộp các block rời rạc này thành một câu hoàn chỉnh, đồng thời tính toán lại `startMs` và `endMs` cho câu đó.

### 🏗️ Kế hoạch Triển khai (Implementation Plan)

#### Task 31: Cấu trúc Database & State
- [x] Bổ sung `sourceType: "text" | "youtube"` vào `Storybook` schema.
- [x] Thêm `youtubeVideoId: string` vào model.
- [x] Cập nhật `SentenceSchema` bổ sung trường `startMs` và `endMs` (dùng cho YouTube) bên cạnh `audioBase64` (dùng cho Text).

#### Task 32: LangGraph Pipeline mới cho YouTube
Xây dựng một `youtubeShadowingGraph` hoàn toàn mới:
- [x] **Node 1 - Transcript Fetcher**: Lấy toàn bộ mảng phụ đề từ link YouTube. **Cải tiến:** Ưu tiên chỉ lấy phụ đề thủ công (Manual CC) tiếng Anh để tránh lỗi cắt câu của ASR. Nếu không có, ném lỗi yêu cầu đổi video.
- [x] **Node 2 - Sentence Consolidator (Gemini)**: Gộp các block phụ đề thô thành câu hoàn chỉnh, tính toán lại `startMs` và `endMs`.
  - **Kiến trúc Map-Reduce + Chunking**: Video dài được chia thành các chunk (80 blocks) để xử lý song song vượt qua giới hạn context của Gemini.
  - **Zero-shifting time**: Tịnh tiến mốc thời gian của từng chunk về 0 trước khi đẩy cho LLM để chống lại "hội chứng ảo giác thời gian" (Time Hallucination) do Pattern Matching.
  - **Nội suy thời gian (Interpolation)**: Phân bổ đều thời lượng dựa trên số lượng ký tự cho các câu nằm trong cùng 1 block phụ đề thủ công.
  - **Mid-point clamping**: Xử lý mượt mà các đoạn chồng lấn thời gian (overlap) bằng cách lấy trung bình cộng.
- [x] **Node 3 - Keyword Extractor & IPA**: Tái sử dụng logic phân tích từ vựng và phiên âm IPA.

#### Task 33: API Endpoint mới
- [x] Tạo `POST /api/story-shadowing/youtube` để nhận Link YouTube, parse ID và gọi LangGraph Pipeline. Triển khai xử lý Streaming log (Server-Sent Events) để cập nhật trạng thái tiến trình ra UI.

#### Task 34: Cập nhật UI Create Page
- [x] Form nhập liệu có thêm Tab "Từ YouTube".
- [x] Tự động fetch tiêu đề và thumbnail của video YouTube.
- [x] Hiển thị terminal log realtime (Server-Sent Events) các bước đang chạy (VD: Đang phân tích video, Đang lọc từ vựng...).

#### Task 35: Viết lại Player Engine (React-YouTube)
- [x] Nâng cấp bằng hook riêng `useYouTubeShadowingPlayer`:
  - [x] Thay vì phát thẻ `<audio>`, hook sẽ quản lý tham chiếu đến `YouTube Player`.
  - [x] Ẩn Iframe (Option 2) giữ UI đồng nhất với bản Text. Hiển thị mô tả video, link gốc và thời gian dự kiến.
  - [x] Sử dụng `requestAnimationFrame` để theo dõi `player.getCurrentTime()`.
  - [x] **Bắt sự kiện Asynchronous Seek**: Bổ sung cờ `hasSeekedRef` để xử lý triệt để lỗi "không phát âm thanh" khi bấm Back (buộc script phải chờ YouTube load xong thao tác tua ngược trước khi tính giờ).
  - [x] Khi thời gian chạy tới `endMs` của câu hiện tại -> Dừng Video -> Chuyển state sang `USER_SHADOWING` -> Đếm ngược thời gian -> Hết giờ Play Video tiếp.

*Made by Anh Tu - Share to be share*

