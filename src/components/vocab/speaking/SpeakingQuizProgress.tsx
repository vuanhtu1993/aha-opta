"use client";

/**
 * @file SpeakingQuizProgress.tsx
 * @description Real-time 4-stage pipeline progress indicator:
 * context_resolved (25%) -> question_formulated (50%) -> prep_synthesized (80%) -> completed (100%)
 *
 * Mapped Spec: FR-VOCAB-07 | US-VOCAB-04 | AC-VOCAB-09
 * Made by Anh Tu - Share to be share
 */

import React from "react";
import { AlertCircle } from "lucide-react";

interface SpeakingQuizProgressProps {
  progress: number;
  stageName: string;
  stageMessage: string;
  error?: string | null;
  onRetry?: () => void;
}

const STAGES = [
  {
    key: "context_resolved",
    label: "Context Analysis",
    sub: "Storybook / Topic Context",
    threshold: 25,
  },
  {
    key: "question_formulated",
    label: "Question Design",
    sub: "Debate Dilemma Prompt",
    threshold: 50,
  },
  {
    key: "prep_synthesized",
    label: "PREP Synthesis",
    sub: "4-Stage PREP Scaffold",
    threshold: 80,
  },
  {
    key: "completed",
    label: "Challenge Ready",
    sub: "Model Answer Verified",
    threshold: 100,
  },
];

export function SpeakingQuizProgress({
  progress,
  stageMessage,
  error,
  onRetry,
}: SpeakingQuizProgressProps) {
  if (error) {
    return (
      <div className="bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 rounded-2xl p-5 space-y-3">
        <div className="flex items-center gap-2 text-rose-600 dark:text-rose-400 font-bold text-sm">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>Error Generating Challenge</span>
        </div>
        <p className="text-xs text-rose-700 dark:text-rose-300 leading-relaxed">
          {error}
        </p>
        {onRetry && (
          <button
            type="button"
            onClick={onRetry}
            className="px-3 py-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-xs font-semibold transition-colors cursor-pointer"
          >
            Retry
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 space-y-4 shadow-xs">
      {/* Header & Percentage */}
      <div className="flex items-center justify-between">
        <div className="space-y-0.5">
          <span className="text-[10px] font-black uppercase tracking-wider text-amber-600 dark:text-amber-400">
            Agentic Pipeline
          </span>
          <p className="text-sm font-bold text-slate-800 dark:text-slate-100">
            {stageMessage || "Connecting to AI Agent..."}
          </p>
        </div>
        <span className="text-xl font-black text-amber-600 dark:text-amber-400 font-mono">
          {progress}%
        </span>
      </div>

      {/* Progress Bar */}
      <div className="w-full bg-slate-100 dark:bg-slate-800 h-2 rounded-full overflow-hidden">
        <div
          className="bg-amber-500 h-full transition-all duration-500 ease-out"
          style={{ width: `${Math.min(100, Math.max(5, progress))}%` }}
        />
      </div>

      {/* Stage Grid (Clean typography, no icon clutter) */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1">
        {STAGES.map((s, idx) => {
          const isDone = progress >= s.threshold;
          const isCurrent =
            progress < s.threshold &&
            (idx === 0 || progress >= STAGES[idx - 1].threshold);

          return (
            <div
              key={s.key}
              className={`p-2.5 rounded-xl border text-left transition-all ${
                isDone
                  ? "bg-amber-50/60 dark:bg-amber-950/20 border-amber-200 dark:border-amber-800/80 text-amber-900 dark:text-amber-200"
                  : isCurrent
                  ? "bg-slate-50 dark:bg-slate-800/60 border-amber-400 dark:border-amber-600 animate-pulse text-slate-800 dark:text-slate-200"
                  : "bg-slate-50/50 dark:bg-slate-800/20 border-slate-200/60 dark:border-slate-800 text-slate-400 dark:text-slate-600"
              }`}
            >
              <div className="text-[11px] font-bold truncate mb-0.5">
                {s.label}
              </div>
              <span className="text-[9px] block text-slate-400 dark:text-slate-500 truncate">
                {s.sub}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
