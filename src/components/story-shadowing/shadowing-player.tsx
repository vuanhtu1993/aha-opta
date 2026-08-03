"use client";

import { useEffect, useState, useCallback } from "react";
import YouTube, { YouTubePlayer } from "react-youtube";
import { useShadowingPlayer } from "@/lib/hooks/use-shadowing-player";
import { useYouTubeShadowingPlayer } from "@/lib/hooks/useYouTubeShadowingPlayer";
import { SentenceCard } from "./sentence-card";
import type { Sentence } from "@/lib/schemas/story-shadowing.schema";
import { Play, Pause, ChevronLeft, ChevronRight, Volume2, Mic, CheckCircle2 } from "lucide-react";

interface ShadowingPlayerProps {
  sentences: Sentence[];
  title?: string;
  level?: "easy" | "medium" | "hard" | null;
  onBack?: () => void;
  sourceType?: "text" | "youtube";
  youtubeVideoId?: string;
}

export function ShadowingPlayer({
  sentences,
  title,
  level,
  onBack,
  sourceType = "text",
  youtubeVideoId,
}: ShadowingPlayerProps) {
  // === Text Player Hook ===
  const textPlayer = useShadowingPlayer(sourceType === "text" ? sentences : []);

  // === YouTube Player Hook ===
  const [ytPlayer, setYtPlayer] = useState<YouTubePlayer | null>(null);
  const youtubePlayer = useYouTubeShadowingPlayer(sourceType === "youtube" ? sentences : [], ytPlayer);

  // Chọn player phù hợp
  const isYoutube = sourceType === "youtube";
  const player = isYoutube ? youtubePlayer : textPlayer;

  // Ánh xạ State (Text dùng "AI_SPEAKING", YT dùng "PLAYING_AUDIO")
  const currentState = isYoutube
    ? player.playerState === "PLAYING_AUDIO"
      ? "AI_SPEAKING"
      : player.playerState
    : player.playerState;

  const currentIndex = isYoutube ? youtubePlayer.currentSentenceIndex : textPlayer.currentIndex;
  const countdown = isYoutube ? youtubePlayer.countdownMs : textPlayer.countdown;
  const isPlaying = isYoutube
    ? youtubePlayer.playerState === "PLAYING_AUDIO" || youtubePlayer.playerState === "USER_SHADOWING"
    : textPlayer.isPlaying;

  const play = isYoutube ? () => youtubePlayer.playSentence(currentIndex) : textPlayer.play;
  const pause = isYoutube ? youtubePlayer.pause : textPlayer.pause;

  const goToNext = useCallback(() => {
    if (currentIndex < sentences.length - 1) {
      isYoutube ? youtubePlayer.playSentence(currentIndex + 1) : textPlayer.goToNext();
    }
  }, [currentIndex, sentences.length, isYoutube, youtubePlayer, textPlayer]);

  const goToPrev = useCallback(() => {
    if (currentIndex > 0) {
      isYoutube ? youtubePlayer.playSentence(currentIndex - 1) : textPlayer.goToPrev();
    }
  }, [currentIndex, isYoutube, youtubePlayer, textPlayer]);

  // Auto-scroll tới câu đang đọc
  useEffect(() => {
    const el = document.getElementById(`sentence-${currentIndex}`);
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "center" });
    }
  }, [currentIndex]);

  const handleYtReady = (e: { target: YouTubePlayer }) => {
    setYtPlayer(e.target);
  };

  return (
    <div className="space-y-4">
      {/* Ẩn YouTube Iframe theo Option 2 */}
      {isYoutube && youtubeVideoId && (
        <div style={{ display: "none" }}>
          <YouTube
            videoId={youtubeVideoId}
            opts={{ height: "0", width: "0", playerVars: { controls: 0, disablekb: 1 } }}
            onReady={handleYtReady}
          />
        </div>
      )}

      {/* Header Info (Title, Player State Status Pill) */}
      <div className="flex items-center justify-between gap-2">
        <div className="min-w-0 flex-1">
          <h1 className="text-base font-extrabold text-slate-900 dark:text-white truncate" title={title || "Luyện Shadowing"}>
            {title || "Luyện Shadowing"}
          </h1>
        </div>

        {/* Trạng thái Player Inline */}
        <div
          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold shrink-0 ${
            currentState === "AI_SPEAKING"
              ? "bg-blue-50 text-blue-600 dark:bg-blue-950/40 dark:text-blue-400 border border-blue-200 dark:border-blue-800"
              : currentState === "USER_SHADOWING"
              ? "bg-amber-50 text-amber-600 dark:bg-amber-950/40 dark:text-amber-400 border border-amber-200 dark:border-amber-800 animate-pulse"
              : currentState === "DONE"
              ? "bg-emerald-50 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800"
              : "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400"
          }`}
        >
          {currentState === "AI_SPEAKING" && (
            <>
              <Volume2 className="w-3.5 h-3.5 text-blue-500 animate-pulse" />
              <span>{isYoutube ? "Speaker đọc" : "AI đang đọc"}</span>
            </>
          )}
          {currentState === "USER_SHADOWING" && (
            <>
              <Mic className="w-3.5 h-3.5 text-amber-500 animate-bounce" />
              <span>Lặp lại theo mẫu</span>
            </>
          )}
          {(currentState === "IDLE" || currentState === "WAITING") && <span>Sẵn sàng</span>}
          {currentState === "PAUSED" && <span>Tạm dừng</span>}
          {currentState === "DONE" && (
            <>
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
              <span>Hoàn thành</span>
            </>
          )}
        </div>
      </div>

      {/* Danh sách câu */}
      <div className="space-y-3 pb-32">
        {sentences.map((s, i) => (
          <SentenceCard
            key={s.id}
            id={`sentence-${i}`}
            sentence={s}
            isActive={i === currentIndex}
            isDone={i < currentIndex}
            shadowingProgress={
              i === currentIndex && currentState === "USER_SHADOWING"
                ? { totalMs: countdown + 1000, remainingMs: countdown }
                : undefined
            }
          />
        ))}
      </div>

      {/* Fixed Bottom Control Bar (Contained in 480px app-shell) */}
      <div className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-[480px] bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-t border-slate-200 dark:border-slate-800 px-4 py-3 pb-safe shadow-2xl z-50">
        <div className="flex items-center justify-between gap-3">
          {/* Nút Câu Trước */}
          <button
            onClick={goToPrev}
            disabled={currentIndex === 0}
            className="w-11 h-11 flex items-center justify-center rounded-2xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 disabled:opacity-30 disabled:cursor-not-allowed transition-colors shrink-0"
            aria-label="Câu trước"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>

          {/* Nút Play / Pause Trung Tâm */}
          {isPlaying ? (
            <button
              onClick={pause}
              className="flex-1 py-3 px-4 rounded-2xl bg-slate-900 dark:bg-slate-800 text-white font-bold hover:bg-slate-800 transition-colors shadow-md flex items-center justify-center gap-2 text-xs"
              aria-label="Tạm dừng"
            >
              <Pause className="w-4 h-4 fill-white" />
              <span>Tạm dừng</span>
            </button>
          ) : (
            <button
              onClick={play as () => void}
              disabled={isYoutube && !ytPlayer}
              className="flex-1 py-3 px-4 rounded-2xl bg-[#FFBA49] hover:bg-[#e6a640] text-slate-900 font-extrabold transition-colors shadow-md flex items-center justify-center gap-2 text-xs disabled:opacity-50"
              aria-label="Phát"
            >
              <Play className="w-4 h-4 fill-slate-900" />
              <span>
                {currentState === "PAUSED"
                  ? "Tiếp tục"
                  : isYoutube && !ytPlayer
                  ? "Đang tải Audio..."
                  : "Bắt đầu đọc"}
              </span>
            </button>
          )}

          {/* Nút Câu Tiếp Theo */}
          <button
            onClick={goToNext}
            disabled={currentIndex >= sentences.length - 1}
            className="w-11 h-11 flex items-center justify-center rounded-2xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 disabled:opacity-30 disabled:cursor-not-allowed transition-colors shrink-0"
            aria-label="Câu tiếp"
          >
            <ChevronRight className="w-5 h-5" />
          </button>

          {/* Chỉ số tiến độ câu */}
          <div className="text-right text-[11px] font-bold text-slate-400 dark:text-slate-500 shrink-0 min-w-[40px]">
            {Math.min(currentIndex + 1, sentences.length)}/{sentences.length}
          </div>
        </div>
      </div>
    </div>
  );
}
