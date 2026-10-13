# Speaking Quiz Agent Contract Sync & Dual-Project Integration Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Đồng bộ hóa toàn diện API Contract giữa `aha-mind-agents` (Backend NestJS) và `aha-tools` (Frontend Next.js) cho module Speaking Quiz; khắc phục triệt để lỗi unawaited microtask tại BullMQ Worker, chuẩn hóa payload sự kiện SSE, bổ sung REST endpoint tra cứu trạng thái Job (`GET /jobs/:jobId`), và tinh gọn mã nguồn Frontend bằng cách loại bỏ toàn bộ các hàm heuristic/đoán mò.

**Architecture:** Áp dụng nguyên tắc **Contract-First & Separation of Concerns**. Backend là Single Source of Truth chịu trách nhiệm quản lý vòng đời Job và định danh `questionId`. Hệ thống truyền thông kết hợp mô hình Hybrid: **SSE Streaming** cho trải nghiệm thời gian thực (Fast Path) và **Job Status Polling** (`GET /jobs/:jobId`) làm chốt chặn an toàn khi mạng đứt (Failover Path), loại bỏ hoàn toàn việc Frontend phải quét CSDL MongoDB tự do.

**Tech Stack:** NestJS 10, BullMQ, Redis Pub/Sub, RxJS, LangGraph, MongoDB/Mongoose (`aha-mind-agents`) ⟷ Next.js 16 (App Router), React 19, TypeScript, EventSource (`aha-tools`).

---

## 1. Bản đồ Tệp tin Cần Tác động (File Impact Map)

### Repo 1: `aha-mind-agents` (`/Users/anhtus/Documents/Development/NestJS/aha-mind-agents`)
- **Modify:** `src/plugins/speaking-quiz/speaking-quiz.worker.ts`
  *Trách nhiệm:* Xử lý đồng bộ hóa `finalResult` từ RxJS stream, đảm bảo `JOB_COMPLETED` luôn mang đầy đủ payload `{ questionId, topic, ... }` và lưu vào `job.returnvalue`.
- **Modify:** `src/plugins/speaking-quiz/speaking-quiz.controller.ts`
  *Trách nhiệm:* Bổ sung endpoint `GET /api/agents/speaking-quiz/jobs/:jobId`, tạo độ trễ đệm 100ms trước khi `res.end()` trong stream SSE để đảm bảo client nhận trọn vẹn chunk cuối.
- **Modify:** `src/plugins/speaking-quiz/speaking-quiz.service.ts`
  *Trách nhiệm:* Cung cấp hàm `getJobStatus(jobId: string)` trích xuất trạng thái BullMQ chuẩn hóa.

### Repo 2: `aha-tools` (`/Users/anhtus/Documents/Development/NextJS/aha-tools`)
- **Modify:** `src/lib/types/speaking-quiz.ts`
  *Trách nhiệm:* Khai báo type interface `SpeakingQuizJobStatusResponse`.
- **Modify:** `src/lib/services/speaking-quiz-client.ts`
  *Trách nhiệm:* Bổ sung hàm `fetchSpeakingQuizJobStatus(jobId)`, tinh gọn `subscribeToSpeakingQuizProgress` (xóa bỏ `isQuestionMatchingJob`, `extractQuestionId`, `findMatchingQuestionWithRetry`), chuyển fallback `onerror` sang gọi trực tiếp `fetchSpeakingQuizJobStatus(jobId)`.
- **Modify:** `src/hooks/useSpeakingQuizJob.ts`
  *Trách nhiệm:* Đồng bộ gọi `subscribeToSpeakingQuizProgress` với `jobId` thay vì truyền validation context phức tạp.

---

## 2. Các Bước Thực thi Chi tiết (Step-by-Step Tasks)

### Task 1: [Backend - aha-mind-agents] Bổ sung Endpoint Tra cứu Trạng thái Job `GET /jobs/:jobId`

**Files:**
- Modify: `/Users/anhtus/Documents/Development/NestJS/aha-mind-agents/src/plugins/speaking-quiz/speaking-quiz.service.ts`
- Modify: `/Users/anhtus/Documents/Development/NestJS/aha-mind-agents/src/plugins/speaking-quiz/speaking-quiz.controller.ts`

