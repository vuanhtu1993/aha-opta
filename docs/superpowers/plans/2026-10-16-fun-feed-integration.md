# Fun Feed Integration Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Tích hợp module Fun Feed (Funny English Memes & Reels) từ `aha-mind-agents` vào Next.js PWA `aha-tools`, cung cấp trải nghiệm lướt dọc TikTok-style 100vh với Media Streaming không tốn băng thông máy chủ (CDN offload qua GIPHY & YouTube), bộ lọc Topic/Level, Glassmorphism Learning Overlay, và hệ thống tương tác Like/Save/Report phản hồi tức thì (Optimistic UI).

**Architecture:** 
1. **Data & SDK Layer (`src/lib/types/fun-feed.ts` & `src/lib/services/fun-feed-client.ts`):** Xây dựng TypeScript interfaces chuẩn hóa và Client SDK kết nối REST API Gateway (`GET /api/funny-feed`, `POST /api/funny-feed/:id/interact`) với Cursor Pagination.
2. **State & Analytics Hook (`src/hooks/useFunFeed.ts`):** Hook quản lý tải danh sách, lọc chủ đề/trình độ, IntersectionObserver kích hoạt Infinite Scroll, và Optimistic UI khi thả tim, lưu bài, báo cáo hoặc lướt qua (skip analytics).
3. **Component & View Layer (`src/components/fun-feed/` & `src/app/apps/fun-feed/page.tsx`):** Container CSS Scroll Snap dọc 100vh với `FunFeedCard` (tự động phân loại GIF qua thẻ `<img>` CDN hoặc YouTube Shorts qua `<iframe>`), Glassmorphism Learning Overlay hiển thị `whyFunny` + `youLearned`, Report Dialog Modal, và tích hợp thanh công cụ vào Dashboard `aha-tools`.

**Tech Stack:** Next.js 16 (App Router), React 19, TypeScript 5, Tailwind CSS 4, Framer Motion, Lucide React, GIPHY Global CDN, YouTube Embed API.

---

### Task 1: Record Architectural Decision in OpenLore

**Files:**
- Command: `npx openlore decisions record`

- [ ] **Step 1: Record decision via OpenLore CLI**

Run:
```bash
npx openlore decisions record \
  --title "Decoupled Edutainment Fun Feed Integration with CDN Offload" \
  --rationale "Integrating Fun Feed into aha-tools via Cursor Pagination and direct CDN offloading to GIPHY and YouTube guarantees instant 60 FPS playback with zero origin media bandwidth and robust pagination consistency" \
  --consequences "aha-tools acts as a pure presentation layer receiving lightweight JSON metadata; media loading depends on client-side third-party CDN availability; interactions use optimistic UI updates" \
  --files "src/lib/types/fun-feed.ts,src/lib/services/fun-feed-client.ts,src/hooks/useFunFeed.ts,src/components/fun-feed/FunFeedCard.tsx,src/app/apps/fun-feed/page.tsx"
```
Expected output: Architectural decision recorded with a draft ID.

- [ ] **Step 2: Verify OpenLore decisions list**

Run:
```bash
npx openlore decisions --list
```
Expected output: The newly created decision draft appears in the OpenLore decision store.

---

### Task 2: Define Fun Feed TypeScript Data Contracts & Interfaces

**Files:**
- Create: `src/lib/types/fun-feed.ts`

- [ ] **Step 1: Create `src/lib/types/fun-feed.ts`**

```typescript
/**
 * @file fun-feed.ts
 * @description Định nghĩa Type & Interface chuẩn cho module Fun Feed (Funny English Memes & Reels)
 * 
 * Target Application: aha-tools (Next.js Frontend PWA)
 * Synchronized with: aha-mind-agents (NestJS Ingestion & AI Gateway)
 * Mapped Spec: requirements/modules/fun-feed/fun-feed-api-contract.md
 * 
 * Made by Anh Tu - Share to be share
 */

export type FunFeedTopic = 
  | 'grammar' 
  | 'vocabulary' 
  | 'pronunciation' 
  | 'idiom' 
  | 'conversation';

export type FunFeedLevel = 
  | 'beginner' 
  | 'intermediate' 
  | 'advanced';

export type FunFeedMediaType = 
  | 'gif' 
  | 'image' 
  | 'video' 
  | 'short_video';

export type FunFeedAction = 
  | 'view' 
  | 'like' 
  | 'skip' 
  | 'save' 
  | 'report';

export interface FunFeedItemStats {
  views: number;
  likes: number;
  saves: number;
  reports: number;
}

export interface FunFeedItem {
  _id: string;
  source: 'giphy' | 'youtube' | 'generated';
  sourceId: string;
  sourceUrl: string;
  type: FunFeedMediaType;
  title: string;
  mediaUrl: string;
  thumbnailUrl?: string;
  attribution?: string;
  topic?: FunFeedTopic;
  level?: FunFeedLevel;
  whyFunny?: string;
  youLearned?: string;
  explanation?: string;
  learningScore?: number;
  stats: FunFeedItemStats;
  status: 'published' | 'hidden';
  publishedAt: string;
}

export interface FunFeedResponse {
  items: FunFeedItem[];
  nextCursor: string | null;
  hasMore: boolean;
}

export interface FunFeedQuery {
  topic?: FunFeedTopic;
  level?: FunFeedLevel;
  cursor?: string;
  limit?: number;
}

export interface FunFeedInteractPayload {
  action: FunFeedAction;
  reportReason?: string;
}

export interface FunFeedInteractionResponse {
  success: boolean;
}
```

