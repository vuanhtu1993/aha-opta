"use client";

/**
 * @file SpeakYourMindPlayer.tsx
 * @description Main Container Component for Speak Your Mind (Adaptive Framework Speaking).
 * Hỗ trợ 4 loại giàn giáo thích ứng (PREP, PAR, STAR, CCR), hiển thị Topic Collocations,
 * và tích hợp 1-tap lưu từ vựng vào hệ thống ôn tập giãn cách FSRS (/vocab/review).
 *
 * Mapped Spec: FR-VOCAB-06 | FR-VOCAB-07 | US-VOCAB-03 | US-VOCAB-04 | BR-08 | BR-09
 * Made by Anh Tu - Share to be share
 */

import React, { useState, useMemo } from "react";
import { Volume2, Plus, BookmarkPlus, Check, Loader2 } from "lucide-react";
import Link from "next/link";
import {
  ISpeakingQuestion,
  AdaptiveScaffoldStageItem,
  TopicCollocationItem,
} from "@/lib/types/speaking-quiz";
import { SpeakingPrepCard } from "./SpeakingPrepCard";
import { TopicCollocationsCard } from "./TopicCollocationsCard";
import { vocabSpeaker } from "@/lib/services/vocab-speaker";
import {
  getFrameworkConfig,
  getSrsBadgeConfig,
} from "@/lib/services/speaking-quiz-client";
import { useVocabSave } from "@/lib/hooks/use-vocab-save";

interface SpeakYourMindPlayerProps {
  question: ISpeakingQuestion;
}

