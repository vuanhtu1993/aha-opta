"use client";

import React from "react";
import { Volume2, Sparkles } from "lucide-react";
import type { QuizQuestion } from "@/lib/srs/review-session.service";
import { useVocabSpeaker } from "@/lib/hooks/use-vocab-speaker";

interface ClozeCardProps {
  question: QuizQuestion;
  isAnswered: boolean;
  /** Input hiện tại của user — được truyền từ parent để render vào blank */
  userInput: string;
  /** Kết quả đúng/sai — dùng để render màu sắc sau khi trả lời */
  lastCorrect: boolean | null;
}

/**
 * ClozeCard — Display-only component.
 *
 * WHY display-only?
 * Input form cần nằm ở bottom zone của QuizPlayer (bên ngoài vùng scroll)
 * để khi bàn phím iOS mở và container co lại, input luôn visible.
 * Đặt form trong ClozeCard (bên trong scrollable area) sẽ bị keyboard che.
 */
export function ClozeCard({
  question,
  isAnswered,
  userInput,
  lastCorrect,
}: ClozeCardProps) {
  const { speak } = useVocabSpeaker();

  const activeSentence =
    question.exampleSentences && question.exampleSentences.length > 0
      ? question.exampleSentences[0]
      : { sentence: "___", answer: question.word };

  return (
    <div className="space-y-4 w-full py-2">
      {/* Cloze Sentence Box */}
      <div className="bg-white dark:bg-slate-800 rounded-3xl p-5 border border-slate-200/80 dark:border-slate-700 shadow-sm text-center space-y-4">
        <div className="flex items-center justify-center gap-1.5 text-xs font-black text-indigo-500 bg-indigo-50 dark:bg-indigo-950/40 px-3 py-1 rounded-full border border-indigo-200 dark:border-indigo-900 w-fit mx-auto">
          <Sparkles className="w-3.5 h-3.5" />
          <span>Fill in the Blank</span>
        </div>

        {/* Sentence Prompt */}
        <p className="text-base font-medium text-slate-800 dark:text-slate-100 leading-relaxed px-1">
          {activeSentence.sentence.split("___").map((part, i, arr) => (
            <React.Fragment key={i}>
              {part}
              {i < arr.length - 1 && (
                <span
                  className={`inline-block px-3 py-0.5 mx-1 font-bold rounded-lg transition-all duration-300 ${
                    isAnswered
                      ? lastCorrect
                        ? "border-2 border-emerald-500 bg-emerald-100 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-300 shadow-sm shadow-emerald-200/50 dark:shadow-emerald-900/50 animate-in zoom-in-95"
                        : "border-2 border-rose-400 bg-rose-100 dark:bg-rose-950/80 text-rose-700 dark:text-rose-300"
                      : "border-b-2 border-indigo-500 bg-indigo-50/80 dark:bg-indigo-950/80 text-indigo-700 dark:text-indigo-300"
                  }`}
                >
                  {isAnswered ? activeSentence.answer : userInput || "___"}
                </span>
              )}
            </React.Fragment>
          ))}
        </p>

        {/* Word Explanation & Audio / Level */}
        <div className="pt-3 border-t border-slate-100 dark:border-slate-700/60 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs text-slate-500">
          <div className="flex items-start gap-1.5 text-left">
            <span className="font-semibold text-slate-700 dark:text-slate-300 shrink-0">
              Nghĩa:
            </span>
            <span className="text-slate-600 dark:text-slate-300 font-medium leading-normal">
              {question.explanation}
            </span>
          </div>

          <div className="flex items-center justify-end gap-2 shrink-0 self-end sm:self-center">
            <button
              onClick={() => speak(question.word, question.audioUrl)}
              className="p-1 text-slate-400 hover:text-indigo-500 transition-colors cursor-pointer"
              title="Nghe phát âm chuẩn"
            >
              <Volume2 className="w-4 h-4" />
            </button>
            <span className="px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-700 text-[10px] font-bold">
              {question.level}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
