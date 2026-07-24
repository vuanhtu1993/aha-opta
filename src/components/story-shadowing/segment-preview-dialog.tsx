"use client";

import { useState, useEffect } from "react";
import type { SuggestedSegment } from "@/lib/agents/story-shadowing-agent/nodes/youtube-segment-suggester.node";

interface SegmentPreviewDialogProps {
  open: boolean;
  videoTitle: string;
  segments: SuggestedSegment[];
  onConfirm: (selectedSegments: SuggestedSegment[]) => void;
  onCancel: () => void;
}

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

  if (!open) return null;

  const toggleSelect = (index: number) => {
    setSegments((prev) =>
      prev.map((item, i) => (i === index ? { ...item, selected: !item.selected } : item))
    );
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="w-full max-w-2xl bg-white rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh] border border-slate-100">
        {/* Header */}
        <div className="p-6 bg-slate-900 text-white flex justify-between items-start">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/20 text-indigo-300 text-xs font-semibold mb-2">
              🎬 AI Suggestion • {segments.length} phần bài học
            </div>
            <h3 className="text-xl font-bold">Video dài — Gợi ý chia nhỏ bài học</h3>
            <p className="text-sm text-slate-300 line-clamp-1 mt-1">{videoTitle}</p>
          </div>
          <button
            onClick={onCancel}
            className="text-slate-400 hover:text-white p-1 transition-colors"
          >
            ✕
          </button>
        </div>

        {/* List of segments */}
        <div className="flex-1 overflow-y-auto p-6 space-y-3 bg-slate-50">
          {segments.map((seg, idx) => (
            <div
              key={idx}
              className={`flex items-start gap-4 p-4 rounded-xl border transition-all ${
                seg.selected
                  ? "bg-white border-indigo-200 shadow-sm"
                  : "bg-slate-100/70 border-slate-200 opacity-60"
              }`}
            >
              <input
                type="checkbox"
                checked={seg.selected}
                onChange={() => toggleSelect(idx)}
                className="mt-2.5 h-4 w-4 text-indigo-600 rounded border-slate-300 focus:ring-indigo-500 cursor-pointer"
              />
              <div className="flex-1 space-y-2">
                <input
                  type="text"
                  value={seg.title}
                  onChange={(e) => updateTitle(idx, e.target.value)}
                  className="w-full font-semibold text-slate-800 text-base bg-transparent border-b border-dashed border-slate-300 focus:border-indigo-500 focus:outline-none py-0.5"
                  placeholder="Tiêu đề bài học..."
                />
                <div className="flex items-center gap-4 text-xs font-medium text-slate-500">
                  <span className="flex items-center gap-1">
                    ⏱️ Thời lượng: {formatDuration(seg.endMs - seg.startMs)}
                  </span>
                  <span className="flex items-center gap-1">
                    📍 Block {seg.blockStart + 1} → {seg.blockEnd + 1}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="p-4 bg-white border-t border-slate-100 flex items-center justify-between">
          <div className="text-xs text-slate-500">
            Đã chọn <strong className="text-slate-800">{selectedCount}/{segments.length}</strong> phần (Dự kiến: ~{selectedCount * 30}s tạo)
          </div>
          <div className="flex gap-3">
            <button
              onClick={onCancel}
              className="px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
            >
              Hủy bỏ
            </button>
            <button
              disabled={selectedCount === 0}
              onClick={handleConfirm}
              className="px-6 py-2 text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-40 rounded-xl shadow-lg shadow-indigo-500/20 transition-all"
            >
              Tạo {selectedCount} phần bài học →
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
