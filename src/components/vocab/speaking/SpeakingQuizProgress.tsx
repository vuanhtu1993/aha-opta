"use client";

/**
 * @file SpeakingQuizProgress.tsx
 * @description Mobile-First PWA Floating Bottom Toast HUD for Speaking Quiz Agentic Pipeline.
 * Anchored nicely at the bottom (matching AgentProgressToast architecture).
 * Non-blocking floating toast HUD with framer-motion spring animations.
 *
 * Mapped Spec: FR-VOCAB-07 | US-VOCAB-04 | AC-VOCAB-09
 * Made by Anh Tu - Share to be share
 */

import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Loader2, CheckCircle2, AlertCircle, Sparkles, X } from "lucide-react";
import { usePathname } from "next/navigation";

export interface SpeakingQuizProgressProps {
  open: boolean;
  progress: number;
  stageName: string;
  stageMessage: string;
  error?: string | null;
  onRetry?: () => void;
  onCancel?: () => void;
}

const STAGES = [
  {
    key: "context_resolved",
    label: "Context",
    threshold: 25,
  },
  {
    key: "question_formulated",
    label: "Question",
    threshold: 50,
  },
  {
    key: "prep_synthesized",
    label: "PREP",
    threshold: 80,
  },
  {
    key: "completed",
    label: "Ready",
    threshold: 100,
  },
];

