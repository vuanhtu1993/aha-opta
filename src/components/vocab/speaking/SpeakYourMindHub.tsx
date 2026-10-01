"use client";

/**
 * @file SpeakYourMindHub.tsx
 * @description Trung tâm thử thách nói PREP (Speaking Hub Dashboard).
 * Cung cấp bức tranh toàn cảnh, giàn giáo phương pháp PREP, bài tập tiêu biểu trong ngày,
 * thư viện câu hỏi thảo luận và cổng tạo thử thách bằng AI Agent.
 *
 * Mapped Spec: FR-VOCAB-06 | FR-VOCAB-07 | US-VOCAB-03 | US-VOCAB-04 | AC-VOCAB-11
 * Made by Anh Tu - Share to be share
 */

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Mic,
  Sparkles,
  Flame,
  ArrowRight,
  Filter,
  Volume2,
  BookOpen,
  Award,
  Layers,
  CheckCircle2,
} from "lucide-react";
import { ISpeakingQuestion, CefrLevel } from "@/lib/types/speaking-quiz";
import { SpeakingQuizGenerator } from "./SpeakingQuizGenerator";

interface SpeakYourMindHubProps {
  questions: ISpeakingQuestion[];
}

export function SpeakYourMindHub({ questions }: SpeakYourMindHubProps) {
  const router = useRouter();
  const [showGeneratorModal, setShowGeneratorModal] = useState(false);
  const [levelFilter, setLevelFilter] = useState<string>("all");

  const dailyChallenge = questions.length > 0 ? questions[0] : null;

  const filteredQuestions = questions.filter((q) => {
    if (levelFilter === "all") return true;
    return q.level === levelFilter;
  });

  return (
    <div className="space-y-6 max-w-xl mx-auto pb-28">
      {/* 1. Header & AI Action */}
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-amber-500 text-slate-950 flex items-center justify-center font-black shadow-xs">
            <Mic className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-base font-black text-slate-900 dark:text-white leading-tight">
              Speak Your Mind
            </h1>
            <p className="text-[11px] font-medium text-slate-500 dark:text-slate-400">
              Luyện nói phản biện theo cấu trúc PREP
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => setShowGeneratorModal(true)}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-amber-500 hover:bg-amber-600 text-slate-950 text-xs font-black rounded-xl shadow-xs transition-colors cursor-pointer"
        >
          <Sparkles className="w-3.5 h-3.5" />
          <span>Tạo bài AI</span>
        </button>
      </div>

      {/* 2. Hero Methodology Guide (PREP Framework) */}
      <div className="bg-gradient-to-br from-amber-500/10 via-amber-500/5 to-transparent dark:from-amber-950/40 dark:via-amber-950/20 dark:to-transparent border border-amber-200/80 dark:border-amber-800/60 rounded-2xl p-4 space-y-3">
        <div className="flex items-center justify-between">
          <div className="inline-flex items-center gap-1.5 text-amber-700 dark:text-amber-300 font-extrabold text-xs uppercase tracking-wider">
            <Layers className="w-3.5 h-3.5" />
            <span>Phương pháp phản biện PREP</span>
          </div>
          <span className="text-[10px] text-slate-500 dark:text-slate-400 font-medium">
            30–60s mỗi lượt
          </span>
        </div>

        <div className="grid grid-cols-2 gap-2 text-[11px]">
          <div className="p-2 rounded-xl bg-white/80 dark:bg-slate-900/80 border border-slate-200/60 dark:border-slate-800 space-y-0.5">
            <div className="font-black text-amber-600 dark:text-amber-400 flex items-center gap-1">
              <span className="w-4 h-4 rounded-full bg-amber-100 dark:bg-amber-900/60 flex items-center justify-center text-[10px]">
                P
              </span>
              <span>Point</span>
            </div>
            <p className="text-slate-600 dark:text-slate-300 leading-tight">
              Khẳng định quan điểm trực diện (Agree / Disagree).
            </p>
          </div>

          <div className="p-2 rounded-xl bg-white/80 dark:bg-slate-900/80 border border-slate-200/60 dark:border-slate-800 space-y-0.5">
            <div className="font-black text-blue-600 dark:text-blue-400 flex items-center gap-1">
              <span className="w-4 h-4 rounded-full bg-blue-100 dark:bg-blue-900/60 flex items-center justify-center text-[10px]">
                R
              </span>
              <span>Reason</span>
            </div>
            <p className="text-slate-600 dark:text-slate-300 leading-tight">
              Lý giải nguyên nhân cốt lõi tạo nên quan điểm.
            </p>
          </div>

          <div className="p-2 rounded-xl bg-white/80 dark:bg-slate-900/80 border border-slate-200/60 dark:border-slate-800 space-y-0.5">
            <div className="font-black text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
              <span className="w-4 h-4 rounded-full bg-emerald-100 dark:bg-emerald-900/60 flex items-center justify-center text-[10px]">
                E
              </span>
              <span>Example</span>
            </div>
            <p className="text-slate-600 dark:text-slate-300 leading-tight">
              Dẫn chứng hoặc ví dụ minh họa thực tiễn.
            </p>
          </div>

          <div className="p-2 rounded-xl bg-white/80 dark:bg-slate-900/80 border border-slate-200/60 dark:border-slate-800 space-y-0.5">
            <div className="font-black text-purple-600 dark:text-purple-400 flex items-center gap-1">
              <span className="w-4 h-4 rounded-full bg-purple-100 dark:bg-purple-900/60 flex items-center justify-center text-[10px]">
                P
              </span>
              <span>Point</span>
            </div>
            <p className="text-slate-600 dark:text-slate-300 leading-tight">
              Tái khẳng định thông điệp và chốt lại vấn đề.
            </p>
          </div>
        </div>
      </div>

      {/* 3. Daily Featured Challenge Card */}
      {dailyChallenge && (
        <div className="bg-white dark:bg-slate-900 border-2 border-amber-500/80 dark:border-amber-500/60 rounded-2xl p-4.5 space-y-3 shadow-md relative overflow-hidden">
          <div className="flex items-center justify-between">
            <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-amber-500 text-slate-950 font-black text-[10px] uppercase tracking-wider shadow-xs">
              <Flame className="w-3 h-3 fill-current" />
              <span>Thử Thách Tiêu Biểu Hôm Nay</span>
            </div>
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

          {/* Keywords preview */}
          {dailyChallenge.targetKeywords && dailyChallenge.targetKeywords.length > 0 && (
            <div className="flex flex-wrap gap-1.5 pt-1">
              {dailyChallenge.targetKeywords.map((kw, i) => (
                <span
                  key={i}
                  className="px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-[10px] font-bold"
                >
                  {kw.word}
                </span>
              ))}
            </div>
          )}

          {/* CTA Link */}
          <Link
            href={`/vocab/speak-your-mind/${dailyChallenge.id}`}
            className="w-full py-2.5 px-4 bg-amber-500 hover:bg-amber-600 text-slate-950 font-black rounded-xl text-xs flex items-center justify-center gap-2 transition-colors cursor-pointer"
          >
            <span>Luyện nói ngay</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      )}

      {/* 4. Challenge Library (Danh sách câu hỏi) */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5 text-xs font-black text-slate-900 dark:text-white uppercase tracking-wider">
            <BookOpen className="w-4 h-4 text-amber-500" />
            <span>Thư Viện Thử Thách ({filteredQuestions.length})</span>
          </div>

          {/* Filter Chips */}
          <div className="flex items-center gap-1 text-[11px] font-bold">
            {["all", "B1", "B2", "C1"].map((lvl) => (
              <button
                key={lvl}
                type="button"
                onClick={() => setLevelFilter(lvl)}
                className={`px-2 py-0.5 rounded-lg transition-colors cursor-pointer ${
                  levelFilter === lvl
                    ? "bg-slate-900 text-white dark:bg-white dark:text-slate-900 font-black"
                    : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
                }`}
              >
                {lvl === "all" ? "Tất cả" : lvl}
              </button>
            ))}
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

              {/* Keywords */}
              {q.targetKeywords && q.targetKeywords.length > 0 && (
                <div className="flex flex-wrap gap-1.5 mt-2.5">
                  {q.targetKeywords.map((kw, i) => (
                    <span
                      key={i}
                      className="px-1.5 py-0.5 rounded-md bg-slate-50 dark:bg-slate-800/80 border border-slate-200/60 dark:border-slate-700/60 text-slate-600 dark:text-slate-300 text-[10px] font-medium"
                    >
                      {kw.word}
                    </span>
                  ))}
                </div>
              )}

              <div className="mt-3 pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-[11px] text-slate-400">
                <span>4 chặng giàn giáo PREP</span>
                <span className="font-bold text-amber-600 dark:text-amber-400 flex items-center gap-1 group-hover:translate-x-0.5 transition-transform">
                  Vào phòng nói <ArrowRight className="w-3 h-3" />
                </span>
              </div>
            </Link>
          ))}
        </div>
      </div>

      {/* 5. Generator Modal Dialog */}
      {showGeneratorModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="w-full max-w-xl">
            <SpeakingQuizGenerator
              onQuizReady={(newQuestion) => {
                setShowGeneratorModal(false);
                router.push(`/vocab/speak-your-mind/${newQuestion.id}`);
              }}
              onCancel={() => setShowGeneratorModal(false)}
            />
          </div>
        </div>
      )}
    </div>
  );
}
