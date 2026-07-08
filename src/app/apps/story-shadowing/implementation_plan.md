# AI Storybook Shadowing — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Thêm một micro-app "Storybook Shadowing" vào workspace `aha-tools`, cho phép người dùng nhập đoạn văn bản tiếng Anh, AI sẽ chia câu, tổng hợp giọng đọc (TTS), và phát theo kiểu Shadowing (AI đọc → dừng → người dùng lặp lại).

**Architecture:** Frontend dùng Next.js App Router với một Custom Hook `useShadowingPlayer` quản lý State Machine. Backend dùng Next.js API Routes để gọi Gemini Flash (chia câu) và Google Cloud TTS (tổng hợp âm thanh). LangGraph orchestrate pipeline AI 2 bước: sentence-splitter → tts-fetcher.

**Tech Stack:** Next.js 16 (App Router), React 19, TailwindCSS v4, `@langchain/langgraph` v1.3.6, `@langchain/google-genai` v2, Google Cloud TTS API, Zod v4, SWR v2.

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
│   │   └── storybook/                         [NEW DIR]
│   │       ├── page.tsx                        [NEW] — Trang nhập text + nút "Generate"
│   │       └── player/
│   │           └── page.tsx                   [NEW] — Trang Shadowing Player
│   └── api/
│       └── storybook/                         [NEW DIR]
│           ├── process/
│           │   └── route.ts                   [NEW] — POST: nhận text, chạy LangGraph pipeline
│           └── tts/
│               └── route.ts                   [NEW] — POST: nhận 1 câu, trả về audio base64
├── lib/
│   ├── agents/
│   │   └── storybook-agent/                   [NEW DIR]
│   │       ├── state.ts                       [NEW] — LangGraph State schema
│   │       ├── graph.ts                       [NEW] — Graph orchestrator
│   │       └── nodes/
│   │           ├── sentence-splitter.node.ts  [NEW] — Gemini Flash: chia câu
│   │           └── tts-generator.node.ts      [NEW] — Google Cloud TTS: tổng hợp audio
│   └── schemas/
│       └── storybook.schema.ts               [NEW] — Zod schemas dùng chung
└── components/
    └── storybook/                             [NEW DIR]
        ├── text-input-form.tsx               [NEW] — Form nhập text
        ├── shadowing-player.tsx              [NEW] — Component player chính
        ├── sentence-card.tsx                 [NEW] — Hiển thị 1 câu (có highlight)
        └── progress-countdown.tsx            [NEW] — Progress bar đếm ngược
```

**File bị modify:**
- `src/app/page.tsx` — Thêm card "AI Storybook Shadowing" vào danh sách micro-apps

---

## 🏗️ Task Breakdown

### Task 1: Zod Schemas & Types (Foundation)

**Files:**
- Create: `src/lib/schemas/storybook.schema.ts`

- [ ] **Step 1: Viết Zod schema cho toàn bộ domain**

```typescript
// src/lib/schemas/storybook.schema.ts
import { z } from "zod";

// Schema cho 1 câu đã được xử lý (có text + audio)
export const SentenceSchema = z.object({
  id: z.number(),           // Thứ tự câu (0-indexed)
  text: z.string(),         // Nội dung câu
  audioBase64: z.string().optional(), // Base64 audio (MP3), gán sau khi TTS xong
});

export type Sentence = z.infer<typeof SentenceSchema>;

// Schema response từ API /api/storybook/process
export const ProcessResponseSchema = z.object({
  sentences: z.array(SentenceSchema),
  totalCount: z.number(),
});

export type ProcessResponse = z.infer<typeof ProcessResponseSchema>;

// Schema request vào API /api/storybook/tts
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

- [ ] **Step 2: Commit**

```bash
git add src/lib/schemas/storybook.schema.ts
git commit -m "feat(storybook): add Zod schemas for sentence and TTS domain"
```

---

### Task 2: LangGraph State

