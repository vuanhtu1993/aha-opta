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

/**
 * Normalizes and splits sentence around cloze blank ("___"),
 * handling edge cases like "__", "[blank]", or target word included in full text.
 */
function getSentenceParts(sentence: string, targetWord: string): string[] {
  if (!sentence) return ["", ""];

  // 1. Standardize existing blanks (___, ____, __, [blank])
  let normalized = sentence.replace(/_{2,}|\[blank\]/gi, "___");

  // 2. If no ___ blank exists, attempt to replace targetWord (case-insensitive)
  if (!normalized.includes("___") && targetWord) {
    const escaped = targetWord.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const regex = new RegExp(`\\b${escaped}\\b`, "gi");
    if (regex.test(normalized)) {
      normalized = normalized.replace(regex, "___");
    } else if (normalized.toLowerCase().includes(targetWord.toLowerCase())) {
      const fallbackRegex = new RegExp(escaped, "gi");
      normalized = normalized.replace(fallbackRegex, "___");
    } else {
      // 3. Fallback: append blank at end
      normalized = `${normalized} (___)`;
    }
  }

  return normalized.split("___");
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

  const targetAnswer = activeSentence.answer || question.word;

  // Auto focus input and reset state when switching questions
  useEffect(() => {
    setUserInput("");
    setLastCorrect(null);
    const timer = setTimeout(() => {
      inputRef.current?.focus();
    }, 50);
    return () => clearTimeout(timer);
  }, [question.cardId]);

  const handleSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (isAnswered || !userInput.trim()) return;

    const correct = isClozeCorrect(userInput, targetAnswer);
    setLastCorrect(correct);
    onSubmitAnswer(userInput, correct);
  };

  const handleGiveUp = () => {
    if (isAnswered) return;
    setLastCorrect(false);
    onSubmitAnswer("", false);
  };

  const sentenceParts = getSentenceParts(activeSentence.sentence, targetAnswer);

  return (
    <div className="space-y-4 w-full">
      {/* Cloze Sentence Box */}
      <div className="bg-white dark:bg-slate-800 rounded-3xl p-5 border border-slate-200/80 dark:border-slate-700 shadow-sm text-center space-y-4">
        <div className="flex items-center justify-center gap-1.5 text-xs font-black text-indigo-500 bg-indigo-50 dark:bg-indigo-950/40 px-3 py-1 rounded-full border border-indigo-200 dark:border-indigo-900 w-fit mx-auto">
          <Sparkles className="w-3.5 h-3.5" />
          <span>Fill in the Blank</span>
        </div>

        {/* Sentence Prompt */}
        <p className="text-base font-medium text-slate-800 dark:text-slate-100 leading-relaxed px-1">
          {sentenceParts.map((part, i, arr) => (
            <React.Fragment key={i}>
              {part}
              {i < arr.length - 1 && (
                <span
                  onClick={() => !isAnswered && inputRef.current?.focus()}
                  title={!isAnswered ? "Nhấn để nhập đáp án" : undefined}
                  className={`inline-block px-3 py-0.5 mx-1 font-bold rounded-lg transition-all duration-300 ${
                    !isAnswered ? "cursor-pointer hover:ring-2 hover:ring-indigo-400/80" : ""
                  } ${
                    isAnswered
                      ? lastCorrect
                        ? "border-2 border-emerald-500 bg-emerald-100 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-300 shadow-sm shadow-emerald-200/50 dark:shadow-emerald-900/50 animate-in zoom-in-95"
                        : "border-2 border-rose-400 bg-rose-100 dark:bg-rose-950/80 text-rose-700 dark:text-rose-300"
                      : "border-b-2 border-indigo-500 bg-indigo-50/80 dark:bg-indigo-950/80 text-indigo-700 dark:text-indigo-300"
                  }`}
                >
                  {isAnswered ? targetAnswer : userInput || "___"}
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

      {/* Input Form & Action Button inside Card Flow */}
      {!isAnswered && (
        <form onSubmit={handleSubmit} className="space-y-2.5">
          <div className="relative">
            <input
              ref={inputRef}
              type="text"
              value={userInput}
              onChange={(e) => setUserInput(e.target.value)}
              placeholder="Nhập từ vựng tiếng Anh..."
              className="w-full py-3.5 pl-4 pr-12 text-sm bg-white dark:bg-slate-800 border-2 border-indigo-200 dark:border-indigo-900 rounded-2xl focus:outline-none focus:border-indigo-500 dark:focus:border-indigo-400 font-semibold text-slate-900 dark:text-white shadow-sm transition-all"
              autoCapitalize="none"
              autoComplete="off"
              autoCorrect="off"
              enterKeyHint="send"
              autoFocus
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

