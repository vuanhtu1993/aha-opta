"use client";

import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Loader2,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  Volume2,
  BookOpen,
  Split,
  FileCheck,
} from "lucide-react";
import { StoryJobStatus } from "@/hooks/useStoryShadowingJob";

interface StoryShadowingProgressProps {
  status: StoryJobStatus;
  progress: number;
  stageName: string;
  stageMessage: string;
  pipeline: "text" | "youtube";
  error: string | null;
  onRetry?: () => void;
  onCancel?: () => void;
}

interface StepItem {
  id: string;
  label: string;
  icon: React.ElementType;
}

const TEXT_STEPS: StepItem[] = [
  { id: "sentenceSplitter", label: "Tách câu & Phiên âm IPA", icon: Split },
  { id: "keywordIdentifier", label: "Phân tích Từ vựng CEFR", icon: BookOpen },
  { id: "ttsGenerator", label: "Tổng hợp Giọng đọc TTS", icon: Volume2 },
  { id: "keywordEnricher", label: "Làm giàu Ngữ nghĩa & Collocations", icon: Sparkles },
];

const YOUTUBE_STEPS: StepItem[] = [
  { id: "youtubeFetcher", label: "Tải Phụ đề mốc thời gian", icon: FileCheck },
  { id: "youtubeConsolidator", label: "Căn chỉnh Câu & IPA", icon: Split },
  { id: "keywordIdentifier", label: "Trích xuất Từ vựng khó", icon: BookOpen },
  { id: "keywordEnricher", label: "Làm giàu Ngữ cảnh chi tiết", icon: Sparkles },
];

export function StoryShadowingProgress({
  status,
  progress,
  stageName,
  stageMessage,
  pipeline,
  error,
  onRetry,
  onCancel,
}: StoryShadowingProgressProps) {
  if (status === "idle") return null;

  const steps = pipeline === "youtube" ? YOUTUBE_STEPS : TEXT_STEPS;

  const getStepStatus = (stepId: string) => {
    if (status === "completed") return "done";
    if (status === "error") return "error";

    const stepIndex = steps.findIndex((s) => s.id === stepId);
    const currentIndex = steps.findIndex((s) => s.id === stageName);

    if (currentIndex === -1) {
      return stepIndex === 0 ? "current" : "pending";
    }
    if (stepIndex < currentIndex) return "done";
    if (stepIndex === currentIndex) return "current";
    return "pending";
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="w-full max-w-md bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-2xl space-y-6"
      >
        {/* Header */}
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <span className="text-[10px] font-black tracking-wider uppercase px-2.5 py-0.5 rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
              Agent Pipeline • {pipeline.toUpperCase()}
            </span>
            <h3 className="text-base font-black text-slate-900 dark:text-white pt-1">
              Đang tạo bài tập Shadowing
            </h3>
          </div>

          <div className="text-right">
            <span className="text-2xl font-black text-amber-500 font-mono">
              {progress}%
            </span>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="space-y-2">
          <div className="w-full h-2.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
            <motion.div
              className={`h-full transition-all duration-300 ${
                status === "error"
                  ? "bg-rose-500"
                  : status === "completed"
                  ? "bg-emerald-500"
                  : "bg-gradient-to-r from-amber-500 to-orange-500"
              }`}
              initial={{ width: 0 }}
              animate={{ width: `${progress}%` }}
            />
          </div>

          <p className="text-xs text-slate-600 dark:text-slate-300 font-medium truncate flex items-center gap-1.5">
            {status !== "completed" && status !== "error" && (
              <Loader2 className="w-3.5 h-3.5 animate-spin text-amber-500 shrink-0" />
            )}
            {stageMessage || "Đang kết nối tới Agent Gateway..."}
          </p>
        </div>

        {/* Stepper Checklist */}
        <div className="space-y-2.5 py-1">
          {steps.map((step) => {
            const stepStatus = getStepStatus(step.id);
            const Icon = step.icon;

            return (
              <div
                key={step.id}
                className={`flex items-center justify-between p-3 rounded-xl border transition-all ${
                  stepStatus === "done"
                    ? "bg-emerald-50/60 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-900/40 text-emerald-800 dark:text-emerald-300"
                    : stepStatus === "current"
                    ? "bg-amber-50/70 dark:bg-amber-950/30 border-amber-300 dark:border-amber-700/60 text-slate-900 dark:text-white shadow-2xs"
                    : "bg-slate-50/60 dark:bg-slate-800/40 border-slate-100 dark:border-slate-800 text-slate-400 dark:text-slate-500"
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <div
                    className={`p-1.5 rounded-lg ${
                      stepStatus === "done"
                        ? "bg-emerald-500 text-white"
                        : stepStatus === "current"
                        ? "bg-amber-500 text-slate-950 font-bold"
                        : "bg-slate-200 dark:bg-slate-700 text-slate-400"
                    }`}
                  >
                    <Icon className="w-3.5 h-3.5" />
                  </div>
                  <span className="text-xs font-bold">{step.label}</span>
                </div>

                <div>
                  {stepStatus === "done" && (
                    <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                  )}
                  {stepStatus === "current" && (
                    <Loader2 className="w-4 h-4 text-amber-500 animate-spin" />
                  )}
                  {stepStatus === "pending" && (
                    <div className="w-2 h-2 rounded-full bg-slate-300 dark:bg-slate-700" />
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Error Alert */}
        {error && (
          <div className="p-3.5 rounded-xl bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900/60 text-rose-700 dark:text-rose-300 text-xs flex items-start gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <span className="font-bold">Lỗi khởi tạo bài học:</span>
              <p className="text-[11px] leading-relaxed opacity-90">{error}</p>
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="flex items-center justify-end gap-2 pt-2">
          {status === "error" && onRetry && (
            <button
              type="button"
              onClick={onRetry}
              className="px-4 py-2 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-xl text-xs font-bold hover:opacity-90 transition-opacity cursor-pointer"
            >
              Thử lại
            </button>
          )}

          {status !== "completed" && onCancel && (
            <button
              type="button"
              onClick={onCancel}
              className="px-3.5 py-2 text-xs font-bold text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 transition-colors cursor-pointer"
            >
              Hủy bỏ
            </button>
          )}
        </div>
      </motion.div>
    </div>
  );
}