- [ ] **Step 1: Viết hàm `getJobStatus` trong `speaking-quiz.service.ts`**
Thêm phương thức trích xuất dữ liệu Job từ BullMQ Queue:
```typescript
  public async getJobStatus(jobId: string) {
    const job = await this.queue.getJob(jobId);
    if (!job) {
      throw new NotFoundException(`Không tìm thấy Job với ID: ${jobId}`);
    }

    const state = await job.getState();
    const progress = typeof job.progress === 'number' ? job.progress : 0;
    const returnvalue = job.returnvalue || null;
    const failedReason = job.failedReason || null;

    return {
      jobId,
      status: state, // 'completed' | 'active' | 'waiting' | 'failed' | 'delayed'
      progress,
      result: returnvalue,
      error: failedReason,
      createdAt: job.timestamp ? new Date(job.timestamp).toISOString() : new Date().toISOString(),
    };
  }
```

- [ ] **Step 2: Thêm endpoint `GET /jobs/:jobId` trong `speaking-quiz.controller.ts`**
Đặt ngay trước endpoint `streamProgress`:
```typescript
  @Get('jobs/:jobId')
  @ApiOperation({ summary: 'Lấy trạng thái chi tiết của Job sinh đề bài Speaking Quiz' })
  @ApiParam({ name: 'jobId', description: 'Mã định danh của Job trong hàng đợi BullMQ' })
  async getJobStatus(@Param('jobId') jobId: string) {
    return this.speakingQuizService.getJobStatus(jobId);
  }
```

- [ ] **Step 3: Kiểm thử endpoint bằng curl**
Khởi động service và gọi:
```bash
curl -i http://localhost:3001/api/agents/speaking-quiz/jobs/48
```
Kỳ vọng: Trả về HTTP 200 `{ "jobId": "48", "status": "completed", ... }` hoặc 404 có format chuẩn thay vì 404 unhandled route.

---

### Task 2: [Backend - aha-mind-agents] Khắc phục Lỗi Microtask Unawaited tại Worker & SSE Flush

**Files:**
- Modify: `/Users/anhtus/Documents/Development/NestJS/aha-mind-agents/src/plugins/speaking-quiz/speaking-quiz.worker.ts`
- Modify: `/Users/anhtus/Documents/Development/NestJS/aha-mind-agents/src/plugins/speaking-quiz/speaking-quiz.controller.ts`

- [ ] **Step 1: Sửa luồng bắt `finalResult` trong `speaking-quiz.worker.ts`**
Đảm bảo khi `event.status === 'done'`, `finalResult` được gán đồng bộ tức thì, và sự kiện `JOB_COMPLETED` gửi đi đầy đủ data:
```typescript
      let finalResult: any = null;

      await new Promise<void>((resolve, reject) => {
        stream$.subscribe({
          next: (event) => {
            // Gán đồng bộ ngay lập tức trong microtick hiện tại
            if (event.status === 'done' && event.payload) {
              finalResult = event.payload;
            } else if (event.payload?.questionId && !finalResult) {
              finalResult = event.payload;
            }

            if (event.progress !== undefined) {
              job.updateProgress(event.progress).catch(() => {});
            }

            // Broadcast tiến trình qua Redis Pub/Sub
            this.redisPubSub.publishEvent({
              type: event.status === 'done' ? 'JOB_COMPLETED' : 'JOB_STEP',
              jobId,
              pluginId: 'speaking-quiz',
              timestamp: Date.now(),
              data: event,
            }).catch((err) => {
              this.logger.error(`Redis publish error: ${err.message}`);
            });
          },
          error: (err) => reject(err),
          complete: () => resolve(),
        });
      });

      // Phát sự kiện tổng kết cuối cùng kèm finalResult đầy đủ
      await this.redisPubSub.publishEvent({
        type: 'JOB_COMPLETED',
        jobId,
        pluginId: 'speaking-quiz',
        pipeline: 'generate',
        timestamp: Date.now(),
        data: {
          jobId,
          status: 'done',
          progress: 100,
          message: 'Speaking quiz generation completed',
          payload: finalResult,
        },
      });

      this.logger.log(`✅ Hoàn thành Job [${jobId}] thành công. ID: ${finalResult?.questionId}`);
      return finalResult;
```

