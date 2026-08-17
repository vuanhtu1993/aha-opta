"use client";

import React, { useState, useEffect, useRef } from "react";
import { Volume2, Sparkles, Send } from "lucide-react";
import type { QuizQuestion } from "@/lib/srs/review-session.service";
import { isClozeCorrect } from "@/lib/srs/cloze-scorer";

interface ClozeCardProps {
  question: QuizQuestion;
  isAnswered: boolean;
  onSubmitAnswer: (userInput: string, isCorrect: boolean) => void;
  onPlayAudio: (word: string) => void;
}

export function ClozeCard({
  question,
  isAnswered,
  onSubmitAnswer,
  onPlayAudio,
}: ClozeCardProps) {
  const [userInput, setUserInput] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  // Pick the first example sentence available
  const activeSentence =
    question.exampleSentences && question.exampleSentences.length > 0
      ? question.exampleSentences[0]
      : { sentence: "___", answer: question.word };

  useEffect(() => {
    setUserInput("");
    if (!isAnswered) {
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [question, isAnswered]);

  const handleSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (isAnswered || !userInput.trim()) return;

    const correct = isClozeCorrect(userInput, activeSentence.answer);
    onSubmitAnswer(userInput, correct);
  };

  return (
    <div className="space-y-5 my-auto py-4">
      {/* Cloze Sentence Box */}
      <div className="bg-white dark:bg-slate-800 rounded-3xl p-6 border border-slate-200/80 dark:border-slate-700 shadow-sm text-center space-y-4">
        <div className="flex items-center justify-center gap-1.5 text-xs font-black text-indigo-500 bg-indigo-50 dark:bg-indigo-950/40 px-3 py-1 rounded-full border border-indigo-200 dark:border-indigo-900 w-fit mx-auto">
          <Sparkles className="w-3.5 h-3.5" />
          <span>Fill in the Blank</span>
        </div>

        {/* Sentence Prompt */}
        <p className="text-base font-medium text-slate-800 dark:text-slate-100 leading-relaxed px-2">
          {activeSentence.sentence.split("___").map((part, i, arr) => (
            <React.Fragment key={i}>
              {part}
              {i < arr.length - 1 && (
                <span className="inline-block px-3 py-0.5 mx-1 border-b-2 border-indigo-500 bg-indigo-50/80 dark:bg-indigo-950/80 text-indigo-700 dark:text-indigo-300 font-bold rounded">
                  {isAnswered ? activeSentence.answer : userInput || "___"}
                </span>
              )}
            </React.Fragment>
          ))}
        </p>

        {/* Word Explanation & Level Hint */}
        <div className="pt-2 border-t border-slate-100 dark:border-slate-700/60 flex items-center justify-between text-xs text-slate-500">
          <div className="flex items-center gap-1.5">
            <span className="font-semibold text-slate-700 dark:text-slate-300">
              Nghĩa:
            </span>
            <span className="line-clamp-1 max-w-[200px] text-left">
              {question.explanation}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => onPlayAudio(question.word)}
              className="p-1 text-slate-400 hover:text-indigo-500 transition-colors"
              title="Nghe từ"
            >
              <Volume2 className="w-4 h-4" />
            </button>
            <span className="px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-700 text-[10px] font-bold">
              {question.level}
            </span>
          </div>
        </div>
      </div>

      {/* Input Form */}
      {!isAnswered && (
        <form onSubmit={handleSubmit} className="space-y-3">
          <div className="relative">
            <input
              ref={inputRef}
              type="text"
              value={userInput}
              onChange={(e) => setUserInput(e.target.value)}
              placeholder="Nhập từ vựng tiếng Anh..."
              className="w-full py-4 pl-4 pr-12 text-sm bg-white dark:bg-slate-800 border-2 border-indigo-200 dark:border-indigo-900 rounded-2xl focus:outline-none focus:border-indigo-500 dark:focus:border-indigo-400 font-semibold text-slate-900 dark:text-white shadow-sm transition-all"
              autoCapitalize="none"
              autoComplete="off"
              autoCorrect="off"
            />
            <button
              type="submit"
              disabled={!userInput.trim()}
              className="absolute right-2 top-2 bottom-2 px-3.5 bg-indigo-500 hover:bg-indigo-600 disabled:opacity-40 text-white rounded-xl font-extrabold flex items-center justify-center transition-all active:scale-95"
            >
              <Send className="w-4 h-4" />
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
