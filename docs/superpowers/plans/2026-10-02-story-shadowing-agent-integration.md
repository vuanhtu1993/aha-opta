# Story Shadowing Agent API Integration Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Integrate the Story Shadowing module in `aha-tools` with the `aha-mind-agents` backend using the asynchronous BullMQ + Redis Pub/Sub + GET SSE architecture, supporting idempotent fast-paths (<50ms) and live progress streaming.

**Architecture:** 
1. Build `story-shadowing-client.ts` as the SDK layer communicating with `aha-mind-agents` endpoints (`/api/agents/story-shadowing/jobs`, `/progress`, and `/stories`).
2. Implement `revalidateStoryShadowing` Server Action in `src/lib/actions/story-shadowing.actions.ts` to purge static route cache on job completion.
3. Create `useStoryShadowingJob` custom hook managing the job lifecycle (submitting, queued, streaming, idempotent hit, completed, error).
4. Build `StoryShadowingProgress.tsx` component providing real-time visual step-by-step progress tracking for both Text and YouTube pipelines.
5. Upgrade `src/app/apps/story-shadowing/create/page.tsx` to use the new hook and progress component, redirecting automatically to the player upon completion.

**Tech Stack:** Next.js 16 (App Router), React 19, TypeScript, Tailwind CSS, Framer Motion, Lucide React, Server-Sent Events (SSE).

---

### Task 1: Record Architectural Decision in OpenLore

**Files:**
- Command: `npx openlore decisions record`

- [ ] **Step 1: Record decision via OpenLore CLI**

Run:
```bash
npx openlore decisions record \
  --title "Integrate Story Shadowing with Asynchronous Agent Gateway" \
  --rationale "Migrating from in-process Next.js execution to aha-mind-agents BullMQ queue and GET SSE eliminates 504 timeouts on long YouTube videos and enables <50ms idempotent cache hits" \
  --consequences "Story generation runs out-of-process in NestJS; aha-tools manages async job state and listens to SSE progress stream" \
  --files "src/lib/services/story-shadowing-client.ts,src/hooks/useStoryShadowingJob.ts,src/components/story-shadowing/StoryShadowingProgress.tsx,src/app/apps/story-shadowing/create/page.tsx"
```
Expected: Decision recorded with draft ID.

- [ ] **Step 2: Verify OpenLore decisions list**

Run:
```bash
npx openlore decisions --list
```
Expected: The new decision is visible in the list.

---

### Task 2: Create Story Shadowing Client SDK

**Files:**
- Create: `src/lib/services/story-shadowing-client.ts`

- [ ] **Step 1: Write `src/lib/services/story-shadowing-client.ts`**

