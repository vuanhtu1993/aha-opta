"use client";
import { cn } from "@/lib/utils";
import type { Sentence } from "@/lib/schemas/story-shadowing.schema";

interface SentenceCardProps {
  sentence: Sentence;
  isActive: boolean;
  isDone: boolean;
  id?: string;
  shadowingProgress?: {
    totalMs: number;
    remainingMs: number;
  };
}

export function SentenceCard({ sentence, isActive, isDone, id, shadowingProgress }: SentenceCardProps) {
  // Hiển thị Ruby annotation (từ + IPA) khi câu đang active VÀ có dữ liệu IPA
  const showIPA = isActive && sentence.words && sentence.words.length > 0;

  return (
    <div
      id={id}
      className={cn(
        "relative overflow-hidden px-6 py-4 rounded-xl transition-all duration-300",
        // Active: highlight vàng, phóng to nhẹ
        isActive ? "bg-[#FFBA49] text-slate-900 scale-[1.02] shadow-lg shadow-[#FFBA49]/40 font-bold" : "font-medium",
        // Câu đã đọc: xám, gạch ngang
        !isActive && isDone && "text-slate-400 line-through",
        // Câu chưa tới: xám nhạt
        !isActive && !isDone && "text-slate-500",
        // Khi có IPA: cần thêm padding bottom để ruby text không bị cắt
        showIPA ? "text-xl pb-6" : "text-xl"
      )}
    >
      {/* Index number */}
      <span className={cn(
        "text-sm mr-3 transition-colors",
        isActive ? "text-slate-800/60 font-medium" : "font-normal opacity-60"
      )}>
        #{sentence.id + 1}
      </span>

      {showIPA ? (
        // === Chế độ IPA: Ruby annotation — từng từ có phiên âm nhỏ bên dưới ===
        <span className="inline-flex flex-wrap gap-x-2 gap-y-1 items-end leading-none">
          {sentence.words!.map((w, i) => (
            <ruby key={i} className="relative group inline-flex flex-col items-center">
              {/* Từ gốc */}
              <span className="text-xl font-bold">{w.word}</span>
              {/* IPA bên dưới — nhỏ, mờ hơn một chút */}
              <rt className="text-[11px] font-normal text-slate-700/70 not-italic tracking-wide">
                {w.ipa}
              </rt>
            </ruby>
          ))}
        </span>
      ) : (
        // === Chế độ thông thường: hiển thị text thuần ===
        sentence.text
      )}

      {/* Progress bar đếm ngược khi USER_SHADOWING */}
      {shadowingProgress && isActive && shadowingProgress.totalMs > 0 && (
        <div className="absolute bottom-0 left-0 w-full h-[6px] bg-slate-900/10">
          <div
            className="h-full bg-slate-900/40 rounded-r-full transition-all duration-100 ease-linear"
            style={{
              width: `${((shadowingProgress.totalMs - shadowingProgress.remainingMs) / shadowingProgress.totalMs) * 100}%`
            }}
          />
        </div>
      )}
    </div>
  );
}
