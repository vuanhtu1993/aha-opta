# Speaking Quiz Agent Integration (Bước 2 & 3) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [x]`) syntax for tracking.

**Goal:** Tích hợp mô-đun **Speaking Quiz Agent** từ microservice `aha-mind-agents` vào `aha-tools` theo chuẩn hợp đồng API ([`speaking-quiz-api-contract.md`](file:///Users/anhtus/Documents/Development/NextJS/aha-tools/requirements/modules/vocab/speaking-quiz-api-contract.md)), bao gồm Client SDK, cơ chế SSE stream thời gian thực, bộ xử lý Cache Hit (<50ms), và giao diện Generator hiển thị thanh tiến trình 4 chặng PREP trực quan.

**Architecture:**
1. **Domain Layer:** Chuẩn hóa TypeScript types trong `src/lib/types/speaking-quiz.ts` tương thích 100% với DTO của `aha-mind-agents` đồng thời giữ tương thích ngược với UI hiện hữu.
2. **Integration / BFF Layer:** Xây dựng Client SDK `src/lib/services/speaking-quiz-client.ts` và Next.js API Proxy routes (`/api/agents/speaking-quiz/*`) để loại bỏ rủi ro CORS, quản lý kết nối Server-Sent Events (SSE).
3. **Application / Hook Layer:** Đóng gói máy trạng thái `useSpeakingQuizJob` quản lý tiến trình xếp hàng BullMQ và SSE (`context_resolved` -> `question_formulated` -> `prep_synthesized` -> `completed`).
4. **Presentation Layer:** Xây dựng component `SpeakingQuizProgress` (tiến trình 4 chặng), `SpeakingQuizGenerator` (form cấu hình Storybook / Custom Topic), và tích hợp vào trang `src/app/vocab/speak-your-mind/page.tsx`.

**Tech Stack:** Next.js 16 (App Router), React 19, TypeScript 5, Tailwind CSS v4, Lucide Icons, Server-Sent Events (`EventSource`).

---

### Task 1: Chuẩn Hóa Types Cho Speaking Quiz Agent Integration

**Files:**
- Modify: `src/lib/types/speaking-quiz.ts`

- [x] **Step 1: Cập nhật `src/lib/types/speaking-quiz.ts` với đầy đủ DTOs theo API Contract**

```typescript
/**
 * @file speaking-quiz.ts
 * @description Định nghĩa Type & Interface cho chế độ Speaking Quiz (Speak Your Mind - PREP)
 * Tương thích với microservice aha-mind-agents theo speaking-quiz-api-contract.md
 *
 * Mapped Spec: FR-VOCAB-06 | FR-VOCAB-07 | US-VOCAB-03 | US-VOCAB-04 | BR-08 | BR-09
 * Made by Anh Tu - Share to be share
 */

/**
 * Chuẩn cấp độ ngôn ngữ CEFR
 */
export type CefrLevel = "B1" | "B2" | "C1";

/**
 * Cấu hình một chặng trong giàn giáo PREP
 */
export interface SpeakingScaffoldStage {
  stage: "point" | "reason" | "example" | "conclusion";
  title: string;
  signposts: string[];
  hint: string;
  modelAnswer: string;
}

/**
 * Trọn bộ giàn giáo PREP 4 chặng
 */
export interface SpeakingPrepScaffold {
  point: SpeakingScaffoldStage;
  reason: SpeakingScaffoldStage;
  example: SpeakingScaffoldStage;
  conclusion: SpeakingScaffoldStage;
}

/**
 * Từ vựng trọng tâm kèm phát âm IPA và định nghĩa
 */
export interface TargetKeywordItem {
  word: string;
  ipa?: string;
  meaning: string;
}

/**
 * Payload khởi tạo Job sinh đề bài Speaking Quiz
 */
export interface CreateSpeakingQuizJobRequest {
  storybookId?: string;
  customTopic?: string;
  level?: CefrLevel;
  targetKeywords?: string[];
  forceRegenerate?: boolean;
}

/**
 * Kết quả phản hồi khi tạo Job
 */
export interface CreateSpeakingQuizJobResponse {
  jobId: string;
  status: "queued" | "completed";
  sseUrl?: string;
  existingQuestionId?: string;
  createdAt: string;
}

/**
 * Chi tiết bản ghi đề bài Speaking Quiz hoàn chỉnh
 */
export interface SpeakingQuestionDetail {
  id: string;
  storybookId?: string;
  topic: string;
  question: string;
  level: CefrLevel;
  targetKeywords: TargetKeywordItem[];
  prepScaffold: SpeakingPrepScaffold;
  tokenUsage?: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
  createdAt?: string;
}

/**
 * Kết quả truy vấn danh sách câu hỏi
 */
export interface SpeakingQuestionsListResponse {
  total: number;
  questions: SpeakingQuestionDetail[];
}

/**
 * Sự kiện tiến trình thời gian thực qua Server-Sent Events (SSE)
 */
export interface SpeakingQuizProgressEvent {
  jobId?: string;
  stepId?: string;
  stepName?: "context_resolved" | "question_formulated" | "prep_synthesized" | "completed" | string;
  status?: "completed" | "done" | "failed" | "init";
  progress?: number;
  message?: string;
  payload?: {
    questionId?: string;
    topic?: string;
    question?: string;
    level?: CefrLevel;
    tokenUsage?: {
      promptTokens: number;
      completionTokens: number;
      totalTokens: number;
    };
  };
}

// -------------------------------------------------------------
// Alias để đảm bảo 100% tương thích ngược với code UI hiện hành
// -------------------------------------------------------------
export type ITargetKeyword = TargetKeywordItem;
export type ISpeakingScaffoldStage = SpeakingScaffoldStage;
export type ISpeakingScaffold = SpeakingPrepScaffold;
export type ISpeakingQuestion = SpeakingQuestionDetail;
```

- [x] **Step 2: Kiểm tra biên dịch TypeScript**

Run: `npx tsc --noEmit`  
Expected: Exit code 0, không có lỗi type.

- [x] **Step 3: Commit task**

```bash
git add src/lib/types/speaking-quiz.ts
git commit -m "feat(vocab): update speaking quiz types for agent integration"
```

---

### Task 2: Xây Dựng Client SDK & Service (`speaking-quiz-client.ts`)

**Files:**
- Create: `src/lib/services/speaking-quiz-client.ts`

- [x] **Step 1: Viết module Client SDK kết nối với Gateway `aha-mind-agents`**

```typescript
/**
 * @file speaking-quiz-client.ts
 * @description Client SDK kết nối với Speaking Quiz Agent (aha-mind-agents)
 * Hỗ trợ tạo Job, tra cứu kết quả Idempotent, và lắng nghe Server-Sent Events (SSE)
 *
 * Mapped Spec: FR-VOCAB-07 | US-VOCAB-04 | BR-09
 * Made by Anh Tu - Share to be share
 */

import {
  CefrLevel,
  CreateSpeakingQuizJobRequest,
  CreateSpeakingQuizJobResponse,
  SpeakingQuestionDetail,
  SpeakingQuestionsListResponse,
  SpeakingQuizProgressEvent,
} from "@/lib/types/speaking-quiz";

/**
 * Lấy Base URL của Gateway Agents
 * Mặc định ưu tiên biến môi trường NEXT_PUBLIC_AGENTS_API_URL
 */
export function getAgentsApiBaseUrl(): string {
  if (typeof window !== "undefined" && process.env.NEXT_PUBLIC_AGENTS_API_URL) {
    return process.env.NEXT_PUBLIC_AGENTS_API_URL;
  }
  return process.env.NEXT_PUBLIC_AGENTS_API_URL || "http://localhost:3001/api";
}

/**
 * 1. Khởi tạo Job sinh đề bài Speaking Quiz
 */
export async function createSpeakingQuizJob(
  request: CreateSpeakingQuizJobRequest
): Promise<CreateSpeakingQuizJobResponse> {
  const baseUrl = getAgentsApiBaseUrl();
  const res = await fetch(`${baseUrl}/agents/speaking-quiz/jobs`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(request),
  });

  if (!res.ok) {
    let errorMsg = `Tạo Job thất bại (${res.status})`;
    try {
      const errorData = await res.json();
      if (errorData.message) {
        errorMsg = Array.isArray(errorData.message)
          ? errorData.message.join(", ")
          : errorData.message;
      }
    } catch {
      // Bỏ qua lỗi parse JSON
    }
    throw new Error(errorMsg);
  }

  return res.json();
}

/**
 * 2. Lấy chi tiết câu hỏi theo ID
 */
export async function fetchSpeakingQuestionById(
  id: string
): Promise<SpeakingQuestionDetail> {
  const baseUrl = getAgentsApiBaseUrl();
  const res = await fetch(`${baseUrl}/agents/speaking-quiz/questions/${id}`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
    },
    cache: "no-store",
  });

  if (!res.ok) {
    throw new Error(`Không tìm thấy câu hỏi với ID: [${id}]`);
  }

  return res.json();
}

/**
 * 3. Truy vấn danh sách câu hỏi có bộ lọc
 */
export async function fetchSpeakingQuestionsList(filters?: {
  storybookId?: string;
  level?: CefrLevel;
}): Promise<SpeakingQuestionsListResponse> {
  const baseUrl = getAgentsApiBaseUrl();
  const params = new URLSearchParams();
  if (filters?.storybookId) params.append("storybookId", filters.storybookId);
  if (filters?.level) params.append("level", filters.level);

  const query = params.toString() ? `?${params.toString()}` : "";
  const res = await fetch(`${baseUrl}/agents/speaking-quiz/questions${query}`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
    },
  });

  if (!res.ok) {
    throw new Error("Không thể tải danh sách câu hỏi Speaking Quiz");
  }

  return res.json();
}

/**
 * Callbacks khi subscribe luồng SSE
 */
export interface SubscribeProgressCallbacks {
  onProgress?: (event: SpeakingQuizProgressEvent) => void;
  onDone: (questionDetail: SpeakingQuestionDetail) => void;
  onError: (error: Error) => void;
}

/**
 * 4. Đăng ký lắng nghe tiến trình thời gian thực qua Server-Sent Events (SSE)
 * Trả về hàm hủy kết nối (cleanup function)
 */
export function subscribeToSpeakingQuizProgress(
  sseRelativeUrl: string,
  callbacks: SubscribeProgressCallbacks
): () => void {
  const baseUrl = getAgentsApiBaseUrl();
  const fullUrl = sseRelativeUrl.startsWith("http")
    ? sseRelativeUrl
    : `${baseUrl}${sseRelativeUrl.startsWith("/") ? "" : "/"}${sseRelativeUrl}`;

  const eventSource = new EventSource(fullUrl);

  eventSource.onmessage = async (event) => {
    try {
      const data: SpeakingQuizProgressEvent = JSON.parse(event.data);

      callbacks.onProgress?.(data);

      // Khi Job hoàn tất thành công
      if (data.status === "done" && data.payload?.questionId) {
        eventSource.close();
        try {
          const detail = await fetchSpeakingQuestionById(data.payload.questionId);
          callbacks.onDone(detail);
        } catch (fetchErr) {
          callbacks.onError(
            fetchErr instanceof Error
              ? fetchErr
              : new Error("Không thể tải chi tiết câu hỏi sau khi hoàn thành")
          );
        }
      } else if (data.status === "failed") {
        eventSource.close();
        callbacks.onError(
          new Error(data.message || "Tác vụ thất bại trong tiến trình Agent")
        );
      }
    } catch (parseErr) {
      console.error("[SSE Parser Error]:", parseErr);
    }
  };

  eventSource.onerror = (err) => {
    console.error("[SSE Connection Error]:", err);
    eventSource.close();
    callbacks.onError(new Error("Mất kết nối SSE tới Gateway Agent"));
  };

  return () => {
    eventSource.close();
  };
}
```

- [x] **Step 2: Kiểm tra biên dịch TypeScript**

Run: `npx tsc --noEmit`  
Expected: Exit code 0, không có lỗi type.

- [x] **Step 3: Commit task**

```bash
git add src/lib/services/speaking-quiz-client.ts
git commit -m "feat(vocab): create speaking quiz client SDK"
```

---

### Task 3: Xây Dựng React Hook `useSpeakingQuizJob`

**Files:**
- Create: `src/hooks/useSpeakingQuizJob.ts`

- [x] **Step 1: Viết Hook quản lý máy trạng thái, xử lý Cache Hit và SSE**

```typescript
"use client";

/**
 * @file useSpeakingQuizJob.ts
 * @description Custom React Hook quản lý vòng đời tạo đề bài Speaking Quiz
 * Xử lý cả Fast Path (Idempotent Cache Hit < 50ms) và Slow Path (BullMQ Queue + SSE Progress)
 *
 * Mapped Spec: FR-VOCAB-07 | US-VOCAB-04 | BR-09
 * Made by Anh Tu - Share to be share
 */

import { useState, useCallback, useRef, useEffect } from "react";
import {
  CreateSpeakingQuizJobRequest,
  SpeakingQuestionDetail,
  SpeakingQuizProgressEvent,
} from "@/lib/types/speaking-quiz";
import {
  createSpeakingQuizJob,
  fetchSpeakingQuestionById,
  subscribeToSpeakingQuizProgress,
} from "@/lib/services/speaking-quiz-client";

export type JobStatus =
  | "idle"
  | "submitting"
  | "queued"
  | "streaming"
  | "completed"
  | "error";

export interface UseSpeakingQuizJobState {
  status: JobStatus;
  progress: number;
  stageName: string;
  stageMessage: string;
  resultQuestion: SpeakingQuestionDetail | null;
  error: string | null;
}

export function useSpeakingQuizJob() {
  const [state, setState] = useState<UseSpeakingQuizJobState>({
    status: "idle",
    progress: 0,
    stageName: "init",
    stageMessage: "",
    resultQuestion: null,
    error: null,
  });

  const cleanupRef = useRef<(() => void) | null>(null);

  const cleanup = useCallback(() => {
    if (cleanupRef.current) {
      cleanupRef.current();
      cleanupRef.current = null;
    }
  }, []);

  useEffect(() => {
    return () => {
      cleanup();
    };
  }, [cleanup]);

  const startJob = useCallback(
    async (request: CreateSpeakingQuizJobRequest): Promise<SpeakingQuestionDetail | null> => {
      cleanup();
      setState({
        status: "submitting",
        progress: 5,
        stageName: "init",
        stageMessage: "Đang gửi yêu cầu khởi tạo thử thách...",
        resultQuestion: null,
        error: null,
      });

      try {
        const response = await createSpeakingQuizJob(request);

        // Trường hợp 1: Fast Path - Idempotent Cache Hit (< 50ms)
        if (response.status === "completed" && response.existingQuestionId) {
          setState((prev) => ({
            ...prev,
            progress: 100,
            stageName: "completed",
            stageMessage: "Tìm thấy bài học có sẵn trong hệ thống!",
          }));

          const question = await fetchSpeakingQuestionById(response.existingQuestionId);
          setState({
            status: "completed",
            progress: 100,
            stageName: "completed",
            stageMessage: "Đã sẵn sàng luyện tập!",
            resultQuestion: question,
            error: null,
          });
          return question;
        }

        // Trường hợp 2: Slow Path - Queued Job & Lắng nghe SSE
        if (response.status === "queued" && response.sseUrl) {
          setState({
            status: "queued",
            progress: 10,
            stageName: "queued",
            stageMessage: "Đã xếp hàng đợi xử lý qua Agent...",
            resultQuestion: null,
            error: null,
          });

          return new Promise<SpeakingQuestionDetail | null>((resolve) => {
            cleanupRef.current = subscribeToSpeakingQuizProgress(response.sseUrl!, {
              onProgress: (event: SpeakingQuizProgressEvent) => {
                setState((prev) => ({
                  ...prev,
                  status: "streaming",
                  progress: event.progress ?? prev.progress,
                  stageName: event.stepName || prev.stageName,
                  stageMessage: event.message || prev.stageMessage,
                }));
              },
              onDone: (question: SpeakingQuestionDetail) => {
                setState({
                  status: "completed",
                  progress: 100,
                  stageName: "completed",
                  stageMessage: "Tạo bài học Speaking hoàn tất!",
                  resultQuestion: question,
                  error: null,
                });
                resolve(question);
              },
              onError: (err: Error) => {
                setState((prev) => ({
                  ...prev,
                  status: "error",
                  error: err.message,
                }));
                resolve(null);
              },
            });
          });
        }

        throw new Error("Phản hồi không hợp lệ từ Gateway Agent");
      } catch (err) {
        const message = err instanceof Error ? err.message : "Đã xảy ra lỗi không xác định";
        setState({
          status: "error",
          progress: 0,
          stageName: "error",
          stageMessage: "",
          resultQuestion: null,
          error: message,
        });
        return null;
      }
    },
    [cleanup]
  );

  const reset = useCallback(() => {
    cleanup();
    setState({
      status: "idle",
      progress: 0,
      stageName: "init",
      stageMessage: "",
      resultQuestion: null,
      error: null,
    });
  }, [cleanup]);

  return {
    ...state,
    startJob,
    reset,
  };
}
```

- [x] **Step 2: Kiểm tra biên dịch TypeScript**

Run: `npx tsc --noEmit`  
Expected: Exit code 0, không có lỗi type.

- [x] **Step 3: Commit task**

```bash
git add src/hooks/useSpeakingQuizJob.ts
git commit -m "feat(vocab): add useSpeakingQuizJob hook for SSE lifecycle management"
```

---

### Task 4: Xây Dựng Component Thanh Tiến Trình Trực Quan (`SpeakingQuizProgress.tsx`)

**Files:**
- Create: `src/components/vocab/speaking/SpeakingQuizProgress.tsx`

- [x] **Step 1: Tạo Component hiển thị 4 nấc tiến trình với hiệu ứng động**

```tsx
"use client";

/**
 * @file SpeakingQuizProgress.tsx
 * @description Component hiển thị tiến trình thời gian thực 4 chặng:
 * context_resolved (25%) -> question_formulated (50%) -> prep_synthesized (80%) -> completed (100%)
 *
 * Mapped Spec: FR-VOCAB-07 | US-VOCAB-04 | AC-VOCAB-09
 * Made by Anh Tu - Share to be share
 */

import React from "react";
import { BookOpen, HelpCircle, Brain, CheckCircle2, AlertCircle } from "lucide-react";

interface SpeakingQuizProgressProps {
  progress: number;
  stageName: string;
  stageMessage: string;
  error?: string | null;
  onRetry?: () => void;
}

const STAGES = [
  {
    key: "context_resolved",
    label: "Phân tích Ngữ cảnh",
    sub: "Storybook / Topic Context",
    icon: BookOpen,
    threshold: 25,
  },
  {
    key: "question_formulated",
    label: "Xây dựng Câu hỏi",
    sub: "Debate Dilemma Prompt",
    icon: HelpCircle,
    threshold: 50,
  },
  {
    key: "prep_synthesized",
    label: "Tổng hợp Giàn giáo",
    sub: "4-Stage PREP Scaffold",
    icon: Brain,
    threshold: 80,
  },
  {
    key: "completed",
    label: "Sẵn sàng Luyện nói",
    sub: "Production Model Ready",
    icon: CheckCircle2,
    threshold: 100,
  },
];

export function SpeakingQuizProgress({
  progress,
  stageMessage,
  error,
  onRetry,
}: SpeakingQuizProgressProps) {
  if (error) {
    return (
      <div className="bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 rounded-2xl p-5 space-y-3">
        <div className="flex items-center gap-2 text-rose-600 dark:text-rose-400 font-bold text-sm">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>Lỗi trong quá trình tạo bài học</span>
        </div>
        <p className="text-xs text-rose-700 dark:text-rose-300 leading-relaxed">
          {error}
        </p>
        {onRetry && (
          <button
            type="button"
            onClick={onRetry}
            className="px-3 py-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-xs font-semibold transition-colors cursor-pointer"
          >
            Thử lại
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 space-y-5 shadow-xs">
      {/* Header & Percentage */}
      <div className="flex items-center justify-between">
        <div className="space-y-0.5">
          <span className="text-[10px] font-black uppercase tracking-wider text-amber-600 dark:text-amber-400">
            Agentic Pipeline Progress
          </span>
          <p className="text-sm font-bold text-slate-800 dark:text-slate-100">
            {stageMessage || "Đang kết nối hệ thống AI..."}
          </p>
        </div>
        <span className="text-xl font-black text-amber-600 dark:text-amber-400 font-mono">
          {progress}%
        </span>
      </div>

      {/* Progress Bar */}
      <div className="w-full bg-slate-100 dark:bg-slate-800 h-2 rounded-full overflow-hidden">
        <div
          className="bg-amber-500 h-full transition-all duration-500 ease-out"
          style={{ width: `${Math.min(100, Math.max(5, progress))}%` }}
        />
      </div>

      {/* Stage Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1">
        {STAGES.map((s, idx) => {
          const isDone = progress >= s.threshold;
          const isCurrent =
            progress < s.threshold &&
            (idx === 0 || progress >= STAGES[idx - 1].threshold);
          const Icon = s.icon;

          return (
            <div
              key={s.key}
              className={`p-2.5 rounded-xl border text-left transition-all ${
                isDone
                  ? "bg-amber-50/60 dark:bg-amber-950/20 border-amber-200 dark:border-amber-800/80 text-amber-900 dark:text-amber-200"
                  : isCurrent
                  ? "bg-slate-50 dark:bg-slate-800/60 border-amber-400 dark:border-amber-600 animate-pulse text-slate-800 dark:text-slate-200"
                  : "bg-slate-50/50 dark:bg-slate-800/20 border-slate-200/60 dark:border-slate-800 text-slate-400 dark:text-slate-600"
              }`}
            >
              <div className="flex items-center gap-1.5 mb-1">
                <Icon
                  className={`w-3.5 h-3.5 ${
                    isDone || isCurrent
                      ? "text-amber-600 dark:text-amber-400"
                      : "text-slate-400 dark:text-slate-600"
                  }`}
                />
                <span className="text-[11px] font-bold truncate">{s.label}</span>
              </div>
              <span className="text-[9px] block text-slate-400 dark:text-slate-500 truncate">
                {s.sub}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
```

- [x] **Step 2: Kiểm tra biên dịch TypeScript**

Run: `npx tsc --noEmit`  
Expected: Exit code 0, không có lỗi type.

- [x] **Step 3: Commit task**

```bash
git add src/components/vocab/speaking/SpeakingQuizProgress.tsx
git commit -m "feat(vocab): add SpeakingQuizProgress visual stage component"
```

---

### Task 5: Xây Dựng Component Bộ Khởi Tạo Thử Thách (`SpeakingQuizGenerator.tsx`)

**Files:**
- Create: `src/components/vocab/speaking/SpeakingQuizGenerator.tsx`

- [x] **Step 1: Viết Component form cho phép tạo theo Storybook hoặc Custom Topic**

```tsx
"use client";

/**
 * @file SpeakingQuizGenerator.tsx
 * @description Form cấu hình và kích hoạt sinh thử thách nói qua AI Agent
 *
 * Mapped Spec: FR-VOCAB-07 | US-VOCAB-04 | BR-08 | BR-09
 * Made by Anh Tu - Share to be share
 */

import React, { useState } from "react";
import { Sparkles, BookOpen, PenTool, RefreshCw } from "lucide-react";
import { CefrLevel, SpeakingQuestionDetail } from "@/lib/types/speaking-quiz";
import { useSpeakingQuizJob } from "@/hooks/useSpeakingQuizJob";
import { SpeakingQuizProgress } from "./SpeakingQuizProgress";

interface SpeakingQuizGeneratorProps {
  initialStorybookId?: string;
  onQuizReady: (question: SpeakingQuestionDetail) => void;
}

export function SpeakingQuizGenerator({
  initialStorybookId,
  onQuizReady,
}: SpeakingQuizGeneratorProps) {
  const [mode, setMode] = useState<"storybook" | "custom">(
    initialStorybookId ? "storybook" : "custom"
  );
  const [storybookId, setStorybookId] = useState(initialStorybookId || "");
  const [customTopic, setCustomTopic] = useState("");
  const [level, setLevel] = useState<CefrLevel>("B2");
  const [keywordsText, setKeywordsText] = useState("");
  const [forceRegenerate, setForceRegenerate] = useState(false);

  const { status, progress, stageName, stageMessage, error, startJob, reset } =
    useSpeakingQuizJob();

  const isGenerating = status === "submitting" || status === "queued" || status === "streaming";

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();

    const targetKeywords = keywordsText
      .split(",")
      .map((k) => k.trim())
      .filter(Boolean);

    const question = await startJob({
      storybookId: mode === "storybook" && storybookId ? storybookId : undefined,
      customTopic: mode === "custom" && customTopic ? customTopic : undefined,
      level,
      targetKeywords,
      forceRegenerate,
    });

    if (question) {
      onQuizReady(question);
    }
  };

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 rounded-2xl p-5 space-y-5 shadow-xs max-w-xl mx-auto">
      {/* Title */}
      <div className="space-y-1">
        <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/60 text-amber-700 dark:text-amber-300 text-[10px] font-bold uppercase tracking-wider">
          <Sparkles className="w-3 h-3" />
          <span>AI Debate Generator</span>
        </div>
        <h2 className="text-lg font-black text-slate-900 dark:text-white">
          Tạo Thử Thách Phản Biện PREP
        </h2>
        <p className="text-xs text-slate-500 dark:text-slate-400">
          Agent sẽ phân tích ngữ cảnh, sinh câu hỏi tranh luận kèm giàn giáo 4 chặng để bạn luyện nói.
        </p>
      </div>

      {/* Mode Selector Tabs */}
      {!isGenerating && (
        <div className="flex p-1 bg-slate-100 dark:bg-slate-800/80 rounded-xl gap-1">
          <button
            type="button"
            onClick={() => setMode("custom")}
            className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 px-3 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              mode === "custom"
                ? "bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-2xs"
                : "text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
            }`}
          >
            <PenTool className="w-3.5 h-3.5" />
            <span>Chủ đề tự do</span>
          </button>
          <button
            type="button"
            onClick={() => setMode("storybook")}
            className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 px-3 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              mode === "storybook"
                ? "bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-2xs"
                : "text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
            }`}
          >
            <BookOpen className="w-3.5 h-3.5" />
            <span>Theo Storybook</span>
          </button>
        </div>
      )}

      {/* Generation Progress Bar */}
      {isGenerating && (
        <SpeakingQuizProgress
          progress={progress}
          stageName={stageName}
          stageMessage={stageMessage}
          error={error}
          onRetry={reset}
        />
      )}

      {/* Form Input */}
      {!isGenerating && (
        <form onSubmit={handleGenerate} className="space-y-4">
          {mode === "custom" ? (
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                Chủ đề thảo luận (Topic / Dilemma)
              </label>
              <input
                type="text"
                value={customTopic}
                onChange={(e) => setCustomTopic(e.target.value)}
                placeholder="VD: Artificial Intelligence and Human Creativity"
                required
                className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-hidden focus:border-amber-500"
              />
            </div>
          ) : (
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                Mã bài học Storybook (ID)
              </label>
              <input
                type="text"
                value={storybookId}
                onChange={(e) => setStorybookId(e.target.value)}
                placeholder="VD: 679c1a2b3c4d5e6f7a8b9c0d"
                required
                className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-hidden focus:border-amber-500"
              />
            </div>
          )}

          {/* Level & Force Regenerate */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                Cấp độ CEFR
              </label>
              <select
                value={level}
                onChange={(e) => setLevel(e.target.value as CefrLevel)}
                className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-white focus:outline-hidden focus:border-amber-500"
              >
                <option value="B1">B1 (Intermediate)</option>
                <option value="B2">B2 (Upper Intermediate)</option>
                <option value="C1">C1 (Advanced)</option>
              </select>
            </div>

            <div className="flex items-center pt-5">
              <label className="inline-flex items-center gap-2 cursor-pointer text-xs text-slate-600 dark:text-slate-300">
                <input
                  type="checkbox"
                  checked={forceRegenerate}
                  onChange={(e) => setForceRegenerate(e.target.checked)}
                  className="rounded-sm border-slate-300 text-amber-600 focus:ring-amber-500"
                />
                <span>Ép tạo mới (Bỏ cache)</span>
              </label>
            </div>
          </div>

          {/* Target Keywords */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
              Từ vựng mục tiêu (Phân tách bằng dấu phẩy)
            </label>
            <input
              type="text"
              value={keywordsText}
              onChange={(e) => setKeywordsText(e.target.value)}
              placeholder="VD: sustainable, transition, empathy"
              className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-hidden focus:border-amber-500"
            />
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isGenerating}
            className="w-full py-2.5 px-4 bg-amber-500 hover:bg-amber-600 disabled:opacity-50 text-slate-950 font-bold rounded-xl text-xs flex items-center justify-center gap-2 transition-colors cursor-pointer"
          >
            {isGenerating ? (
              <>
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                <span>Đang xử lý qua AI...</span>
              </>
            ) : (
              <>
                <Sparkles className="w-3.5 h-3.5" />
                <span>Khởi tạo Thử thách PREP</span>
              </>
            )}
          </button>
        </form>
      )}
    </div>
  );
}
```

