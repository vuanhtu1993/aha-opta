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
  SpeakingQuizJobStatusResponse,
} from "@/lib/types/speaking-quiz";

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
    let errorMsg = `Create Job failed (${res.status})`;
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
    throw new Error(`Speaking question not found: [${id}]`);
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
    // Không lưu Data Cache để Server Component luôn nhận danh sách đề bài mới nhất từ backend
    cache: "no-store",
  });

  if (!res.ok) {
    throw new Error("Failed to fetch speaking questions list");
  }

  return res.json();
}

/**
 * 4. Tra cứu trạng thái của Job trực tiếp qua REST API
 * Chốt chặn an toàn (Failover Path) khi kết nối mạng SSE bị gián đoạn
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

/**
 * Callbacks khi subscribe luồng SSE
 */
export interface SubscribeProgressCallbacks {
  onProgress?: (event: SpeakingQuizProgressEvent) => void;
  onDone: (questionDetail: SpeakingQuestionDetail) => void;
  onError: (error: Error) => void;
}

/**
 * 5. Đăng ký lắng nghe tiến trình thời gian thực qua Server-Sent Events (SSE)
 * Tự động chuyển đổi sang Job Status Polling nếu mạng SSE bị ngắt kết nối giữa chừng.
 * Trả về hàm hủy kết nối (cleanup function)
 */
export function subscribeToSpeakingQuizProgress(
  sseRelativeUrl: string,
  jobId: string,
  callbacks: SubscribeProgressCallbacks
): () => void {
  const fullUrl = resolveAgentUrl(sseRelativeUrl);
  const eventSource = new EventSource(fullUrl);
  let isDone = false;
  let isPollingFallback = false;

  // Cơ chế Fallback an toàn tuyệt đối: Tra cứu trạng thái đúng theo jobId thay vì đoán mò
  const pollJobStatusRecovery = async () => {
    if (isDone || isPollingFallback) return;
    isPollingFallback = true;

    callbacks.onProgress?.({
      progress: 90,
      stepName: "prep_synthesized",
      message: "Syncing challenge status with Agent gateway...",
    });

    const maxAttempts = 15;
    for (let i = 0; i < maxAttempts; i++) {
      if (isDone) return;
      try {
        const job = await fetchSpeakingQuizJobStatus(jobId);
        if (job.status === "completed" && job.result?.questionId) {
          isDone = true;
          try {
            eventSource.close();
          } catch {}

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
          try {
            eventSource.close();
          } catch {}
          callbacks.onError(
            new Error(job.error || "Speaking quiz generation pipeline failed")
          );
          return;
        }
      } catch {
        // Tiếp tục thử lại nếu job đang được xử lý hoặc mạng có độ trễ
      }
      await new Promise((r) => setTimeout(r, 2000));
    }

    if (!isDone) {
      isDone = true;
      try {
        eventSource.close();
      } catch {}
      callbacks.onError(
        new Error("Timeout waiting for speaking challenge generation")
      );
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

      const questionId =
        data.payload?.questionId || (data as any).result?.questionId;

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
        // Nếu nhận completed nhưng chưa kịp có questionId trong event, poll đúng jobId
        pollJobStatusRecovery();
      } else if (data.status === "failed" || data.type === "JOB_FAILED") {
        isDone = true;
        eventSource.close();
        callbacks.onError(
          new Error(data.message || "Speaking Quiz generation pipeline failed")
        );
      }
    } catch (parseErr) {
      console.error("[SSE Parser Error]:", parseErr);
    }
  };

  eventSource.onerror = (err) => {
    if (isDone || isPollingFallback) return;
    console.warn(
      "[SSE Connection Notice]: Connection interrupted, switching to Job Status Polling...",
      err
    );
    pollJobStatusRecovery();
  };

  return () => {
    isDone = true;
    try {
      eventSource.close();
    } catch {}
  };
}
