"use client";

import React, { useState } from "react";
import Link from "next/link";
import { Plus, ArrowRight, Sparkles } from "lucide-react";
import { ISpeakingQuestion, FrameworkType } from "@/lib/types/speaking-quiz";
import { getFrameworkConfig } from "@/lib/services/speaking-quiz-client";

/**
 * @file SpeakYourMindHub.tsx
 * @description Interactive Client Component for Speak Your Mind Hub Dashboard.
 * Giới thiệu 4 khung tư duy (PREP, PAR, STAR, CCR), hiển thị Daily Challenge và danh sách bài luyện nói.
 *
 * Mapped Spec: FR-VOCAB-06 | FR-VOCAB-07 | US-VOCAB-03 | US-VOCAB-04 | AC-VOCAB-11
 * Made by Anh Tu - Share to be share
 */

interface SpeakYourMindHubProps {
  questions: ISpeakingQuestion[];
  initialLevel?: string;
  currentLevel?: string;
}

const FRAMEWORK_GUIDES: Record<
  FrameworkType,
  {
    name: string;
    subtitle: string;
    description: string;
    stages: { code: string; label: string; desc: string; color: string }[];
  }
> = {
  PREP: {
    name: "PREP Framework",
    subtitle: "Quan điểm & Tranh biện (Opinion / Debate)",
    description: "Cấu trúc kinh điển giúp đưa ra quan điểm đanh thép và bảo vệ lập luận logic.",
    stages: [
      { code: "P", label: "Point", desc: "Tuyên bố quan điểm rõ ràng (Đồng ý/Phản đối)", color: "text-emerald-600 dark:text-emerald-400" },
      { code: "R", label: "Reason", desc: "Giải thích nguyên nhân cốt lõi và lập luận", color: "text-blue-600 dark:text-blue-400" },
      { code: "E", label: "Example", desc: "Dẫn chứng thực tế, số liệu hoặc ví dụ cụ thể", color: "text-amber-600 dark:text-amber-400" },
      { code: "P", label: "Point", desc: "Đúc kết thông điệp và chốt lại luận điểm", color: "text-purple-600 dark:text-purple-400" },
    ],
  },
  PAR: {
    name: "PAR Framework",
    subtitle: "Lời khuyên & Giải pháp (Problem-Solving)",
    description: "Tối ưu cho câu hỏi tham vấn ý kiến, đưa ra lộ trình giải quyết vấn đề thực tế.",
    stages: [
      { code: "P", label: "Problem", desc: "Nêu thực trạng nan giải và rủi ro nếu bỏ qua", color: "text-rose-600 dark:text-rose-400" },
      { code: "A", label: "Advice", desc: "Đề xuất lời khuyên và hành động thực tiễn", color: "text-blue-600 dark:text-blue-400" },
      { code: "R", label: "Result", desc: "Lợi ích kỳ vọng hoặc phương án thay thế", color: "text-emerald-600 dark:text-emerald-400" },
    ],
  },
  STAR: {
    name: "STAR Framework",
    subtitle: "Kể chuyện & Trải nghiệm (Storytelling / Behavioral)",
    description: "Chuẩn giao tiếp quốc tế để chia sẻ câu chuyện vượt khó và hành động cá nhân.",
    stages: [
      { code: "S", label: "Situation", desc: "Bối cảnh thời gian, không gian sự việc", color: "text-sky-600 dark:text-sky-400" },
      { code: "T", label: "Task", desc: "Thách thức hoặc mục tiêu cần hoàn thành", color: "text-indigo-600 dark:text-indigo-400" },
      { code: "A", label: "Action", desc: "Hành động cụ thể bạn đã chủ động thực hiện", color: "text-blue-600 dark:text-blue-400" },
      { code: "R", label: "Result", desc: "Kết quả tích cực và bài học rút ra", color: "text-emerald-600 dark:text-emerald-400" },
    ],
  },
  CCR: {
    name: "CCR Framework",
    subtitle: "Đàm phán & Cân nhắc đa chiều (Diplomacy / Trade-offs)",
    description: "Khung tư duy biện chứng cao cấp, thừa nhận mặt đối lập trước khi chốt giải pháp.",
    stages: [
      { code: "C", label: "Claim", desc: "Luận điểm đề xuất ban đầu", color: "text-blue-600 dark:text-blue-400" },
      { code: "C", label: "Concession", desc: "Thừa nhận rủi ro hoặc góc nhìn phản biện", color: "text-amber-600 dark:text-amber-400" },
      { code: "R", label: "Resolution", desc: "Giải pháp dung hòa và phương hướng dung nạp", color: "text-emerald-600 dark:text-emerald-400" },
    ],
  },
};

