"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { mutate } from "swr";
import { Volume2, ChevronDown, Trash2, Clock, Sparkles } from "lucide-react";

export interface VocabCardData {
  _id: string;
  word: string;
  ipa?: string;
  explanation?: string;
  level?: string;
  wordFamily?: Array<{ word: string; pos?: string; meaning?: string }>;
  collocations?: Array<{ phrase: string; meaning?: string; example?: string }>;
  sourceStorybookTitle?: string;
  fsrs?: {
    due?: string;
    stability?: number;
    reps?: number;
    state?: number;
  };
}

interface VocabCardItemProps {
  card: VocabCardData;
}

/**
 * VocabCardItem - Client Component Island
 * Xử lý phát âm Web Audio, mở rộng thẻ và gọi API xoá thẻ.
 */
export default function VocabCardItem({ card }: VocabCardItemProps) {
  const router = useRouter();
  const [isExpanded, setIsExpanded] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const playAudio = (word: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      const utterance = new SpeechSynthesisUtterance(word);
      utterance.lang = "en-US";
      utterance.rate = 0.9;
      window.speechSynthesis.speak(utterance);
    }
  };

  const handleDelete = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm(`Bạn có chắc muốn xoá từ "${card.word}" khỏi danh mục SRS không?`)) {
      return;
    }

    try {
      setIsDeleting(true);
      const res = await fetch(`/api/vocab/${card._id}`, { method: "DELETE" });
      if (res.ok) {
        mutate("/api/vocab/due-count");
        router.refresh();
      }
    } catch (err) {
      console.error("Failed to delete card", err);
    } finally {
      setIsDeleting(false);
    }
  };

  const formatDueText = (dueDateStr?: string, stability: number = 0) => {
    if (!dueDateStr) return { text: "Mới tạo", color: "text-slate-500 bg-slate-100" };
    const due = new Date(dueDateStr);
    const now = new Date();
    const diffHours = Math.round((due.getTime() - now.getTime()) / (1000 * 60 * 60));

    if (diffHours <= 0) {
      return {
        text: "Cần ôn hôm nay ⏰",
        color: "text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/40 border-rose-200 dark:border-rose-900",
      };
    } else if (diffHours < 24) {
      return {
        text: `Ôn sau ${diffHours}h`,
        color: "text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/40 border-amber-200 dark:border-amber-900",
      };
    } else {
      const days = Math.round(diffHours / 24);
      if (stability >= 30) {
        return {
          text: `Đã nhớ lâu (${days}d)`,
          color: "text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800",
        };
      }
      return {
        text: `Ôn sau ${days} ngày`,
        color: "text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/40 border-blue-200 dark:border-blue-800",
      };
    }
  };

  const dueInfo = formatDueText(card.fsrs?.due, card.fsrs?.stability);

  return (
    <div
      className={`bg-white dark:bg-slate-800 rounded-2xl border border-slate-200/80 dark:border-slate-700 shadow-2xs overflow-hidden transition-all duration-200 ${
        isDeleting ? "opacity-50 pointer-events-none" : ""
      }`}
    >
      <div
        className="p-3.5 flex items-start justify-between gap-3 cursor-pointer hover:bg-slate-50/80 dark:hover:bg-slate-750/80"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex-1 min-w-0 space-y-1">
          <div className="flex items-center flex-wrap gap-2">
            <span className="text-sm font-extrabold text-slate-900 dark:text-white">
              {card.word}
            </span>
            {card.ipa && (
              <span className="font-mono text-[11px] text-slate-400">
                {card.ipa}
              </span>
            )}
            <button
              onClick={(e) => playAudio(card.word, e)}
              className="p-1 text-slate-400 hover:text-amber-500 rounded-full hover:bg-amber-50 dark:hover:bg-slate-700 transition-colors"
              title="Phát âm"
            >
              <Volume2 className="w-3.5 h-3.5" />
            </button>
            {card.level && (
              <span className="px-1.5 py-0.5 rounded-md bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 text-[10px] font-bold border border-amber-200 dark:border-amber-900">
                {card.level}
              </span>
            )}
          </div>

          <p className="text-xs text-slate-600 dark:text-slate-300 line-clamp-1">
            {card.explanation}
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <span
            className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${dueInfo.color}`}
          >
            {dueInfo.text}
          </span>
          <ChevronDown
            className={`w-4 h-4 text-slate-400 transition-transform duration-200 ${
              isExpanded ? "rotate-180" : ""
            }`}
          />
        </div>
      </div>

      {/* Expanded Details Drawer */}
      {isExpanded && (
        <div className="px-3.5 pb-3.5 pt-1 border-t border-slate-100 dark:border-slate-700/60 space-y-3 text-xs">
          {/* Detailed Explanation */}
          <div className="space-y-1">
            <div className="text-[10px] font-bold text-slate-400">Định nghĩa chi tiết:</div>
            <p className="text-slate-700 dark:text-slate-200 bg-slate-50 dark:bg-slate-750 p-2.5 rounded-xl border border-slate-100 dark:border-slate-700">
              {card.explanation}
            </p>
          </div>

          {/* Word Family */}
          {card.wordFamily && card.wordFamily.length > 0 && (
            <div className="space-y-1">
              <div className="text-[10px] font-bold text-slate-400">Gia đình từ (Word Family):</div>
              <div className="flex flex-wrap gap-1.5">
                {card.wordFamily.map((wf, idx) => (
                  <span
                    key={idx}
                    className="px-2 py-0.5 bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-lg text-[11px]"
                  >
                    <span className="font-bold">{wf.word}</span>
                    {wf.pos && <span className="text-slate-400 ml-1">({wf.pos})</span>}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Collocations */}
          {card.collocations && card.collocations.length > 0 && (
            <div className="space-y-1">
              <div className="text-[10px] font-bold text-slate-400">Cụm từ liên quan (Collocations):</div>
              <div className="space-y-1">
                {card.collocations.map((col, idx) => (
                  <div
                    key={idx}
                    className="bg-amber-50/50 dark:bg-amber-950/20 p-2 rounded-xl border border-amber-100 dark:border-amber-900/40 text-[11px]"
                  >
                    <div className="font-bold text-amber-900 dark:text-amber-300">
                      {col.phrase}
                    </div>
                    {col.meaning && (
                      <div className="text-slate-500 dark:text-slate-400 text-[10px]">
                        {col.meaning}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Footer Metadata & Actions */}
          <div className="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-slate-700 text-[10px] text-slate-400">
            <div className="flex items-center gap-3">
              <span className="flex items-center gap-1">
                <Sparkles className="w-3 h-3 text-amber-500" />
                <span>Độ bền: {Math.round((card.fsrs?.stability || 0) * 10) / 10}d</span>
              </span>
              <span className="flex items-center gap-1">
                <Clock className="w-3 h-3 text-blue-500" />
                <span>Đã ôn: {card.fsrs?.reps || 0} lần</span>
              </span>
            </div>

            <button
              onClick={handleDelete}
              className="flex items-center gap-1 text-rose-500 hover:text-rose-600 p-1 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors"
              title="Xoá từ vựng"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Xoá</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
