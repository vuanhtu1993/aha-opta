"use client";

/**
 * @file TopicCollocationsCard.tsx
 * @description Component hiển thị bộ cụm từ bản xứ (Topic Collocations & Idioms) theo đề bài.
 * Cung cấp phát âm giọng đọc bản xứ và nút 1-tap lưu trực tiếp vào kho từ vựng SRS (/vocab/review).
 *
 * Mapped Spec: FR-VOCAB-06 | US-VOCAB-03 | BR-08
 * Made by Anh Tu - Share to be share
 */

import React from "react";
import { Volume2, BookmarkPlus, Check, Loader2, Sparkles } from "lucide-react";
import { TopicCollocationItem } from "@/lib/types/speaking-quiz";
import { vocabSpeaker } from "@/lib/services/vocab-speaker";

export interface TopicCollocationsCardProps {
  collocations?: TopicCollocationItem[];
  isSaved: (word: string) => boolean;
  isSaving: (word: string) => boolean;
  onSave: (item: TopicCollocationItem) => void;
}

export function TopicCollocationsCard({
  collocations,
  isSaved,
  isSaving,
  onSave,
}: TopicCollocationsCardProps) {
  if (!collocations || collocations.length === 0) {
    return null;
  }

  const handleSpeak = (e: React.MouseEvent, phrase: string) => {
    e.stopPropagation();
    vocabSpeaker.speak(phrase);
  };

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl p-4.5 space-y-3.5 shadow-2xs">
      {/* 1. Header: Tiêu đề & Giảng giải mục đích sư phạm */}
      <div className="flex items-center justify-between gap-2 border-b border-slate-100 dark:border-slate-800/80 pb-2.5">
        <div className="flex items-center gap-1.5">
          <Sparkles className="w-4 h-4 text-amber-500" />
          <h3 className="text-xs font-black uppercase tracking-wider text-slate-800 dark:text-slate-200">
            Topic Collocations & Idioms
          </h3>
        </div>
        <span className="text-[10px] text-slate-400 font-medium hidden sm:inline">
          Cụm từ bản xứ gợi ý tư duy
        </span>
      </div>

      {/* 2. Danh sách cụm từ (Interactive Cards) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
        {collocations.map((item, idx) => {
          const saved = isSaved(item.phrase);
          const saving = isSaving(item.phrase);

          return (
            <div
              key={idx}
              className="group relative flex flex-col justify-between p-3 rounded-xl bg-slate-50/80 dark:bg-slate-800/50 hover:bg-slate-50 dark:hover:bg-slate-800 border border-slate-200/70 dark:border-slate-700/60 hover:border-amber-300 dark:hover:border-amber-700/60 transition-all space-y-2"
            >
              {/* Tên cụm từ, IPA và nút phát âm */}
              <div className="flex items-start justify-between gap-2">
                <div className="space-y-0.5">
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs font-bold text-slate-900 dark:text-white leading-tight group-hover:text-amber-600 dark:group-hover:text-amber-400 transition-colors">
                      {item.phrase}
                    </span>
                    <button
                      type="button"
                      onClick={(e) => handleSpeak(e, item.phrase)}
                      className="p-0.5 text-slate-400 hover:text-amber-500 transition-colors cursor-pointer"
                      title="Phát âm (Pronounce)"
                    >
                      <Volume2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                  {item.ipa && (
                    <span className="text-[10px] text-slate-400 font-mono block">
                      {item.ipa}
                    </span>
                  )}
                </div>

                {/* Nút 1-Tap Save to SRS */}
                <button
                  type="button"
                  disabled={saved || saving}
                  onClick={(e) => {
                    e.stopPropagation();
                    if (!saved && !saving) onSave(item);
                  }}
                  className={`inline-flex items-center gap-1 px-2 py-1 rounded-md text-[10px] font-bold transition-all cursor-pointer ${
                    saved
                      ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 cursor-default"
                      : saving
                      ? "bg-slate-200 dark:bg-slate-700 text-slate-400 cursor-wait"
                      : "bg-white dark:bg-slate-700 text-slate-700 dark:text-slate-200 hover:text-amber-600 dark:hover:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-950/30 border border-slate-200 dark:border-slate-600 shadow-2xs active:scale-95"
                  }`}
                  title={saved ? "Đã lưu vào kho ôn tập" : "Lưu vào kho từ vựng ôn tập (SRS)"}
                >
                  {saving ? (
                    <>
                      <Loader2 className="w-3 h-3 animate-spin" />
                      <span>Saving</span>
                    </>
                  ) : saved ? (
                    <>
                      <Check className="w-3 h-3" />
                      <span>Saved</span>
                    </>
                  ) : (
                    <>
                      <BookmarkPlus className="w-3 h-3 text-slate-400 group-hover:text-amber-500" />
                      <span>+ Save</span>
                    </>
                  )}
                </button>
              </div>

              {/* Nghĩa tiếng Việt */}
              <p className="text-[11px] text-slate-600 dark:text-slate-300 font-medium leading-relaxed italic">
                {item.meaning}
              </p>
            </div>
          );
        })}
      </div>
    </div>
  );
}
