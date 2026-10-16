/**
 * @file ReportModal.tsx
 * @description Hộp thoại cho phép người dùng nhập lý do báo cáo nội dung vi phạm
 * 
 * Made by Anh Tu - Share to be share
 */

"use client";

import { useState } from "react";
import { X, Loader2 } from "lucide-react";

interface ReportModalProps {
  isOpen: boolean;
  contentTitle: string;
  onClose: () => void;
  onSubmit: (reason: string) => Promise<void>;
}

const PRESET_REASONS = [
  "Nội dung không liên quan đến học tiếng Anh",
  "Nội dung phản cảm, không phù hợp thuần phong mỹ tục",
  "Giải thích ngữ pháp/từ vựng không chính xác",
  "Video/GIF bị lỗi hoặc không phát được",
];

export function ReportModal({
  isOpen,
  contentTitle,
  onClose,
  onSubmit,
}: ReportModalProps) {
  const [selectedReason, setSelectedReason] = useState<string>("");
  const [customReason, setCustomReason] = useState<string>("");
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const finalReason = customReason.trim() || selectedReason;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!finalReason) {
      setError("Vui lòng chọn hoặc nhập lý do báo cáo");
      return;
    }

    setSubmitting(true);
    setError(null);
    try {
      await onSubmit(finalReason);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gửi báo cáo thất bại");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="w-full max-w-sm rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl p-5 space-y-4">
        <div className="flex items-center justify-between">
          <div className="text-rose-600 dark:text-rose-400 font-bold text-sm">
            <span>Báo cáo nội dung</span>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-full text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-1">
          Bài viết: <span className="font-semibold text-slate-700 dark:text-slate-200">{contentTitle}</span>
        </p>

        <form onSubmit={handleSubmit} className="space-y-3">
          <div className="space-y-2">
            {PRESET_REASONS.map((reason) => (
              <label
                key={reason}
                className="flex items-start gap-2.5 p-2 rounded-xl border border-slate-100 dark:border-slate-800/80 hover:bg-slate-50 dark:hover:bg-slate-800/40 cursor-pointer text-xs transition-colors"
              >
                <input
                  type="radio"
                  name="reportReason"
                  checked={selectedReason === reason}
                  onChange={() => {
                    setSelectedReason(reason);
                    setCustomReason("");
                    setError(null);
                  }}
                  className="mt-0.5 text-rose-600 focus:ring-rose-500"
                />
                <span className="text-slate-700 dark:text-slate-300">{reason}</span>
              </label>
            ))}
          </div>

          <div>
            <textarea
              placeholder="Hoặc nhập lý do khác..."
              value={customReason}
              onChange={(e) => {
                setCustomReason(e.target.value);
                if (e.target.value.trim()) setSelectedReason("");
                setError(null);
              }}
              rows={2}
              className="w-full text-xs p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 focus:outline-hidden focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500"
            />
          </div>

          {error && (
            <p className="text-[11px] text-rose-500 font-medium">{error}</p>
          )}

          <div className="flex gap-2 pt-1">
            <button
              type="button"
              onClick={onClose}
              disabled={submitting}
              className="flex-1 py-2 px-3 rounded-xl border border-slate-200 dark:border-slate-800 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              Hủy
            </button>
            <button
              type="submit"
              disabled={submitting || !finalReason}
              className="flex-1 py-2 px-3 rounded-xl bg-rose-600 hover:bg-rose-700 disabled:opacity-50 text-white text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors shadow-xs"
            >
              {submitting ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Đang gửi...</span>
                </>
              ) : (
                <span>Gửi báo cáo</span>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
