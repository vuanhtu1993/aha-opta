/**
 * @file page.tsx
 * @description Trang lướt meme học tiếng Anh (Fun Feed) dạng TikTok Scroll Snap 100vh
 * Tích hợp Active Viewport Tracking, Mute Toggle, và Virtual Sliding Window
 * 
 * Route: /apps/fun-feed
 * Made by Anh Tu - Share to be share
 */

"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { ArrowLeft, Loader2, RefreshCw, Volume2, VolumeX } from "lucide-react";
import { useFunFeed } from "@/hooks/useFunFeed";
import { useActiveFeedIndex } from "@/hooks/useActiveFeedIndex";
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
    handleSkip,
  } = useFunFeed({ pageSize: 10 });

  const containerRef = useRef<HTMLDivElement>(null);
  const sentinelRef = useRef<HTMLDivElement>(null);
  const [isMuted, setIsMuted] = useState<boolean>(true);

  // Theo dõi chính xác Card đang Active trên màn hình
  const { activeIndex } = useActiveFeedIndex({
    containerRef,
    itemCount: items.length,
    enabled: !loading,
    itemSelector: "[data-feed-index]",
    threshold: 0.5,
  });

  // Ghi nhận skip analytics khi activeIndex thay đổi nhanh
  const previousIndexRef = useRef<number>(0);
  const enterTimeRef = useRef<number | null>(null);

  useEffect(() => {
    if (enterTimeRef.current === null) {
      enterTimeRef.current = Date.now();
      return;
    }
    const elapsed = Date.now() - enterTimeRef.current;
    const prevItem = items[previousIndexRef.current];
    if (prevItem && elapsed < 2000 && previousIndexRef.current !== activeIndex) {
      handleSkip(prevItem._id);
    }
    previousIndexRef.current = activeIndex;
    enterTimeRef.current = Date.now();
  }, [activeIndex, items, handleSkip]);

  // Kích hoạt Infinite Scroll khi cuộn đến thẻ áp chót
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
        rootMargin: "300px",
        threshold: 0.1,
      }
    );

    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [hasMore, loadingMore, loading, loadMore]);

  return (
    <div className="relative w-full h-[100dvh] max-h-[100dvh] -mb-24 bg-black overflow-hidden flex flex-col">
      {/* 1. Floating Top Bar: Nút thoát, Tiêu đề, Mute Toggle & Refresh */}
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

        <div className="flex items-center gap-1.5 pointer-events-auto">
          {/* Nút bật/tắt âm thanh chức năng */}
          <button
            onClick={() => setIsMuted((prev) => !prev)}
            className="p-2 rounded-full bg-black/40 text-white/90 hover:bg-black/60 backdrop-blur-md border border-white/10 transition-transform active:scale-90"
            title={isMuted ? "Bật âm thanh" : "Tắt âm thanh"}
          >
            {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4 text-amber-400" />}
          </button>

          {/* Nút làm mới bảng tin */}
          <button
            onClick={refresh}
            className="p-2 rounded-full bg-black/40 text-white/90 hover:bg-black/60 backdrop-blur-md border border-white/10 transition-transform active:scale-90"
            title="Làm mới bảng tin"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
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
          {items.map((item, index) => {
            const isActive = index === activeIndex;
            // Pre-mount liền kề 1 card trước và 1 card sau [i-1, i, i+1] để xóa bỏ hoàn toàn độ trễ khi lướt
            const shouldMount = Math.abs(index - activeIndex) <= 1;

            return (
              <FunFeedCard
                key={item._id}
                index={index}
                item={item}
                isActive={isActive}
                shouldMount={shouldMount}
                isPrefetchTarget={index === activeIndex + 1}
                isMuted={isMuted}
                isLiked={likedIds.has(item._id)}
                isSaved={savedIds.has(item._id)}
                onLike={handleLike}
                onSave={handleSave}
                onReport={handleReport}
              />
            );
          })}

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
