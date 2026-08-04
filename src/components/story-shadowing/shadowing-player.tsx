"use client";

import { useEffect, useState, useCallback } from "react";
import YouTube, { YouTubePlayer } from "react-youtube";
import { useShadowingPlayer } from "@/lib/hooks/use-shadowing-player";
import { useYouTubeShadowingPlayer } from "@/lib/hooks/useYouTubeShadowingPlayer";
import { SentenceCard } from "./sentence-card";
import { Button } from "@/components/ui/button";
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
  const youtubePlayer = useYouTubeShadowingPlayer(
    sourceType === "youtube" ? sentences : [],
    ytPlayer
  );

  // Chọn player phù hợp
  const isYoutube = sourceType === "youtube";
  const player = isYoutube ? youtubePlayer : textPlayer;

  // Ánh xạ State (Text dùng "AI_SPEAKING", YT dùng "PLAYING_AUDIO")
  const currentState = isYoutube
    ? player.playerState === "PLAYING_AUDIO"
      ? "AI_SPEAKING"
      : player.playerState
    : player.playerState;

  const currentIndex = isYoutube
    ? youtubePlayer.currentSentenceIndex
    : textPlayer.currentIndex;
  const countdown = isYoutube ? youtubePlayer.countdownMs : textPlayer.countdown;
  const isPlaying = isYoutube
    ? youtubePlayer.playerState === "PLAYING_AUDIO" ||
      youtubePlayer.playerState === "USER_SHADOWING"
    : textPlayer.isPlaying;

  const play = isYoutube
    ? () => youtubePlayer.playSentence(currentIndex)
    : textPlayer.play;
  const pause = isYoutube ? youtubePlayer.pause : textPlayer.pause;

  const goToNext = useCallback(() => {
    if (currentIndex < sentences.length - 1) {
      isYoutube
        ? youtubePlayer.playSentence(currentIndex + 1)
        : textPlayer.goToNext();
    }
  }, [currentIndex, sentences.length, isYoutube, youtubePlayer, textPlayer]);

  const goToPrev = useCallback(() => {
    if (currentIndex > 0) {
      isYoutube
        ? youtubePlayer.playSentence(currentIndex - 1)
        : textPlayer.goToPrev();
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
      {/* Off-screen YouTube Iframe tuân thủ WebKit/iOS Safari audio pipeline */}
      {isYoutube && youtubeVideoId && (
        <div
          className="fixed -left-[9999px] top-0 pointer-events-none opacity-0 w-1 h-1 overflow-hidden"
          aria-hidden="true"
        >
          <YouTube
            videoId={youtubeVideoId}
            opts={{
              height: "100",
              width: "100",
              playerVars: {
                controls: 0,
                disablekb: 1,
                playsinline: 1,
                rel: 0,
                modestbranding: 1,
                enablejsapi: 1,
                origin:
                  typeof window !== "undefined"
                    ? window.location.origin
                    : undefined,
              },
            }}
            onReady={handleYtReady}
          />
        </div>
      )}

      {/* Header Info (Title, Player State Status Pill) */}
      <div className="flex items-center justify-between gap-2">
        <div className="min-w-0 flex-1">
          <h1
            className="text-base font-extrabold text-slate-900 dark:text-white truncate"
            title={title || "Luyện Shadowing"}
          >
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
          {(currentState === "IDLE" || currentState === "WAITING") && (
            <span>Sẵn sàng</span>
          )}
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
      <div className="space-y-3 pb-44">
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

      {/* Fixed Bottom Control Bar (Contained in 480px app-shell with iOS Safe Area) */}
      <div className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-[480px] bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl border-t border-slate-200/80 dark:border-slate-800 px-4 pt-3.5 pb-[max(1.25rem,calc(env(safe-area-inset-bottom,0px)+0.75rem))] shadow-[0_-10px_30px_-5px_rgba(0,0,0,0.1)] dark:shadow-[0_-10px_30px_-5px_rgba(0,0,0,0.5)] z-50">
        <div className="flex items-center justify-between gap-3">
          {/* Nút Câu Trước */}
          <Button
            variant="control"
            size="control-square-lg"
            shape="rounded2Xl"
            onClick={goToPrev}
            disabled={currentIndex === 0}
            aria-label="Câu trước"
            className="shadow-2xs active:scale-95"
          >
            <ChevronLeft className="w-6 h-6 stroke-[2.2]" />
          </Button>

          {/* Nút Play / Pause Trung Tâm */}
          {isPlaying ? (
            <Button
              variant="dark"
              size="2xl"
              shape="rounded2Xl"
              onClick={pause}
              className="flex-1 text-sm font-black shadow-md active:scale-[0.98]"
              aria-label="Tạm dừng"
              leftIcon={<Pause className="w-5 h-5 fill-white" />}
            >
              Tạm dừng
            </Button>
          ) : (
            <Button
              variant="amber"
              size="2xl"
              shape="rounded2Xl"
              onClick={play as () => void}
              disabled={isYoutube && !ytPlayer}
              className="flex-1 text-sm font-black shadow-md active:scale-[0.98]"
              aria-label="Phát"
              leftIcon={<Play className="w-5 h-5 fill-slate-900" />}
            >
              {currentState === "PAUSED"
                ? "Tiếp tục"
                : isYoutube && !ytPlayer
                ? "Đang tải Audio..."
                : "Bắt đầu đọc"}
            </Button>
          )}

          {/* Nút Câu Tiếp Theo */}
          <Button
            variant="control"
            size="control-square-lg"
            shape="rounded2Xl"
            onClick={goToNext}
            disabled={currentIndex >= sentences.length - 1}
            aria-label="Câu tiếp"
            className="shadow-2xs active:scale-95"
          >
            <ChevronRight className="w-6 h-6 stroke-[2.2]" />
          </Button>

          {/* Chỉ số tiến độ câu */}
          <div className="text-right text-xs font-extrabold text-slate-400 dark:text-slate-500 shrink-0 min-w-[42px] font-mono">
            {Math.min(currentIndex + 1, sentences.length)}/{sentences.length}
          </div>
        </div>
      </div>
    </div>
  );
}