- [ ] **Step 2: Thêm thời gian trễ đệm 100ms trước khi `res.end()` trong `speaking-quiz.controller.ts`**
Giúp mạng HTTP/2 và Vercel reverse proxy kịp xả toàn bộ buffer dữ liệu của chunk cuối tới client:
```typescript
    const subscription = this.redisPubSub.events$.subscribe((event) => {
      if (event.jobId === jobId) {
        const payloadToSend = event.data || event;
        res.write(`data: ${JSON.stringify(payloadToSend)}\n\n`);

        if (event.type === 'JOB_COMPLETED' || event.type === 'JOB_FAILED') {
          setTimeout(() => {
            subscription.unsubscribe();
            try {
              res.end();
            } catch {}
          }, 100);
        }
      }
    });
```

---

### Task 3: [Frontend - aha-tools] Khai báo Types & Service Tra cứu Job theo ID

**Files:**
- Modify: `/Users/anhtus/Documents/Development/NextJS/aha-tools/src/lib/types/speaking-quiz.ts`
- Modify: `/Users/anhtus/Documents/Development/NextJS/aha-tools/src/lib/services/speaking-quiz-client.ts`

- [ ] **Step 1: Khai báo `SpeakingQuizJobStatusResponse` trong `src/lib/types/speaking-quiz.ts`**
```typescript
export interface SpeakingQuizJobStatusResponse {
  jobId: string;
  status: "waiting" | "active" | "completed" | "failed" | "delayed" | "queued";
  progress: number;
  result?: {
    questionId: string;
    topic?: string;
    question?: string;
    level?: CefrLevel;
    tokenUsage?: any;
  } | null;
  error?: string | null;
  createdAt: string;
}
```

- [ ] **Step 2: Thêm hàm `fetchSpeakingQuizJobStatus` trong `src/lib/services/speaking-quiz-client.ts`**
```typescript
/**
 * Tra cứu trạng thái của Job trực tiếp qua REST API (Dùng khi SSE bị ngắt kết nối)
 */
export async function fetchSpeakingQuizJobStatus(
  jobId: string
): Promise<SpeakingQuizJobStatusResponse> {
  const baseUrl = getAgentsApiBaseUrl();
  const res = await fetch(`${baseUrl}/agents/speaking-quiz/jobs/${jobId}`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
    },
    cache: "no-store",
  });

  if (!res.ok) {
    throw new Error(`Failed to query job status: [${jobId}] (${res.status})`);
  }

  return res.json();
}
```

---

### Task 4: [Frontend - aha-tools] Tinh gọn Toàn diện `speaking-quiz-client.ts` (Xóa bỏ Code Heuristic)

**Files:**
- Modify: `/Users/anhtus/Documents/Development/NextJS/aha-tools/src/lib/services/speaking-quiz-client.ts`
- Modify: `/Users/anhtus/Documents/Development/NextJS/aha-tools/src/hooks/useSpeakingQuizJob.ts`

- [ ] **Step 1: Dọn dẹp các hàm suy đoán phức tạp trong `speaking-quiz-client.ts`**
Xóa bỏ:
- `isQuestionMatchingJob`
- `findMatchingQuestionWithRetry`
- `JobValidationContext`
- `extractQuestionId`