**Files:**
- Create: `src/lib/agents/storybook-agent/state.ts`

- [ ] **Step 1: Viết State cho storybook-agent**

```typescript
// src/lib/agents/storybook-agent/state.ts
import { Annotation } from "@langchain/langgraph";

// "Bộ nhớ" của Agent — truyền qua lại giữa các Node
export const StorybookAgentState = Annotation.Root({
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

export type StorybookStateType = typeof StorybookAgentState.State;
```

- [ ] **Step 2: Commit**

```bash
git add src/lib/agents/storybook-agent/state.ts
git commit -m "feat(storybook): add LangGraph state definition for storybook-agent"
```

---

### Task 3: Node 1 — Sentence Splitter (Gemini Flash)

**Files:**
- Create: `src/lib/agents/storybook-agent/nodes/sentence-splitter.node.ts`

**Yêu cầu trước:** `GEMINI_API_KEY` phải có trong `.env.local`.

- [ ] **Step 1: Viết node gọi Gemini Flash để chia câu**

```typescript
// src/lib/agents/storybook-agent/nodes/sentence-splitter.node.ts
import { ChatGoogleGenerativeAI } from "@langchain/google-genai";
import { GeminiSentenceListSchema } from "@/lib/schemas/storybook.schema";
import { StorybookStateType } from "../state";

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

export async function sentenceSplitterNode(state: StorybookStateType): Promise<Partial<StorybookStateType>> {
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

- [ ] **Step 2: Commit**

```bash
git add src/lib/agents/storybook-agent/nodes/sentence-splitter.node.ts
git commit -m "feat(storybook): add sentence-splitter node using Gemini Flash"
```

---

### Task 4: Node 2 — TTS Generator (Google Cloud TTS)

**Files:**
- Create: `src/lib/agents/storybook-agent/nodes/tts-generator.node.ts`

**Yêu cầu trước:** `GOOGLE_TTS_API_KEY` trong `.env.local`.

> [!IMPORTANT]
> Dùng Google Cloud TTS REST API (không cần SDK nặng). Voice được dùng: `en-US-Standard-D` (nam, tự nhiên, miễn phí trong quota).

- [ ] **Step 1: Viết node gọi Google Cloud TTS cho từng câu**

```typescript
// src/lib/agents/storybook-agent/nodes/tts-generator.node.ts
import { StorybookStateType } from "../state";

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

