"use client";

import React, { useState } from "react";
import useSWR, { mutate } from "swr";
import { Sparkles, Loader2, CheckCircle2 } from "lucide-react";

const fetcher = (url: string) => fetch(url).then((res) => res.json());

export default function VocabClozeBatchBanner() {
  const { data, isLoading } = useSWR("/api/vocab/generate-cloze-batch", fetcher);
  const [isGenerating, setIsGenerating] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const pendingCount = data?.pendingCount ?? 0;

  if (isLoading || (pendingCount === 0 && !successMessage)) {
    return null; // Don't show banner if no cards need Cloze generation
  }

  const handleGenerateBatch = async () => {
    try {
      setIsGenerating(true);
      setSuccessMessage(null);

      const res = await fetch("/api/vocab/generate-cloze-batch", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ limit: 45 }),
      });

      const result = await res.json();

      if (res.ok && result.success) {
        setSuccessMessage(result.message);
        // Refresh SWR state for pending count, due count, and cards list
        mutate("/api/vocab/generate-cloze-batch");
        mutate("/api/vocab/due-count");
        mutate("/api/vocab");
      }
    } catch (err) {
      console.error("Failed to generate cloze batch", err);
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="bg-gradient-to-r from-indigo-500/10 via-purple-500/10 to-pink-500/10 dark:from-indigo-950/40 dark:via-purple-950/40 dark:to-pink-950/40 border border-indigo-200/80 dark:border-indigo-800/80 rounded-2xl p-4 space-y-2 shadow-2xs">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2 min-w-0">
          <div className="p-2 rounded-xl bg-indigo-500 text-white shrink-0 shadow-xs">
            <Sparkles className="w-4 h-4" />
          </div>
          <div className="min-w-0">
            <h4 className="text-xs font-black text-slate-900 dark:text-white flex items-center gap-1.5">
              <span>Tối ưu câu Cloze với AI</span>
              <span className="px-2 py-0.5 rounded-full bg-indigo-100 dark:bg-indigo-900/60 text-indigo-700 dark:text-indigo-300 text-[10px]">
                Batch AI
              </span>
            </h4>
            <p className="text-[11px] text-slate-600 dark:text-slate-300 line-clamp-1 mt-0.5">
              {successMessage ? (
                <span className="text-emerald-600 dark:text-emerald-400 font-bold flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5 inline" /> {successMessage}
                </span>
              ) : (
                `Có ${pendingCount} từ vựng chưa có câu ví dụ Cloze ngữ cảnh.`
              )}
            </p>
          </div>
        </div>

        {!successMessage && (
          <button
            onClick={handleGenerateBatch}
            disabled={isGenerating}
            className="shrink-0 px-3.5 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-extrabold text-xs rounded-xl shadow-xs transition-all active:scale-95 flex items-center gap-1.5 cursor-pointer"
          >
            {isGenerating ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                <span>Đang sinh câu...</span>
              </>
            ) : (
              <>
                <Sparkles className="w-3.5 h-3.5" />
                <span>Tạo câu Cloze ({pendingCount})</span>
              </>
            )}
          </button>
        )}
      </div>
    </div>
  );
}
