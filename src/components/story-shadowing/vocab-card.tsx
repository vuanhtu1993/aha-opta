"use client";

import { useEffect, useState } from "react";
import { mutate } from "swr";
import { ChevronDown, BookmarkPlus, Check, Volume2 } from "lucide-react";
import { Button } from "@/components/ui/button";

export interface WordFamilyItem {
  word: string;
  partOfSpeech?: string;
  ipa?: string;
  explanation: string;
}

export interface CollocationItem {
  collocation: string;
  explanation: string;
}

export interface KeywordItem {
  word: string;
  ipa?: string;
  explanation: string;
  level?: string;
  wordFamily?: WordFamilyItem[];
  collocations?: CollocationItem[];
}

export interface VocabCardProps {
  keyword: KeywordItem;
  storybookId: string;
  storybookTitle: string;
  isInitiallySaved?: boolean;
  onSaved?: (word: string) => void;
}

export function VocabCard({
  keyword,
  storybookId,
  storybookTitle,
  isInitiallySaved = false,
  onSaved,
}: VocabCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isSaved, setIsSaved] = useState(isInitiallySaved);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    setIsSaved(isInitiallySaved);
  }, [isInitiallySaved]);

  const handleSaveToSRS = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isSaved || isSaving) return;

    try {
      setIsSaving(true);
      const res = await fetch("/api/vocab", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          word: keyword.word,
          ipa: keyword.ipa,
          explanation: keyword.explanation,
          level: keyword.level || "B1",
          wordFamily: keyword.wordFamily,
          collocations: keyword.collocations,
          sourceStorybookId: storybookId,
          sourceStorybookTitle: storybookTitle,
        }),
      });

      if (res.ok) {
        setIsSaved(true);
        onSaved?.(keyword.word);
        // Cập nhật lại badge đếm từ cần ôn tập trong navbar/dashboard
        mutate("/api/vocab/due-count");
      }
    } catch (err) {
      console.error("[VocabCard] Failed to save vocab to SRS:", err);
    } finally {
      setIsSaving(false);
    }
  };

  const playPronunciation = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      // Huỷ các phát âm đang dở trước đó để tránh nghẽn hàng đợi trên Safari
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(keyword.word);
      utterance.lang = "en-US";
      utterance.rate = 0.9;
      window.speechSynthesis.speak(utterance);
    }
  };

  const isAdvancedLevel =
    keyword.level === "hard" ||
    keyword.level === "C1" ||
    keyword.level === "C2";

  return (
    <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200/80 dark:border-slate-700 shadow-2xs overflow-hidden transition-all duration-300">
      <div
        className="p-4 flex gap-3 items-start justify-between cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-750 transition-colors"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex-1 min-w-0">
          <div className="flex items-center flex-wrap gap-2">
            <span className="text-base font-extrabold text-slate-900 dark:text-white">
              {keyword.word}
            </span>
            {keyword.ipa && (
              <span className="font-mono text-xs text-slate-400 font-normal">
                {keyword.ipa}
              </span>
            )}
            <button
              type="button"
              onClick={playPronunciation}
              className="p-1 text-slate-400 hover:text-amber-500 rounded-full hover:bg-amber-50 dark:hover:bg-slate-700 transition-colors"
              title="Phát âm từ này"
              aria-label={`Phát âm từ ${keyword.word}`}
            >
              <Volume2 className="w-3.5 h-3.5" />
            </button>
          </div>
          <p className="text-xs text-slate-600 dark:text-slate-300 mt-1 leading-relaxed">
            {keyword.explanation}
          </p>

          {/* Action button to save to SRS */}
          <div className="mt-2.5 flex items-center gap-2">
            <Button
              type="button"
              onClick={handleSaveToSRS}
              disabled={isSaved || isSaving}
              variant={isSaved ? "softEmerald" : "softAmber"}
              size="xs"
              shape="roundedXl"
              className="text-[11px] font-bold"
              leftIcon={
                isSaved ? (
                  <Check className="w-3.5 h-3.5 stroke-[2.5]" />
                ) : (
                  <BookmarkPlus className="w-3.5 h-3.5" />
                )
              }
            >
              {isSaved ? "Đã lưu vào SRS" : isSaving ? "Đang lưu..." : "+ Lưu vào SRS"}
            </Button>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0 pt-0.5">
          {keyword.level && (
            <span
              className={`px-2 py-0.5 rounded-md text-[10px] font-extrabold whitespace-nowrap ${
                isAdvancedLevel
                  ? "bg-rose-50 text-rose-600 dark:bg-rose-950/40 dark:text-rose-400 border border-rose-200 dark:border-rose-900"
                  : "bg-amber-50 text-amber-600 dark:bg-amber-950/40 dark:text-amber-400 border border-amber-200 dark:border-amber-900"
              }`}
            >
              {keyword.level.toUpperCase()}
            </span>
          )}
          <ChevronDown
            className={`w-4 h-4 text-slate-400 transition-transform duration-300 ${
              isExpanded ? "rotate-180" : ""
            }`}
          />
        </div>
      </div>

      {/* Expanded Content: Word Family & Collocations */}
      <div
        className={`px-4 transition-all duration-300 ease-in-out ${
          isExpanded
            ? "max-h-96 py-3 border-t border-slate-100 dark:border-slate-700/60 opacity-100"
            : "max-h-0 opacity-0 overflow-hidden"
        }`}
      >
        <div className="space-y-3">
          {keyword.wordFamily && keyword.wordFamily.length > 0 && (
            <div>
              <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200 mb-1.5 flex items-center gap-1.5">
                <span>👨‍👩‍👧‍👦</span> Word Family
              </h4>
              <ul className="space-y-1">
                {keyword.wordFamily.map((wf, idx) => (
                  <li
                    key={idx}
                    className="text-xs bg-slate-50 dark:bg-slate-750 px-2.5 py-1.5 rounded-xl border border-slate-100 dark:border-slate-700 flex flex-col gap-0.5"
                  >
                    <div className="flex items-baseline gap-2 flex-wrap">
                      <span className="font-bold text-slate-800 dark:text-slate-100">
                        {wf.word}
                      </span>
                      {wf.partOfSpeech && (
                        <span className="text-[10px] font-medium text-slate-400">
                          ({wf.partOfSpeech})
                        </span>
                      )}
                      {wf.ipa && (
                        <span className="font-mono text-[10px] text-slate-400">
                          {wf.ipa}
                        </span>
                      )}
                    </div>
                    <span className="text-slate-500 dark:text-slate-400 text-[11px]">
                      {wf.explanation}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {keyword.collocations && keyword.collocations.length > 0 && (
            <div>
              <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200 mb-1.5 flex items-center gap-1.5">
                <span>🔗</span> Collocations
              </h4>
              <ul className="space-y-1">
                {keyword.collocations.map((col, idx) => (
                  <li
                    key={idx}
                    className="text-xs bg-slate-50 dark:bg-slate-750 px-2.5 py-1.5 rounded-xl border border-slate-100 dark:border-slate-700 flex flex-col gap-0.5"
                  >
                    <span className="font-bold text-slate-800 dark:text-slate-100">
                      {col.collocation}
                    </span>
                    <span className="text-slate-500 dark:text-slate-400 text-[11px]">
                      {col.explanation}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
