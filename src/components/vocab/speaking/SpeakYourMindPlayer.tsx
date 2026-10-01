"use client";

/**
 * @file SpeakYourMindPlayer.tsx
 * @description Main Container Component for Speak Your Mind (PREP Speaking).
 * Minimalist, English-only, zero-clutter UI focused on topic, question, target keywords, and PREP scaffold.
 * Tích hợp AI Speaking Quiz Generator để tạo câu hỏi tranh biện theo ngữ cảnh.
 *
 * Mapped Spec: FR-VOCAB-06 | FR-VOCAB-07 | US-VOCAB-03 | US-VOCAB-04 | BR-08 | BR-09
 * Made by Anh Tu - Share to be share
 */

import React, { useState } from "react";
import { Volume2, Mic, Eye, EyeOff, Sparkles } from "lucide-react";
import Link from "next/link";
import { ISpeakingQuestion } from "@/lib/types/speaking-quiz";
import { SpeakingPrepCard } from "./SpeakingPrepCard";
import { SpeakingQuizGenerator } from "./SpeakingQuizGenerator";
import { vocabSpeaker } from "@/lib/services/vocab-speaker";

interface SpeakYourMindPlayerProps {
  question: ISpeakingQuestion;
}

export function SpeakYourMindPlayer({ question }: SpeakYourMindPlayerProps) {
  const [currentQuestion, setCurrentQuestion] = useState<ISpeakingQuestion>(question);
  const [showGenerator, setShowGenerator] = useState(false);
  const [revealAll, setRevealAll] = useState(false);

  const handleSpeakWord = (word: string) => {
    vocabSpeaker.speak(word);
  };

  return (
    <div className="space-y-4 max-w-xl mx-auto pb-28">
      {/* 1. Top Bar */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/80 flex items-center justify-center text-amber-600 dark:text-amber-400">
            <Mic className="w-4 h-4" />
          </div>
          <div>
            <h1 className="text-sm font-black text-slate-900 dark:text-white leading-none">
              Speak Your Mind
            </h1>
            <span className="text-[10px] font-medium text-slate-400">
              PREP Argumentation
            </span>
          </div>
        </div>
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={() => setShowGenerator(!showGenerator)}
            className="inline-flex items-center gap-1 text-[11px] font-bold text-amber-600 dark:text-amber-400 hover:text-amber-700 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/80 px-2 py-0.5 rounded-md transition-colors cursor-pointer"
            title="Tạo thử thách nói mới qua AI Agent"
          >
            <Sparkles className="w-3 h-3" />
            <span>{showGenerator ? "Đóng form" : "Tạo bài mới (AI)"}</span>
          </button>
          <span className="px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-bold text-[10px] tracking-wider uppercase border border-slate-200 dark:border-slate-700">
            {currentQuestion.level}
          </span>
        </div>
      </div>

      {/* 2. Hiển thị Generator hoặc Player */}
      {showGenerator ? (
        <SpeakingQuizGenerator
          initialStorybookId={currentQuestion.storybookId}
          onQuizReady={(newQuestion) => {
            setCurrentQuestion(newQuestion);
            setShowGenerator(false);
            setRevealAll(false);
          }}
          onCancel={() => setShowGenerator(false)}
        />
      ) : (
        <>
          {/* Topic & Question Card */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl p-5 space-y-3.5 shadow-2xs">
            <div className="space-y-1">
              <span className="text-[10px] font-black uppercase tracking-wider text-amber-600 dark:text-amber-400">
                {currentQuestion.topic}
              </span>
              <h1 className="text-lg font-black text-slate-900 dark:text-white leading-snug">
                {currentQuestion.question}
              </h1>
            </div>

            {/* Target Keywords */}
            {currentQuestion.targetKeywords && currentQuestion.targetKeywords.length > 0 && (
              <div className="pt-2 border-t border-slate-100 dark:border-slate-800/80 space-y-1.5">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                  Target Vocabulary
                </span>
                <div className="flex flex-wrap gap-2">
                  {currentQuestion.targetKeywords.map((item, idx) => (
                    <button
                      type="button"
                      key={idx}
                      onClick={() => handleSpeakWord(item.word)}
                      className="group inline-flex items-center gap-1.5 bg-slate-50 dark:bg-slate-800/80 hover:bg-amber-50 dark:hover:bg-amber-950/30 border border-slate-200 dark:border-slate-700 hover:border-amber-300 dark:hover:border-amber-700 px-2.5 py-1 rounded-lg text-xs transition-colors cursor-pointer"
                      title={item.meaning}
                    >
                      <span className="font-bold text-slate-800 dark:text-slate-200 group-hover:text-amber-600 dark:group-hover:text-amber-400">
                        {item.word}
                      </span>
                      {item.ipa && (
                        <span className="text-[10px] text-slate-400 font-mono">
                          {item.ipa}
                        </span>
                      )}
                      <Volume2 className="w-3 h-3 text-slate-400 group-hover:text-amber-500 transition-colors" />
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Section Controls: PREP Framework & Global Toggle */}
          <div className="flex items-center justify-between px-1 pt-1">
            <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              PREP Framework
            </span>
            <button
              type="button"
              onClick={() => setRevealAll(!revealAll)}
              className="inline-flex items-center gap-1 text-xs font-semibold text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white transition-colors cursor-pointer"
            >
              {revealAll ? (
                <>
                  <EyeOff className="w-3.5 h-3.5" />
                  <span>Hide all</span>
                </>
              ) : (
                <>
                  <Eye className="w-3.5 h-3.5" />
                  <span>Show all</span>
                </>
              )}
            </button>
          </div>

          {/* Four Clean PREP Cards */}
          <div className="space-y-2.5">
            <SpeakingPrepCard
              stageKey="P"
              stageData={currentQuestion.prepScaffold.point}
              isForceRevealed={revealAll}
            />
            <SpeakingPrepCard
              stageKey="R"
              stageData={currentQuestion.prepScaffold.reason}
              isForceRevealed={revealAll}
            />
            <SpeakingPrepCard
              stageKey="E"
              stageData={currentQuestion.prepScaffold.example}
              isForceRevealed={revealAll}
            />
            <SpeakingPrepCard
              stageKey="P2"
              stageData={currentQuestion.prepScaffold.conclusion}
              isForceRevealed={revealAll}
            />
          </div>
        </>
      )}
    </div>
  );
}
