"use client";

import React from "react";
import { Volume2, CheckCircle2, XCircle } from "lucide-react";
import type { QuizQuestion } from "@/lib/srs/review-session.service";
import { useVocabSpeaker } from "@/lib/hooks/use-vocab-speaker";

interface MCQCardProps {
  question: QuizQuestion;
  selectedOptionId: string | null;
  isAnswered: boolean;
  onSelectOption: (optionId: string, isCorrect: boolean) => void;
}

export function MCQCard({
  question,
  selectedOptionId,
  isAnswered,
  onSelectOption,
}: MCQCardProps) {
  const { speak } = useVocabSpeaker();

  return (
    <div className="space-y-4 w-full py-2">
      {/* Word Prompt Box */}
      <div className="bg-white dark:bg-slate-800 rounded-3xl p-5 border border-slate-200/80 dark:border-slate-700 shadow-sm text-center space-y-2">
        <div className="flex items-center justify-center gap-2">
          <span className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">
            {question.word}
          </span>
          <button
            onClick={() => speak(question.word, question.audioUrl)}
            className="p-1.5 text-amber-500 hover:text-amber-600 bg-amber-50 dark:bg-amber-950/40 rounded-full transition-transform active:scale-90 cursor-pointer"
            title="Phát âm"
          >
            <Volume2 className="w-4 h-4" />
          </button>
        </div>

        {question.ipa && (
          <div className="font-mono text-xs text-slate-400 font-normal">
            {question.ipa}
          </div>
        )}

        {question.level && (
          <div className="pt-1">
            <span className="px-2 py-0.5 rounded-md bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 text-[10px] font-extrabold border border-amber-200 dark:border-amber-900">
              {question.level}
            </span>
          </div>
        )}
      </div>

      {/* 4 English Answer Choices */}
      <div className="space-y-2.5">
        {question.options.map((opt) => {
          const isSelected = selectedOptionId === opt.id;
          let btnStyle =
            "bg-white dark:bg-slate-800 border-slate-200/80 dark:border-slate-700 text-slate-800 dark:text-slate-200 hover:border-amber-400 dark:hover:border-amber-500";

          if (isAnswered) {
            if (opt.isCorrect) {
              btnStyle =
                "bg-emerald-50 dark:bg-emerald-950/50 border-emerald-500 text-emerald-800 dark:text-emerald-300 font-bold shadow-xs";
            } else if (isSelected && !opt.isCorrect) {
              btnStyle =
                "bg-rose-50 dark:bg-rose-950/50 border-rose-500 text-rose-800 dark:text-rose-300";
            } else {
              btnStyle =
                "bg-slate-50/50 dark:bg-slate-850 border-slate-100 dark:border-slate-800 text-slate-400 dark:text-slate-500 opacity-60";
            }
          }

          return (
            <button
              key={opt.id}
              onClick={() => onSelectOption(opt.id, opt.isCorrect)}
              disabled={isAnswered}
              className={`w-full p-4 rounded-2xl border text-left text-xs transition-all duration-200 flex items-start gap-3 shadow-2xs ${btnStyle}`}
            >
              <span className="w-5 h-5 rounded-full bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 text-[11px] font-black flex items-center justify-center shrink-0">
                {opt.id}
              </span>
              <span className="flex-1 leading-relaxed">{opt.text}</span>
              {isAnswered && opt.isCorrect && (
                <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
              )}
              {isAnswered && isSelected && !opt.isCorrect && (
                <XCircle className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
