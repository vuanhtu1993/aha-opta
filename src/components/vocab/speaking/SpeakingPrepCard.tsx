"use client";

/**
 * @file SpeakingPrepCard.tsx
 * @description Card giàn giáo thích ứng hỗ trợ 4 khung tư duy (PREP, PAR, STAR, CCR).
 * Thiết kế tối giản, sạch sẽ, chuẩn Sư phạm (Pedagogical UI), hỗ trợ phát âm câu mẫu qua Web Speech API.
 *
 * Mapped Spec: BR-08 | AC-VOCAB-06 | AC-VOCAB-07
 * Made by Anh Tu - Share to be share
 */

import React, { useState } from "react";
import { Volume2 } from "lucide-react";
import {
  ISpeakingScaffoldStage,
  AdaptiveScaffoldStageItem,
  FrameworkType,
} from "@/lib/types/speaking-quiz";
import { vocabSpeaker } from "@/lib/services/vocab-speaker";

export interface SpeakingPrepCardProps {
  /** Khóa chặng theo chuẩn Legacy ('P' | 'R' | 'E' | 'P2') hoặc chặng động ('problem', 'advice', ...) */
  stageKey?: "P" | "R" | "E" | "P2" | string;
  /** Dữ liệu chặng giàn giáo (hỗ trợ cả format Legacy và Adaptive v1.3) */
  stageData: ISpeakingScaffoldStage | AdaptiveScaffoldStageItem;
  /** Loại khung tư duy (PREP, PAR, STAR, CCR) */
  frameworkType?: FrameworkType;
  /** Vị trí chặng (1, 2, 3, 4) */
  stageIndex?: number;
  /** Bắt buộc mở câu mẫu mà không cần bấm lật */
  isForceRevealed?: boolean;
}

interface StageBadgeConfig {
  letter: string;
  label: string;
  badge: string;
}

/**
 * Tra cứu ký tự viết tắt và màu sắc theo loại khung hoặc stageKey
 */
function resolveStageConfig(
  stageKey?: string,
  frameworkType?: FrameworkType,
  stageIndex?: number,
  title?: string
): StageBadgeConfig {
  const normalizedKey = (stageKey || "").toLowerCase();

  // 1. Ánh xạ theo Legacy keys
  if (stageKey === "P") {
    return {
      letter: "P",
      label: "Point",
      badge: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-300/40 dark:border-emerald-800",
    };
  }
  if (stageKey === "R" && frameworkType !== "PAR" && frameworkType !== "CCR" && frameworkType !== "STAR") {
    return {
      letter: "R",
      label: "Reason",
      badge: "bg-blue-500/10 text-blue-700 dark:text-blue-300 border-blue-300/40 dark:border-blue-800",
    };
  }
  if (stageKey === "E") {
    return {
      letter: "E",
      label: "Example",
      badge: "bg-amber-500/10 text-amber-700 dark:text-amber-300 border-amber-300/40 dark:border-amber-800",
    };
  }
  if (stageKey === "P2") {
    return {
      letter: "P",
      label: "Conclusion",
      badge: "bg-purple-500/10 text-purple-700 dark:text-purple-300 border-purple-300/40 dark:border-purple-800",
    };
  }

  // 2. Ánh xạ theo Semantic stageKey của các khung thích ứng v1.3
  if (normalizedKey.includes("problem")) {
    return {
      letter: "P",
      label: "Problem",
      badge: "bg-rose-500/10 text-rose-700 dark:text-rose-300 border-rose-300/40 dark:border-rose-800",
    };
  }
  if (normalizedKey.includes("advice") || normalizedKey.includes("action") && frameworkType === "PAR") {
    return {
      letter: "A",
      label: "Advice",
      badge: "bg-blue-500/10 text-blue-700 dark:text-blue-300 border-blue-300/40 dark:border-blue-800",
    };
  }
  if (normalizedKey.includes("alternative")) {
    return {
      letter: "A",
      label: "Alternative",
      badge: "bg-amber-500/10 text-amber-700 dark:text-amber-300 border-amber-300/40 dark:border-amber-800",
    };
  }
  if (normalizedKey.includes("situation")) {
    return {
      letter: "S",
      label: "Situation",
      badge: "bg-sky-500/10 text-sky-700 dark:text-sky-300 border-sky-300/40 dark:border-sky-800",
    };
  }
  if (normalizedKey.includes("task")) {
    return {
      letter: "T",
      label: "Task",
      badge: "bg-indigo-500/10 text-indigo-700 dark:text-indigo-300 border-indigo-300/40 dark:border-indigo-800",
    };
  }
  if (normalizedKey.includes("action")) {
    return {
      letter: "A",
      label: "Action",
      badge: "bg-blue-500/10 text-blue-700 dark:text-blue-300 border-blue-300/40 dark:border-blue-800",
    };
  }
  if (normalizedKey.includes("result") || normalizedKey.includes("outcome")) {
    return {
      letter: "R",
      label: "Result",
      badge: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-300/40 dark:border-emerald-800",
    };
  }
  if (normalizedKey.includes("claim")) {
    return {
      letter: "C",
      label: "Claim",
      badge: "bg-blue-500/10 text-blue-700 dark:text-blue-300 border-blue-300/40 dark:border-blue-800",
    };
  }
  if (normalizedKey.includes("concession") || normalizedKey.includes("counter")) {
    return {
      letter: "C",
      label: "Concession",
      badge: "bg-amber-500/10 text-amber-700 dark:text-amber-300 border-amber-300/40 dark:border-amber-800",
    };
  }
  if (normalizedKey.includes("resolution")) {
    return {
      letter: "R",
      label: "Resolution",
      badge: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-300/40 dark:border-emerald-800",
    };
  }

  // 3. Fallback theo số thứ tự stageIndex (1, 2, 3, 4)
  const defaultLetters = ["1", "2", "3", "4"];
  const letter = (stageIndex && stageIndex >= 1 && stageIndex <= 4)
    ? defaultLetters[stageIndex - 1]
    : title?.charAt(0).toUpperCase() || "S";

  return {
    letter,
    label: title || `Stage ${stageIndex || 1}`,
    badge: "bg-slate-500/10 text-slate-700 dark:text-slate-300 border-slate-300/40 dark:border-slate-700",
  };
}