- [ ] **Step 2: Verify TypeScript Compilation for Types**

Run:
```bash
npx tsc --noEmit
```
Expected output: No errors in `src/lib/types/fun-feed.ts`.

---

### Task 3: Implement Fun Feed Client SDK

**Files:**
- Create: `src/lib/services/fun-feed-client.ts`

- [ ] **Step 1: Write `src/lib/services/fun-feed-client.ts`**

```typescript
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
```

- [ ] **Step 2: Verify TypeScript Compilation for SDK**

Run:
```bash
npx tsc --noEmit
```
Expected output: No compilation errors in `src/lib/services/fun-feed-client.ts`.

---

### Task 4: Build Custom React Hook `useFunFeed`

**Files:**
- Create: `src/hooks/useFunFeed.ts`

- [ ] **Step 1: Write `src/hooks/useFunFeed.ts`**

```typescript
/**
 * @file useFunFeed.ts
 * @description Hook quản lý trạng thái nạp dữ liệu phân trang Cursor, lọc chủ đề/trình độ,
 * và Optimistic UI cho tương tác (Like, Save, Report, Skip)
 * 
 * Made by Anh Tu - Share to be share
 */

"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import {
  FunFeedItem,
  FunFeedTopic,
  FunFeedLevel,
  FunFeedAction,
} from "@/lib/types/fun-feed";
import { funFeedClient } from "@/lib/services/fun-feed-client";

export interface UseFunFeedOptions {
  initialTopic?: FunFeedTopic;
  initialLevel?: FunFeedLevel;
  pageSize?: number;
}

export function useFunFeed(options: UseFunFeedOptions = {}) {
  const { initialTopic, initialLevel, pageSize = 10 } = options;

  const [items, setItems] = useState<FunFeedItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [loadingMore, setLoadingMore] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState<boolean>(true);
  const [nextCursor, setNextCursor] = useState<string | null>(null);

  // Active filters
  const [selectedTopic, setSelectedTopic] = useState<FunFeedTopic | undefined>(initialTopic);
  const [selectedLevel, setSelectedLevel] = useState<FunFeedLevel | undefined>(initialLevel);

  // User local interaction states (Set of IDs)
  const [likedIds, setLikedIds] = useState<Set<string>>(new Set());
  const [savedIds, setSavedIds] = useState<Set<string>>(new Set());

  // Prevent multiple simultaneous loadMore requests
  const isFetchingRef = useRef<boolean>(false);

  /**
   * Tải lại danh sách ban đầu (reset trang)
   */
  const loadInitialFeed = useCallback(async (
    topicFilter?: FunFeedTopic,
    levelFilter?: FunFeedLevel
  ) => {
    setLoading(true);
    setError(null);
    try {
      const res = await funFeedClient.getFeed({
        limit: pageSize,
        topic: topicFilter,
        level: levelFilter,
      });

      setItems(res.items || []);
      setNextCursor(res.nextCursor);
      setHasMore(res.hasMore);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Không thể tải danh sách nội dung");
    } finally {
      setLoading(false);
    }
  }, [pageSize]);

  // Load feed on mount and when filter criteria change
  useEffect(() => {
    loadInitialFeed(selectedTopic, selectedLevel);
  }, [selectedTopic, selectedLevel, loadInitialFeed]);

  /**
   * Tải thêm bài viết tiếp theo khi người dùng vuốt đến cuối (Infinite Scroll)
   */
  const loadMore = useCallback(async () => {
    if (!hasMore || !nextCursor || loadingMore || isFetchingRef.current) {
      return;
    }

    isFetchingRef.current = true;
    setLoadingMore(true);

    try {
      const res = await funFeedClient.getFeed({
        limit: pageSize,
        cursor: nextCursor,
        topic: selectedTopic,
        level: selectedLevel,
      });

      setItems((prevItems) => {
        // Tránh trùng lặp items qua _id
        const existingIds = new Set(prevItems.map((item) => item._id));
        const newUniqueItems = res.items.filter((item) => !existingIds.has(item._id));
        return [...prevItems, ...newUniqueItems];
      });

      setNextCursor(res.nextCursor);
      setHasMore(res.hasMore);
    } catch (err) {
      console.error("[useFunFeed] Failed to load more items:", err);
    } finally {
      setLoadingMore(false);
      isFetchingRef.current = false;
    }
  }, [hasMore, nextCursor, loadingMore, pageSize, selectedTopic, selectedLevel]);

  /**
   * Thay đổi bộ lọc chủ đề
   */
  const setTopicFilter = useCallback((topic?: FunFeedTopic) => {
    setSelectedTopic((prev) => (prev === topic ? undefined : topic));
  }, []);

  /**
   * Thay đổi bộ lọc trình độ
   */
  const setLevelFilter = useCallback((level?: FunFeedLevel) => {
    setSelectedLevel((prev) => (prev === level ? undefined : level));
  }, []);

  /**
   * Xử lý hành động Like với Optimistic UI
   */
  const handleLike = useCallback(async (contentId: string) => {
    const isCurrentlyLiked = likedIds.has(contentId);

    // Optimistic update
    setLikedIds((prev) => {
      const next = new Set(prev);
      if (isCurrentlyLiked) {
        next.delete(contentId);
      } else {
        next.add(contentId);
      }
      return next;
    });

    setItems((prev) =>
      prev.map((item) => {
        if (item._id === contentId) {
          const delta = isCurrentlyLiked ? -1 : 1;
          return {
            ...item,
            stats: {
              ...item.stats,
              likes: Math.max(0, item.stats.likes + delta),
            },
          };
        }
        return item;
      })
    );

    try {
      await funFeedClient.interact(contentId, { action: "like" });
    } catch (err) {
      // Rollback on network failure
      console.error("[useFunFeed] Like failed, rolling back:", err);
      setLikedIds((prev) => {
        const next = new Set(prev);
        if (isCurrentlyLiked) {
          next.add(contentId);
        } else {
          next.delete(contentId);
        }
        return next;
      });
      setItems((prev) =>
        prev.map((item) => {
          if (item._id === contentId) {
            const rollbackDelta = isCurrentlyLiked ? 1 : -1;
            return {
              ...item,
              stats: {
                ...item.stats,
                likes: Math.max(0, item.stats.likes + rollbackDelta),
              },
            };
          }
          return item;
        })
      );
    }
  }, [likedIds]);

  /**
   * Xử lý hành động Save/Bookmark với Optimistic UI
   */
  const handleSave = useCallback(async (contentId: string) => {
    const isCurrentlySaved = savedIds.has(contentId);

    setSavedIds((prev) => {
      const next = new Set(prev);
      if (isCurrentlySaved) {
        next.delete(contentId);
      } else {
        next.add(contentId);
      }
      return next;
    });

    setItems((prev) =>
      prev.map((item) => {
        if (item._id === contentId) {
          const delta = isCurrentlySaved ? -1 : 1;
          return {
            ...item,
            stats: {
              ...item.stats,
              saves: Math.max(0, item.stats.saves + delta),
            },
          };
        }
        return item;
      })
    );

    try {
      await funFeedClient.interact(contentId, { action: "save" });
    } catch (err) {
      console.error("[useFunFeed] Save failed, rolling back:", err);
      setSavedIds((prev) => {
        const next = new Set(prev);
        if (isCurrentlySaved) {
          next.add(contentId);
        } else {
          next.delete(contentId);
        }
        return next;
      });
      setItems((prev) =>
        prev.map((item) => {
          if (item._id === contentId) {
            const rollbackDelta = isCurrentlySaved ? 1 : -1;
            return {
              ...item,
              stats: {
                ...item.stats,
                saves: Math.max(0, item.stats.saves + rollbackDelta),
              },
            };
          }
          return item;
        })
      );
    }
  }, [savedIds]);

  /**
   * Xử lý Báo cáo vi phạm (Report)
   */
  const handleReport = useCallback(async (contentId: string, reason: string) => {
    try {
      await funFeedClient.interact(contentId, {
        action: "report",
        reportReason: reason,
      });

      // Cập nhật số lượng report tại chỗ
      setItems((prev) =>
        prev.map((item) => {
          if (item._id === contentId) {
            const newReports = item.stats.reports + 1;
            // Nếu đủ 3 reports, backend ẩn bài -> frontend cũng tự động lọc khỏi view
            return {
              ...item,
              status: newReports >= 3 ? "hidden" : item.status,
              stats: {
                ...item.stats,
                reports: newReports,
              },
            };
          }
          return item;
        }).filter((item) => item.status !== "hidden")
      );
    } catch (err) {
      console.error("[useFunFeed] Report failed:", err);
      throw err;
    }
  }, []);

  /**
   * Gửi skip analytics thụ động khi lướt qua nhanh
   */
  const handleSkip = useCallback((contentId: string) => {
    funFeedClient.interact(contentId, { action: "skip" }).catch(() => {
      // Bỏ qua lỗi vì đây chỉ là background analytics
    });
  }, []);

  return {
    items,
    loading,
    loadingMore,
    error,
    hasMore,
    selectedTopic,
    selectedLevel,
    likedIds,
    savedIds,
    setTopicFilter,
    setLevelFilter,
    loadMore,
    refresh: () => loadInitialFeed(selectedTopic, selectedLevel),
    handleLike,
    handleSave,
    handleReport,
    handleSkip,
  };
}
```