```typescript
/**
 * @file story-shadowing-client.ts
 * @description Client SDK kết nối với Story Shadowing Agent (aha-mind-agents)
 * Hỗ trợ tạo Job bất đồng bộ, tra cứu Idempotency, và lắng nghe Server-Sent Events (GET SSE)
 *
 * Mapped Spec: aha-mind-agents-api-contract v2.0.0
 * Made by Anh Tu - Share to be share
 */

import {
  CreateStoryShadowingJobRequest,
  CreateStoryShadowingJobResponse,
  IStorybook,
  StoryShadowingProgressEvent,
} from "@/lib/types/story-shadowing";

/**
 * Lấy Base URL của Gateway Agents
 * Mặc định ưu tiên biến môi trường NEXT_PUBLIC_AGENTS_API_URL
 */
export function getAgentsApiBaseUrl(): string {
  const envUrl = process.env.NEXT_PUBLIC_AGENTS_API_URL;
  if (envUrl && envUrl.trim()) {
    return envUrl.trim().replace(/\/+$/, "");
  }
  return "http://localhost:3001/api";
}

/**
 * Phân giải URL tương đối hoặc tuyệt đối từ Agent API
 * Tránh lỗi nhân đôi /api/api khi sseUrl trả về bắt đầu bằng /api
 */
export function resolveAgentUrl(relativeOrFullUrl: string): string {
  if (
    relativeOrFullUrl.startsWith("http://") ||
    relativeOrFullUrl.startsWith("https://")
  ) {
    return relativeOrFullUrl;
  }
  const baseUrl = getAgentsApiBaseUrl();
  try {
    const parsedBase = new URL(baseUrl);
    if (relativeOrFullUrl.startsWith("/")) {
      return new URL(relativeOrFullUrl, parsedBase.origin).toString();
    }
    const baseWithTrailingSlash = baseUrl.endsWith("/") ? baseUrl : `${baseUrl}/`;
    return new URL(relativeOrFullUrl, baseWithTrailingSlash).toString();
  } catch {
    const cleanBase = baseUrl.replace(/\/+$/, "");
    const cleanPath = relativeOrFullUrl.replace(/^\/+/, "");
    return `${cleanBase}/${cleanPath}`;
  }
}

/**
 * 1. Khởi tạo Job sinh bài học Story Shadowing (Text hoặc YouTube)
 */
export async function createStoryShadowingJob(
  request: CreateStoryShadowingJobRequest
): Promise<CreateStoryShadowingJobResponse> {
  const baseUrl = getAgentsApiBaseUrl();
  const res = await fetch(`${baseUrl}/agents/story-shadowing/jobs`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(request),
  });

  if (!res.ok) {
    let errorMsg = `Create Story Shadowing Job failed (${res.status})`;
    try {
      const errorData = await res.json();
      if (errorData.message) {
        errorMsg = Array.isArray(errorData.message)
          ? errorData.message.join(", ")
          : errorData.message;
      }
    } catch {
      // Ignore JSON parse error
    }
    throw new Error(errorMsg);
  }

  return res.json();
}

/**
 * 2. Lấy chi tiết bài học Storybook theo ID
 */
export async function fetchStoryById(id: string): Promise<IStorybook> {
  const baseUrl = getAgentsApiBaseUrl();
  const res = await fetch(`${baseUrl}/agents/story-shadowing/stories/${id}`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
    },
    cache: "no-store",
  });

  if (!res.ok) {
    throw new Error(`Story lesson not found: [${id}]`);
  }

  return res.json();
}

/**
 * 3. Truy vấn danh sách bài học có bộ lọc
 */
export async function fetchStoriesList(filters?: {
  sourceType?: "text" | "youtube";
  level?: string;
}): Promise<{ total: number; stories: IStorybook[] }> {
  const baseUrl = getAgentsApiBaseUrl();
  const params = new URLSearchParams();
  if (filters?.sourceType) params.append("sourceType", filters.sourceType);
  if (filters?.level) params.append("level", filters.level);

  const query = params.toString() ? `?${params.toString()}` : "";
  const res = await fetch(`${baseUrl}/agents/story-shadowing/stories${query}`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
    },
    next: {
      tags: ["story-shadowing-stories"],
    },
  });

  if (!res.ok) {
    throw new Error("Failed to fetch stories list");
  }

  return res.json();
}

/**
 * Callbacks khi subscribe luồng SSE
 */
export interface SubscribeStoryProgressCallbacks {
  onProgress?: (event: StoryShadowingProgressEvent) => void;
  onDone: (story: IStorybook) => void;
  onError: (error: Error) => void;
}

/**
 * 4. Đăng ký lắng nghe tiến trình thời gian thực qua Server-Sent Events (GET SSE)
 * Trả về hàm hủy kết nối (cleanup function)
 */
export function subscribeToStoryShadowingProgress(
  sseRelativeUrl: string,
  callbacks: SubscribeStoryProgressCallbacks
): () => void {
  const fullUrl = resolveAgentUrl(sseRelativeUrl);
  const eventSource = new EventSource(fullUrl);
  let isDone = false;

  eventSource.onmessage = async (event) => {
    try {
      const data: StoryShadowingProgressEvent = JSON.parse(event.data);
      callbacks.onProgress?.(data);

      const isCompleted =
        data.status === "done" ||
        data.status === "completed" ||
        data.stepId === "completed" ||
        data.progress === 100;

      if (isCompleted && !isDone) {
        isDone = true;
        eventSource.close();

        try {
          const storyId =
            data.payload?.storyId ||
            data.payload?.id ||
            (data as any).storyId ||
            (data as any).id;

          let story: IStorybook | null = null;
          if (storyId) {
            story = await fetchStoryById(storyId);
          } else {
            // Fallback: Lấy bài học mới nhất nếu payload không chứa ID
            const list = await fetchStoriesList();
            if (list.stories && list.stories.length > 0) {
              story = list.stories[0];
            }
          }

          if (story) {
            callbacks.onDone(story);
          } else {
            callbacks.onError(new Error("Job completed but story could not be retrieved"));
          }
        } catch (fetchErr) {
          callbacks.onError(
            fetchErr instanceof Error ? fetchErr : new Error(String(fetchErr))
          );
        }
      } else if (data.status === "failed") {
        isDone = true;
        eventSource.close();
        callbacks.onError(new Error(data.message || "Story generation pipeline failed"));
      }
    } catch (parseErr) {
      console.warn("[subscribeToStoryShadowingProgress] JSON parse warning:", parseErr);
    }
  };

  eventSource.onerror = (err) => {
    if (!isDone) {
      console.error("[subscribeToStoryShadowingProgress] SSE connection error:", err);
      eventSource.close();
      callbacks.onError(new Error("Lost connection to Agent Gateway SSE stream"));
    }
  };

  return () => {
    isDone = true;
    eventSource.close();
  };
}
```

