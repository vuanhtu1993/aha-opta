"use client";

import React, { useState, useEffect, useRef } from "react";
import { Volume2, Sparkles, Send, HelpCircle } from "lucide-react";
import type { QuizQuestion } from "@/lib/srs/review-session.service";
import { isClozeCorrect } from "@/lib/srs/cloze-scorer";
import { useVocabSpeaker } from "@/lib/hooks/use-vocab-speaker";

interface ClozeCardProps {
  question: QuizQuestion;
  isAnswered: boolean;
  onSubmitAnswer: (userInput: string, isCorrect: boolean) => void;
}

export function ClozeCard({
  question,
  isAnswered,
  onSubmitAnswer,
}: ClozeCardProps) {
  const { speak } = useVocabSpeaker();
  const [userInput, setUserInput] = useState("");
  const [lastCorrect, setLastCorrect] = useState<boolean | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Pick the first example sentence available
  const activeSentence =
    question.exampleSentences && question.exampleSentences.length > 0
      ? question.exampleSentences[0]
      : { sentence: "___", answer: question.word };

  // Scroll input element nicely into view inside the scrollable container
  const scrollToInput = () => {
    if (inputRef.current) {
      inputRef.current.scrollIntoView({
        behavior: "smooth",
        block: "center",
      });
    }
  };

  // Reset state when switching to a new question
  useEffect(() => {
    setUserInput("");
    setLastCorrect(null);
  }, [question]);

  // Focus input & scroll into view when question becomes active or switches
  useEffect(() => {
    if (!isAnswered && inputRef.current) {
      inputRef.current.focus();
      // On iOS Safari, keyboard animation takes ~300ms.
      // Scroll into view after keyboard fully opens so block: "center" works against the shrunk viewport!
      const timer1 = setTimeout(scrollToInput, 100);
      const timer2 = setTimeout(scrollToInput, 350);

      return () => {
        clearTimeout(timer1);
        clearTimeout(timer2);
      };
    }
  }, [isAnswered, question]);

  const handleSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (isAnswered || !userInput.trim()) return;

    const correct = isClozeCorrect(userInput, activeSentence.answer);
    setLastCorrect(correct);
    onSubmitAnswer(userInput, correct);
  };

  const handleGiveUp = () => {
    if (isAnswered) return;
    setLastCorrect(false);
    onSubmitAnswer("", false); // Mark incorrect (Rating.Again) and reveal answer
  };

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

        {/* Word Explanation & Audio / Level Bar */}
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

      {/* Input Form & Give Up Action */}
      {!isAnswered && (
        <form onSubmit={handleSubmit} className="space-y-2.5">
          <div className="relative">
            <input
              ref={inputRef}
              type="text"
              autoFocus
              value={userInput}
              onChange={(e) => setUserInput(e.target.value)}
              onFocus={() => {
                setTimeout(scrollToInput, 300);
              }}
              placeholder="Nhập từ vựng tiếng Anh..."
              className="w-full py-3.5 pl-4 pr-12 text-sm bg-white dark:bg-slate-800 border-2 border-indigo-200 dark:border-indigo-900 rounded-2xl focus:outline-none focus:border-indigo-500 dark:focus:border-indigo-400 font-semibold text-slate-900 dark:text-white shadow-sm transition-all"
              autoCapitalize="none"
              autoComplete="off"
              autoCorrect="off"
              enterKeyHint="send"
            />
            <button
              type="submit"
              disabled={!userInput.trim()}
              className="absolute right-2 top-1.5 bottom-1.5 px-3.5 bg-indigo-500 hover:bg-indigo-600 disabled:opacity-40 text-white rounded-xl font-extrabold flex items-center justify-center transition-all active:scale-95 cursor-pointer"
            >
              <Send className="w-4 h-4" />
            </button>
          </div>

          <button
            type="button"
            onClick={handleGiveUp}
            className="w-full py-2.5 text-xs font-bold text-slate-500 dark:text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 bg-slate-100/80 dark:bg-slate-800/80 hover:bg-slate-200/80 dark:hover:bg-slate-700/80 rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer"
          >
            <HelpCircle className="w-3.5 h-3.5" />
            <span>Tôi chưa nhớ từ này (Xem đáp án)</span>
          </button>
        </form>
      )}
    </div>
  );
}
