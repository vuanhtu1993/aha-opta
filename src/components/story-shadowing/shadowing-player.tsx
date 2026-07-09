"use client";
import { useEffect } from "react";
import { useShadowingPlayer } from "@/lib/hooks/use-shadowing-player";
import { SentenceCard } from "./sentence-card";
import type { Sentence } from "@/lib/schemas/story-shadowing.schema";

interface ShadowingPlayerProps {
  sentences: Sentence[];
  title?: string;
  level?: "easy" | "medium" | "hard" | null;
  speakingRate?: number;
  onBack?: () => void;
}

export function ShadowingPlayer({ sentences, title, level, speakingRate, onBack }: ShadowingPlayerProps) {
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
    <div className="space-y-4">
      {/* Header (Title, Back Button, Player State, Level) */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3 flex-1 min-w-0">
          {onBack && (
            <button
              onClick={onBack}
              className="p-2 -ml-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-full transition-colors flex-shrink-0"
              aria-label="Danh sách bài"
            >
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-5 h-5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5 3 12m0 0 7.5-7.5M3 12h18" />
              </svg>
            </button>
          )}
          
          <h1 className="text-xl font-bold text-slate-800 truncate" title={title || "Luyện Shadowing"}>
            {title || "Luyện Shadowing"}
          </h1>

          {/* Trạng thái Player Inline */}
          <div className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold flex-shrink-0 ml-2 ${
            playerState === "AI_SPEAKING" ? "bg-blue-50 text-blue-700" :
            playerState === "USER_SHADOWING" ? "bg-[#FFBA49]/10 text-[#d9962a]" :
            playerState === "DONE" ? "bg-green-50 text-green-700" :
            "bg-slate-50 text-slate-600"
          }`}>
            {playerState === "AI_SPEAKING" && <><span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse" /> AI đang đọc</>}
            {playerState === "USER_SHADOWING" && <><span className="w-1.5 h-1.5 rounded-full bg-[#FFBA49] animate-bounce" /> Lặp lại theo AI</>}
            {playerState === "IDLE" && "Sẵn sàng"}
            {playerState === "PAUSED" && "Tạm dừng"}
            {playerState === "DONE" && "Hoàn thành"}
          </div>
        </div>

        {/* Tags */}
        <div className="flex items-center flex-wrap gap-2 text-xs">
          {level && (
            <span className={`px-3 py-1 rounded-full font-bold shadow-sm ${
              level === 'easy' ? 'bg-green-100 text-green-700 border border-green-200' :
              level === 'medium' ? 'bg-yellow-100 text-yellow-700 border border-yellow-200' :
              'bg-red-100 text-red-700 border border-red-200'
            }`}>
              {level.toUpperCase()}
            </span>
          )}
          {speakingRate && (
            <span className="text-slate-500 font-medium bg-slate-100 px-3 py-1 rounded-full border border-slate-200">
              Tốc độ: {speakingRate}x
            </span>
          )}
        </div>
      </div>

      {/* Danh sách câu */}
      <div className="space-y-3 max-h-[calc(100vh-320px)] sm:max-h-[450px] overflow-y-auto pr-2 custom-scrollbar pb-32 sm:pb-4">
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

      {/* Controls & Progress (Sticky bottom on mobile) */}
      <div className="fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-sm border-t border-slate-200 p-4 shadow-[0_-4px_10px_rgba(0,0,0,0.05)] z-50 sm:relative sm:bg-transparent sm:backdrop-blur-none sm:border-t sm:border-slate-100 sm:shadow-none sm:p-0 sm:pt-4">
        <div className="flex flex-col sm:flex-row justify-center items-center gap-4 max-w-2xl mx-auto">
          <div className="flex items-center gap-4">
            <button
              onClick={goToPrev}
              disabled={currentIndex === 0}
              className="w-12 h-12 flex items-center justify-center rounded-full bg-slate-50 hover:bg-slate-100 border border-slate-200 disabled:opacity-30 disabled:hover:bg-slate-50 transition-colors text-slate-600 shadow-sm"
              aria-label="Câu trước"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>

            {isPlaying ? (
              <button
                onClick={pause}
                className="px-8 py-3 rounded-full bg-slate-800 text-white font-bold hover:bg-slate-900 transition-colors shadow-lg flex items-center gap-2"
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
                className="px-8 py-3 rounded-full bg-[#FFBA49] text-slate-900 font-bold hover:bg-[#e6a640] transition-colors shadow-lg flex items-center gap-2"
                aria-label="Phát"
              >
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />
                </svg>
                {playerState === "PAUSED" ? "Tiếp tục" : "Đọc đoạn"}
              </button>
            )}

            <button
              onClick={goToNext}
              disabled={currentIndex >= sentences.length - 1}
              className="w-12 h-12 flex items-center justify-center rounded-full bg-slate-50 hover:bg-slate-100 border border-slate-200 disabled:opacity-30 disabled:hover:bg-slate-50 transition-colors text-slate-600 shadow-sm"
              aria-label="Câu tiếp"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>
          
          {/* Progress tổng */}
          <div className="text-center text-xs font-semibold text-slate-400 mt-1 sm:mt-0 sm:absolute sm:right-0">
            {Math.min(currentIndex + 1, sentences.length)} / {sentences.length}
          </div>
        </div>
      </div>
    </div>
  );
}