- [ ] **Step 2: Verify TypeScript Compilation for Hook**

Run:
```bash
npx tsc --noEmit
```
Expected output: No compilation errors in `src/hooks/useFunFeed.ts`.

---

### Task 5: Build UI Components for Fun Feed

**Files:**
- Create: `src/components/fun-feed/FunFeedCard.tsx`
- Create: `src/components/fun-feed/FunFeedFilterBar.tsx`
- Create: `src/components/fun-feed/ReportModal.tsx`

- [ ] **Step 1: Write `src/components/fun-feed/ReportModal.tsx`**

```typescript
/**
 * @file ReportModal.tsx
 * @description Hộp thoại cho phép người dùng nhập lý do báo cáo nội dung vi phạm
 * 
 * Made by Anh Tu - Share to be share
 */

"use client";

import { useState } from "react";
import { AlertCircle, X, Loader2 } from "lucide-react";

interface ReportModalProps {
  isOpen: boolean;
  contentTitle: string;
  onClose: () => void;
  onSubmit: (reason: string) => Promise<void>;
}

const PRESET_REASONS = [
  "Nội dung không liên quan đến học tiếng Anh",
  "Nội dung phản cảm, không phù hợp thuần phong mỹ tục",
  "Giải thích ngữ pháp/từ vựng không chính xác",
  "Video/GIF bị lỗi hoặc không phát được",
];

export function ReportModal({
  isOpen,
  contentTitle,
  onClose,
  onSubmit,
}: ReportModalProps) {
  const [selectedReason, setSelectedReason] = useState<string>("");
  const [customReason, setCustomReason] = useState<string>("");
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const finalReason = customReason.trim() || selectedReason;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!finalReason) {
      setError("Vui lòng chọn hoặc nhập lý do báo cáo");
      return;
    }

    setSubmitting(true);
    setError(null);
    try {
      await onSubmit(finalReason);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gửi báo cáo thất bại");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="w-full max-w-sm rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl p-5 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-rose-600 dark:text-rose-400 font-bold text-sm">
            <AlertCircle className="w-4 h-4" />
            <span>Báo cáo nội dung</span>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-full text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-1">
          Bài viết: <span className="font-semibold text-slate-700 dark:text-slate-200">{contentTitle}</span>
        </p>

        <form onSubmit={handleSubmit} className="space-y-3">
          <div className="space-y-2">
            {PRESET_REASONS.map((reason) => (
              <label
                key={reason}
                className="flex items-start gap-2.5 p-2 rounded-xl border border-slate-100 dark:border-slate-800/80 hover:bg-slate-50 dark:hover:bg-slate-800/40 cursor-pointer text-xs transition-colors"
              >
                <input
                  type="radio"
                  name="reportReason"
                  checked={selectedReason === reason}
                  onChange={() => {
                    setSelectedReason(reason);
                    setCustomReason("");
                    setError(null);
                  }}
                  className="mt-0.5 text-rose-600 focus:ring-rose-500"
                />
                <span className="text-slate-700 dark:text-slate-300">{reason}</span>
              </label>
            ))}
          </div>

          <div>
            <textarea
              placeholder="Hoặc nhập lý do khác..."
              value={customReason}
              onChange={(e) => {
                setCustomReason(e.target.value);
                if (e.target.value.trim()) setSelectedReason("");
                setError(null);
              }}
              rows={2}
              className="w-full text-xs p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 focus:outline-hidden focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500"
            />
          </div>

          {error && (
            <p className="text-[11px] text-rose-500 font-medium">{error}</p>
          )}

          <div className="flex gap-2 pt-1">
            <button
              type="button"
              onClick={onClose}
              disabled={submitting}
              className="flex-1 py-2 px-3 rounded-xl border border-slate-200 dark:border-slate-800 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              Hủy
            </button>
            <button
              type="submit"
              disabled={submitting || !finalReason}
              className="flex-1 py-2 px-3 rounded-xl bg-rose-600 hover:bg-rose-700 disabled:opacity-50 text-white text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors shadow-xs"
            >
              {submitting ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Đang gửi...</span>
                </>
              ) : (
                <span>Gửi báo cáo</span>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Write `src/components/fun-feed/FunFeedFilterBar.tsx`**

```typescript
/**
 * @file FunFeedFilterBar.tsx
 * @description Thanh lọc nhanh Chủ đề (Topic) và Trình độ (Level) cho Fun Feed
 * 
 * Made by Anh Tu - Share to be share
 */

