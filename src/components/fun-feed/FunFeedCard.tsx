/**
 * @file FunFeedCard.tsx
 * @description Card hiển thị Meme/Reel tràn màn hình 100vh với Virtual Windowing [i-1, i, i+1]
 * Pre-mount iframe liền kề và điều khiển âm thanh qua postMessage không gây reload
 * 
 * Made by Anh Tu - Share to be share
 */

"use client";

import { useState, useEffect, useRef } from "react";
import { Heart, Bookmark, Flag, Share2, Play } from "lucide-react";
import { FunFeedItem } from "@/lib/types/fun-feed";
import { cn } from "@/lib/utils";
import { ReportModal } from "./ReportModal";

interface FunFeedCardProps {
  index: number;
  item: FunFeedItem;
  isActive: boolean;
  shouldMount: boolean;
  isPrefetchTarget: boolean;
  isMuted?: boolean;
  isLiked: boolean;
  isSaved: boolean;
  onLike: (id: string) => void;
  onSave: (id: string) => void;
  onReport: (id: string, reason: string) => Promise<void>;
}

export function FunFeedCard({
  index,
  item,
  isActive,
  shouldMount,
  isPrefetchTarget,
  isMuted = true,
  isLiked,
  isSaved,
  onLike,
  onSave,
  onReport,
}: FunFeedCardProps) {
  const [reportModalOpen, setReportModalOpen] = useState(false);
  const [copiedToast, setCopiedToast] = useState(false);
  const iframeRef = useRef<HTMLIFrameElement>(null);

  // 1. Predictive Prefetching: Nạp trước tài nguyên GIF khi là mục tiêu kế tiếp (i + 1)
  useEffect(() => {
    if (isPrefetchTarget && item.type === "gif" && item.mediaUrl) {
      const img = new window.Image();
      img.src = item.mediaUrl;
    }
  }, [isPrefetchTarget, item.type, item.mediaUrl]);

  // 2. Đồng bộ phát/tắt và bật/tắt tiếng tức thì qua YouTube IFrame postMessage API (không reload src)
  useEffect(() => {
    const iframe = iframeRef.current;
    if (!iframe || !iframe.contentWindow) return;

    const sendCommand = (func: string, args: unknown[] = []) => {
      try {
        iframe.contentWindow?.postMessage(
          JSON.stringify({ event: "command", func, args }),
          "*"
        );
      } catch {
        // Cross-origin safe
      }
    };

    if (isActive) {
      sendCommand("playVideo");
      if (isMuted) {
        sendCommand("mute");
      } else {
        sendCommand("unMute");
      }
    } else {
      // Khi không active (ở card kế tiếp hoặc card trước), luôn mute để triệt tiêu tiếng ngầm
      sendCommand("mute");
    }
  }, [isActive, isMuted]);

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

  const isYouTube = item.type === "short_video" || item.source === "youtube";
  const posterUrl =
    item.thumbnailUrl ||
    (isYouTube && item.sourceId
      ? `https://i.ytimg.com/vi/${item.sourceId}/hqdefault.jpg`
      : undefined);

  return (
    <div
      data-feed-index={index}
      className="relative w-full h-[100dvh] max-h-[100dvh] snap-start flex flex-col justify-between overflow-hidden bg-slate-950 select-none"
    >
      {/* 1. Media Canvas Layer với 3-Card Virtual Windowing */}
      <div className="absolute inset-0 z-0 flex items-center justify-center bg-black">
        {/* Background Poster Thumbnail luôn sẵn sàng, chống giật chớp màn hình */}
        {posterUrl && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={posterUrl}
            alt={item.title}
            className="absolute inset-0 w-full h-full object-contain pointer-events-none"
          />
        )}

        {/* Media Player: Pre-mount trong cửa sổ trượt [i-1, i, i+1] */}
        {shouldMount && (
          isYouTube ? (
            <iframe
              ref={iframeRef}
              src={`${item.mediaUrl}?enablejsapi=1&autoplay=1&mute=1&loop=1&playlist=${item.sourceId}&controls=0&modestbranding=1&rel=0&playsinline=1`}
              title={item.title}
              className={cn(
                "absolute inset-0 w-full h-full border-0 transition-opacity duration-300",
                isActive ? "pointer-events-auto opacity-100" : "pointer-events-none opacity-90"
              )}
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            />
          ) : (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={item.mediaUrl}
              alt={item.title}
              className="absolute inset-0 w-full h-full object-contain pointer-events-none"
            />
          )
        )}

        {/* Fallback khi không có media lẫn poster */}
        {!shouldMount && !posterUrl && (
          <div className="w-full h-full bg-slate-900 flex items-center justify-center text-slate-700">
            <Play className="w-12 h-12 opacity-30" />
          </div>
        )}

        {/* Gradient bóng mờ chân trang */}
        <div className="absolute inset-x-0 bottom-0 h-64 bg-gradient-to-t from-black/90 via-black/40 to-transparent pointer-events-none" />
      </div>

      {/* 2. Top spacer cho Floating Navigation */}
      <div className="h-14 w-full z-10 pointer-events-none" />

      {/* 3. Bottom Layer: Tiêu đề & Cột nút tương tác */}
      <div className="relative z-10 w-full px-4 pb-6 pt-2 flex items-end justify-between gap-3">
        {/* Left: Thông tin học tập tinh gọn */}
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
        </div>

        {/* Right: Cột nút hành động chức năng */}
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

      {/* Modal Báo cáo */}
      <ReportModal
        isOpen={reportModalOpen}
        contentTitle={item.title}
        onClose={() => setReportModalOpen(false)}
        onSubmit={(reason) => onReport(item._id, reason)}
      />
    </div>
  );
}