export function SpeakYourMindHub({
  questions = [],
  initialLevel,
  currentLevel,
}: SpeakYourMindHubProps) {
  const [selectedLevel, setSelectedLevel] = useState<string>(
    initialLevel || currentLevel || "all"
  );
  const [activeFrameworkTab, setActiveFrameworkTab] = useState<FrameworkType>("PREP");

  const dailyChallenge = questions.length > 0 ? questions[0] : null;
  const dailyFrameworkConfig = getFrameworkConfig(
    dailyChallenge?.adaptiveScaffold?.frameworkType || "PREP"
  );

  const filteredQuestions = questions.filter((q) => {
    if (!selectedLevel || selectedLevel === "all") return true;
    return q.level === selectedLevel;
  });

  const guide = FRAMEWORK_GUIDES[activeFrameworkTab];

  return (
    <div className="space-y-6 max-w-xl mx-auto pb-28">
      {/* 1. Header Shell */}
      <div className="flex items-center justify-between pt-1">
        <div>
          <h1 className="text-xl font-black text-slate-900 dark:text-white tracking-tight">
            Speak Your Mind
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Adaptive Speaking Frameworks • Tư duy & Phản xạ nói
          </p>
        </div>

        <Link
          href="/vocab/speak-your-mind/create"
          className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-[#FFBA49] hover:bg-[#e6a640] text-slate-900 font-bold text-xs rounded-xl shadow-xs transition-colors active:scale-98 cursor-pointer"
        >
          <Plus className="w-4 h-4" /> Create
        </Link>
      </div>

      {/* 2. Hero Methodology Guide (Hỗ trợ tương tác 4 Frameworks) */}
      <div className="bg-slate-50 dark:bg-slate-900/60 border border-slate-200/80 dark:border-slate-800 rounded-2xl p-4 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <Sparkles className="w-4 h-4 text-amber-500" />
            <span className="text-xs font-black text-slate-900 dark:text-white uppercase tracking-wider">
              Adaptive Speaking Frameworks
            </span>
          </div>
          <span className="text-[11px] text-slate-400 font-medium">
            30–60s per turn
          </span>
        </div>

        {/* Framework Selector Tabs */}
        <div className="flex gap-1 p-1 bg-slate-200/60 dark:bg-slate-800/80 rounded-xl">
          {(["PREP", "PAR", "STAR", "CCR"] as FrameworkType[]).map((fw) => (
            <button
              key={fw}
              type="button"
              onClick={() => setActiveFrameworkTab(fw)}
              className={`flex-1 py-1 text-center rounded-lg text-xs font-bold transition-all cursor-pointer ${
                activeFrameworkTab === fw
                  ? "bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-2xs"
                  : "text-slate-500 hover:text-slate-900 dark:hover:text-white"
              }`}
            >
              {fw}
            </button>
          ))}
        </div>

        {/* Tab Description */}
        <div className="space-y-1">
          <div className="flex items-center justify-between text-xs font-bold text-slate-800 dark:text-slate-200">
            <span>{guide.name}</span>
            <span className="text-[10px] text-slate-400 font-medium">
              {guide.subtitle}
            </span>
          </div>
          <p className="text-[11px] text-slate-500 dark:text-slate-400">
            {guide.description}
          </p>
        </div>

        {/* Stages Grid */}
        <div
          className={`grid gap-2 text-[11px] ${
            guide.stages.length === 3 ? "grid-cols-3" : "grid-cols-2"
          }`}
        >
          {guide.stages.map((stg, sIdx) => (
            <div
              key={sIdx}
              className="p-2.5 rounded-xl bg-white dark:bg-slate-800/80 border border-slate-200/60 dark:border-slate-700/60 space-y-0.5"
            >
              <div className={`font-black text-xs ${stg.color}`}>
                {stg.code} • {stg.label}
              </div>
              <p className="text-slate-600 dark:text-slate-300 leading-tight text-[10px]">
                {stg.desc}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* 3. Daily Featured Challenge Card */}
      {dailyChallenge && (
        <div className="bg-white dark:bg-slate-900 border-2 border-amber-500/80 dark:border-amber-500/60 rounded-2xl p-4.5 space-y-3 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="px-2.5 py-0.5 rounded-full bg-amber-500 text-slate-950 font-black text-[10px] uppercase tracking-wider">
              Daily Featured Challenge
            </span>
            <div className="flex items-center gap-1.5">
              <span
                className={`px-2 py-0.5 rounded-md text-[10px] font-black uppercase tracking-wider border ${dailyFrameworkConfig.badgeClass}`}
              >
                {dailyFrameworkConfig.shortName}
              </span>
              <span className="px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-extrabold text-[10px] uppercase border border-slate-200 dark:border-slate-700">
                {dailyChallenge.level}
              </span>
            </div>
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
                  <strong className="text-amber-700 dark:text-amber-400">
                    {kw.word}
                  </strong>
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
              Start {dailyFrameworkConfig.shortName} Practice{" "}
              <ArrowRight className="w-3.5 h-3.5" />
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
          {filteredQuestions.map((q) => {
            const fwConfig = getFrameworkConfig(
              q.adaptiveScaffold?.frameworkType || "PREP"
            );

            return (
              <Link
                key={q.id}
                href={`/vocab/speak-your-mind/${q.id}`}
                className="block bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 hover:border-amber-400 dark:hover:border-amber-600/80 rounded-2xl p-4 transition-all group shadow-2xs hover:shadow-xs"
              >
                <div className="flex items-center justify-between gap-2 mb-1.5">
                  <span className="text-[10px] font-bold text-amber-600 dark:text-amber-400 uppercase tracking-wider truncate">
                    {q.topic}
                  </span>
                  <div className="flex items-center gap-1.5">
                    <span
                      className={`px-1.5 py-0.5 rounded text-[9px] font-black uppercase tracking-wider border ${fwConfig.badgeClass}`}
                    >
                      {fwConfig.shortName}
                    </span>
                    <span className="px-1.5 py-0.5 rounded-sm bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 text-[10px] font-bold uppercase border border-slate-200 dark:border-slate-700">
                      {q.level}
                    </span>
                  </div>
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
                  <span>
                    {q.adaptiveScaffold
                      ? `${fwConfig.shortName} Scaffold`
                      : "4 PREP stages"}
                  </span>
                  <span className="font-bold text-amber-600 dark:text-amber-400 flex items-center gap-1 group-hover:translate-x-0.5 transition-transform">
                    Practice <ArrowRight className="w-3 h-3" />
                  </span>
                </div>
              </Link>
            );
          })}

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
