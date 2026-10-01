"use client";

/**
 * @file CreateSpeakingQuizClient.tsx
 * @description Client Island wrapper for SpeakingQuizGenerator on the dedicated create page.
 * Revalidates server cache via Server Action and redirects back to the Hub on completion.
 *
 * Mapped Spec: FR-VOCAB-07 | US-VOCAB-04 | AC-VOCAB-11 | AC-VOCAB-12
 * Made by Anh Tu - Share to be share
 */

import React from "react";
import { useRouter } from "next/navigation";
import { SpeakingQuizGenerator } from "@/components/vocab/speaking/SpeakingQuizGenerator";
import { revalidateSpeakingHub } from "@/lib/actions/speaking-quiz.actions";
import { ISpeakingQuestion } from "@/lib/types/speaking-quiz";

interface CreateSpeakingQuizClientProps {
  initialStorybookId?: string;
}

export function CreateSpeakingQuizClient({
  initialStorybookId,
}: CreateSpeakingQuizClientProps) {
  const router = useRouter();

  const handleQuizReady = async (_newQuestion: ISpeakingQuestion) => {
    try {
      // 1. Kích hoạt Server Action để xóa cache server của Hub page (/vocab/speak-your-mind)
      await revalidateSpeakingHub();
    } catch (err) {
      console.error("[CreateSpeakingQuizClient] Failed to revalidate hub:", err);
    }

    // 2. Điều hướng người dùng quay về trang chính Hub để thấy đề bài mới tạo ở vị trí đầu tiên
    router.push("/vocab/speak-your-mind");
    router.refresh();
  };

  return (
    <SpeakingQuizGenerator
      initialStorybookId={initialStorybookId}
      onQuizReady={handleQuizReady}
      onCancel={() => {
        router.push("/vocab/speak-your-mind");
      }}
    />
  );
}
