"use client";

import { useAgentStore } from "@/lib/store/useAgentStore";
import { Loader2, CheckCircle2, Circle } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export function AgentProgressToast() {
  const { isRunning, title, steps, activeStepId, message } = useAgentStore();

  return (
    <AnimatePresence>
      {isRunning && (
        <motion.div
          initial={{ opacity: 0, x: 50, y: -20 }}
          animate={{ opacity: 1, x: 0, y: 0 }}
          exit={{ opacity: 0, x: 50, scale: 0.9 }}
          transition={{ duration: 0.3, ease: "easeInOut", bounce: 0.4 }}
          className="fixed top-18 right-2 z-50 w-[400px] bg-white rounded-2xl shadow-2xl border border-slate-100 overflow-hidden flex flex-col"
        >
          {/* Header */}
          <div className="bg-slate-900 px-5 py-4 flex items-center justify-between">
            <h3 className="font-bold text-white text-sm">
              {title || "Đang xử lý..."}
            </h3>
            <Loader2 className="w-4 h-4 text-[#FFBA49] animate-spin" />
          </div>

          {/* Steps */}
          {steps && steps.length > 0 && (
            <div className="p-5 flex items-center justify-between gap-2 border-b border-slate-50">
              {steps.map((step, idx) => {
                const isCompleted = step.status === 'completed';
                const isPending = step.status === 'pending';
                const isActive = step.status === 'running';

                return (
                  <div key={step.id} className="flex flex-col items-center gap-2 flex-1">
                    <div
                      className={`
                        w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold transition-colors
                        ${isCompleted ? "bg-[#FFBA49] text-slate-900" :
                          isActive ? "bg-slate-900 text-white ring-4 ring-slate-100" :
                            "bg-slate-100 text-slate-400"}
                      `}
                    >
                      {isCompleted ? <CheckCircle2 className="w-5 h-5" /> : (idx + 1)}
                    </div>
                    <span className={`text-[10px] font-medium text-center leading-tight ${isActive ? "text-slate-900" : "text-slate-500"}`}>
                      {step.name}
                    </span>
                  </div>
                );
              })}
            </div>
          )}

          {/* Log Message */}
          <div className="px-5 py-3 bg-slate-50 text-xs font-medium text-slate-600 truncate">
            {message || "Vui lòng chờ..."}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
