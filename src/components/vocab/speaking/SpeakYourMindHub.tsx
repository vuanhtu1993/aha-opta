"use client";

import React, { useState } from "react";
import Link from "next/link";
import { Plus, ArrowRight } from "lucide-react";
import { ISpeakingQuestion } from "@/lib/types/speaking-quiz";

/**
 * @file SpeakYourMindHub.tsx
 * @description Interactive Client Component for Speak Your Mind Hub Dashboard.
 * Supports instant (0ms) client-side level filtering without server round-trips.
 *
 * Mapped Spec: FR-VOCAB-06 | FR-VOCAB-07 | US-VOCAB-03 | US-VOCAB-04 | AC-VOCAB-11
 * Made by Anh Tu - Share to be share
 */

interface SpeakYourMindHubProps {
  questions: ISpeakingQuestion[];
  initialLevel?: string;
  currentLevel?: string;
}

export function SpeakYourMindHub({
  questions = [],
  initialLevel,
  currentLevel,
}: SpeakYourMindHubProps) {
  const [selectedLevel, setSelectedLevel] = useState<string>(
    initialLevel || currentLevel || "all"
  );

  const dailyChallenge = questions.length > 0 ? questions[0] : null;

  const filteredQuestions = questions.filter((q) => {
    if (!selectedLevel || selectedLevel === "all") return true;
    return q.level === selectedLevel;
  });

  return (
    <div className="space-y-6 max-w-xl mx-auto pb-28">
      {/* 1. Header Shell: Synchronized with Story Shadowing & Vocab */}
      <div className="flex items-center justify-between pt-1">
        <div>
          <h1 className="text-xl font-black text-slate-900 dark:text-white tracking-tight">
            Speak Your Mind
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            PREP Framework • Critical Thinking & Speaking
          </p>
        </div>

        <Link
          href="/vocab/speak-your-mind/create"
          className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-[#FFBA49] hover:bg-[#e6a640] text-slate-900 font-bold text-xs rounded-xl shadow-xs transition-colors active:scale-98 cursor-pointer"
        >
          <Plus className="w-4 h-4" /> Create
        </Link>
      </div>

      {/* 2. Hero Methodology Guide (PREP Framework) */}
      <div className="bg-slate-50 dark:bg-slate-900/60 border border-slate-200/80 dark:border-slate-800 rounded-2xl p-4 space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-xs font-black text-slate-900 dark:text-white uppercase tracking-wider">
            PREP Argumentation Framework
          </span>
          <span className="text-[11px] text-slate-400 font-medium">
            30–60s per turn
          </span>
        </div>

        <div className="grid grid-cols-2 gap-2 text-[11px]">
          <div className="p-2.5 rounded-xl bg-white dark:bg-slate-800/80 border border-slate-200/60 dark:border-slate-700/60 space-y-0.5">
            <div className="font-black text-amber-600 dark:text-amber-400 text-xs">
              P • Point
            </div>
            <p className="text-slate-600 dark:text-slate-300 leading-tight">
              Direct stance statement (Agree / Disagree).
            </p>
          </div>

          <div className="p-2.5 rounded-xl bg-white dark:bg-slate-800/80 border border-slate-200/60 dark:border-slate-700/60 space-y-0.5">
            <div className="font-black text-blue-600 dark:text-blue-400 text-xs">
              R • Reason
            </div>
            <p className="text-slate-600 dark:text-slate-300 leading-tight">
              Core rationale and logical justification.
            </p>
          </div>

          <div className="p-2.5 rounded-xl bg-white dark:bg-slate-800/80 border border-slate-200/60 dark:border-slate-700/60 space-y-0.5">
            <div className="font-black text-emerald-600 dark:text-emerald-400 text-xs">
              E • Example
            </div>
            <p className="text-slate-600 dark:text-slate-300 leading-tight">
              Concrete evidence, fact, or personal anecdote.
            </p>
          </div>

          <div className="p-2.5 rounded-xl bg-white dark:bg-slate-800/80 border border-slate-200/60 dark:border-slate-700/60 space-y-0.5">
            <div className="font-black text-purple-600 dark:text-purple-400 text-xs">
              P • Point
            </div>
            <p className="text-slate-600 dark:text-slate-300 leading-tight">
              Concluding synthesis and key takeaway.
            </p>
          </div>
        </div>
      </div>

      {/* 3. Daily Featured Challenge Card */}
      {dailyChallenge && (
        <div className="bg-white dark:bg-slate-900 border-2 border-amber-500/80 dark:border-amber-500/60 rounded-2xl p-4.5 space-y-3 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="px-2.5 py-0.5 rounded-full bg-amber-500 text-slate-950 font-black text-[10px] uppercase tracking-wider">
              Daily Featured Challenge
            </span>
            <span className="px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-extrabold text-[10px] uppercase border border-slate-200 dark:border-slate-700">
              {dailyChallenge.level}
            </span>
          </div>

          <div className="space-y-1">
            <span className="text-[10px] font-bold text-amber-600 dark:text-amber-400 uppercase tracking-wider">
              {dailyChallenge.topic}
            </span>
            <h2 className="text-sm font-black text-slate-900 dark:text-white leading-snug">
              {dailyChallenge.question}
            </h2>
          </div>

          {dailyChallenge.targetKeywords && dailyChallenge.targetKeywords.length > 0 && (
            <div className="flex flex-wrap gap-1.5 pt-1">
              {dailyChallenge.targetKeywords.map((kw, idx) => (
                <span
                  key={idx}
                  className="px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-[11px] font-semibold border border-slate-200 dark:border-slate-700"
                >
                  <strong className="text-amber-700 dark:text-amber-400">{kw.word}</strong>
                  {kw.ipa && (
                    <span className="text-slate-500 dark:text-slate-400 text-[10px] ml-1">
                      {kw.ipa}
                    </span>
                  )}
                </span>
              ))}
            </div>
          )}

          <div className="pt-2">
            <Link
              href={`/vocab/speak-your-mind/${dailyChallenge.id}`}
              className="inline-flex items-center justify-center gap-1.5 w-full py-2.5 px-4 bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-bold text-xs rounded-xl shadow-xs hover:bg-slate-800 dark:hover:bg-slate-100 transition-colors cursor-pointer"
            >
              Start PREP Practice <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      )}

      {/* 4. Filter & Questions List */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-xs font-black text-slate-900 dark:text-white uppercase tracking-wider">
            Practice Topics ({filteredQuestions.length})
          </span>

          {/* Filter Chips: Instant Client-side Buttons */}
          <div className="flex items-center gap-1 text-[11px] font-bold">
            {["all", "B1", "B2", "C1"].map((lvl) => {
              const isActive = selectedLevel === lvl;

              return (
                <button
                  key={lvl}
                  type="button"
                  onClick={() => setSelectedLevel(lvl)}
                  className={`px-2.5 py-0.5 rounded-lg transition-colors capitalize cursor-pointer ${
                    isActive
                      ? "bg-slate-900 text-white dark:bg-white dark:text-slate-900 font-black"
                      : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
                  }`}
                >
                  {lvl === "all" ? "All" : lvl}
                </button>
              );
            })}
          </div>
        </div>

        {/* Questions Grid */}
        <div className="space-y-2.5">
          {filteredQuestions.map((q) => (
            <Link
              key={q.id}
              href={`/vocab/speak-your-mind/${q.id}`}
              className="block bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 hover:border-amber-400 dark:hover:border-amber-600/80 rounded-2xl p-4 transition-all group shadow-2xs hover:shadow-xs"
            >
              <div className="flex items-center justify-between gap-2 mb-1.5">
                <span className="text-[10px] font-bold text-amber-600 dark:text-amber-400 uppercase tracking-wider truncate">
                  {q.topic}
                </span>
                <span className="px-1.5 py-0.5 rounded-sm bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 text-[10px] font-bold uppercase border border-slate-200 dark:border-slate-700">
                  {q.level}
                </span>
              </div>

              <h3 className="text-xs font-bold text-slate-900 dark:text-white leading-snug group-hover:text-amber-600 dark:group-hover:text-amber-400 transition-colors">
                {q.question}
              </h3>

              {q.targetKeywords && q.targetKeywords.length > 0 && (
                <div className="flex flex-wrap gap-1 mt-2.5">
                  {q.targetKeywords.map((kw, kidx) => (
                    <span
                      key={kidx}
                      className="px-1.5 py-0.5 rounded bg-slate-50 dark:bg-slate-800/60 text-slate-600 dark:text-slate-300 text-[10px] border border-slate-200/60 dark:border-slate-700/60"
                    >
                      {kw.word}
                    </span>
                  ))}
                </div>
              )}

              <div className="mt-3 pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-[11px] text-slate-400">
                <span>4 PREP stages</span>
                <span className="font-bold text-amber-600 dark:text-amber-400 flex items-center gap-1 group-hover:translate-x-0.5 transition-transform">
                  Practice <ArrowRight className="w-3 h-3" />
                </span>
              </div>
            </Link>
          ))}

          {filteredQuestions.length === 0 && (
            <div className="p-8 text-center bg-slate-50 dark:bg-slate-900/40 rounded-2xl border border-dashed border-slate-200 dark:border-slate-800 text-slate-500 text-xs">
              No questions found for level <span className="font-bold">{selectedLevel}</span>.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
