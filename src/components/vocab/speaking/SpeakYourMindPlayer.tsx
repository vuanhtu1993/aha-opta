"use client";

/**
 * @file SpeakYourMindPlayer.tsx
 * @description Main Container Component for Speak Your Mind (PREP Speaking).
 * Minimalist, English-only, zero-clutter UI focused on topic, question, target keywords, and PREP scaffold.
 *
 * Mapped Spec: FR-VOCAB-06 | US-VOCAB-03 | BR-08
 * Made by Anh Tu - Share to be share
 */

import React, { useState } from "react";
import { Volume2, ArrowLeft, Eye, EyeOff } from "lucide-react";
import Link from "next/link";
import { ISpeakingQuestion } from "@/lib/types/speaking-quiz";
import { SpeakingPrepCard } from "./SpeakingPrepCard";
import { vocabSpeaker } from "@/lib/services/vocab-speaker";

interface SpeakYourMindPlayerProps {
  question: ISpeakingQuestion;
}

export function SpeakYourMindPlayer({ question }: SpeakYourMindPlayerProps) {
  const [revealAll, setRevealAll] = useState(false);

  const handleSpeakWord = (word: string) => {
    vocabSpeaker.speak(word);
  };

  return (
    <div className="space-y-4 max-w-xl mx-auto pb-16">
      {/* 1. Top Bar */}
      <div className="flex items-center justify-between gap-2">
        <Link
          href="/vocab"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Vocab</span>
        </Link>
        <span className="px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-bold text-[10px] tracking-wider uppercase border border-slate-200 dark:border-slate-700">
          {question.level}
        </span>
      </div>

      {/* 2. Topic & Question Card */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl p-5 space-y-3.5 shadow-2xs">
        <div className="space-y-1">
          <span className="text-[10px] font-black uppercase tracking-wider text-amber-600 dark:text-amber-400">
            {question.topic}
          </span>
          <h1 className="text-lg font-black text-slate-900 dark:text-white leading-snug">
            {question.question}
          </h1>
        </div>

        {/* Target Keywords */}
        {question.targetKeywords && question.targetKeywords.length > 0 && (
          <div className="pt-2 border-t border-slate-100 dark:border-slate-800/80 space-y-1.5">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
              Target Vocabulary
            </span>
            <div className="flex flex-wrap gap-2">
              {question.targetKeywords.map((item, idx) => (
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

      {/* 3. Section Controls: PREP Framework & Global Toggle */}
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

      {/* 4. Four Clean PREP Cards */}
      <div className="space-y-2.5">
        <SpeakingPrepCard
          stageKey="P"
          stageData={question.prepScaffold.point}
          isForceRevealed={revealAll}
        />
        <SpeakingPrepCard
          stageKey="R"
          stageData={question.prepScaffold.reason}
          isForceRevealed={revealAll}
        />
        <SpeakingPrepCard
          stageKey="E"
          stageData={question.prepScaffold.example}
          isForceRevealed={revealAll}
        />
        <SpeakingPrepCard
          stageKey="P2"
          stageData={question.prepScaffold.conclusion}
          isForceRevealed={revealAll}
        />
      </div>
    </div>
  );
}
