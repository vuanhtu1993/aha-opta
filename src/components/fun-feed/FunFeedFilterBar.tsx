/**
 * @file FunFeedFilterBar.tsx
 * @description Thanh lọc nhanh Chủ đề (Topic) và Trình độ (Level) cho Fun Feed
 * 
 * Made by Anh Tu - Share to be share
 */

"use client";

import { FunFeedTopic, FunFeedLevel } from "@/lib/types/fun-feed";
import { cn } from "@/lib/utils";

interface FunFeedFilterBarProps {
  selectedTopic?: FunFeedTopic;
  selectedLevel?: FunFeedLevel;
  onSelectTopic: (topic?: FunFeedTopic) => void;
  onSelectLevel: (level?: FunFeedLevel) => void;
}

const TOPICS: { value: FunFeedTopic; label: string; icon: string }[] = [
  { value: "grammar", label: "Ngữ pháp", icon: "📐" },
  { value: "vocabulary", label: "Từ vựng", icon: "📚" },
  { value: "pronunciation", label: "Phát âm", icon: "🗣️" },
  { value: "idiom", label: "Thành ngữ", icon: "💡" },
  { value: "conversation", label: "Giao tiếp", icon: "💬" },
];

const LEVELS: { value: FunFeedLevel; label: string }[] = [
  { value: "beginner", label: "A1-A2" },
  { value: "intermediate", label: "B1-B2" },
  { value: "advanced", label: "C1-C2" },
];

export function FunFeedFilterBar({
  selectedTopic,
  selectedLevel,
  onSelectTopic,
  onSelectLevel,
}: FunFeedFilterBarProps) {
  return (
    <div className="w-full space-y-1.5 py-1 px-3 z-30 pointer-events-auto">
      {/* Topics Scrollable Row */}
      <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar scroll-smooth">
        <button
          onClick={() => onSelectTopic(undefined)}
          className={cn(
            "px-2.5 py-1 rounded-full text-[11px] font-semibold whitespace-nowrap transition-all backdrop-blur-md",
            !selectedTopic
              ? "bg-amber-500 text-slate-950 shadow-xs scale-105"
              : "bg-slate-900/60 text-white/80 hover:bg-slate-900/80 border border-white/10"
          )}
        >
          Tất cả chủ đề
        </button>

        {TOPICS.map((topic) => (
          <button
            key={topic.value}
            onClick={() => onSelectTopic(topic.value)}
            className={cn(
              "px-2.5 py-1 rounded-full text-[11px] font-semibold whitespace-nowrap transition-all flex items-center gap-1 backdrop-blur-md",
              selectedTopic === topic.value
                ? "bg-amber-500 text-slate-950 shadow-xs scale-105"
                : "bg-slate-900/60 text-white/80 hover:bg-slate-900/80 border border-white/10"
            )}
          >
            <span>{topic.icon}</span>
            <span>{topic.label}</span>
          </button>
        ))}
      </div>

      {/* Levels Row */}
      <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar">
        <button
          onClick={() => onSelectLevel(undefined)}
          className={cn(
            "px-2 py-0.5 rounded-md text-[10px] font-bold tracking-wider uppercase transition-all backdrop-blur-md",
            !selectedLevel
              ? "bg-emerald-500 text-slate-950 font-extrabold"
              : "bg-slate-900/40 text-white/60 hover:text-white border border-white/10"
          )}
        >
          All Levels
        </button>

        {LEVELS.map((lvl) => (
          <button
            key={lvl.value}
            onClick={() => onSelectLevel(lvl.value)}
            className={cn(
              "px-2 py-0.5 rounded-md text-[10px] font-bold tracking-wider uppercase transition-all backdrop-blur-md",
              selectedLevel === lvl.value
                ? "bg-emerald-500 text-slate-950 font-extrabold"
                : "bg-slate-900/40 text-white/60 hover:text-white border border-white/10"
            )}
          >
            {lvl.label}
          </button>
        ))}
      </div>
    </div>
  );
}
