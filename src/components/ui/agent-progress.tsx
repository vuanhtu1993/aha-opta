"use client";

/**
 * @file agent-progress.tsx
 * @description Unified Mobile-First Floating Bottom Toast HUD for all AI Agent streaming pipelines.
 * Features:
 * - Floating Bottom Docked HUD (non-blocking, context-preserving)
 * - Safe-area aware & automatic Mobile Tab Bar offset detection
 * - Top gradient progress rail with Spring physics
 * - Config-driven adaptable stage stepper (supports 3-5 stages)
 * - Live telemetry status indicator with pulsating pulse signal
 * - Error alert with quick retry action
 *
 * Mapped Spec: FR-VOCAB-07 | FR-SHADOW-04 | AC-VOCAB-09 | AC-SHADOW-03
 * Made by Anh Tu - Share to be share
 */

import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Loader2, CheckCircle2, AlertCircle, Sparkles, X } from "lucide-react";
import { usePathname } from "next/navigation";

export interface AgentStageItem {
  key: string;
  label: string;
  threshold: number;
}

export interface AgentProgressProps {
  /** Controls open/closed visibility state */
  open: boolean;
  /** Main title when running (e.g. "AI Debate Agent", "Shadowing Agent") */
  title?: string;
  /** Title when reaching 100% completion */
  readyTitle?: string;
  /** Subtitle message when reaching 100% completion */
  readyMessage?: string;
  /** Category badge text (e.g. "PREP", "YOUTUBE", "TEXT") */
  badge?: string;
  /** Current progress percentage from 0 to 100 */
  progress: number;
  /** Real-time telemetry message stream from backend */
  stageMessage?: string;
  /** Adaptive milestone stages displayed in the compact grid */
  stages?: AgentStageItem[];
  /** Key of the active stage currently executing */
  activeStageKey?: string;
  /** Error message string if pipeline fails */
  error?: string | null;
  /** Callback triggered when user clicks retry on failure */
  onRetry?: () => void;
  /** Callback triggered when user dismisses/cancels the HUD */
  onCancel?: () => void;
  /** Override safe-area tab bar offset if needed */
  isTabBarHidden?: boolean;
}

