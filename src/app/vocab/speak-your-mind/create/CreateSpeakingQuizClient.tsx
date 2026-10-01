"use client";

/**
 * @file CreateSpeakingQuizClient.tsx
 * @description Client Island wrapper for SpeakingQuizGenerator on the dedicated create page.
 *
 * Mapped Spec: FR-VOCAB-07 | US-VOCAB-04 | AC-VOCAB-11 | AC-VOCAB-12
 * Made by Anh Tu - Share to be share
 */

import React from "react";
import { useRouter } from "next/navigation";
import { SpeakingQuizGenerator } from "@/components/vocab/speaking/SpeakingQuizGenerator";

interface CreateSpeakingQuizClientProps {
  initialStorybookId?: string;
}

export function CreateSpeakingQuizClient({
  initialStorybookId,
}: CreateSpeakingQuizClientProps) {
  const router = useRouter();

  return (
    <SpeakingQuizGenerator
      initialStorybookId={initialStorybookId}
      onQuizReady={(newQuestion) => {
        router.push(`/vocab/speak-your-mind/${newQuestion.id}`);
      }}
      onCancel={() => {
        router.push("/vocab/speak-your-mind");
      }}
    />
  );
}