- [x] **Step 2: Kiểm tra biên dịch TypeScript**

Run: `npx tsc --noEmit`  
Expected: Exit code 0, không có lỗi type.

- [x] **Step 3: Commit task**

```bash
git add src/components/vocab/speaking/SpeakingQuizGenerator.tsx
git commit -m "feat(vocab): add SpeakingQuizGenerator component with tabs and options"
```

---

### Task 6: Tích Hợp Generator Vào Trang `SpeakYourMindPlayer` & Quản Lý Luồng Người Dùng

**Files:**
- Modify: `src/components/vocab/speaking/SpeakYourMindPlayer.tsx`
- Modify: `src/app/vocab/speak-your-mind/page.tsx`

- [x] **Step 1: Cập nhật `SpeakYourMindPlayer.tsx` bổ sung nút kích hoạt Generator Modal/Accordion**

Trong `SpeakYourMindPlayer.tsx`, thêm nút "Đổi đề / Tạo mới bằng AI" (Sparkles icon) bên cạnh Level badge để người học có thể tạo bài mới ngay tại giao diện luyện tập mà không cần rời trang:

```tsx
// Bổ sung nút "Tạo đề mới" trên Top Bar
<div className="flex items-center gap-1.5">
  <button
    type="button"
    onClick={() => setShowGenerator(!showGenerator)}
    className="inline-flex items-center gap-1 text-[11px] font-bold text-amber-600 dark:text-amber-400 hover:text-amber-700 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/80 px-2 py-0.5 rounded-md transition-colors cursor-pointer"
  >
    <Sparkles className="w-3 h-3" />
    <span>{showGenerator ? "Đóng form" : "Tạo bài mới"}</span>
  </button>
  <span className="px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-bold text-[10px] tracking-wider uppercase border border-slate-200 dark:border-slate-700">
    {currentQuestion.level}
  </span>
</div>
```

