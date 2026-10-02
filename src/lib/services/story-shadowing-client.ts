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