export async function ttsGeneratorNode(state: StorybookStateType): Promise<Partial<StorybookStateType>> {
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

- [ ] **Step 2: Commit**

```bash
git add src/lib/agents/storybook-agent/nodes/tts-generator.node.ts
git commit -m "feat(storybook): add tts-generator node using Google Cloud TTS REST API"
```

---

### Task 5: LangGraph Graph Orchestrator

**Files:**
- Create: `src/lib/agents/storybook-agent/graph.ts`

- [ ] **Step 1: Kết nối 2 Node thành pipeline**

```typescript
// src/lib/agents/storybook-agent/graph.ts
import { StateGraph, START, END } from "@langchain/langgraph";
import { StorybookAgentState } from "./state";
import { sentenceSplitterNode } from "./nodes/sentence-splitter.node";
import { ttsGeneratorNode } from "./nodes/tts-generator.node";

// 1. Khởi tạo Graph
const graphBuilder = new StateGraph<typeof StorybookAgentState, any, any, string>(StorybookAgentState);

// 2. Thêm Node
graphBuilder.addNode("sentenceSplitter", sentenceSplitterNode);
graphBuilder.addNode("ttsGenerator", ttsGeneratorNode);

// 3. Định nghĩa luồng: START → chia câu → tạo audio → END
graphBuilder.addEdge(START, "sentenceSplitter");
graphBuilder.addEdge("sentenceSplitter", "ttsGenerator");
graphBuilder.addEdge("ttsGenerator", END);

// 4. Compile
export const storybookAgentGraph = graphBuilder.compile();

/**
 * Public API: Chạy toàn bộ pipeline cho 1 đoạn văn bản
 */
export async function runStorybookPipeline(rawText: string) {
  const finalState = await storybookAgentGraph.invoke({ rawText });

  if (finalState.error) {
    throw new Error(finalState.error);
  }

  return finalState.sentences;
}
```

- [ ] **Step 2: Commit**

```bash
git add src/lib/agents/storybook-agent/graph.ts
git commit -m "feat(storybook): wire LangGraph graph: sentenceSplitter → ttsGenerator"
```

---

### Task 6: API Route — POST /api/storybook/process

**Files:**
- Create: `src/app/api/storybook/process/route.ts`

- [ ] **Step 1: Viết API endpoint nhận text và chạy pipeline**

```typescript
// src/app/api/storybook/process/route.ts
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { runStorybookPipeline } from "@/lib/agents/storybook-agent/graph";

// Validate input với Zod
const RequestSchema = z.object({
  text: z.string()
    .min(10, "Văn bản quá ngắn (tối thiểu 10 ký tự)")
    .max(2000, "Văn bản quá dài (tối đa 2000 ký tự)"),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { text } = RequestSchema.parse(body);

    // Chạy LangGraph pipeline (blocking ~5-10s do TTS)
    const sentences = await runStorybookPipeline(text);

    return NextResponse.json({ sentences, totalCount: sentences.length });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json(
        { error: err.errors[0].message },
        { status: 400 }
      );
    }
    console.error("[API/storybook/process]", err);
    return NextResponse.json(
      { error: "Đã có lỗi xảy ra. Vui lòng thử lại." },
      { status: 500 }
    );
  }
}
```

- [ ] **Step 2: Test thủ công bằng curl**

```bash
curl -X POST http://localhost:3000/api/storybook/process \
  -H "Content-Type: application/json" \
  -d '{"text": "The quick brown fox jumps over the lazy dog. It was a bright sunny day."}'
```

Expected response:
```json
{
  "sentences": [
    { "id": 0, "text": "The quick brown fox jumps over the lazy dog.", "audioBase64": "SUQzBAA..." },
    { "id": 1, "text": "It was a bright sunny day.", "audioBase64": "SUQzBAA..." }
  ],
  "totalCount": 2
}
```

- [ ] **Step 3: Commit**

```bash
git add src/app/api/storybook/process/route.ts
git commit -m "feat(storybook): add POST /api/storybook/process API route"
```

---

### Task 7: Custom Hook `useShadowingPlayer`

**Files:**
- Create: `src/lib/hooks/use-shadowing-player.ts`

> [!IMPORTANT]
> Đây là **trái tim của ứng dụng**. State Machine có 3 trạng thái: `IDLE` → `AI_SPEAKING` → `USER_SHADOWING` → (lặp lại).

- [ ] **Step 1: Viết Custom Hook với State Machine**

```typescript
// src/lib/hooks/use-shadowing-player.ts
"use client";
import { useState, useRef, useCallback, useEffect } from "react";
import type { Sentence } from "@/lib/schemas/storybook.schema";

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

- [ ] **Step 2: Commit**

```bash
git add src/lib/hooks/use-shadowing-player.ts
git commit -m "feat(storybook): add useShadowingPlayer hook with state machine (IDLE/AI_SPEAKING/USER_SHADOWING)"
```

---

### Task 8: UI Components

**Files:**
- Create: `src/components/storybook/sentence-card.tsx`
- Create: `src/components/storybook/progress-countdown.tsx`
- Create: `src/components/storybook/shadowing-player.tsx`

- [ ] **Step 1: Viết SentenceCard — hiển thị 1 câu với highlight**

```typescript
// src/components/storybook/sentence-card.tsx
"use client";
import { cn } from "@/lib/utils";
import type { Sentence } from "@/lib/schemas/storybook.schema";

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

- [ ] **Step 2: Viết ProgressCountdown — thanh đếm ngược**

```typescript
// src/components/storybook/progress-countdown.tsx
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

- [ ] **Step 3: Viết ShadowingPlayer — component player tổng hợp**

```typescript
// src/components/storybook/shadowing-player.tsx
"use client";
import { useShadowingPlayer } from "@/lib/hooks/use-shadowing-player";
import { SentenceCard } from "./sentence-card";
import { ProgressCountdown } from "./progress-countdown";
import type { Sentence } from "@/lib/schemas/storybook.schema";

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

- [ ] **Step 4: Commit**

```bash
git add src/components/storybook/
git commit -m "feat(storybook): add SentenceCard, ProgressCountdown, ShadowingPlayer UI components"
```

---

### Task 9: Pages — Text Input & Player

**Files:**
- Create: `src/app/apps/storybook/page.tsx`
- Create: `src/app/apps/storybook/player/page.tsx`

- [ ] **Step 1: Viết trang nhập text (form)**

```typescript
// src/app/apps/storybook/page.tsx
"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import type { ProcessResponse } from "@/lib/schemas/storybook.schema";

export default function StorybookPage() {
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/storybook/process", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error ?? "Lỗi không xác định");
      }

      const data: ProcessResponse = await res.json();
      // Lưu vào sessionStorage để trang player đọc
      sessionStorage.setItem("storybook_sentences", JSON.stringify(data.sentences));
      router.push("/apps/storybook/player");
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-8 py-12">
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-bold text-slate-900">📖 AI Storybook Shadowing</h1>
        <p className="text-slate-500">Nhập đoạn văn tiếng Anh, AI sẽ đọc mẫu và bạn luyện đọc theo.</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Dán đoạn văn tiếng Anh vào đây... (10–2000 ký tự)"
          className="w-full h-48 p-4 border border-slate-200 rounded-xl resize-none focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-700"
          maxLength={2000}
        />
        <div className="flex justify-between text-xs text-slate-400">
          <span>{text.length} / 2000 ký tự</span>
        </div>

        {error && (
          <p className="text-red-600 text-sm bg-red-50 px-4 py-2 rounded-lg">{error}</p>
        )}

        <button
          type="submit"
          disabled={loading || text.length < 10}
          className="w-full py-3 px-6 bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {loading ? "⏳ Đang xử lý (5-15 giây)..." : "✨ Tạo bài luyện tập"}
        </button>
      </form>
    </div>
  );
}
```

- [ ] **Step 2: Viết trang Player**

```typescript
// src/app/apps/storybook/player/page.tsx
"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ShadowingPlayer } from "@/components/storybook/shadowing-player";
import { SentenceSchema } from "@/lib/schemas/storybook.schema";
import { z } from "zod";

export default function PlayerPage() {
  const router = useRouter();
  const [sentences, setSentences] = useState<z.infer<typeof SentenceSchema>[]>([]);

  useEffect(() => {
    const stored = sessionStorage.getItem("storybook_sentences");
    if (!stored) {
      router.replace("/apps/storybook");
      return;
    }
    try {
      setSentences(JSON.parse(stored));
    } catch {
      router.replace("/apps/storybook");
    }
  }, [router]);

  if (!sentences.length) return null;

  return (
    <div className="max-w-2xl mx-auto space-y-6 py-8">
      <div className="flex items-center gap-4">
        <button
          onClick={() => router.push("/apps/storybook")}
          className="text-sm text-slate-400 hover:text-slate-700 transition-colors"
        >
          ← Bài mới
        </button>
        <h1 className="text-xl font-bold text-slate-800">Luyện Shadowing</h1>
      </div>

      <ShadowingPlayer sentences={sentences} />
    </div>
  );
}
```

- [ ] **Step 3: Commit**

```bash
git add src/app/apps/storybook/
git commit -m "feat(storybook): add text input page and player page"
```

---

### Task 10: Cập nhật Homepage & ENV

**Files:**
- Modify: `src/app/page.tsx`
- Modify: `.env.local` (thêm keys)

- [ ] **Step 1: Thêm card vào trang chủ**

Trong `src/app/page.tsx`, thêm Card mới vào grid (sau card `aha-opta`):

```tsx
{/* App 3: AI Storybook Shadowing */}
<Card className="hover:shadow-lg transition-shadow duration-300 border-indigo-200 bg-gradient-to-br from-indigo-50 to-violet-50">
  <CardHeader>
    <div className="text-4xl mb-2">📖</div>
    <CardTitle className="text-indigo-800">AI Storybook Shadowing</CardTitle>
    <CardDescription>
      Luyện phát âm tiếng Anh qua phương pháp Shadowing — AI đọc mẫu, bạn đọc theo.
    </CardDescription>
  </CardHeader>
  <CardContent>
    <Link
      href="/apps/storybook"
      className={cn(buttonVariants({ variant: "default" }), "w-full bg-indigo-600 hover:bg-indigo-700 text-white text-center")}
    >
      Bắt đầu luyện tập
    </Link>
  </CardContent>
</Card>
```

- [ ] **Step 2: Thêm API Keys vào .env.local**

```bash
# .env.local (thêm 2 dòng sau)
GEMINI_API_KEY=your_gemini_api_key_here
GOOGLE_TTS_API_KEY=your_google_cloud_tts_api_key_here
```

> [!WARNING]
> `GOOGLE_TTS_API_KEY` phải là **API Key** của Google Cloud (không phải Service Account JSON). Tạo tại [Google Cloud Console → Credentials → Create API Key] và bật API "Cloud Text-to-Speech".

- [ ] **Step 3: Commit**

```bash
git add src/app/page.tsx
git commit -m "feat(storybook): add Storybook Shadowing card to homepage"
```

---

## ✅ Verification Plan

### Automated Build Check
```bash
npm run build
# Expected: exit code 0, no TypeScript errors
```

### Manual Verification Flow

1. **Happy Path:** Chạy `npm run dev` → Vào `http://localhost:3000/apps/storybook` → Nhập đoạn văn 3-5 câu → Bấm "Tạo bài luyện" → Đợi ~5-10s → Chuyển sang trang Player → Bấm Play → Nghe AI đọc → Đọc theo trong khoảng dừng.

2. **Edge Case — Pause:** Bấm Pause giữa chừng → kiểm tra audio dừng ngay lập tức (không có tiếng tiếp theo sau vài giây).

3. **Edge Case — Navigate:** Bấm Next/Prev → kiểm tra câu highlight đổi đúng.

4. **Edge Case — Empty return:** Vào trực tiếp `/apps/storybook/player` (không qua form) → kiểm tra redirect về `/apps/storybook`.

---

## 📋 Open Questions

> [!IMPORTANT]
> **Q1: Google Cloud TTS hay ElevenLabs?**
> Plan hiện tại dùng **Google Cloud TTS** (Standard voice) vì đơn giản hơn, không cần SDK, quota miễn phí 1 triệu ký tự/tháng. ElevenLabs cho giọng đọc tự nhiên hơn nhưng tốn phí ngay từ đầu. Anh Tú muốn dùng cái nào?

> [!IMPORTANT]
> **Q2: Lưu trữ session bằng `sessionStorage` hay URL params?**
> Plan dùng `sessionStorage` để truyền dữ liệu giữa 2 trang (tránh URL quá dài). Nhược điểm: data mất khi refresh tab. Anh muốn lưu persistent hơn (MongoDB đã có trong workspace) không?

> [!NOTE]
> **Q3: Giai đoạn 1 không cần upload PDF** — plan đã confirm: chỉ nhập text thô. PDF sẽ là Giai đoạn 2.

---

*Made by Anh Tu - Share to be share*
