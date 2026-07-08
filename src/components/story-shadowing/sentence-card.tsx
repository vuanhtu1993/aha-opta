"use client";
import { cn } from "@/lib/utils";
import type { Sentence } from "@/lib/schemas/story-shadowing.schema";

interface SentenceCardProps {
  sentence: Sentence;
  isActive: boolean;
  isDone: boolean;
  id?: string;
}

export function SentenceCard({ sentence, isActive, isDone, id }: SentenceCardProps) {
  return (
    <div
      id={id}
      className={cn(
        "px-6 py-4 rounded-xl text-xl font-medium transition-all duration-300",
        isActive && "bg-indigo-600 text-white scale-[1.02] shadow-lg shadow-indigo-500/30",
        !isActive && isDone && "text-slate-400 line-through",
        !isActive && !isDone && "text-slate-500"
      )}
    >
      <span className="text-sm font-normal opacity-60 mr-3">#{sentence.id + 1}</span>
      {sentence.text}
    </div>
  );
}
