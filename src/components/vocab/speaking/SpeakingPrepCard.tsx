"use client";

/**
 * @file SpeakingPrepCard.tsx
 * @description Minimalist PREP scaffold card (Point, Reason, Example, Point).
 *
 * Mapped Spec: BR-08 | AC-VOCAB-06 | AC-VOCAB-07
 * Made by Anh Tu - Share to be share
 */

import React, { useState } from "react";
import { Volume2, ChevronDown, ChevronUp } from "lucide-react";
import { ISpeakingScaffoldStage } from "@/lib/types/speaking-quiz";
import { vocabSpeaker } from "@/lib/services/vocab-speaker";

interface SpeakingPrepCardProps {
  stageKey: "P" | "R" | "E" | "P2";
  stageData: ISpeakingScaffoldStage;
  isForceRevealed?: boolean;
}

const STAGE_CONFIG = {
  P: {
    letter: "P",
    label: "Point",
    badge: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-300/40 dark:border-emerald-800",
  },
  R: {
    letter: "R",
    label: "Reason",
    badge: "bg-blue-500/10 text-blue-700 dark:text-blue-300 border-blue-300/40 dark:border-blue-800",
  },
  E: {
    letter: "E",
    label: "Example",
    badge: "bg-amber-500/10 text-amber-700 dark:text-amber-300 border-amber-300/40 dark:border-amber-800",
  },
  P2: {
    letter: "P",
    label: "Point",
    badge: "bg-purple-500/10 text-purple-700 dark:text-purple-300 border-purple-300/40 dark:border-purple-800",
  },
};

export function SpeakingPrepCard({
  stageKey,
  stageData,
  isForceRevealed = false,
}: SpeakingPrepCardProps) {
  const [isRevealed, setIsRevealed] = useState(false);
  const config = STAGE_CONFIG[stageKey];
  const showModel = isForceRevealed || isRevealed;

  const handleSpeak = (e: React.MouseEvent) => {
    e.stopPropagation();
    vocabSpeaker.speak(stageData.modelAnswer);
  };

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl p-4 space-y-3 shadow-2xs transition-all">
      {/* 1. Header: Stage Tag, Hint & Model Toggle */}
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
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
            {stageData.hint}
          </p>
        </div>

        <button
          type="button"
          onClick={() => setIsRevealed(!isRevealed)}
          className="shrink-0 flex items-center gap-1 text-[11px] font-semibold text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 px-2 py-1 rounded-lg border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/60 transition-colors cursor-pointer"
        >
          <span>{showModel ? "Hide" : "Model"}</span>
          {showModel ? (
            <ChevronUp className="w-3 h-3" />
          ) : (
            <ChevronDown className="w-3 h-3" />
          )}
        </button>
      </div>

      {/* 2. Signposts (Concise Chips) */}
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
          <p className="text-xs text-slate-800 dark:text-slate-200 font-medium leading-relaxed italic">
            "{stageData.modelAnswer}"
          </p>
        </div>
      )}
    </div>
  );
}