- [ ] **Step 2: Run TypeScript check**

Run:
```bash
npx tsc --noEmit
```
Expected: Exit code 0 (no errors).

- [ ] **Step 3: Commit Task 2**

```bash
git add src/lib/services/story-shadowing-client.ts
git commit -m "feat(story-shadowing): add client sdk for aha-mind-agents integration"
```

---

### Task 3: Create Server Actions for Cache Revalidation

**Files:**
- Create: `src/lib/actions/story-shadowing.actions.ts`

- [ ] **Step 1: Write `src/lib/actions/story-shadowing.actions.ts`**

```typescript
"use server";

/**
 * @file story-shadowing.actions.ts
 * @description Server Actions for Story Shadowing module.
 * Handles cache revalidation for the hub and story lists.
 *
 * Mapped Spec: aha-mind-agents-api-contract v2.0.0
 * Made by Anh Tu - Share to be share
 */

import { revalidatePath, updateTag } from "next/cache";

/**
 * Revalidates the Story Shadowing Hub route and stories tag on the server.
 */
export async function revalidateStoryShadowing(): Promise<void> {
  try {
    revalidatePath("/apps/story-shadowing");
    updateTag("story-shadowing-stories");
  } catch (error) {
    console.error("[revalidateStoryShadowing] Error revalidating path/tag:", error);
  }
}
```

- [ ] **Step 2: Run TypeScript check**

Run:
```bash
npx tsc --noEmit
```
Expected: Exit code 0 (no errors).

- [ ] **Step 3: Commit Task 3**

```bash
git add src/lib/actions/story-shadowing.actions.ts
git commit -m "feat(story-shadowing): add server action for cache revalidation"
```

---

### Task 4: Create Custom Hook `useStoryShadowingJob`

**Files:**
- Create: `src/hooks/useStoryShadowingJob.ts`

- [ ] **Step 1: Write `src/hooks/useStoryShadowingJob.ts`**

