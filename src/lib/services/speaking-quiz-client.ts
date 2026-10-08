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
  const fullUrl = resolveAgentUrl(sseRelativeUrl);
  const eventSource = new EventSource(fullUrl);
  let isDone = false;

  eventSource.onmessage = async (event) => {
    try {
      const data: SpeakingQuizProgressEvent = JSON.parse(event.data);
      callbacks.onProgress?.(data);

      const isCompleted =
        data.type === "JOB_COMPLETED" ||
        data.status === "done" ||
        data.status === "completed" ||
        data.stepName === "completed" ||
        data.progress === 100;

      // Khi Job hoàn tất thành công từ Agent Gateway
      if (isCompleted && !isDone) {
        isDone = true;
        eventSource.close();

        try {
          const questionId =
            data.payload?.questionId ||
            (data as any).data?.id ||
            (data as any).data?.questionId ||
            (data as any).questionId;

          let detail: SpeakingQuestionDetail | null = null;
          if (questionId) {
            detail = await fetchSpeakingQuestionById(questionId);
          } else {
            // Trường hợp backend emit JOB_COMPLETED với data: null (đã lưu trực tiếp MongoDB)
            // Lấy câu hỏi mới nhất từ danh sách
            const list = await fetchSpeakingQuestionsList();
            if (list.questions && list.questions.length > 0) {
              detail = list.questions[0];
            }
          }

          if (detail) {
            callbacks.onProgress?.({
              ...data,
              progress: 100,
              stepName: "completed",
              message: "Speaking challenge generated successfully!",
            });
            callbacks.onDone(detail);
          } else {
            throw new Error("Unable to retrieve newly generated speaking question");
          }
        } catch (fetchErr) {
          callbacks.onError(
            fetchErr instanceof Error
              ? fetchErr
              : new Error("Failed to fetch generated question detail")
          );
        }
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

  eventSource.onerror = async (err) => {
    if (isDone) return;
    eventSource.close();

    // Kiểm tra xem thực tế Job đã lưu xong vào DB hay chưa trước khi báo lỗi rớt mạng
    try {
      const list = await fetchSpeakingQuestionsList();
      if (list.questions && list.questions.length > 0) {
        isDone = true;
        callbacks.onProgress?.({
          progress: 100,
          stepName: "completed",
          message: "Speaking challenge generated successfully!",
        });
        callbacks.onDone(list.questions[0]);
        return;
      }
    } catch {
      // Bỏ qua lỗi fallback
    }

    if (eventSource.readyState === EventSource.CLOSED) {
      console.error("[SSE Connection Error]:", err);
      callbacks.onError(new Error("Lost SSE connection to Agent Gateway"));
    }
  };

  return () => {
    eventSource.close();
  };
}