export function SpeakingQuizProgress({
  open,
  progress,
  stageMessage,
  error,
  onRetry,
  onCancel,
}: SpeakingQuizProgressProps) {
  const pathname = usePathname();

  // Kiểm tra route hiện tại để căn chỉnh khoảng cách đáy an toàn
  const isTabBarHidden =
    pathname?.startsWith("/apps/story-shadowing/player") ||
    pathname?.startsWith("/apps/story-shadowing/create") ||
    pathname?.startsWith("/vocab/speak-your-mind/create") ||
    pathname?.startsWith("/vocab/speak-your-mind/") ||
    pathname?.startsWith("/vocab/review");

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          role="status"
          aria-live="polite"
          initial={{ opacity: 0, y: 32, scale: 0.96 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 24, scale: 0.96 }}
          transition={{ type: "spring", stiffness: 380, damping: 28 }}
          className={`fixed left-1/2 -translate-x-1/2 w-[calc(100%-1.5rem)] max-w-[448px] z-50 bg-slate-900/95 dark:bg-slate-900/95 backdrop-blur-xl rounded-2xl shadow-2xl border border-white/15 text-white overflow-hidden flex flex-col transition-all duration-300 ${
            isTabBarHidden
              ? "bottom-[max(1rem,env(safe-area-inset-bottom,0px))]"
              : "bottom-[max(5.25rem,calc(env(safe-area-inset-bottom,0px)+4.75rem))]"
          }`}
        >
          {/* 1. Top Gradient Progress Bar */}
          <div className="w-full h-1 bg-white/10 overflow-hidden">
            <motion.div
              className={`h-full ${
                error
                  ? "bg-rose-500"
                  : "bg-gradient-to-r from-[#FFBA49] via-amber-400 to-amber-200"
              }`}
              initial={{ width: "0%" }}
              animate={{
                width: error
                  ? "100%"
                  : `${Math.min(100, Math.max(progress, 8))}%`,
              }}
              transition={{ duration: 0.4, ease: "easeOut" }}
            />
          </div>

          {/* 2. Header Shell */}
          <div className="px-4 py-3 flex items-center justify-between gap-3 border-b border-white/10">
            <div className="flex items-center gap-2.5 min-w-0">
              <div
                className={`relative flex items-center justify-center w-7 h-7 rounded-xl ${
                  error
                    ? "bg-rose-500/20 text-rose-400"
                    : "bg-amber-500/20 text-[#FFBA49]"
                } shrink-0`}
              >
                {error ? (
                  <AlertCircle className="w-4 h-4" />
                ) : (
                  <Sparkles className="w-4 h-4 animate-pulse" />
                )}
              </div>
              <div className="min-w-0">
                <h3 className="font-bold text-slate-100 text-xs truncate">
                  {error
                    ? "Generation Error"
                    : progress >= 100
                    ? "Challenge Ready!"
                    : "AI Debate Agent"}
                </h3>
                <p className="text-[10px] text-slate-400 truncate">
                  {error
                    ? "Pipeline encountered an issue"
                    : progress >= 100
                    ? "Redirecting to Speak Your Mind..."
                    : stageMessage || "Synthesizing PREP debate challenge..."}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              {!error && (
                <span
                  className={`text-[11px] font-bold px-2 py-0.5 rounded-full border font-mono ${
                    progress >= 100
                      ? "bg-emerald-500/20 text-emerald-300 border-emerald-500/30"
                      : "bg-white/10 text-amber-300 border-white/10"
                  }`}
                >
                  {progress}%
                </span>
              )}
              {progress >= 100 ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              ) : !error ? (
                <Loader2 className="w-4 h-4 text-[#FFBA49] animate-spin" />
              ) : (
                onCancel && (
                  <button
                    type="button"
                    onClick={onCancel}
                    className="p-1 rounded-lg text-slate-400 hover:text-white transition-colors cursor-pointer"
                    title="Dismiss"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )
              )}
            </div>
          </div>

          {/* 3. Stepper Timeline (Compact 4 PREP Stages) */}
          <div className="px-3 py-2 grid grid-flow-col auto-cols-fr gap-1.5 bg-black/20">
            {STAGES.map((step, idx) => {
              const isCompleted = progress >= step.threshold && !error;
              const isActive =
                !error &&
                progress < step.threshold &&
                (idx === 0 || progress >= STAGES[idx - 1].threshold);
              const isErrorStep = !!error && isActive;

              return (
                <div
                  key={step.key}
                  className={`flex flex-col items-center gap-1 p-1.5 rounded-xl transition-all ${
                    isActive
                      ? "bg-white/15 ring-1 ring-[#FFBA49]/60"
                      : isCompleted
                      ? "bg-white/5 opacity-90"
                      : "opacity-40"
                  }`}
                >
                  <div
                    className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold transition-all ${
                      isCompleted
                        ? "bg-[#FFBA49] text-slate-950 shadow-xs"
                        : isActive
                        ? "bg-amber-400 text-slate-950 animate-pulse"
                        : isErrorStep
                        ? "bg-rose-500 text-white"
                        : "bg-white/20 text-slate-300"
                    }`}
                  >
                    {isCompleted ? (
                      <CheckCircle2 className="w-3.5 h-3.5 stroke-[2.5]" />
                    ) : isErrorStep ? (
                      <AlertCircle className="w-3.5 h-3.5 stroke-[2.5]" />
                    ) : (
                      idx + 1
                    )}
                  </div>
                  <span
                    className={`text-[9px] font-medium text-center leading-tight truncate w-full max-w-[76px] ${
                      isActive
                        ? "text-amber-300 font-semibold"
                        : isCompleted
                        ? "text-slate-300"
                        : "text-slate-500"
                    }`}
                  >
                    {step.label}
                  </span>
                </div>
              );
            })}
          </div>

          {/* 4. Realtime Message Log or Error Action Bar */}
          {error ? (
            <div className="px-4 py-2.5 bg-rose-950/40 flex items-center justify-between gap-2 text-xs">
              <p className="text-[11px] text-rose-300 truncate flex-1 leading-tight">
                {error}
              </p>
              {onRetry && (
                <button
                  type="button"
                  onClick={onRetry}
                  className="px-2.5 py-1 bg-rose-600 hover:bg-rose-500 text-white font-bold rounded-lg text-[10px] transition-colors shrink-0 cursor-pointer"
                >
                  Retry
                </button>
              )}
            </div>
          ) : (
            <div className="px-4 py-2 bg-black/40 flex items-center gap-2 text-[11px] font-medium text-slate-300">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping shrink-0" />
              <p className="truncate flex-1">
                {stageMessage || "Formulating structured debate scaffold..."}
              </p>
            </div>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );
}
