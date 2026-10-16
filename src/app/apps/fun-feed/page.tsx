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
