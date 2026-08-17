"use client";

import React from "react";
import type { QuizQuestion } from "@/lib/srs/review-session.service";

interface ReviewResult {
  cardId: string;
  word: string;
  isCorrect: boolean;
  rating: number;
  responseTimeMs: number;
  nextDue: string;
  stability: number;
}

interface QuizFeedbackProps {
  question: QuizQuestion;
  result: ReviewResult;
  completedSentence?: string;
}

export function QuizFeedback({
  question,
  result,
  completedSentence,
}: QuizFeedbackProps) {
  const getRatingBadge = (rating: number) => {
    switch (rating) {
      case 4:
        return { label: "Easy (Dễ)", color: "bg-emerald-50 text-emerald-600 border-emerald-200" };
      case 3:
        return { label: "Good (Tốt)", color: "bg-blue-50 text-blue-600 border-blue-200" };
      case 2:
        return { label: "Hard (Khó)", color: "bg-amber-50 text-amber-600 border-amber-200" };
      case 1:
      default:
        return { label: "Again (Ôn lại)", color: "bg-rose-50 text-rose-600 border-rose-200" };
    }
  };

  const formatIntervalDays = (nextDueStr?: string) => {
    if (!nextDueStr) return "";
    const due = new Date(nextDueStr);
    const now = new Date();
    const diffMs = due.getTime() - now.getTime();
    if (diffMs <= 0) return "Hôm nay";
    const diffMinutes = Math.round(diffMs / (1000 * 60));
    if (diffMinutes < 60) return `${diffMinutes} phút`;
    const diffHours = Math.round(diffMs / (1000 * 60 * 60));
    if (diffHours < 24) return `${diffHours} giờ`;
    const days = Math.round(diffHours / 24);
    return `${days} ngày`;
  };

  const badge = getRatingBadge(result.rating);

  return (
    <div className="bg-slate-50 dark:bg-slate-800/80 rounded-2xl p-4 border border-slate-200/80 dark:border-slate-700 space-y-3 animate-in fade-in slide-in-from-bottom-2 duration-300">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className={`px-2 py-0.5 rounded-md text-[10px] font-extrabold border ${badge.color}`}>
            {badge.label}
          </span>
          <span className="text-[11px] text-slate-500 dark:text-slate-400">
            ⚡ {Math.round(result.responseTimeMs / 100) / 10}s
          </span>
        </div>

        <div className="text-[11px] font-bold text-amber-600 dark:text-amber-400">
          Ôn lại: +{formatIntervalDays(result.nextDue)}
        </div>
      </div>

      {/* Completed Sentence for Cloze Mode */}
      {completedSentence && (
        <div className="p-3 bg-amber-50/60 dark:bg-amber-950/40 rounded-xl border border-amber-200/60 dark:border-amber-900/60 text-xs text-amber-950 dark:text-amber-200 font-medium">
          <div className="text-[10px] font-bold text-amber-600 dark:text-amber-400 mb-1 uppercase tracking-wider">
            Sentence in context:
          </div>
          <p className="italic">{completedSentence}</p>
        </div>
      )}

      {/* Word Family / Collocations hint */}
      {question.wordFamily && question.wordFamily.length > 0 && (
        <div className="text-[11px] text-slate-500 dark:text-slate-400 border-t border-slate-200/60 dark:border-slate-700/60 pt-2">
          <span className="font-bold text-slate-700 dark:text-slate-300">
            👨‍👩‍👧‍👦 Family:{" "}
          </span>
          {question.wordFamily.map((wf: any) => wf.word).join(", ")}
        </div>
      )}
    </div>
  );
}
