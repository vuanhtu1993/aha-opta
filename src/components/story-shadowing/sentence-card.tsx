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
  return (
    <div
      id={id}
      className={cn(
        "relative overflow-hidden px-6 py-4 rounded-xl text-xl transition-all duration-300",
        isActive ? "bg-[#FFBA49] text-slate-900 scale-[1.02] shadow-lg shadow-[#FFBA49]/40 font-bold" : "font-medium",
        !isActive && isDone && "text-slate-400 line-through",
        !isActive && !isDone && "text-slate-500"
      )}
    >
      <span className={cn(
        "text-sm mr-3 transition-colors", 
        isActive ? "text-slate-800/60 font-medium" : "font-normal opacity-60"
      )}>
        #{sentence.id + 1}
      </span>
      {sentence.text}

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
