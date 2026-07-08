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
        "relative overflow-hidden px-6 py-4 rounded-xl text-xl font-medium transition-all duration-300",
        isActive && "bg-indigo-600 text-white scale-[1.02] shadow-lg shadow-indigo-500/30",
        !isActive && isDone && "text-slate-400 line-through",
        !isActive && !isDone && "text-slate-500"
      )}
    >
      <span className="text-sm font-normal opacity-60 mr-3">#{sentence.id + 1}</span>
      {sentence.text}

      {shadowingProgress && isActive && shadowingProgress.totalMs > 0 && (
        <div className="absolute bottom-0 left-0 w-full h-[6px] bg-white/20">
          <div
            className="h-full bg-yellow-400 shadow-[0_0_8px_rgba(250,204,21,0.6)] transition-all duration-100 ease-linear rounded-r-full"
            style={{
              width: `${((shadowingProgress.totalMs - shadowingProgress.remainingMs) / shadowingProgress.totalMs) * 100}%`
            }}
          />
        </div>
      )}
    </div>
  );
}