"use client";

import { FunFeedTopic, FunFeedLevel } from "@/lib/types/fun-feed";
import { cn } from "@/lib/utils";

interface FunFeedFilterBarProps {
  selectedTopic?: FunFeedTopic;
  selectedLevel?: FunFeedLevel;
  onSelectTopic: (topic?: FunFeedTopic) => void;
  onSelectLevel: (level?: FunFeedLevel) => void;
}

const TOPICS: { value: FunFeedTopic; label: string; icon: string }[] = [
  { value: "grammar", label: "Ngữ pháp", icon: "📐" },
  { value: "vocabulary", label: "Từ vựng", icon: "📚" },
  { value: "pronunciation", label: "Phát âm", icon: "🗣️" },
  { value: "idiom", label: "Thành ngữ", icon: "💡" },
  { value: "conversation", label: "Giao tiếp", icon: "💬" },
];

const LEVELS: { value: FunFeedLevel; label: string }[] = [
  { value: "beginner", label: "A1-A2" },
  { value: "intermediate", label: "B1-B2" },
  { value: "advanced", label: "C1-C2" },
];

export function FunFeedFilterBar({
  selectedTopic,
  selectedLevel,
  onSelectTopic,
  onSelectLevel,
}: FunFeedFilterBarProps) {
  return (
    <div className="w-full space-y-1.5 py-1 px-3 z-30 pointer-events-auto">
      {/* Topics Scrollable Row */}
      <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar scroll-smooth">
        <button
          onClick={() => onSelectTopic(undefined)}
          className={cn(
            "px-2.5 py-1 rounded-full text-[11px] font-semibold whitespace-nowrap transition-all backdrop-blur-md",
            !selectedTopic
              ? "bg-amber-500 text-slate-950 shadow-xs scale-105"
              : "bg-slate-900/60 text-white/80 hover:bg-slate-900/80 border border-white/10"
          )}
        >
          Tất cả chủ đề
        </button>

        {TOPICS.map((topic) => (
          <button
            key={topic.value}
            onClick={() => onSelectTopic(topic.value)}
            className={cn(
              "px-2.5 py-1 rounded-full text-[11px] font-semibold whitespace-nowrap transition-all flex items-center gap-1 backdrop-blur-md",
              selectedTopic === topic.value
                ? "bg-amber-500 text-slate-950 shadow-xs scale-105"
                : "bg-slate-900/60 text-white/80 hover:bg-slate-900/80 border border-white/10"
            )}
          >
            <span>{topic.icon}</span>
            <span>{topic.label}</span>
          </button>
        ))}
      </div>

      {/* Levels Row */}
      <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar">
        <button
          onClick={() => onSelectLevel(undefined)}
          className={cn(
            "px-2 py-0.5 rounded-md text-[10px] font-bold tracking-wider uppercase transition-all backdrop-blur-md",
            !selectedLevel
              ? "bg-emerald-500 text-slate-950 font-extrabold"
              : "bg-slate-900/40 text-white/60 hover:text-white border border-white/10"
          )}
        >
          All Levels
        </button>

        {LEVELS.map((lvl) => (
          <button
            key={lvl.value}
            onClick={() => onSelectLevel(lvl.value)}
            className={cn(
              "px-2 py-0.5 rounded-md text-[10px] font-bold tracking-wider uppercase transition-all backdrop-blur-md",
              selectedLevel === lvl.value
                ? "bg-emerald-500 text-slate-950 font-extrabold"
                : "bg-slate-900/40 text-white/60 hover:text-white border border-white/10"
            )}
          >
            {lvl.label}
          </button>
        ))}
      </div>
    </div>
  );
}
```

- [ ] **Step 3: Write `src/components/fun-feed/FunFeedCard.tsx`**

```typescript
/**
 * @file FunFeedCard.tsx
 * @description Card hiển thị Meme/Reel tràn màn hình 100vh theo cơ chế scroll-snap của TikTok
 * Bao gồm Media Player (GIF CDN hoặc YouTube Shorts iframe), Glassmorphism Learning Overlay,
 * và Cột nút tương tác (Like, Save, Report, Share)
 * 
 * Made by Anh Tu - Share to be share
 */

