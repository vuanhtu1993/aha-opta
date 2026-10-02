"use client";

/**
 * @file useStoryShadowingJob.ts
 * @description Custom React Hook managing Story Shadowing Job lifecycle
 * Handles Fast Path (Idempotent cache hit < 50ms) and Slow Path (BullMQ queue + GET SSE progress)
 *
 * Mapped Spec: aha-mind-agents-api-contract v2.0.0
 * Made by Anh Tu - Share to be share
 */

import { useState, useCallback, useRef, useEffect } from "react";
import {
  CreateStoryShadowingJobRequest,
  IStorybook,
  StoryShadowingProgressEvent,
} from "@/lib/types/story-shadowing";
import {
  createStoryShadowingJob,
  fetchStoryById,
  subscribeToStoryShadowingProgress,
} from "@/lib/services/story-shadowing-client";

export type StoryJobStatus =
  | "idle"
  | "submitting"
  | "queued"
  | "streaming"
  | "completed"
  | "error";

export interface UseStoryShadowingJobState {
  status: StoryJobStatus;
  progress: number;
  stageName: string;
  stageMessage: string;
  resultStory: IStorybook | null;
  error: string | null;
  isIdempotentHit: boolean;
}

export function useStoryShadowingJob() {
  const [state, setState] = useState<UseStoryShadowingJobState>({
    status: "idle",
    progress: 0,
    stageName: "init",
    stageMessage: "",
    resultStory: null,
    error: null,
    isIdempotentHit: false,
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

  const reset = useCallback(() => {
    cleanup();
    setState({
      status: "idle",
      progress: 0,
      stageName: "init",
      stageMessage: "",
      resultStory: null,
      error: null,
      isIdempotentHit: false,
    });
  }, [cleanup]);

  const startJob = useCallback(
    async (request: CreateStoryShadowingJobRequest): Promise<IStorybook> => {
      cleanup();

      setState({
        status: "submitting",
        progress: 5,
        stageName: "init",
        stageMessage: "Đang gửi yêu cầu tạo bài học...",
        resultStory: null,
        error: null,
        isIdempotentHit: false,
      });

      try {
        // 1. Gửi request tạo Job vào BullMQ Gateway
        const jobResponse = await createStoryShadowingJob(request);

        // 2. Fast Path: Idempotent Hit (< 50ms)
        if (jobResponse.status === "completed" && jobResponse.existingStoryId) {
          setState((prev) => ({
            ...prev,
            status: "completed",
            progress: 100,
            stageName: "completed",
            stageMessage: "Bài học đã có sẵn trong hệ thống (Tải tức thì)",
            isIdempotentHit: true,
          }));

          const existingStory = await fetchStoryById(jobResponse.existingStoryId);
          setState((prev) => ({
            ...prev,
            resultStory: existingStory,
          }));
          return existingStory;
        }

        // 3. Slow Path: Job xếp hàng đợi, mở SSE stream
        if (!jobResponse.sseUrl) {
          throw new Error("Không nhận được đường dẫn luồng tiến độ (sseUrl) từ Agent Gateway");
        }

        setState({
          status: "queued",
          progress: 10,
          stageName: "init",
          stageMessage: "Đã xếp hàng đợi xử lý...",
          resultStory: null,
          error: null,
          isIdempotentHit: false,
        });

        return new Promise<IStorybook>((resolve, reject) => {
          cleanupRef.current = subscribeToStoryShadowingProgress(jobResponse.sseUrl!, {
            onProgress: (event: StoryShadowingProgressEvent) => {
              setState((prev) => ({
                ...prev,
                status: "streaming",
                progress: event.progress !== undefined ? event.progress : prev.progress,
                stageName: event.stepId || prev.stageName,
                stageMessage: event.message || prev.stageMessage,
              }));
            },
            onDone: (story: IStorybook) => {
              cleanup();
              setState({
                status: "completed",
                progress: 100,
                stageName: "completed",
                stageMessage: "Tạo bài luyện tập thành công!",
                resultStory: story,
                error: null,
                isIdempotentHit: false,
              });
              resolve(story);
            },
            onError: (err: Error) => {
              cleanup();
              const errorText = err.message || "Lỗi trong quá trình sinh bài học";
              setState((prev) => ({
                ...prev,
                status: "error",
                error: errorText,
              }));
              reject(err);
            },
          });
        });
      } catch (err: any) {
        cleanup();
        const msg = err.message || "Không thể khởi tạo tiến trình tạo bài học";
        setState((prev) => ({
          ...prev,
          status: "error",
          error: msg,
        }));
        throw err;
      }
    },
    [cleanup]
  );

  return {
    ...state,
    startJob,
    reset,
  };
}
