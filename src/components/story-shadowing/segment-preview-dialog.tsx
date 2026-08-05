"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Sparkles, Clock, Layers, Check, Edit3 } from "lucide-react";
import type { SuggestedSegment } from "@/lib/agents/story-shadowing-agent/nodes/youtube-segment-suggester.node";

interface SegmentPreviewDialogProps {
  open: boolean;
  videoTitle: string;
  segments: SuggestedSegment[];
  onConfirm: (selectedSegments: SuggestedSegment[]) => void;
  onCancel: () => void;
}

/**
 * Mobile-First PWA Bottom Sheet Drawer for YouTube Video Splitting Suggestions.
 * Slides smoothly from the bottom with drag-handle aesthetics, quick action chips,
 * tactile touch cards, and a sticky bottom confirmation dock.
 */
export function SegmentPreviewDialog({
  open,
  videoTitle,
  segments: initialSegments,
  onConfirm,
  onCancel,
}: SegmentPreviewDialogProps) {
  const [segments, setSegments] = useState(
    initialSegments.map((s) => ({ ...s, selected: true }))
  );

  useEffect(() => {
    setSegments(initialSegments.map((s) => ({ ...s, selected: true })));
  }, [initialSegments]);

  const toggleSelect = (index: number) => {
    setSegments((prev) =>
      prev.map((item, i) => (i === index ? { ...item, selected: !item.selected } : item))
    );
  };

  const selectAll = (select: boolean) => {
    setSegments((prev) => prev.map((item) => ({ ...item, selected: select })));
  };

  const updateTitle = (index: number, newTitle: string) => {
    setSegments((prev) =>
      prev.map((item, i) => (i === index ? { ...item, title: newTitle } : item))
    );
  };

  const selectedCount = segments.filter((s) => s.selected).length;

  const handleConfirm = () => {
    const selected = segments.filter((s) => s.selected);
    onConfirm(selected);
  };

  const formatDuration = (ms: number) => {
    const totalSec = Math.floor(ms / 1000);
    const m = Math.floor(totalSec / 60);
    const s = totalSec % 60;
    return `${m}:${s.toString().padStart(2, "0")}`;
  };

  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-50 flex items-end justify-center">
          {/* Backdrop Blur */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={onCancel}
            className="fixed inset-0 bg-slate-950/60 dark:bg-slate-950/80 backdrop-blur-xs"
          />

          {/* Bottom Sheet Modal Container */}
          <motion.div
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", stiffness: 350, damping: 32 }}
            className="relative z-10 w-full max-w-[480px] max-h-[88vh] bg-white dark:bg-slate-900 rounded-t-3xl shadow-2xl flex flex-col border-t border-slate-200 dark:border-slate-800 overflow-hidden"
          >
            {/* Drag Handle Bar */}
            <div className="pt-2.5 pb-1 flex justify-center cursor-grab active:cursor-grabbing">
              <div className="w-12 h-1.5 bg-slate-300 dark:bg-slate-700 rounded-full" />
            </div>

            {/* Header */}
            <div className="px-5 py-3 border-b border-slate-100 dark:border-slate-800/80 flex items-start justify-between gap-3">
              <div>
                <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-amber-500/15 text-amber-600 dark:text-amber-400 text-[11px] font-bold mb-1">
                  <Sparkles className="w-3.5 h-3.5" /> Gợi ý phân đoạn • {segments.length} phần
                </div>
                <h3 className="text-lg font-black text-slate-900 dark:text-white tracking-tight">
                  Video dài — Chia nhỏ bài học
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-1 mt-0.5">
                  {videoTitle}
                </p>
              </div>

              <button
                onClick={onCancel}
                className="p-1.5 rounded-full text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                title="Đóng"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Quick Action Filters */}
            <div className="px-5 py-2.5 bg-slate-50/80 dark:bg-slate-900/50 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => selectAll(true)}
                  className="px-2.5 py-1 text-xs font-semibold rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:border-amber-500 transition-colors shadow-2xs"
                >
                  Chọn tất cả
                </button>
                <button
                  type="button"
                  onClick={() => selectAll(false)}
                  className="px-2.5 py-1 text-xs font-semibold rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 transition-colors shadow-2xs"
                >
                  Bỏ chọn
                </button>
              </div>

              <span className="text-xs font-bold text-amber-600 dark:text-amber-400">
                Đã chọn {selectedCount}/{segments.length} phần
              </span>
            </div>

            {/* Scrollable Segment Items List */}
            <div className="flex-1 overflow-y-auto p-4 space-y-2.5 bg-slate-50/50 dark:bg-slate-950/30">
              {segments.map((seg, idx) => {
                const isSelected = seg.selected;

                return (
                  <div
                    key={idx}
                    className={`relative rounded-2xl border p-3.5 transition-all ${
                      isSelected
                        ? "bg-white dark:bg-slate-800/90 border-amber-400/80 dark:border-amber-500/50 shadow-xs ring-1 ring-amber-400/20"
                        : "bg-slate-100/70 dark:bg-slate-800/30 border-slate-200 dark:border-slate-800 opacity-65"
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      {/* Checkbox Trigger Pill */}
                      <button
                        type="button"
                        onClick={() => toggleSelect(idx)}
                        className={`w-6 h-6 mt-0.5 rounded-lg flex items-center justify-center transition-all ${
                          isSelected
                            ? "bg-[#FFBA49] text-slate-950 font-bold shadow-2xs"
                            : "border-2 border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800"
                        }`}
                      >
                        {isSelected && <Check className="w-4 h-4 stroke-[3]" />}
                      </button>

                      {/* Content & Inline Edit Title */}
                      <div className="flex-1 min-w-0 space-y-1.5">
                        <div className="flex items-center gap-1.5">
                          <input
                            type="text"
                            value={seg.title}
                            onChange={(e) => updateTitle(idx, e.target.value)}
                            placeholder="Tiêu đề phần bài học..."
                            className="w-full text-sm font-bold text-slate-800 dark:text-slate-100 bg-transparent border-b border-dashed border-slate-300 dark:border-slate-700 focus:border-amber-500 dark:focus:border-amber-400 focus:outline-none py-0.5 truncate"
                          />
                          <Edit3 className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        </div>

                        {/* Meta Tags */}
                        <div className="flex flex-wrap items-center gap-2 text-[11px] font-medium text-slate-500 dark:text-slate-400">
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-700/60 text-slate-700 dark:text-slate-300">
                            <Clock className="w-3 h-3 text-amber-500" />
                            {formatDuration(seg.endMs - seg.startMs)}
                          </span>
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-700/60 text-slate-700 dark:text-slate-300">
                            <Layers className="w-3 h-3 text-blue-500" />
                            Block {seg.blockStart + 1} ➔ {seg.blockEnd + 1}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Sticky Bottom Confirmation Dock */}
            <div className="p-4 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-3 pb-[max(1rem,env(safe-area-inset-bottom,0px))]">
              <div className="min-w-0">
                <p className="text-xs font-bold text-slate-800 dark:text-slate-200">
                  {selectedCount} phần được chọn
                </p>
                <p className="text-[10px] text-slate-400">
                  Ước tính: ~{selectedCount * 20}s xử lý
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={onCancel}
                  className="px-3.5 py-2.5 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors"
                >
                  Hủy
                </button>
                <button
                  type="button"
                  disabled={selectedCount === 0}
                  onClick={handleConfirm}
                  className="px-5 py-2.5 text-xs font-bold text-slate-950 bg-[#FFBA49] hover:bg-[#e6a640] disabled:opacity-40 disabled:cursor-not-allowed rounded-xl shadow-md shadow-amber-500/20 active:scale-98 transition-all flex items-center gap-1.5"
                >
                  Tạo {selectedCount} bài học ➔
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