```typescript
"use client";

/**
 * @file useStoryShadowingJob.ts
 * @description Custom React Hook managing Story Shadowing Job lifecycle
 * Handles Fast Path (Idempotent cache hit < 50ms) and Slow Path (BullMQ queue + GET SSE progress)
 *
 * Mapped Spec: aha-mind-agents-api-contract v2.0.0
 * Made by Anh Tu - Share to be share
 */

import { useState, useCallback, useRef, useEffect } from "react";
import {
  CreateStoryShadowingJobRequest,
  IStorybook,
  StoryShadowingProgressEvent,
} from "@/lib/types/story-shadowing";
import {
  createStoryShadowingJob,
  fetchStoryById,
  subscribeToStoryShadowingProgress,
} from "@/lib/services/story-shadowing-client";

export type StoryJobStatus =
  | "idle"
  | "submitting"
  | "queued"
  | "streaming"
  | "completed"
  | "error";

export interface UseStoryShadowingJobState {
  status: StoryJobStatus;
  progress: number;
  stageName: string;
  stageMessage: string;
  resultStory: IStorybook | null;
  error: string | null;
  isIdempotentHit: boolean;
}

export function useStoryShadowingJob() {
  const [state, setState] = useState<UseStoryShadowingJobState>({
    status: "idle",
    progress: 0,
    stageName: "init",
    stageMessage: "",
    resultStory: null,
    error: null,
    isIdempotentHit: false,
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

  const reset = useCallback(() => {
    cleanup();
    setState({
      status: "idle",
      progress: 0,
      stageName: "init",
      stageMessage: "",
      resultStory: null,
      error: null,
      isIdempotentHit: false,
    });
  }, [cleanup]);

  const startJob = useCallback(
    async (request: CreateStoryShadowingJobRequest): Promise<IStorybook> => {
      cleanup();

      setState({
        status: "submitting",
        progress: 5,
        stageName: "init",
        stageMessage: "Đang gửi yêu cầu tạo bài học...",
        resultStory: null,
        error: null,
        isIdempotentHit: false,
      });

      try {
        // 1. Gửi request tạo Job vào BullMQ Gateway
        const jobResponse = await createStoryShadowingJob(request);

        // 2. Fast Path: Idempotent Hit (< 50ms)
        if (jobResponse.status === "completed" && jobResponse.existingStoryId) {
          setState((prev) => ({
            ...prev,
            status: "completed",
            progress: 100,
            stageName: "completed",
            stageMessage: "Bài học đã có sẵn trong hệ thống (Tải tức thì)",
            isIdempotentHit: true,
          }));

          const existingStory = await fetchStoryById(jobResponse.existingStoryId);
          setState((prev) => ({
            ...prev,
            resultStory: existingStory,
          }));
          return existingStory;
        }

        // 3. Slow Path: Job xếp hàng đợi, mở SSE stream
        if (!jobResponse.sseUrl) {
          throw new Error("Không nhận được đường dẫn luồng tiến độ (sseUrl) từ Agent Gateway");
        }

        setState({
          status: "queued",
          progress: 10,
          stageName: "init",
          stageMessage: "Đã xếp hàng đợi xử lý...",
          resultStory: null,
          error: null,
          isIdempotentHit: false,
        });

        return new Promise<IStorybook>((resolve, reject) => {
          cleanupRef.current = subscribeToStoryShadowingProgress(jobResponse.sseUrl!, {
            onProgress: (event: StoryShadowingProgressEvent) => {
              setState((prev) => ({
                ...prev,
                status: "streaming",
                progress: event.progress !== undefined ? event.progress : prev.progress,
                stageName: event.stepId || prev.stageName,
                stageMessage: event.message || prev.stageMessage,
              }));
            },
            onDone: (story: IStorybook) => {
              cleanup();
              setState({
                status: "completed",
                progress: 100,
                stageName: "completed",
                stageMessage: "Tạo bài luyện tập thành công!",
                resultStory: story,
                error: null,
                isIdempotentHit: false,
              });
              resolve(story);
            },
            onError: (err: Error) => {
              cleanup();
              const errorText = err.message || "Lỗi trong quá trình sinh bài học";
              setState((prev) => ({
                ...prev,
                status: "error",
                error: errorText,
              }));
              reject(err);
            },
          });
        });
      } catch (err: any) {
        cleanup();
        const msg = err.message || "Không thể khởi tạo tiến trình tạo bài học";
        setState((prev) => ({
          ...prev,
          status: "error",
          error: msg,
        }));
        throw err;
      }
    },
    [cleanup]
  );

  return {
    ...state,
    startJob,
    reset,
  };
}
```

- [ ] **Step 2: Run TypeScript check**

Run:
```bash
npx tsc --noEmit
```
Expected: Exit code 0 (no errors).

- [ ] **Step 3: Commit Task 4**

```bash
git add src/hooks/useStoryShadowingJob.ts
git commit -m "feat(story-shadowing): add useStoryShadowingJob hook with SSE & idempotency"
```

---

### Task 5: Build Real-time Progress Component `StoryShadowingProgress.tsx`

**Files:**
- Create: `src/components/story-shadowing/StoryShadowingProgress.tsx`

- [ ] **Step 1: Write `src/components/story-shadowing/StoryShadowingProgress.tsx`**

