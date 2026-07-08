"use client";
import { useEffect } from "react";
import { useShadowingPlayer } from "@/lib/hooks/use-shadowing-player";
import { SentenceCard } from "./sentence-card";
import { ProgressCountdown } from "./progress-countdown";
import type { Sentence } from "@/lib/schemas/story-shadowing.schema";

interface ShadowingPlayerProps {
  sentences: Sentence[];
}

export function ShadowingPlayer({ sentences }: ShadowingPlayerProps) {
  const { playerState, currentIndex, countdown, play, pause, goToNext, goToPrev, isPlaying } =
    useShadowingPlayer(sentences);

  // Auto-scroll tới câu đang đọc
  useEffect(() => {
    const el = document.getElementById(`sentence-${currentIndex}`);
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "center" });
    }
  }, [currentIndex]);

  return (
    <div className="space-y-6">
      {/* Trạng thái hiện tại */}
      <div className="text-center">
        <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-semibold ${
          playerState === "AI_SPEAKING" ? "bg-blue-100 text-blue-700" :
          playerState === "USER_SHADOWING" ? "bg-green-100 text-green-700" :
          playerState === "DONE" ? "bg-slate-100 text-slate-600" :
          "bg-slate-100 text-slate-500"
        }`}>
          {playerState === "AI_SPEAKING" && <><span className="animate-pulse">🔊</span> AI đang đọc</>}
          {playerState === "USER_SHADOWING" && <><span className="animate-bounce">🎤</span> Lặp lại nào!</>}
          {playerState === "IDLE" && "⏸ Nhấn Play để bắt đầu"}
          {playerState === "PAUSED" && "⏸ Đã tạm dừng"}
          {playerState === "DONE" && "✅ Hoàn thành!"}
        </div>
      </div>

      {/* Progress countdown (chỉ hiện khi USER_SHADOWING) */}
      {playerState === "USER_SHADOWING" && (
        <ProgressCountdown
          totalMs={countdown + 1000}
          remainingMs={countdown}
          isActive={true}
        />
      )}

      {/* Danh sách câu */}
      <div className="space-y-2 max-h-[400px] overflow-y-auto pr-2">
        {sentences.map((s, i) => (
          <SentenceCard
            key={s.id}
            id={`sentence-${i}`}
            sentence={s}
            isActive={i === currentIndex && isPlaying}
            isDone={i < currentIndex}
          />
        ))}
      </div>

      {/* Controls */}
      <div className="flex justify-center items-center gap-4">
        <button
          onClick={goToPrev}
          disabled={currentIndex === 0}
          className="p-3 rounded-full bg-slate-100 hover:bg-slate-200 disabled:opacity-30 transition-colors"
          aria-label="Câu trước"
        >
          ⏮
        </button>

        {isPlaying ? (
          <button
            onClick={pause}
            className="px-8 py-3 rounded-full bg-indigo-600 text-white font-bold hover:bg-indigo-700 transition-colors shadow-lg"
            aria-label="Tạm dừng"
          >
            ⏸ Tạm dừng
          </button>
        ) : (
          <button
            onClick={play}
            className="px-8 py-3 rounded-full bg-indigo-600 text-white font-bold hover:bg-indigo-700 transition-colors shadow-lg"
            aria-label="Phát"
          >
            ▶ {playerState === "PAUSED" ? "Tiếp tục" : "Bắt đầu"}
          </button>
        )}

        <button
          onClick={goToNext}
          disabled={currentIndex >= sentences.length - 1}
          className="p-3 rounded-full bg-slate-100 hover:bg-slate-200 disabled:opacity-30 transition-colors"
          aria-label="Câu tiếp"
        >
          ⏭
        </button>
      </div>

      {/* Progress tổng */}
      <div className="text-center text-sm text-slate-400">
        Câu {Math.min(currentIndex + 1, sentences.length)} / {sentences.length}
      </div>
    </div>
  );
}
