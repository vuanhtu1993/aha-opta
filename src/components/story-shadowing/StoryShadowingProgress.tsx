"use client";

/**
 * @file StoryShadowingProgress.tsx
 * @description Floating Bottom Toast HUD for Story Shadowing Agent.
 * Wraps unified AgentProgress component with dynamic Text & YouTube stages.
 *
 * Mapped Spec: FR-SHADOW-04 | AC-SHADOW-03
 * Made by Anh Tu - Share to be share
 */

import React from "react";
import { StoryJobStatus } from "@/hooks/useStoryShadowingJob";
import { AgentProgress, AgentStageItem } from "@/components/ui/agent-progress";

export interface StoryShadowingProgressProps {
  status: StoryJobStatus;
  progress: number;
  stageName: string;
  stageMessage: string;
  pipeline: "text" | "youtube";
  error: string | null;
  onRetry?: () => void;
  onCancel?: () => void;
}

const TEXT_STAGES: AgentStageItem[] = [
  { key: "sentenceSplitter", label: "Câu & IPA", threshold: 30 },
  { key: "keywordIdentifier", label: "Từ vựng", threshold: 50 },
  { key: "ttsGenerator", label: "Giọng đọc", threshold: 80 },
  { key: "keywordEnricher", label: "Làm giàu", threshold: 100 },
];

const YOUTUBE_STAGES: AgentStageItem[] = [
  { key: "youtubeFetcher", label: "Phụ đề CC", threshold: 30 },
  { key: "youtubeConsolidator", label: "Câu & IPA", threshold: 50 },
  { key: "keywordIdentifier", label: "Từ vựng", threshold: 75 },
  { key: "keywordEnricher", label: "Làm giàu", threshold: 100 },
];

export function StoryShadowingProgress({
  status,
  progress,
  stageName,
  stageMessage,
  pipeline,
  error,
  onRetry,
  onCancel,
}: StoryShadowingProgressProps) {
  const stages = pipeline === "youtube" ? YOUTUBE_STAGES : TEXT_STAGES;

  return (
    <AgentProgress
      open={status !== "idle"}
      title={`Shadowing • ${pipeline === "youtube" ? "YouTube" : "Text"}`}
      badge={pipeline.toUpperCase()}
      readyTitle="Bài học đã sẵn sàng!"
      readyMessage="Đang chuyển hướng sang phòng luyện nói..."
      progress={progress}
      activeStageKey={stageName}
      stageMessage={stageMessage}
      stages={stages}
      error={error}
      onRetry={onRetry}
      onCancel={onCancel}
    />
  );
}