"use client";

import { useState } from "react";
import Image from "next/image";
import { Heart, Bookmark, Flag, Share2, Sparkles, Lightbulb, Target } from "lucide-react";
import { FunFeedItem } from "@/lib/types/fun-feed";
import { cn } from "@/lib/utils";
import { ReportModal } from "./ReportModal";

interface FunFeedCardProps {
  item: FunFeedItem;
  isLiked: boolean;
  isSaved: boolean;
  onLike: (id: string) => void;
  onSave: (id: string) => void;
  onReport: (id: string, reason: string) => Promise<void>;
}

export function FunFeedCard({
  item,
  isLiked,
  isSaved,
  onLike,
  onSave,
  onReport,
}: FunFeedCardProps) {
  const [reportModalOpen, setReportModalOpen] = useState(false);
  const [copiedToast, setCopiedToast] = useState(false);

  // Xử lý chia sẻ (Web Share API hoặc Copy link)
  const handleShare = async () => {
    const shareUrl = item.sourceUrl || window.location.href;
    if (navigator.share) {
      try {
        await navigator.share({
          title: item.title,
          text: `Học tiếng Anh hài hước cùng AhaTools: ${item.title}`,
          url: shareUrl,
        });
      } catch {
        // Share cancelled
      }
    } else {
      await navigator.clipboard.writeText(shareUrl);
      setCopiedToast(true);
      setTimeout(() => setCopiedToast(false), 2000);
    }
  };

  return (
    <div className="relative w-full h-[100dvh] max-h-[100dvh] snap-start flex flex-col justify-between overflow-hidden bg-slate-950 select-none">
      {/* 1. Media Canvas Layer (100% Zero-bandwidth CDN Offload) */}
      <div className="absolute inset-0 z-0 flex items-center justify-center bg-black">
        {item.type === "short_video" || item.source === "youtube" ? (
          <iframe
            src={`${item.mediaUrl}?autoplay=1&mute=1&loop=1&controls=0&modestbranding=1&rel=0`}
            title={item.title}
            className="w-full h-full border-0 pointer-events-auto"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
          />
        ) : (
          /* GIF stream direct from GIPHY CDN */
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={item.mediaUrl}
            alt={item.title}
            loading="lazy"
            className="w-full h-full object-contain pointer-events-none"
          />
        )}

        {/* Gradient bóng đổ nhẹ để làm nổi bật overlay văn bản */}
        <div className="absolute inset-x-0 bottom-0 h-72 bg-gradient-to-t from-black/90 via-black/50 to-transparent pointer-events-none" />
      </div>

      {/* 2. Top spacer for Floating Navigation */}
      <div className="h-14 w-full z-10 pointer-events-none" />

      {/* 3. Bottom Presentation Layer: Learning Overlay & Right Actions */}
      <div className="relative z-10 w-full px-4 pb-6 pt-2 flex items-end justify-between gap-3">
        {/* Left: Glassmorphism Learning Information */}
        <div className="flex-1 space-y-2 max-w-[82%]">
          {/* Badges: Topic & Level */}
          <div className="flex items-center gap-1.5 flex-wrap">
            {item.topic && (
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-amber-500/90 text-slate-950 backdrop-blur-md shadow-xs">
                #{item.topic}
              </span>
            )}
            {item.level && (
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-emerald-500/90 text-slate-950 backdrop-blur-md shadow-xs">
                {item.level}
              </span>
            )}
            {item.attribution && (
              <span className="text-[10px] text-white/60 font-medium">
                @{item.attribution}
              </span>
            )}
          </div>

          {/* Title */}
          <h2 className="text-sm sm:text-base font-bold text-white leading-snug drop-shadow-md line-clamp-2">
            {item.title}
          </h2>

          {/* Glassmorphism Pedagogical Insight Box */}
          <div className="p-3 rounded-2xl bg-white/10 dark:bg-slate-900/40 backdrop-blur-md border border-white/15 text-white shadow-lg space-y-1.5">
            {item.whyFunny && (
              <div className="flex items-start gap-1.5 text-xs text-amber-200/95 leading-relaxed">
                <Lightbulb className="w-3.5 h-3.5 mt-0.5 shrink-0 text-amber-400" />
                <p>
                  <strong className="font-semibold text-amber-300">Tại sao hài: </strong>
                  {item.whyFunny}
                </p>
              </div>
            )}

            {item.youLearned && (
              <div className="flex items-start gap-1.5 text-xs text-emerald-200/95 leading-relaxed border-t border-white/10 pt-1.5">
                <Target className="w-3.5 h-3.5 mt-0.5 shrink-0 text-emerald-400" />
                <p>
                  <strong className="font-semibold text-emerald-300">Bạn học được: </strong>
                  {item.youLearned}
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Right: Vertical Interaction Column */}
        <div className="flex flex-col items-center gap-3.5 pb-1">
          {/* Like Button */}
          <button
            onClick={() => onLike(item._id)}
            className="flex flex-col items-center gap-1 group"
            title="Thích"
          >
            <div
              className={cn(
                "p-2.5 rounded-full backdrop-blur-md transition-all active:scale-75",
                isLiked
                  ? "bg-rose-500/90 text-white shadow-lg shadow-rose-500/40"
                  : "bg-black/40 text-white/90 hover:bg-black/60 border border-white/15"
              )}
            >
              <Heart
                className={cn(
                  "w-5 h-5 transition-transform",
                  isLiked ? "fill-current scale-110" : "stroke-2"
                )}
              />
            </div>
            <span className="text-[10px] font-bold text-white drop-shadow-md">
              {item.stats.likes}
            </span>
          </button>

          {/* Save Button */}
          <button
            onClick={() => onSave(item._id)}
            className="flex flex-col items-center gap-1 group"
            title="Lưu lại"
          >
            <div
              className={cn(
                "p-2.5 rounded-full backdrop-blur-md transition-all active:scale-75",
                isSaved
                  ? "bg-amber-500/90 text-slate-950 shadow-lg shadow-amber-500/40"
                  : "bg-black/40 text-white/90 hover:bg-black/60 border border-white/15"
              )}
            >
              <Bookmark
                className={cn(
                  "w-5 h-5 transition-transform",
                  isSaved ? "fill-current scale-110" : "stroke-2"
                )}
              />
            </div>
            <span className="text-[10px] font-bold text-white drop-shadow-md">
              {item.stats.saves}
            </span>
          </button>

          {/* Share Button */}
          <button
            onClick={handleShare}
            className="flex flex-col items-center gap-1 group"
            title="Chia sẻ"
          >
            <div className="p-2.5 rounded-full bg-black/40 text-white/90 hover:bg-black/60 backdrop-blur-md border border-white/15 transition-all active:scale-75">
              <Share2 className="w-5 h-5 stroke-2" />
            </div>
            <span className="text-[10px] font-bold text-white drop-shadow-md">
              {copiedToast ? "Đã copy!" : "Share"}
            </span>
          </button>

          {/* Report Button */}
          <button
            onClick={() => setReportModalOpen(true)}
            className="flex flex-col items-center gap-1 group text-white/60 hover:text-rose-400"
            title="Báo cáo vi phạm"
          >
            <div className="p-2 rounded-full bg-black/30 backdrop-blur-md border border-white/10 transition-all active:scale-75">
              <Flag className="w-4 h-4 stroke-2" />
            </div>
          </button>
        </div>
      </div>

      {/* Modal báo cáo vi phạm */}
      <ReportModal
        isOpen={reportModalOpen}
        contentTitle={item.title}
        onClose={() => setReportModalOpen(false)}
        onSubmit={(reason) => onReport(item._id, reason)}
      />
    </div>
  );
}
```

- [ ] **Step 4: Verify TypeScript Compilation for Components**

Run:
```bash
npx tsc --noEmit
```
Expected output: No compilation errors in `src/components/fun-feed/`.

---

### Task 6: Build Fun Feed App Page

**Files:**
- Create: `src/app/apps/fun-feed/page.tsx`

- [ ] **Step 1: Write `src/app/apps/fun-feed/page.tsx`**

```typescript
/**
 * @file page.tsx
 * @description Trang lướt meme học tiếng Anh (Fun Feed) dạng TikTok Scroll Snap 100vh
 * Hỗ trợ Infinite Scrolling qua Cursor Pagination và bộ lọc Topic/Level
 * 
 * Route: /apps/fun-feed
 * Made by Anh Tu - Share to be share
 */

"use client";

import { useEffect, useRef } from "react";
import Link from "next/link";
import { ArrowLeft, Loader2, Sparkles, RefreshCw, AlertCircle } from "lucide-react";
import { useFunFeed } from "@/hooks/useFunFeed";
import { FunFeedCard } from "@/components/fun-feed/FunFeedCard";
import { FunFeedFilterBar } from "@/components/fun-feed/FunFeedFilterBar";

export default function FunFeedPage() {
  const {
    items,
    loading,
    loadingMore,
    error,
    hasMore,
    selectedTopic,
    selectedLevel,
    likedIds,
    savedIds,
    setTopicFilter,
    setLevelFilter,
    loadMore,
    refresh,
    handleLike,
    handleSave,
    handleReport,
  } = useFunFeed({ pageSize: 10 });

  const containerRef = useRef<HTMLDivElement>(null);
  const sentinelRef = useRef<HTMLDivElement>(null);

  // Kích hoạt Infinite Scroll khi cuộn đến thẻ áp chót qua IntersectionObserver
  useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!sentinel) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !loadingMore && !loading) {
          loadMore();
        }
      },
      {
        root: containerRef.current,
        rootMargin: "200px",
        threshold: 0.1,
      }
    );

    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [hasMore, loadingMore, loading, loadMore]);

  return (
    <div className="relative w-full h-[100dvh] max-h-[100dvh] bg-black overflow-hidden flex flex-col">
      {/* 1. Floating Top Bar: Nút thoát & Bộ lọc */}
      <header className="absolute top-0 inset-x-0 z-40 flex flex-col pt-safe bg-gradient-to-b from-black/80 via-black/40 to-transparent pointer-events-none">
        <div className="flex items-center justify-between px-3 h-12 pointer-events-auto">
          <Link
            href="/"
            className="p-2 rounded-full bg-black/40 text-white/90 hover:bg-black/60 backdrop-blur-md border border-white/10 transition-transform active:scale-90"
            title="Quay lại Trang chủ"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>

          <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-black/40 backdrop-blur-md border border-white/10">
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            <span className="text-xs font-bold text-white tracking-wide">
              Fun English Feed
            </span>
          </div>

          <button
            onClick={refresh}
            className="p-2 rounded-full bg-black/40 text-white/90 hover:bg-black/60 backdrop-blur-md border border-white/10 transition-transform active:scale-90"
            title="Làm mới bảng tin"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>

        {/* Thanh lọc chủ đề & cấp độ */}
        <FunFeedFilterBar
          selectedTopic={selectedTopic}
          selectedLevel={selectedLevel}
          onSelectTopic={setTopicFilter}
          onSelectLevel={setLevelFilter}
        />
      </header>

      {/* 2. Main Scroll-Snap Reel Container */}
      {loading ? (
        <div className="flex-1 flex flex-col items-center justify-center gap-3 text-white">
          <Loader2 className="w-8 h-8 animate-spin text-amber-500" />
          <p className="text-xs text-white/70 font-medium tracking-wide">
            Đang nạp memes & reels hài hước...
          </p>
        </div>
      ) : error ? (
        <div className="flex-1 flex flex-col items-center justify-center p-6 text-center text-white space-y-3">
          <AlertCircle className="w-10 h-10 text-rose-500" />
          <h3 className="text-sm font-bold">Không thể tải Fun Feed</h3>
          <p className="text-xs text-white/60 max-w-xs">{error}</p>
          <button
            onClick={refresh}
            className="px-4 py-2 rounded-xl bg-amber-500 text-slate-950 font-bold text-xs shadow-md active:scale-95"
          >
            Thử lại
          </button>
        </div>
      ) : items.length === 0 ? (
        <div className="flex-1 flex flex-col items-center justify-center p-6 text-center text-white space-y-3">
          <span className="text-4xl">🎭</span>
          <h3 className="text-sm font-bold">Chưa có nội dung phù hợp</h3>
          <p className="text-xs text-white/60 max-w-xs">
            Hiện chưa có meme nào thuộc chủ đề hoặc cấp độ bạn đã chọn.
          </p>
          <button
            onClick={() => {
              setTopicFilter(undefined);
              setLevelFilter(undefined);
            }}
            className="px-4 py-2 rounded-xl bg-slate-800 text-white font-semibold text-xs border border-white/20 active:scale-95"
          >
            Xóa bộ lọc
          </button>
        </div>
      ) : (
        <div
          ref={containerRef}
          className="flex-1 w-full overflow-y-scroll snap-y snap-mandatory no-scrollbar"
        >
          {items.map((item) => (
            <FunFeedCard
              key={item._id}
              item={item}
              isLiked={likedIds.has(item._id)}
              isSaved={savedIds.has(item._id)}
              onLike={handleLike}
              onSave={handleSave}
              onReport={handleReport}
            />
          ))}

          {/* Sentinel kích hoạt infinite scroll */}
          <div ref={sentinelRef} className="h-4 w-full" />

          {/* Indicator khi đang tải thêm */}
          {loadingMore && (
            <div className="h-16 w-full flex items-center justify-center bg-black text-amber-500">
              <Loader2 className="w-5 h-5 animate-spin" />
            </div>
          )}
        </div>
      )}
    </div>
  );
}
```

- [ ] **Step 2: Verify TypeScript Compilation for Page**

Run:
```bash
npx tsc --noEmit
```
Expected output: No compilation errors in `src/app/apps/fun-feed/page.tsx`.

---

### Task 7: Integrate Fun Feed into App Navigation & Dashboard

**Files:**
- Modify: `src/components/dashboard/app-shortcuts.tsx`
- Modify: `src/components/mobile-shell/mobile-tab-bar.tsx`
- Modify: `src/components/mobile-shell/mobile-header.tsx`

- [ ] **Step 1: Add Fun Feed to `src/components/dashboard/app-shortcuts.tsx`**

Thay thế mục "Tin tức AI (Sắp có)" bằng app tiện ích "Fun English Feed":
```typescript
  {
    id: "fun-feed",
    name: "Fun English Feed",
    desc: "Memes & Reels học vui",
    icon: "🎭",
    href: "/apps/fun-feed",
    gradient: "from-rose-50 to-amber-50 dark:from-rose-950/30 dark:to-amber-950/20 border-rose-200 dark:border-rose-900",
  },
