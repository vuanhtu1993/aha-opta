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
      // Bỏ qua lỗi parse JSON nếu response rỗng
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
