/**
 * @file page.tsx
 * @description Trang lướt meme học tiếng Anh (Fun Feed) dạng TikTok Scroll Snap 100vh
 * Hỗ trợ Infinite Scrolling qua Cursor Pagination và giao diện tối giản, tập trung vào nội dung media
 * 
 * Route: /apps/fun-feed
 * Made by Anh Tu - Share to be share
 */

"use client";

import { useEffect, useRef } from "react";
import Link from "next/link";
import { ArrowLeft, Loader2, RefreshCw } from "lucide-react";
import { useFunFeed } from "@/hooks/useFunFeed";
import { FunFeedCard } from "@/components/fun-feed/FunFeedCard";

export default function FunFeedPage() {
  const {
    items,
    loading,
    loadingMore,
    error,
    hasMore,
    likedIds,
    savedIds,
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
    <div className="relative w-full h-[100dvh] max-h-[100dvh] -mb-24 bg-black overflow-hidden flex flex-col">
      {/* 1. Floating Top Bar: Nút thoát & Tiêu đề tinh giản */}
      <header className="absolute top-0 inset-x-0 z-40 flex items-center justify-between px-3 h-14 pt-safe bg-gradient-to-b from-black/80 via-black/40 to-transparent pointer-events-none">
        <Link
          href="/"
          className="p-2 rounded-full bg-black/40 text-white/90 hover:bg-black/60 backdrop-blur-md border border-white/10 transition-transform active:scale-90 pointer-events-auto"
          title="Quay lại Trang chủ"
        >
          <ArrowLeft className="w-4 h-4" />
        </Link>

        <span className="text-xs font-semibold text-white/90 tracking-wide pointer-events-auto">
          Fun English Feed
        </span>

        <button
          onClick={refresh}
          className="p-2 rounded-full bg-black/40 text-white/90 hover:bg-black/60 backdrop-blur-md border border-white/10 transition-transform active:scale-90 pointer-events-auto"
          title="Làm mới bảng tin"
        >
          <RefreshCw className="w-4 h-4" />
        </button>
      </header>

      {/* 2. Main Scroll-Snap Reel Container */}
      {loading ? (
        <div className="flex-1 flex flex-col items-center justify-center gap-3 text-white">
          <Loader2 className="w-7 h-7 animate-spin text-amber-500" />
          <p className="text-xs text-white/70 font-medium tracking-wide">
            Đang tải bảng tin...
          </p>
        </div>
      ) : error ? (
        <div className="flex-1 flex flex-col items-center justify-center p-6 text-center text-white space-y-3">
          <h3 className="text-sm font-bold text-rose-400">Không thể tải nội dung</h3>
          <p className="text-xs text-white/60 max-w-xs">{error}</p>
          <button
            onClick={refresh}
            className="px-4 py-2 rounded-xl bg-amber-500 text-slate-950 font-bold text-xs shadow-md active:scale-95 transition-transform"
          >
            Thử lại
          </button>
        </div>
      ) : items.length === 0 ? (
        <div className="flex-1 flex flex-col items-center justify-center p-6 text-center text-white space-y-3">
          <h3 className="text-sm font-bold text-white">Chưa có nội dung</h3>
          <p className="text-xs text-white/60 max-w-xs">
            Hiện chưa có meme hoặc video nào được xuất bản. Vui lòng quay lại sau!
          </p>
          <button
            onClick={refresh}
            className="px-4 py-2 rounded-xl bg-amber-500 text-slate-950 font-bold text-xs shadow-md active:scale-95 transition-transform"
          >
            Làm mới
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
