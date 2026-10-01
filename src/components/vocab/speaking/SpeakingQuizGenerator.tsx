"use client";

/**
 * @file SpeakingQuizGenerator.tsx
 * @description Form cấu hình và kích hoạt sinh thử thách nói qua AI Agent
 *
 * Mapped Spec: FR-VOCAB-07 | US-VOCAB-04 | BR-08 | BR-09
 * Made by Anh Tu - Share to be share
 */

import React, { useState } from "react";
import { Sparkles, BookOpen, PenTool, RefreshCw, X } from "lucide-react";
import { CefrLevel, SpeakingQuestionDetail } from "@/lib/types/speaking-quiz";
import { useSpeakingQuizJob } from "@/hooks/useSpeakingQuizJob";
import { SpeakingQuizProgress } from "./SpeakingQuizProgress";
import { StorybookSelectorModal } from "./StorybookSelectorModal";

interface SpeakingQuizGeneratorProps {
  initialStorybookId?: string;
  onQuizReady: (question: SpeakingQuestionDetail) => void;
  onCancel?: () => void;
}

export function SpeakingQuizGenerator({
  initialStorybookId,
  onQuizReady,
  onCancel,
}: SpeakingQuizGeneratorProps) {
  const [mode, setMode] = useState<"storybook" | "custom">(
    initialStorybookId ? "storybook" : "custom"
  );
  const [selectedStory, setSelectedStory] = useState<{
    id: string;
    title: string;
    thumbnail?: string;
    level?: string;
  } | null>(
    initialStorybookId ? { id: initialStorybookId, title: "Bài học đã chọn" } : null
  );
  const [isPickerOpen, setIsPickerOpen] = useState(false);
  const [customTopic, setCustomTopic] = useState("");
  const [level, setLevel] = useState<CefrLevel>("B2");
  const [keywordsText, setKeywordsText] = useState("");
  const [forceRegenerate, setForceRegenerate] = useState(false);

  const { status, progress, stageName, stageMessage, error, startJob, reset } =
    useSpeakingQuizJob();

  const isGenerating =
    status === "submitting" || status === "queued" || status === "streaming";

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();

    if (mode === "storybook" && !selectedStory?.id) {
      setIsPickerOpen(true);
      return;
    }

    const targetKeywords = keywordsText
      .split(",")
      .map((k) => k.trim())
      .filter(Boolean);

    const question = await startJob({
      storybookId: mode === "storybook" && selectedStory?.id ? selectedStory.id : undefined,
      customTopic: mode === "custom" && customTopic ? customTopic : undefined,
      level,
      targetKeywords,
      forceRegenerate,
    });

    if (question) {
      onQuizReady(question);
    }
  };

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 rounded-2xl p-5 space-y-5 shadow-xs max-w-xl mx-auto relative">
      {/* Storybook Selector Modal */}
      <StorybookSelectorModal
        isOpen={isPickerOpen}
        selectedId={selectedStory?.id}
        onSelect={(story) => {
          setSelectedStory({
            id: story._id,
            title: story.title,
            thumbnail: story.thumbnail,
            level: story.level,
          });
        }}
        onClose={() => setIsPickerOpen(false)}
      />

      {/* Close button if onCancel provided */}
      {onCancel && !isGenerating && (
        <button
          type="button"
          onClick={onCancel}
          className="absolute top-4 right-4 p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
        >
          <X className="w-4 h-4" />
        </button>
      )}

      {/* Title */}
      <div className="space-y-1">
        <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/60 text-amber-700 dark:text-amber-300 text-[10px] font-bold uppercase tracking-wider">
          <Sparkles className="w-3 h-3" />
          <span>AI Debate Generator</span>
        </div>
        <h2 className="text-lg font-black text-slate-900 dark:text-white">
          Tạo Thử Thách Phản Biện PREP
        </h2>
        <p className="text-xs text-slate-500 dark:text-slate-400">
          Agent sẽ phân tích ngữ cảnh, sinh câu hỏi tranh luận kèm giàn giáo 4 chặng để bạn luyện nói.
        </p>
      </div>

      {/* Mode Selector Tabs */}
      {!isGenerating && (
        <div className="flex p-1 bg-slate-100 dark:bg-slate-800/80 rounded-xl gap-1">
          <button
            type="button"
            onClick={() => setMode("custom")}
            className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 px-3 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              mode === "custom"
                ? "bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-2xs"
                : "text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
            }`}
          >
            <PenTool className="w-3.5 h-3.5" />
            <span>Chủ đề tự do</span>
          </button>
          <button
            type="button"
            onClick={() => setMode("storybook")}
            className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 px-3 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              mode === "storybook"
                ? "bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-2xs"
                : "text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
            }`}
          >
            <BookOpen className="w-3.5 h-3.5" />
            <span>Theo Storybook</span>
          </button>
        </div>
      )}

      {/* Generation Progress Bar */}
      {isGenerating && (
        <SpeakingQuizProgress
          progress={progress}
          stageName={stageName}
          stageMessage={stageMessage}
          error={error}
          onRetry={reset}
        />
      )}

      {/* Form Input */}
      {!isGenerating && (
        <form onSubmit={handleGenerate} className="space-y-4">
          {mode === "custom" ? (
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                Chủ đề thảo luận (Topic / Dilemma)
              </label>
              <input
                type="text"
                value={customTopic}
                onChange={(e) => setCustomTopic(e.target.value)}
                placeholder="VD: Artificial Intelligence and Human Creativity"
                required
                className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-hidden focus:border-amber-500"
              />
            </div>
          ) : (
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                Bài học Storybook mục tiêu
              </label>
              {!selectedStory ? (
                <button
                  type="button"
                  onClick={() => setIsPickerOpen(true)}
                  className="w-full py-4 px-4 border-2 border-dashed border-slate-200 dark:border-slate-700 hover:border-amber-400 dark:hover:border-amber-600 rounded-xl flex flex-col items-center justify-center gap-1.5 bg-slate-50/50 dark:bg-slate-800/40 hover:bg-amber-50/30 dark:hover:bg-amber-950/20 transition-all cursor-pointer group"
                >
                  <div className="w-8 h-8 rounded-full bg-amber-100 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 flex items-center justify-center group-hover:scale-110 transition-transform">
                    <BookOpen className="w-4 h-4" />
                  </div>
                  <span className="text-xs font-bold text-slate-700 dark:text-slate-300 group-hover:text-amber-600 dark:group-hover:text-amber-400">
                    Bấm để chọn bài học từ Storybook
                  </span>
                  <span className="text-[10px] text-slate-400">
                    Chọn bài học để AI trích xuất nội dung làm đề tài tranh luận
                  </span>
                </button>
              ) : (
                <div className="flex items-center gap-3 p-2.5 rounded-xl border border-amber-300/80 dark:border-amber-700/80 bg-amber-50/60 dark:bg-amber-950/20">
                  <div className="w-12 h-10 rounded-lg overflow-hidden bg-slate-100 dark:bg-slate-800 flex items-center justify-center shrink-0 border border-slate-200/60 dark:border-slate-700">
                    {selectedStory.thumbnail ? (
                      <img
                        src={selectedStory.thumbnail}
                        alt={selectedStory.title}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <BookOpen className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="text-xs font-bold text-slate-900 dark:text-white truncate">
                      {selectedStory.title}
                    </h4>
                    {selectedStory.level && (
                      <span className="inline-block mt-0.5 px-1.5 py-0.5 rounded-xs bg-amber-100 dark:bg-amber-900/60 text-amber-800 dark:text-amber-300 text-[9px] font-bold uppercase">
                        {selectedStory.level}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => setIsPickerOpen(true)}
                      className="px-2 py-1 text-[11px] font-bold text-amber-700 dark:text-amber-300 hover:bg-amber-100 dark:hover:bg-amber-900/50 rounded-lg transition-colors cursor-pointer"
                    >
                      Đổi bài
                    </button>
                    <button
                      type="button"
                      onClick={() => setSelectedStory(null)}
                      className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg transition-colors cursor-pointer"
                      title="Bỏ chọn"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Level & Force Regenerate */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                Cấp độ CEFR
              </label>
              <select
                value={level}
                onChange={(e) => setLevel(e.target.value as CefrLevel)}
                className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-white focus:outline-hidden focus:border-amber-500 cursor-pointer"
              >
                <option value="B1">B1 (Intermediate)</option>
                <option value="B2">B2 (Upper Intermediate)</option>
                <option value="C1">C1 (Advanced)</option>
              </select>
            </div>

            <div className="flex items-center pt-5">
              <label className="inline-flex items-center gap-2 cursor-pointer text-xs text-slate-600 dark:text-slate-300 select-none">
                <input
                  type="checkbox"
                  checked={forceRegenerate}
                  onChange={(e) => setForceRegenerate(e.target.checked)}
                  className="rounded-sm border-slate-300 text-amber-600 focus:ring-amber-500 cursor-pointer"
                />
                <span>Ép tạo mới (Bỏ cache)</span>
              </label>
            </div>
          </div>

          {/* Target Keywords */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
              Từ vựng mục tiêu (Phân tách bằng dấu phẩy)
            </label>
            <input
              type="text"
              value={keywordsText}
              onChange={(e) => setKeywordsText(e.target.value)}
              placeholder="VD: sustainable, transition, empathy"
              className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-hidden focus:border-amber-500"
            />
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isGenerating}
            className="w-full py-2.5 px-4 bg-amber-500 hover:bg-amber-600 disabled:opacity-50 text-slate-950 font-bold rounded-xl text-xs flex items-center justify-center gap-2 transition-colors cursor-pointer"
          >
            {isGenerating ? (
              <>
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                <span>Đang xử lý qua AI...</span>
              </>
            ) : (
              <>
                <Sparkles className="w-3.5 h-3.5" />
                <span>Khởi tạo Thử thách PREP</span>
              </>
            )}
          </button>
        </form>
      )}
    </div>
  );
}
