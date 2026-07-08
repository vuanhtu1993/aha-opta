"use client";
import { useEffect } from "react";
import { useShadowingPlayer } from "@/lib/hooks/use-shadowing-player";
import { SentenceCard } from "./sentence-card";
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
    <div className="space-y-8">
      {/* Trạng thái hiện tại */}
      <div className="text-center">
        <div className={`inline-flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-semibold shadow-sm border ${
          playerState === "AI_SPEAKING" ? "bg-blue-50 text-blue-700 border-blue-200" :
          playerState === "USER_SHADOWING" ? "bg-[#FFBA49]/10 text-[#d9962a] border-[#FFBA49]/30" :
          playerState === "DONE" ? "bg-green-50 text-green-700 border-green-200" :
          "bg-slate-50 text-slate-600 border-slate-200"
        }`}>
          {playerState === "AI_SPEAKING" && <><span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" /> AI đang đọc</>}
          {playerState === "USER_SHADOWING" && <><span className="w-2 h-2 rounded-full bg-[#FFBA49] animate-bounce" /> Lặp lại theo AI</>}
          {playerState === "IDLE" && "Sẵn sàng để bắt đầu"}
          {playerState === "PAUSED" && "Đã tạm dừng"}
          {playerState === "DONE" && "Hoàn thành bài luyện tập"}
        </div>
      </div>

      {/* Danh sách câu */}
      <div className="space-y-3 max-h-[450px] overflow-y-auto pr-2 custom-scrollbar">
        {sentences.map((s, i) => (
          <SentenceCard
            key={s.id}
            id={`sentence-${i}`}
            sentence={s}
            isActive={i === currentIndex && isPlaying}
            isDone={i < currentIndex}
            shadowingProgress={
              i === currentIndex && playerState === "USER_SHADOWING"
                ? { totalMs: countdown + 1000, remainingMs: countdown }
                : undefined
            }
          />
        ))}
      </div>

      {/* Controls */}
      <div className="flex flex-col sm:flex-row justify-center items-center gap-6 pt-4 border-t border-slate-100">
        <div className="flex items-center gap-4">
          <button
            onClick={goToPrev}
            disabled={currentIndex === 0}
            className="w-12 h-12 flex items-center justify-center rounded-full bg-slate-50 hover:bg-slate-100 border border-slate-200 disabled:opacity-30 disabled:hover:bg-slate-50 transition-colors text-slate-600"
            aria-label="Câu trước"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>

          {isPlaying ? (
            <button
              onClick={pause}
              className="px-10 py-3.5 rounded-full bg-slate-800 text-white font-bold hover:bg-slate-900 transition-colors shadow-lg flex items-center gap-2"
              aria-label="Tạm dừng"
            >
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zM7 8a1 1 0 012 0v4a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v4a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
              Tạm dừng
            </button>
          ) : (
            <button
              onClick={play}
              className="px-10 py-3.5 rounded-full bg-[#FFBA49] text-slate-900 font-bold hover:bg-[#e6a640] transition-colors shadow-lg flex items-center gap-2"
              aria-label="Phát"
            >
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />
              </svg>
              {playerState === "PAUSED" ? "Tiếp tục" : "Bắt đầu đọc"}
            </button>
          )}

          <button
            onClick={goToNext}
            disabled={currentIndex >= sentences.length - 1}
            className="w-12 h-12 flex items-center justify-center rounded-full bg-slate-50 hover:bg-slate-100 border border-slate-200 disabled:opacity-30 disabled:hover:bg-slate-50 transition-colors text-slate-600"
            aria-label="Câu tiếp"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>
      </div>

      {/* Progress tổng */}
      <div className="text-center text-sm text-slate-400">
        Câu {Math.min(currentIndex + 1, sentences.length)} / {sentences.length}
      </div>
    </div>
  );
}