```tsx
"use client";

import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Loader2,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  Volume2,
  BookOpen,
  Split,
  FileCheck,
} from "lucide-react";
import { StoryJobStatus } from "@/hooks/useStoryShadowingJob";

interface StoryShadowingProgressProps {
  status: StoryJobStatus;
  progress: number;
  stageName: string;
  stageMessage: string;
  pipeline: "text" | "youtube";
  error: string | null;
  onRetry?: () => void;
  onCancel?: () => void;
}

interface StepItem {
  id: string;
  label: string;
  icon: React.ElementType;
}

const TEXT_STEPS: StepItem[] = [
  { id: "sentenceSplitter", label: "Tách câu & Phiên âm IPA", icon: Split },
  { id: "keywordIdentifier", label: "Phân tích Từ vựng CEFR", icon: BookOpen },
  { id: "ttsGenerator", label: "Tổng hợp Giọng đọc TTS", icon: Volume2 },
  { id: "keywordEnricher", label: "Làm giàu Ngữ nghĩa & Collocations", icon: Sparkles },
];

const YOUTUBE_STEPS: StepItem[] = [
  { id: "youtubeFetcher", label: "Tải Phụ đề mốc thời gian", icon: FileCheck },
  { id: "youtubeConsolidator", label: "Căn chỉnh Câu & IPA", icon: Split },
  { id: "keywordIdentifier", label: "Trích xuất Từ vựng khó", icon: BookOpen },
  { id: "keywordEnricher", label: "Làm giàu Ngữ cảnh chi tiết", icon: Sparkles },
];

export function StoryShadowingProgress({
  status,
  progress,
  stageName,
  stageMessage,
  pipeline,
  error,
  onRetry,
  onCancel,
}: StoryShadowingProgressProps) {
  if (status === "idle") return null;

  const steps = pipeline === "youtube" ? YOUTUBE_STEPS : TEXT_STEPS;

  const getStepStatus = (stepId: string) => {
    if (status === "completed") return "done";
    if (status === "error") return "error";

    const stepIndex = steps.findIndex((s) => s.id === stepId);
    const currentIndex = steps.findIndex((s) => s.id === stageName);

    if (currentIndex === -1) {
      return stepIndex === 0 ? "current" : "pending";
    }
    if (stepIndex < currentIndex) return "done";
    if (stepIndex === currentIndex) return "current";
    return "pending";
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="w-full max-w-md bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-2xl space-y-6"
      >
        {/* Header */}
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <span className="text-[10px] font-black tracking-wider uppercase px-2.5 py-0.5 rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
              Agent Pipeline • {pipeline.toUpperCase()}
            </span>
            <h3 className="text-base font-black text-slate-900 dark:text-white pt-1">
              Đang tạo bài tập Shadowing
            </h3>
          </div>

          <div className="text-right">
            <span className="text-2xl font-black text-amber-500 font-mono">
              {progress}%
            </span>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="space-y-2">
          <div className="w-full h-2.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
            <motion.div
              className={`h-full transition-all duration-300 ${
                status === "error"
                  ? "bg-rose-500"
                  : status === "completed"
                  ? "bg-emerald-500"
                  : "bg-gradient-to-r from-amber-500 to-orange-500"
              }`}
              initial={{ width: 0 }}
              animate={{ width: `${progress}%` }}
            />
          </div>

          <p className="text-xs text-slate-600 dark:text-slate-300 font-medium truncate flex items-center gap-1.5">
            {status !== "completed" && status !== "error" && (
              <Loader2 className="w-3.5 h-3.5 animate-spin text-amber-500 shrink-0" />
            )}
            {stageMessage || "Đang kết nối tới Agent Gateway..."}
          </p>
        </div>

        {/* Stepper Checklist */}
        <div className="space-y-2.5 py-1">
          {steps.map((step) => {
            const stepStatus = getStepStatus(step.id);
            const Icon = step.icon;

            return (
              <div
                key={step.id}
                className={`flex items-center justify-between p-3 rounded-xl border transition-all ${
                  stepStatus === "done"
                    ? "bg-emerald-50/60 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-900/40 text-emerald-800 dark:text-emerald-300"
                    : stepStatus === "current"
                    ? "bg-amber-50/70 dark:bg-amber-950/30 border-amber-300 dark:border-amber-700/60 text-slate-900 dark:text-white shadow-2xs"
                    : "bg-slate-50/60 dark:bg-slate-800/40 border-slate-100 dark:border-slate-800 text-slate-400 dark:text-slate-500"
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <div
                    className={`p-1.5 rounded-lg ${
                      stepStatus === "done"
                        ? "bg-emerald-500 text-white"
                        : stepStatus === "current"
                        ? "bg-amber-500 text-slate-950 font-bold"
                        : "bg-slate-200 dark:bg-slate-700 text-slate-400"
                    }`}
                  >
                    <Icon className="w-3.5 h-3.5" />
                  </div>
                  <span className="text-xs font-bold">{step.label}</span>
                </div>

                <div>
                  {stepStatus === "done" && (
                    <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                  )}
                  {stepStatus === "current" && (
                    <Loader2 className="w-4 h-4 text-amber-500 animate-spin" />
                  )}
                  {stepStatus === "pending" && (
                    <div className="w-2 h-2 rounded-full bg-slate-300 dark:bg-slate-700" />
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Error Alert */}
        {error && (
          <div className="p-3.5 rounded-xl bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900/60 text-rose-700 dark:text-rose-300 text-xs flex items-start gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <span className="font-bold">Lỗi khởi tạo bài học:</span>
              <p className="text-[11px] leading-relaxed opacity-90">{error}</p>
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="flex items-center justify-end gap-2 pt-2">
          {status === "error" && onRetry && (
            <button
              type="button"
              onClick={onRetry}
              className="px-4 py-2 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-xl text-xs font-bold hover:opacity-90 transition-opacity cursor-pointer"
            >
              Thử lại
            </button>
          )}

          {status !== "completed" && onCancel && (
            <button
              type="button"
              onClick={onCancel}
              className="px-3.5 py-2 text-xs font-bold text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 transition-colors cursor-pointer"
            >
              Hủy bỏ
            </button>
          )}
        </div>
      </motion.div>
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

- [ ] **Step 3: Commit Task 5**

```bash
git add src/components/story-shadowing/StoryShadowingProgress.tsx
git commit -m "feat(story-shadowing): add StoryShadowingProgress real-time stepper component"
```

---

### Task 6: Upgrade `create/page.tsx` with New Agent Client

**Files:**
- Modify: `src/app/apps/story-shadowing/create/page.tsx`

- [ ] **Step 1: Wire `useStoryShadowingJob` into `create/page.tsx`**

1. Import `useStoryShadowingJob` from `@/hooks/useStoryShadowingJob`.
2. Import `StoryShadowingProgress` from `@/components/story-shadowing/StoryShadowingProgress`.
3. Import `revalidateStoryShadowing` from `@/lib/actions/story-shadowing.actions`.
4. In `handleManualSubmit`:
   - Call `await startJob({ pipeline: "text", text, voice })`.
   - On completion: `await revalidateStoryShadowing()`, `router.push('/apps/story-shadowing/player/' + story._id)`.
5. In `handleYoutubeSubmit`:
   - If not split: Call `await startJob({ pipeline: "youtube", youtubeUrl, forceRegenerate: false })`.
   - On completion: `await revalidateStoryShadowing()`, `router.push('/apps/story-shadowing/player/' + story._id)`.
6. Render `<StoryShadowingProgress ... />` when job is active.

- [ ] **Step 2: Run TypeScript check**

Run:
```bash
npx tsc --noEmit
```
Expected: Exit code 0 (no errors).

- [ ] **Step 3: Commit Task 6**

```bash
git add src/app/apps/story-shadowing/create/page.tsx
git commit -m "feat(story-shadowing): integrate create page with aha-mind-agents client"
```

---

### Task 7: End-to-End Build & Validation

**Files:**
- Verification only

- [ ] **Step 1: Run production build**

Run:
```bash
npm run build
```
Expected:
1. Build succeeds with code 0.
2. No TypeScript or ESLint errors.
3. All static and dynamic routes compiled successfully.

---
*Made by Anh Tu - Share to be share*
