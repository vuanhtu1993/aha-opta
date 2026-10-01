/**
 * @file speaking-quiz.ts
 * @description Định nghĩa Type & Interface cho chế độ Speaking Quiz (Speak Your Mind - PREP)
 * Tương thích với microservice aha-mind-agents theo speaking-quiz-api-contract.md
 *
 * Mapped Spec: FR-VOCAB-06 | FR-VOCAB-07 | US-VOCAB-03 | US-VOCAB-04 | BR-08 | BR-09
 * Made by Anh Tu - Share to be share
 */

/**
 * Chuẩn cấp độ ngôn ngữ CEFR
 */
export type CefrLevel = "B1" | "B2" | "C1";

/**
 * Cấu hình một chặng trong giàn giáo PREP
 */
export interface SpeakingScaffoldStage {
  stage: "point" | "reason" | "example" | "conclusion";
  title: string;
  signposts: string[];
  hint: string;
  modelAnswer: string;
}

/**
 * Trọn bộ giàn giáo PREP 4 chặng
 */
export interface SpeakingPrepScaffold {
  point: SpeakingScaffoldStage;
  reason: SpeakingScaffoldStage;
  example: SpeakingScaffoldStage;
  conclusion: SpeakingScaffoldStage;
}

/**
 * Từ vựng trọng tâm kèm phát âm IPA và định nghĩa
 */
export interface TargetKeywordItem {
  word: string;
  ipa?: string;
  meaning: string;
}

/**
 * Payload khởi tạo Job sinh đề bài Speaking Quiz
 */
export interface CreateSpeakingQuizJobRequest {
  storybookId?: string;
  customTopic?: string;
  level?: CefrLevel;
  targetKeywords?: string[];
  forceRegenerate?: boolean;
}

/**
 * Kết quả phản hồi khi tạo Job
 */
export interface CreateSpeakingQuizJobResponse {
  jobId: string;
  status: "queued" | "completed";
  sseUrl?: string;
  existingQuestionId?: string;
  createdAt: string;
}

/**
 * Chi tiết bản ghi đề bài Speaking Quiz hoàn chỉnh
 */
export interface SpeakingQuestionDetail {
  id: string;
  storybookId?: string;
  topic: string;
  question: string;
  level: CefrLevel;
  targetKeywords: TargetKeywordItem[];
  prepScaffold: SpeakingPrepScaffold;
  tokenUsage?: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
  createdAt?: string;
}

/**
 * Kết quả truy vấn danh sách câu hỏi
 */
export interface SpeakingQuestionsListResponse {
  total: number;
  questions: SpeakingQuestionDetail[];
}

/**
 * Sự kiện tiến trình thời gian thực qua Server-Sent Events (SSE)
 */
export interface SpeakingQuizProgressEvent {
  type?: "JOB_STARTED" | "JOB_COMPLETED" | "JOB_FAILED" | string;
  data?: any;
  jobId?: string;
  stepId?: string;
  stepName?:
    | "context_resolved"
    | "question_formulated"
    | "prep_synthesized"
    | "completed"
    | string;
  status?: "completed" | "done" | "failed" | "init";
  progress?: number;
  message?: string;
  payload?: {
    questionId?: string;
    topic?: string;
    question?: string;
    level?: CefrLevel;
    tokenUsage?: {
      promptTokens: number;
      completionTokens: number;
      totalTokens: number;
    };
  };
}

// -------------------------------------------------------------
// Alias để đảm bảo 100% tương thích ngược với code UI hiện hành
// -------------------------------------------------------------
export type ITargetKeyword = TargetKeywordItem;
export type ISpeakingScaffoldStage = SpeakingScaffoldStage;
export type ISpeakingScaffold = SpeakingPrepScaffold;
export type ISpeakingQuestion = SpeakingQuestionDetail;
