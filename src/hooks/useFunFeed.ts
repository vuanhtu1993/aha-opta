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

  // Load feed on mount and when filter criteria change
  useEffect(() => {
    let ignore = false;

    funFeedClient
      .getFeed({
        limit: pageSize,
        topic: selectedTopic,
        level: selectedLevel,
      })
      .then((res) => {
        if (!ignore) {
          setItems(res.items || []);
          setNextCursor(res.nextCursor);
          setHasMore(res.hasMore);
          setLoading(false);
        }
      })
      .catch((err) => {
        if (!ignore) {
          setError(err instanceof Error ? err.message : "Không thể tải danh sách nội dung");
          setLoading(false);
        }
      });

    return () => {
      ignore = true;
    };
  }, [selectedTopic, selectedLevel, pageSize]);

  /**
   * Làm mới bảng tin từ đầu
   */
  const refresh = useCallback(() => {
    setLoading(true);
    setError(null);
    funFeedClient
      .getFeed({
        limit: pageSize,
        topic: selectedTopic,
        level: selectedLevel,
      })
      .then((res) => {
        setItems(res.items || []);
        setNextCursor(res.nextCursor);
        setHasMore(res.hasMore);
      })
      .catch((err) => {
        setError(err instanceof Error ? err.message : "Không thể tải danh sách nội dung");
      })
      .finally(() => {
        setLoading(false);
      });
  }, [pageSize, selectedTopic, selectedLevel]);

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
    refresh,
    handleLike,
    handleSave,
    handleReport,
    handleSkip,
  };
}
