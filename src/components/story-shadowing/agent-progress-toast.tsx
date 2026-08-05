"use client";

import { useAgentStore } from "@/lib/store/useAgentStore";
import { Loader2, CheckCircle2, AlertCircle, Sparkles } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { usePathname } from "next/navigation";

/**
 * Mobile-First PWA Bottom Floating HUD for Agent Streaming Tasks.
 * Anchored nicely above the Mobile Tab Bar within the 480px AppShell container.
 */
export function AgentProgressToast() {
  const { isRunning, title, steps, activeStepId, message, progress } = useAgentStore();
  const pathname = usePathname();

  // Kiểm tra xem trang hiện tại có đang ẩn MobileTabBar không để căn chỉnh khoảng cách đáy
  const isTabBarHidden =
    pathname?.startsWith("/apps/story-shadowing/player") ||
    pathname?.startsWith("/vocab/review");

  // Tính toán phần trăm tiến độ nếu có steps
  const completedCount = steps?.filter((s) => s.status === "completed").length || 0;
  const totalSteps = steps?.length || 0;
  const calculatedProgress =
    progress !== undefined
      ? progress
      : totalSteps > 0
      ? Math.round((completedCount / totalSteps) * 100)
      : 0;

  return (
    <AnimatePresence>
      {isRunning && (
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
          {/* Top Progress Bar */}
          <div className="w-full h-1 bg-white/10 overflow-hidden">
            <motion.div
              className="h-full bg-gradient-to-r from-[#FFBA49] via-amber-400 to-amber-200"
              initial={{ width: "0%" }}
              animate={{
                width: totalSteps > 0 ? `${Math.max(calculatedProgress, 12)}%` : "100%",
              }}
              transition={{ duration: 0.4, ease: "easeOut" }}
            />
          </div>

          {/* Header */}
          <div className="px-4 py-3 flex items-center justify-between gap-3 border-b border-white/10">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="relative flex items-center justify-center w-7 h-7 rounded-xl bg-amber-500/20 text-[#FFBA49] shrink-0">
                <Sparkles className="w-4 h-4 animate-pulse" />
              </div>
              <div className="min-w-0">
                <h3 className="font-bold text-slate-100 text-xs truncate">
                  {title || "AI Agent đang xử lý..."}
                </h3>
                <p className="text-[10px] text-slate-400 truncate">
                  {totalSteps > 0 ? `Đã hoàn tất ${completedCount}/${totalSteps} bước` : "Đang thực thi tác vụ"}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              {totalSteps > 0 && (
                <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-white/10 text-amber-300 border border-white/10">
                  {calculatedProgress}%
                </span>
              )}
              <Loader2 className="w-4 h-4 text-[#FFBA49] animate-spin" />
            </div>
          </div>

          {/* Stepper Timeline (Compact on Mobile) */}
          {steps && steps.length > 0 && (
            <div className="px-3 py-2.5 grid grid-flow-col auto-cols-fr gap-1.5 bg-black/20">
              {steps.map((step, idx) => {
                const isCompleted = step.status === "completed";
                const isActive = step.status === "running" || step.id === activeStepId;
                const isError = step.status === "error";

                return (
                  <div
                    key={step.id}
                    className={`flex flex-col items-center gap-1 p-1.5 rounded-xl transition-all ${
                      isActive
                        ? "bg-white/15 ring-1 ring-[#FFBA49]/60"
                        : isCompleted
                        ? "bg-white/5 opacity-80"
                        : "opacity-40"
                    }`}
                  >
                    <div
                      className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold transition-all ${
                        isCompleted
                          ? "bg-[#FFBA49] text-slate-950 shadow-xs"
                          : isActive
                          ? "bg-amber-400 text-slate-950 animate-pulse"
                          : isError
                          ? "bg-rose-500 text-white"
                          : "bg-white/20 text-slate-300"
                      }`}
                    >
                      {isCompleted ? (
                        <CheckCircle2 className="w-3.5 h-3.5 stroke-[2.5]" />
                      ) : isError ? (
                        <AlertCircle className="w-3.5 h-3.5 stroke-[2.5]" />
                      ) : (
                        idx + 1
                      )}
                    </div>
                    <span
                      className={`text-[9px] font-medium text-center leading-tight truncate w-full max-w-[70px] ${
                        isActive
                          ? "text-amber-300 font-semibold"
                          : isCompleted
                          ? "text-slate-300"
                          : "text-slate-500"
                      }`}
                    >
                      {step.name}
                    </span>
                  </div>
                );
              })}
            </div>
          )}

          {/* Realtime Message Log */}
          <div className="px-4 py-2 bg-black/40 flex items-center gap-2 text-[11px] font-medium text-slate-300">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping shrink-0" />
            <p className="truncate flex-1">
              {message || "Hệ thống đang xử lý dữ liệu..."}
            </p>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
