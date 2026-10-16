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
import { Heart, Bookmark, Flag, Share2 } from "lucide-react";
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
              <div className="text-xs text-amber-200/95 leading-relaxed">
                <p>
                  <strong className="font-semibold text-amber-300">Tại sao hài: </strong>
                  {item.whyFunny}
                </p>
              </div>
            )}

            {item.youLearned && (
              <div className="text-xs text-emerald-200/95 leading-relaxed border-t border-white/10 pt-1.5">
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