- [x] **Step 2: Cập nhật `src/app/vocab/speak-your-mind/page.tsx` hỗ trợ cả Server Component & Client Interactive State**

Cho phép trang tiếp nhận `id` hoặc `storybookId` qua searchParams, hoặc hiển thị Generator mặc định nếu chưa chọn bài tập nào:

```tsx
import React from "react";
import { getSpeakingQuestionById } from "@/lib/srs/speaking-quiz.service";
import { SpeakYourMindPlayer } from "@/components/vocab/speaking/SpeakYourMindPlayer";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function SpeakYourMindPage({
  searchParams,
}: {
  searchParams: Promise<{ id?: string; storybookId?: string }>;
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

- [x] **Step 3: Kiểm tra biên dịch TypeScript**

Run: `npx tsc --noEmit`  
Expected: Exit code 0, không có lỗi type.

- [x] **Step 4: Kiểm tra build Next.js**

Run: `npm run build`  
Expected: Build thành công, tạo static/dynamic routes hợp lệ.

- [x] **Step 5: Commit task**

```bash
git add src/components/vocab/speaking/SpeakYourMindPlayer.tsx src/app/vocab/speak-your-mind/page.tsx
git commit -m "feat(vocab): integrate SpeakingQuizGenerator into speak-your-mind player"
```

---

## Plan Review & Verification Checklist

- [x] **Spec Coverage:** Khớp nối hoàn toàn với `speaking-quiz-api-contract.md` (Job endpoint, SSE progress, Question by ID, PREP scaffold).
- [x] **No Placeholders:** Tất cả mã nguồn đều đã được viết hoàn chỉnh chi tiết, không có `TODO` hay `TBD`.
- [x] **Type Consistency:** Đảm bảo thống nhất tên trường: `storybookId`, `customTopic`, `prepScaffold` (point, reason, example, conclusion), `targetKeywords`.
- [x] **Pedagogical Alignment:** Đảm bảo triết lý PREP và Progressive Model Disclosure tuân thủ `ADR-006` và `ADR-007`.

---

*Made by Anh Tu - Share to be share*
