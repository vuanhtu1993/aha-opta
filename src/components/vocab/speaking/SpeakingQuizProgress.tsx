"use client";

/**
 * @file SpeakingQuizProgress.tsx
 * @description Mobile-First PWA Floating Bottom Toast HUD for Speaking Quiz Agentic Pipeline.
 * Wraps unified AgentProgress component with 4 PREP stages.
 *
 * Mapped Spec: FR-VOCAB-07 | US-VOCAB-04 | AC-VOCAB-09
 * Made by Anh Tu - Share to be share
 */

import React from "react";
import { AgentProgress, AgentStageItem } from "@/components/ui/agent-progress";

export interface SpeakingQuizProgressProps {
  open: boolean;
  progress: number;
  stageName: string;
  stageMessage: string;
  error?: string | null;
  onRetry?: () => void;
  onCancel?: () => void;
}

const STAGES: AgentStageItem[] = [
  {
    key: "context_resolved",
    label: "Context",
    threshold: 25,
  },
  {
    key: "question_formulated",
    label: "Question",
    threshold: 50,
  },
  {
    key: "prep_synthesized",
    label: "PREP",
    threshold: 80,
  },
  {
    key: "completed",
    label: "Ready",
    threshold: 100,
  },
];

export function SpeakingQuizProgress({
  open,
  progress,
  stageName,
  stageMessage,
  error,
  onRetry,
  onCancel,
}: SpeakingQuizProgressProps) {
  return (
    <AgentProgress
      open={open}
      title="AI Debate Agent"
      badge="PREP"
      readyTitle="Challenge Ready!"
      readyMessage="Redirecting to Speak Your Mind..."
      progress={progress}
      activeStageKey={stageName}
      stageMessage={stageMessage}
      stages={STAGES}
      error={error}
      onRetry={onRetry}
      onCancel={onCancel}
    />
  );
}