- [ ] **Step 2: Cập nhật hàm `subscribeToSpeakingQuizProgress` chuẩn mực**
Cơ chế: Lấy `questionId` từ `payload.questionId`. Nếu SSE gặp sự cố (`onerror`), chuyển sang polling chính xác vào `fetchSpeakingQuizJobStatus(jobId)`:
```typescript
export function subscribeToSpeakingQuizProgress(
  sseRelativeUrl: string,
  jobId: string,
  callbacks: SubscribeProgressCallbacks
): () => void {
  const fullUrl = resolveAgentUrl(sseRelativeUrl);
  const eventSource = new EventSource(fullUrl);
  let isDone = false;
  let isPollingFallback = false;

  // Cơ chế Fallback an toàn tuyệt đối: Tra cứu trạng thái đúng theo jobId
  const pollJobStatusRecovery = async () => {
    if (isDone || isPollingFallback) return;
    isPollingFallback = true;

    const maxAttempts = 15;
    for (let i = 0; i < maxAttempts; i++) {
      if (isDone) return;
      try {
        const job = await fetchSpeakingQuizJobStatus(jobId);
        if (job.status === "completed" && job.result?.questionId) {
          isDone = true;
          eventSource.close();
          const detail = await fetchSpeakingQuestionById(job.result.questionId);
          callbacks.onProgress?.({
            progress: 100,
            stepName: "completed",
            message: "Speaking challenge generated successfully!",
          });
          callbacks.onDone(detail);
          return;
        } else if (job.status === "failed") {
          isDone = true;
          eventSource.close();
          callbacks.onError(new Error(job.error || "Job processing failed"));
          return;
        }
      } catch (err) {
        // Tiếp tục thử lại nếu job chưa xử lý xong
      }
      await new Promise((r) => setTimeout(r, 2000));
    }

    if (!isDone) {
      isDone = true;
      eventSource.close();
      callbacks.onError(new Error("Timeout waiting for speaking challenge generation"));
    }
  };

  eventSource.onmessage = async (event) => {
    try {
      const data: SpeakingQuizProgressEvent = JSON.parse(event.data);
      callbacks.onProgress?.(data);

      const isCompleted =
        data.status === "done" ||
        data.type === "JOB_COMPLETED" ||
        data.stepName === "completed" ||
        data.progress === 100;

      const questionId = data.payload?.questionId || (data as any).result?.questionId;

      if (isCompleted && questionId && !isDone) {
        isDone = true;
        eventSource.close();

        try {
          const detail = await fetchSpeakingQuestionById(questionId);
          callbacks.onProgress?.({
            ...data,
            progress: 100,
            stepName: "completed",
            message: "Speaking challenge generated successfully!",
          });
          callbacks.onDone(detail);
        } catch (fetchErr) {
          callbacks.onError(
            fetchErr instanceof Error
              ? fetchErr
              : new Error("Failed to fetch generated question detail")
          );
        }
      } else if (isCompleted && !questionId && !isDone) {
        // Trường hợp hi hữu nhận completed nhưng chưa kịp có ID, tra cứu theo jobId
        pollJobStatusRecovery();
      } else if (data.status === "failed" || data.type === "JOB_FAILED") {
        isDone = true;
        eventSource.close();
        callbacks.onError(new Error(data.message || "Speaking Quiz generation pipeline failed"));
      }
    } catch (parseErr) {
      console.error("[SSE Parser Error]:", parseErr);
    }
  };

  eventSource.onerror = () => {
    if (isDone || isPollingFallback) return;
    console.warn("[SSE Connection Notice]: Connection interrupted, switching to Job Status Polling...");
    pollJobStatusRecovery();
  };

  return () => {
    isDone = true;
    try {
      eventSource.close();
    } catch {}
  };
}
```

- [ ] **Step 3: Cập nhật `src/hooks/useSpeakingQuizJob.ts`**
Đơn giản hóa lời gọi hàm:
```typescript
cleanupRef.current = subscribeToSpeakingQuizProgress(
  response.sseUrl!,
  response.jobId,
  {
    onProgress: (event) => { ... },
    onDone: (question) => { ... },
    onError: (err) => { ... },
  }
);
```

---

### Task 5: [Integration Verification] Kiểm thử Tích hợp Cả 2 Dự án

**Files:**
- Test end-to-end flow từ UI tới Agent Backend

- [ ] **Step 1: Chạy kiểm tra tĩnh toàn bộ TypeScript**
```bash
# Tại aha-tools:
pnpm exec tsc --noEmit
```
Kỳ vọng: Không có bất kỳ lỗi linter hoặc type mismatch nào.

- [ ] **Step 2: Thực hiện kiểm thử tạo đề bài thực tế trên giao diện**
1. Mở trang `/vocab/speak-your-mind/create`.
2. Tạo bài nói với Custom Topic mới: `"Thử thách tư duy phản biện trong kỷ nguyên tự động hóa"`.
3. Kiểm tra Developer Tools Network Tab:
   - Request `POST /api/agents/speaking-quiz/jobs` trả về `jobId`.
   - Kết nối SSE nhận đủ các events: `context_resolved (25%)` -> `question_formulated (50%)` -> `prep_synthesized (80%)` -> `completed (100%)`.
   - Chunk cuối cùng chứa đầy đủ `{ payload: { questionId: "..." } }`.
   - Trình duyệt điều hướng chính xác 100% đến ID mới vừa sinh ra.
4. Thử ngắt kết nối mạng giả lập 3 giây trong lúc đang sinh bài để kiểm tra cơ chế `pollJobStatusRecovery`:
   - Xác nhận client tự động chuyển sang tra cứu `GET /jobs/:jobId` và vẫn điều hướng đúng về bài học mới sau khi kết nối phục hồi.

---
*Made by Anh Tu - Share to be share*
