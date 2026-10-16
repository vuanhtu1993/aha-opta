/**
 * @file fun-feed-client.ts
 * @description Client SDK kết nối với Fun Feed API trên Gateway aha-mind-agents
 * Hỗ trợ truy vấn Cursor Pagination và ghi nhận tương tác người dùng
 * 
 * Mapped Spec: requirements/modules/fun-feed/fun-feed-api-contract.md
 * Made by Anh Tu - Share to be share
 */

import {
  FunFeedQuery,
  FunFeedResponse,
  FunFeedInteractPayload,
  FunFeedInteractionResponse,
} from '@/lib/types/fun-feed';

/**
 * Lấy Base URL của Gateway Agents
 * Mặc định ưu tiên biến môi trường NEXT_PUBLIC_AGENTS_API_URL
 */
export function getFunFeedApiBaseUrl(): string {
  const envUrl = process.env.NEXT_PUBLIC_AGENTS_API_URL;
  if (envUrl && envUrl.trim()) {
    return envUrl.trim().replace(/\/+$/, "");
  }
  return "http://localhost:3001/api";
}

export class FunFeedClient {
  private baseUrl: string;

  constructor(baseUrl?: string) {
    this.baseUrl = baseUrl || getFunFeedApiBaseUrl();
  }

  /**
   * Lấy danh sách feed phân trang theo Cursor
   * @param query Bộ lọc topic, level, cursor, limit
   */
  async getFeed(query: FunFeedQuery = {}): Promise<FunFeedResponse> {
    const params = new URLSearchParams();
    if (query.limit) params.set('limit', query.limit.toString());
    if (query.topic) params.set('topic', query.topic);
    if (query.level) params.set('level', query.level);
    if (query.cursor) params.set('cursor', query.cursor);

    const queryString = params.toString() ? `?${params.toString()}` : '';
    const res = await fetch(`${this.baseUrl}/funny-feed${queryString}`, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
      },
      cache: 'no-store',
    });

    if (!res.ok) {
      let errorMessage = `Failed to fetch fun feed: ${res.statusText}`;
      try {
        const errorJson = await res.json();
        if (errorJson.message) {
          errorMessage = Array.isArray(errorJson.message)
            ? errorJson.message.join(', ')
            : errorJson.message;
        }
      } catch {
        // Fallback to default message
      }
      throw new Error(errorMessage);
    }

    return res.json();
  }

  /**
   * Gửi tương tác người dùng (Like / Save / Skip / Report)
   * @param contentId ID của nội dung media
   * @param payload Hành động tương tác và lý do báo cáo nếu có
   * @param userId ID người dùng tùy chọn (cho thành viên đăng nhập)
   */
  async interact(
    contentId: string,
    payload: FunFeedInteractPayload,
    userId?: string
  ): Promise<FunFeedInteractionResponse> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    };
    if (userId) {
      headers['x-user-id'] = userId;
    }

    const res = await fetch(`${this.baseUrl}/funny-feed/${contentId}/interact`, {
      method: 'POST',
      headers,
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      let errorMessage = `Failed to send interaction: ${res.statusText}`;
      try {
        const errorJson = await res.json();
        if (errorJson.message) {
          errorMessage = Array.isArray(errorJson.message)
            ? errorJson.message.join(', ')
            : errorJson.message;
        }
      } catch {
        // Fallback to default message
      }
      throw new Error(errorMessage);
    }

    return res.json();
  }
}

export const funFeedClient = new FunFeedClient();
