"use client";

/**
 * @file SpeakingQuizProgress.tsx
 * @description Component hiển thị tiến trình thời gian thực 4 chặng:
 * context_resolved (25%) -> question_formulated (50%) -> prep_synthesized (80%) -> completed (100%)
 *
 * Mapped Spec: FR-VOCAB-07 | US-VOCAB-04 | AC-VOCAB-09
 * Made by Anh Tu - Share to be share
 */

import React from "react";
import { BookOpen, HelpCircle, Brain, CheckCircle2, AlertCircle } from "lucide-react";

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
    label: "Phân tích Ngữ cảnh",
    sub: "Storybook / Topic Context",
    icon: BookOpen,
    threshold: 25,
  },
  {
    key: "question_formulated",
    label: "Xây dựng Câu hỏi",
    sub: "Debate Dilemma Prompt",
    icon: HelpCircle,
    threshold: 50,
  },
  {
    key: "prep_synthesized",
    label: "Tổng hợp Giàn giáo",
    sub: "4-Stage PREP Scaffold",
    icon: Brain,
    threshold: 80,
  },
  {
    key: "completed",
    label: "Sẵn sàng Luyện nói",
    sub: "Production Model Ready",
    icon: CheckCircle2,
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
          <span>Lỗi trong quá trình tạo bài học</span>
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
            Thử lại
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 space-y-5 shadow-xs">
      {/* Header & Percentage */}
      <div className="flex items-center justify-between">
        <div className="space-y-0.5">
          <span className="text-[10px] font-black uppercase tracking-wider text-amber-600 dark:text-amber-400">
            Agentic Pipeline Progress
          </span>
          <p className="text-sm font-bold text-slate-800 dark:text-slate-100">
            {stageMessage || "Đang kết nối hệ thống AI..."}
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

      {/* Stage Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1">
        {STAGES.map((s, idx) => {
          const isDone = progress >= s.threshold;
          const isCurrent =
            progress < s.threshold &&
            (idx === 0 || progress >= STAGES[idx - 1].threshold);
          const Icon = s.icon;

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
              <div className="flex items-center gap-1.5 mb-1">
                <Icon
                  className={`w-3.5 h-3.5 ${
                    isDone || isCurrent
                      ? "text-amber-600 dark:text-amber-400"
                      : "text-slate-400 dark:text-slate-600"
                  }`}
                />
                <span className="text-[11px] font-bold truncate">{s.label}</span>
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