export function AgentProgress({
  open,
  title = "AI Agent",
  readyTitle = "Hoàn tất!",
  readyMessage = "Đang chuyển hướng...",
  badge,
  progress = 0,
  stageMessage,
  stages = [],
  activeStageKey,
  error,
  onRetry,
  onCancel,
  isTabBarHidden: explicitTabBarHidden,
}: AgentProgressProps) {
  const pathname = usePathname();

  // Kiểm tra route hiện tại để căn chỉnh khoảng cách đáy an toàn nếu không truyền prop ghi đè
  const shouldHideTabBar =
    explicitTabBarHidden ??
    (pathname?.startsWith("/apps/story-shadowing/player") ||
      pathname?.startsWith("/apps/story-shadowing/create") ||
      pathname?.startsWith("/vocab/speak-your-mind/create") ||
      pathname?.startsWith("/vocab/speak-your-mind/") ||
      pathname?.startsWith("/vocab/review"));

  const isCompleted = progress >= 100 && !error;

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
            shouldHideTabBar
              ? "bottom-[max(1rem,env(safe-area-inset-bottom,0px))]"
              : "bottom-[max(5.25rem,calc(env(safe-area-inset-bottom,0px)+4.75rem))]"
          }`}
        >
          {/* 1. Top Gradient Progress Rail */}
          <div className="w-full h-1 bg-white/10 overflow-hidden">
            <motion.div
              className={`h-full ${
                error
                  ? "bg-rose-500"
                  : "bg-gradient-to-r from-[#FFBA49] via-amber-400 to-amber-200"
              }`}
              initial={{ width: "0%" }}
              animate={{
                width: error ? "100%" : `${Math.min(100, Math.max(progress, 8))}%`,
              }}
              transition={{ duration: 0.4, ease: "easeOut" }}
            />
          </div>

          {/* 2. Identity Header */}
          <div className="px-4 py-3 flex items-center justify-between gap-3 border-b border-white/10">
            <div className="flex items-center gap-2.5 min-w-0">
              <div
                className={`relative flex items-center justify-center w-7 h-7 rounded-xl ${
                  error ? "bg-rose-500/20 text-rose-400" : "bg-amber-500/20 text-[#FFBA49]"
                } shrink-0`}
              >
                {error ? (
                  <AlertCircle className="w-4 h-4" />
                ) : (
                  <Sparkles className="w-4 h-4 animate-pulse" />
                )}
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-1.5">
                  <h3 className="font-bold text-slate-100 text-xs truncate">
                    {error ? "Lỗi thực thi" : isCompleted ? readyTitle : title}
                  </h3>
                  {badge && !error && !isCompleted && (
                    <span className="px-1.5 py-0.2 rounded-sm bg-white/10 text-amber-300 text-[9px] font-bold uppercase tracking-wider">
                      {badge}
                    </span>
                  )}
                </div>
                <p className="text-[10px] text-slate-400 truncate">
                  {error
                    ? "Đã xảy ra sự cố trong quá trình xử lý"
                    : isCompleted
                    ? readyMessage
                    : stageMessage || "Đang xử lý dữ liệu..."}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              {!error && (
                <span
                  className={`text-[11px] font-bold px-2 py-0.5 rounded-full border font-mono ${
                    isCompleted
                      ? "bg-emerald-500/20 text-emerald-300 border-emerald-500/30"
                      : "bg-white/10 text-amber-300 border-white/10"
                  }`}
                >
                  {progress}%
                </span>
              )}
              {isCompleted ? (
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

          {/* 3. Adaptive Stage Stepper (Compact Milestone Grid) */}
          {stages && stages.length > 0 && (
            <div className="px-3 py-2 grid grid-flow-col auto-cols-fr gap-1.5 bg-black/20">
              {stages.map((step, idx) => {
                const isStepCompleted = progress >= step.threshold && !error;
                const isStepActive =
                  !error &&
                  !isStepCompleted &&
                  (activeStageKey
                    ? activeStageKey === step.key
                    : idx === 0 || progress >= stages[idx - 1].threshold);
                const isErrorStep = !!error && isStepActive;

                return (
                  <div
                    key={step.key}
                    className={`flex flex-col items-center gap-1 p-1.5 rounded-xl transition-all ${
                      isStepActive
                        ? "bg-white/15 ring-1 ring-[#FFBA49]/60"
                        : isStepCompleted
                        ? "bg-white/5 opacity-90"
                        : "opacity-40"
                    }`}
                  >
                    <div
                      className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold transition-all ${
                        isStepCompleted
                          ? "bg-[#FFBA49] text-slate-950 shadow-xs"
                          : isStepActive
                          ? "bg-amber-400 text-slate-950 animate-pulse"
                          : isErrorStep
                          ? "bg-rose-500 text-white"
                          : "bg-white/20 text-slate-300"
                      }`}
                    >
                      {isStepCompleted ? (
                        <CheckCircle2 className="w-3.5 h-3.5 stroke-[2.5]" />
                      ) : isErrorStep ? (
                        <AlertCircle className="w-3.5 h-3.5 stroke-[2.5]" />
                      ) : (
                        idx + 1
                      )}
                    </div>
                    <span
                      className={`text-[9px] font-medium text-center leading-tight truncate w-full max-w-[76px] ${
                        isStepActive
                          ? "text-amber-300 font-semibold"
                          : isStepCompleted
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
          )}

          {/* 4. Real-time Telemetry Bar or Error Bar */}
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
                  Thử lại
                </button>
              )}
            </div>
          ) : (
            <div className="px-4 py-2 bg-black/40 flex items-center gap-2 text-[11px] font-medium text-slate-300">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping shrink-0" />
              <p className="truncate flex-1">
                {isCompleted
                  ? "Sẵn sàng khởi động bài tập!"
                  : stageMessage || "Đang kết nối với Agent Gateway..."}
              </p>
            </div>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );
}
