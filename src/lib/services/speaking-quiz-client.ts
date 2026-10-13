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
  TargetKeywordItem,
  FrameworkType,
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

/**
 * Helper: Trích xuất nhãn và màu sắc hiển thị cho từ vựng FSRS
 */
export function getSrsBadgeConfig(keyword: TargetKeywordItem): {
  label: string;
  badgeClass: string;
  tooltip: string;
} {
  if (keyword.isInjected || keyword.srsStatus === "due") {
    return {
      label: "Cần Ôn Tập",
      badgeClass: "bg-rose-500/10 text-rose-700 dark:text-rose-400 border-rose-300/40 dark:border-rose-800",
      tooltip: "Từ vựng đến hạn ôn tập FSRS — Đã được lồng ghép vào câu hỏi này để bạn luyện phản xạ nói!",
    };
  }
  if (keyword.srsStatus === "learning") {
    return {
      label: "Đang Học",
      badgeClass: "bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-300/40 dark:border-amber-800",
      tooltip: "Từ vựng đang trong chu kỳ củng cố trí nhớ",
    };
  }
  if (keyword.srsStatus === "mastered") {
    return {
      label: "Thành Thạo",
      badgeClass: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-300/40 dark:border-emerald-800",
      tooltip: "Từ vựng đã ghi nhớ vững chắc",
    };
  }
  return {
    label: "Từ Khóa",
    badgeClass: "bg-sky-500/10 text-sky-700 dark:text-sky-400 border-sky-300/40 dark:border-sky-800",
    tooltip: "Từ vựng trọng tâm trong bài học",
  };
}

export interface FrameworkConfig {
  type: FrameworkType;
  shortName: string;
  fullName: string;
  description: string;
  badgeClass: string;
}

/**
 * Helper: Cấu hình hiển thị theo FrameworkType (PREP, PAR, STAR, CCR)
 */
export function getFrameworkConfig(type?: FrameworkType): FrameworkConfig {
  switch (type) {
    case "PAR":
      return {
        type: "PAR",
        shortName: "PAR",
        fullName: "PAR (Problem - Advice - Result)",
        description: "Khung giải pháp tối ưu cho câu hỏi đề xuất lời khuyên và hành động thực tiễn",
        badgeClass: "bg-rose-500/10 text-rose-700 dark:text-rose-400 border-rose-300/40 dark:border-rose-800",
      };
    case "STAR":
      return {
        type: "STAR",
        shortName: "STAR",
        fullName: "STAR (Situation - Task - Action - Result)",
        description: "Khung chia sẻ kinh nghiệm, kể chuyện tình huống quá khứ",
        badgeClass: "bg-indigo-500/10 text-indigo-700 dark:text-indigo-400 border-indigo-300/40 dark:border-indigo-800",
      };
    case "CCR":
      return {
        type: "CCR",
        shortName: "CCR",
        fullName: "CCR (Claim - Concession - Resolution)",
        description: "Khung cân nhắc đa chiều, thảo luận thỏa hiệp và ngoại giao",
        badgeClass: "bg-cyan-500/10 text-cyan-700 dark:text-cyan-400 border-cyan-300/40 dark:border-cyan-800",
      };
    case "PREP":
    default:
      return {
        type: "PREP",
        shortName: "PREP",
        fullName: "PREP (Point - Reason - Example - Conclusion)",
        description: "Khung quan điểm, tranh biện logic chặt chẽ",
        badgeClass: "bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-300/40 dark:border-amber-800",
      };
  }
}