export function SpeakingPrepCard({
  stageKey = "P",
  stageData,
  frameworkType = "PREP",
  stageIndex,
  isForceRevealed = false,
}: SpeakingPrepCardProps) {
  const [isRevealed, setIsRevealed] = useState(false);
  const showModel = isForceRevealed || isRevealed;

  const config = resolveStageConfig(stageKey, frameworkType, stageIndex, stageData.title);

  const handleSpeak = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (stageData.modelAnswer) {
      vocabSpeaker.speak(stageData.modelAnswer);
    }
  };

  return (
    <div
      className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl p-4 space-y-3 shadow-2xs hover:border-slate-300 dark:hover:border-slate-700 transition-all cursor-pointer select-none"
      onClick={() => setIsRevealed(!isRevealed)}
    >
      {/* 1. Header: Stage Tag, Title & Hint */}
      <div className="flex items-start justify-between gap-3">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span
              className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-black uppercase tracking-wider border ${config.badge}`}
            >
              <span>{config.letter}</span>
              <span className="opacity-40">•</span>
              <span>{config.label}</span>
            </span>

            {stageData.title && stageData.title !== config.label && (
              <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
                {stageData.title}
              </span>
            )}
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 font-medium leading-relaxed">
            {stageData.hint}
          </p>
        </div>
      </div>

      {/* 2. Signposts (Concise Chips) */}
      {stageData.signposts && stageData.signposts.length > 0 && (
        <div className="flex flex-wrap gap-1.5 pt-0.5">
          {stageData.signposts.map((signpost, idx) => (
            <span
              key={idx}
              className="text-[11px] font-medium text-slate-600 dark:text-slate-300 bg-slate-50 dark:bg-slate-800/80 border border-slate-200/70 dark:border-slate-800 px-2 py-0.5 rounded-md"
            >
              {signpost}
            </span>
          ))}
        </div>
      )}

      {/* 3. Model Answer (Minimalist Expansion) */}
      {showModel && (
        <div className="mt-2.5 p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/60 dark:border-slate-800 space-y-1.5">
          <div className="flex items-center justify-between gap-2">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
              Model Answer
            </span>
            <button
              type="button"
              onClick={handleSpeak}
              className="p-1 text-slate-400 hover:text-amber-500 dark:hover:text-amber-400 transition-colors cursor-pointer"
              title="Listen (Speech)"
            >
              <Volume2 className="w-3.5 h-3.5" />
            </button>
          </div>
          <p className="text-sm text-slate-800 dark:text-slate-200 font-medium leading-relaxed italic">
            "{stageData.modelAnswer}"
          </p>
        </div>
      )}
    </div>
  );
}