```

- [ ] **Step 2: Hide Mobile Tab Bar in Full-screen Feed**

Modify `src/components/mobile-shell/mobile-tab-bar.tsx`:
Thêm `pathname.startsWith("/apps/fun-feed")` vào điều kiện `isHidden`:
```typescript
  const isHidden =
    pathname.startsWith("/apps/story-shadowing/player") ||
    pathname.startsWith("/apps/story-shadowing/create") ||
    pathname.startsWith("/vocab/review") ||
    pathname.startsWith("/vocab/speak-your-mind/create") ||
    pathname.startsWith("/apps/fun-feed");
```

- [ ] **Step 3: Hide Root Mobile Header for Fun Feed Full-screen Immersion**

Modify `src/components/mobile-shell/mobile-header.tsx`:
Ẩn toàn bộ header mặc định khi vào route `/apps/fun-feed` để Fun Feed tự hiển thị floating navigation bar riêng:
```typescript
  if (pathname.startsWith("/apps/fun-feed")) {
    return null;
  }
```

- [ ] **Step 4: Verify TypeScript Compilation**

Run:
```bash
npx tsc --noEmit
```
Expected output: No errors across modified files.

---

### Task 8: End-to-End Build & Validation

**Files:**
- Command: `npm run lint` & `npm run build`

- [ ] **Step 1: Run ESLint check**

Run:
```bash
npm run lint
```
Expected output: No ESLint warnings or errors.

- [ ] **Step 2: Run Production Build**

Run:
```bash
npm run build
```
Expected output: Next.js compiles routes successfully including `/apps/fun-feed`.

- [ ] **Step 3: Commit integration changes**

Run:
```bash
git add requirements/modules/fun-feed/ docs/superpowers/plans/ src/lib/types/fun-feed.ts src/lib/services/fun-feed-client.ts src/hooks/useFunFeed.ts src/components/fun-feed/ src/app/apps/fun-feed/ src/components/dashboard/app-shortcuts.tsx src/components/mobile-shell/mobile-tab-bar.tsx src/components/mobile-shell/mobile-header.tsx
git commit -m "feat(fun-feed): integrate Fun English Memes & Reels feed with aha-mind-agents gateway"
```

---

*Made by Anh Tu - Share to be share*