export function SpeakYourMindPlayer({ question }: SpeakYourMindPlayerProps) {
  const [currentQuestion] = useState<ISpeakingQuestion>(question);
  const [revealAll, setRevealAll] = useState(false);

  // 1. Thu thập toàn bộ từ vựng và cụm từ cần theo dõi trạng thái SRS
  const initialTrackedWords = useMemo(() => {
    const list: string[] = [];
    if (currentQuestion.targetKeywords) {
      currentQuestion.targetKeywords.forEach((k) => list.push(k.word));
    }
    if (currentQuestion.adaptiveScaffold?.topicCollocations) {
      currentQuestion.adaptiveScaffold.topicCollocations.forEach((c) =>
        list.push(c.phrase)
      );
    }
    return list;
  }, [currentQuestion]);

  // 2. Kích hoạt hook quản lý trạng thái và 1-tap save vào SRS
  const { isSaved, isSaving, saveWord } = useVocabSave(initialTrackedWords);

  // 3. Cấu hình Framework thích ứng (PREP, PAR, STAR, CCR)
  const frameworkConfig = getFrameworkConfig(
    currentQuestion.adaptiveScaffold?.frameworkType || "PREP"
  );

  const handleSpeakWord = (word: string) => {
    vocabSpeaker.speak(word);
  };

  const handleSaveCollocation = (item: TopicCollocationItem) => {
    saveWord({
      word: item.phrase,
      ipa: item.ipa,
      explanation: item.meaning,
      level: currentQuestion.level,
      sourceStorybookId: currentQuestion.storybookId,
      sourceStorybookTitle: currentQuestion.topic,
    });
  };

  // 4. Chuẩn hóa danh sách các chặng theo Adaptive Scaffold hoặc Fallback về Legacy PREP
  const adaptiveStages = useMemo(() => {
    if (!currentQuestion.adaptiveScaffold?.stages) return null;
    const { stage1, stage2, stage3, stage4 } = currentQuestion.adaptiveScaffold.stages;
    return [stage1, stage2, stage3, stage4].filter(Boolean) as AdaptiveScaffoldStageItem[];
  }, [currentQuestion]);

  return (
    <div className="space-y-4 max-w-xl mx-auto pb-28">
      {/* 1. Header (Clean, minimal, dynamic framework subtitle) */}
      <div className="flex items-center justify-between gap-2 mt-4">
        <div>
          <h1 className="text-xl font-black text-slate-900 dark:text-white leading-none">
            Speak Your Mind
          </h1>
          <span className="text-[11px] font-medium text-slate-400">
            {currentQuestion.adaptiveScaffold?.frameworkName ||
              "PREP Argumentation Practice"}
          </span>
        </div>

        <div className="flex items-center gap-1.5">
          <Link
            href="/vocab/speak-your-mind/create"
            className="inline-flex items-center gap-1 text-[11px] font-bold text-slate-800 dark:text-slate-200 hover:text-slate-950 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 px-2.5 py-1 rounded-lg transition-colors cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>New</span>
          </Link>
          <span className="px-2 py-0.5 rounded-md bg-amber-500 text-slate-950 font-black text-[10px] tracking-wider uppercase">
            {currentQuestion.level}
          </span>
        </div>
      </div>

      {/* 2. Topic & Question Card */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl p-5 space-y-3.5 shadow-2xs">
        <div className="space-y-1">
          <span className="text-[10px] font-black uppercase tracking-wider text-amber-600 dark:text-amber-400">
            {currentQuestion.topic}
          </span>
          <h2 className="text-base font-black text-slate-900 dark:text-white leading-snug">
            {currentQuestion.question}
          </h2>
        </div>

        {/* Target Keywords (Kèm audio và 1-tap save) */}
        {currentQuestion.targetKeywords && currentQuestion.targetKeywords.length > 0 && (
          <div className="pt-2 border-t border-slate-100 dark:border-slate-800/80 space-y-1.5">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
              Target Vocabulary
            </span>
            <div className="flex flex-wrap gap-2">
              {currentQuestion.targetKeywords.map((item, idx) => {
                const saved = isSaved(item.word);
                const saving = isSaving(item.word);

                return (
                  <div
                    key={idx}
                    className="inline-flex items-center gap-1.5 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/80 hover:border-amber-300 dark:hover:border-amber-700 px-2 py-1 rounded-lg text-xs transition-colors"
                    title={item.meaning}
                  >
                    <button
                      type="button"
                      onClick={() => handleSpeakWord(item.word)}
                      className="group inline-flex items-center gap-1 font-bold text-slate-800 dark:text-slate-200 hover:text-amber-600 dark:hover:text-amber-400 cursor-pointer"
                    >
                      <span>{item.word}</span>
                      {item.ipa && (
                        <span className="text-[10px] text-slate-400 font-mono">
                          {item.ipa}
                        </span>
                      )}
                      <Volume2 className="w-3 h-3 text-slate-400 group-hover:text-amber-500 transition-colors" />
                    </button>

                    {/* Nút 1-Tap Save */}
                    <button
                      type="button"
                      disabled={saved || saving}
                      onClick={() => {
                        if (!saved && !saving) {
                          saveWord({
                            word: item.word,
                            ipa: item.ipa,
                            explanation: item.meaning,
                            level: currentQuestion.level,
                            sourceStorybookId: currentQuestion.storybookId,
                            sourceStorybookTitle: currentQuestion.topic,
                          });
                        }
                      }}
                      className={`inline-flex items-center p-0.5 rounded transition-all cursor-pointer ${
                        saved
                          ? "text-emerald-600 dark:text-emerald-400 cursor-default"
                          : saving
                          ? "text-slate-400 cursor-wait"
                          : "text-slate-400 hover:text-amber-500 hover:bg-slate-200/50 dark:hover:bg-slate-700/50"
                      }`}
                      title={saved ? "Đã lưu vào kho SRS" : "Lưu vào kho từ vựng SRS"}
                    >
                      {saving ? (
                        <Loader2 className="w-3 h-3 animate-spin" />
                      ) : saved ? (
                        <Check className="w-3 h-3" />
                      ) : (
                        <BookmarkPlus className="w-3 h-3" />
                      )}
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* 3. Topic Collocations & Idioms Card */}
      {currentQuestion.adaptiveScaffold?.topicCollocations &&
        currentQuestion.adaptiveScaffold.topicCollocations.length > 0 && (
          <TopicCollocationsCard
            collocations={currentQuestion.adaptiveScaffold.topicCollocations}
            isSaved={isSaved}
            isSaving={isSaving}
            onSave={handleSaveCollocation}
          />
        )}

      {/* 4. Section Controls: Framework Name & Global Toggle */}
      <div className="flex items-center justify-between px-1 pt-1">
        <div className="flex items-center gap-2">
          <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
            {frameworkConfig.shortName} Framework
          </span>
          <span
            className={`px-2 py-0.5 rounded-md text-[10px] font-black uppercase tracking-wider border ${frameworkConfig.badgeClass}`}
          >
            {frameworkConfig.shortName}
          </span>
        </div>
        <button
          type="button"
          onClick={() => setRevealAll(!revealAll)}
          className="text-xs font-semibold text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white transition-colors cursor-pointer"
        >
          {revealAll ? "Hide all models" : "Show all models"}
        </button>
      </div>

      {/* 5. Scaffold Cards (Adaptive Stage Rendering với Fallback về PREP) */}
      <div className="space-y-2.5">
        {adaptiveStages && adaptiveStages.length > 0 ? (
          adaptiveStages.map((stageItem, index) => (
            <SpeakingPrepCard
              key={stageItem.stageKey || index}
              stageKey={stageItem.stageKey}
              stageData={stageItem}
              frameworkType={currentQuestion.adaptiveScaffold?.frameworkType}
              stageIndex={index + 1}
              isForceRevealed={revealAll}
            />
          ))
        ) : (
          <>
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
          </>
        )}
      </div>
    </div>
  );
}
