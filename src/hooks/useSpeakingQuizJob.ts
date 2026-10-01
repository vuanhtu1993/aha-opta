"use client";

/**
 * @file useSpeakingQuizJob.ts
 * @description Custom React Hook quản lý vòng đời tạo đề bài Speaking Quiz
 * Xử lý cả Fast Path (Idempotent Cache Hit < 50ms) và Slow Path (BullMQ Queue + SSE Progress)
 *
 * Mapped Spec: FR-VOCAB-07 | US-VOCAB-04 | BR-09
 * Made by Anh Tu - Share to be share
 */

import { useState, useCallback, useRef, useEffect } from "react";
import {
  CreateSpeakingQuizJobRequest,
  SpeakingQuestionDetail,
  SpeakingQuizProgressEvent,
} from "@/lib/types/speaking-quiz";
import {
  createSpeakingQuizJob,
  fetchSpeakingQuestionById,
  subscribeToSpeakingQuizProgress,
} from "@/lib/services/speaking-quiz-client";

export type JobStatus =
  | "idle"
  | "submitting"
  | "queued"
  | "streaming"
  | "completed"
  | "error";

export interface UseSpeakingQuizJobState {
  status: JobStatus;
  progress: number;
  stageName: string;
  stageMessage: string;
  resultQuestion: SpeakingQuestionDetail | null;
  error: string | null;
}

export function useSpeakingQuizJob() {
  const [state, setState] = useState<UseSpeakingQuizJobState>({
    status: "idle",
    progress: 0,
    stageName: "init",
    stageMessage: "",
    resultQuestion: null,
    error: null,
  });

  const cleanupRef = useRef<(() => void) | null>(null);

  const cleanup = useCallback(() => {
    if (cleanupRef.current) {
      cleanupRef.current();
      cleanupRef.current = null;
    }
  }, []);

  useEffect(() => {
    return () => {
      cleanup();
    };
  }, [cleanup]);

  const startJob = useCallback(
    async (
      request: CreateSpeakingQuizJobRequest
    ): Promise<SpeakingQuestionDetail | null> => {
      cleanup();
      setState({
        status: "submitting",
        progress: 5,
        stageName: "init",
        stageMessage: "Submitting challenge creation request...",
        resultQuestion: null,
        error: null,
      });

      try {
        const response = await createSpeakingQuizJob(request);

        // Trường hợp 1: Fast Path - Idempotent Cache Hit (< 50ms)
        if (response.status === "completed" && response.existingQuestionId) {
          setState((prev) => ({
            ...prev,
            progress: 100,
            stageName: "completed",
            stageMessage: "Found existing challenge in cache!",
          }));

          const question = await fetchSpeakingQuestionById(
            response.existingQuestionId
          );
          setState({
            status: "completed",
            progress: 100,
            stageName: "completed",
            stageMessage: "Challenge ready for practice!",
            resultQuestion: question,
            error: null,
          });
          return question;
        }

        // Trường hợp 2: Slow Path - Queued Job & Lắng nghe SSE
        if (response.status === "queued" && response.sseUrl) {
          setState({
            status: "queued",
            progress: 10,
            stageName: "queued",
            stageMessage: "Queued for AI Agent processing...",
            resultQuestion: null,
            error: null,
          });

          return new Promise<SpeakingQuestionDetail | null>((resolve) => {
            cleanupRef.current = subscribeToSpeakingQuizProgress(
              response.sseUrl!,
              {
                onProgress: (event: SpeakingQuizProgressEvent) => {
                  setState((prev) => ({
                    ...prev,
                    status: "streaming",
                    progress: event.progress ?? prev.progress,
                    stageName: event.stepName || prev.stageName,
                    stageMessage: event.message || prev.stageMessage,
                  }));
                },
                onDone: (question: SpeakingQuestionDetail) => {
                  setState({
                    status: "completed",
                    progress: 100,
                    stageName: "completed",
                    stageMessage: "Speaking challenge generated successfully!",
                    resultQuestion: question,
                    error: null,
                  });
                  resolve(question);
                },
                onError: (err: Error) => {
                  setState((prev) => ({
                    ...prev,
                    status: "error",
                    error: err.message,
                  }));
                  resolve(null);
                },
              }
            );
          });
        }

        throw new Error("Invalid response from Agent Gateway");
      } catch (err) {
        const message =
          err instanceof Error ? err.message : "An unexpected error occurred";
        setState({
          status: "error",
          progress: 0,
          stageName: "error",
          stageMessage: "",
          resultQuestion: null,
          error: message,
        });
        return null;
      }
    },
    [cleanup]
  );

  const reset = useCallback(() => {
    cleanup();
    setState({
      status: "idle",
      progress: 0,
      stageName: "init",
      stageMessage: "",
      resultQuestion: null,
      error: null,
    });
  }, [cleanup]);

  return {
    ...state,
    startJob,
    reset,
  };
}
