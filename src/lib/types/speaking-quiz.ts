/**
 * @file speaking-quiz.ts
 * @description Định nghĩa Type & Interface cho chế độ Speaking Quiz (Speak Your Mind)
 * Hỗ trợ 4 loại giàn giáo thích ứng (PREP, PAR, STAR, CCR) và đồng bộ kho từ vựng SRS.
 * Tương thích với microservice aha-mind-agents theo speaking-quiz-api-contract.md v1.3
 *
 * Mapped Spec: FR-VOCAB-06 | FR-VOCAB-07 | US-VOCAB-03 | US-VOCAB-04 | BR-08 | BR-09
 * Made by Anh Tu - Share to be share
 */

/**
 * Chuẩn cấp độ ngôn ngữ CEFR
 */
export type CefrLevel = "B1" | "B2" | "C1";

/**
 * Các loại khung giàn giáo tư duy giao tiếp thích ứng (Adaptive Frameworks)
 * - PREP: Point - Reason - Example - Conclusion (Quan điểm, tranh biện)
 * - PAR: Problem - Advice/Action - Result (Lời khuyên, giải pháp)
 * - STAR: Situation - Task/Action - Result (Kể chuyện, trải nghiệm cá nhân)
 * - CCR: Claim - Concession/Counter - Resolution (Thương lượng, cân nhắc đa chiều)
 */
export type FrameworkType = "PREP" | "PAR" | "STAR" | "CCR";

/**
 * Cụm từ vựng/idioms/collocation bản xứ chuyên đề
 */
export interface TopicCollocationItem {
  phrase: string;
  meaning: string;
  ipa?: string;
}

/**
 * Chi tiết một chặng trong giàn giáo thích ứng
 */
export interface AdaptiveScaffoldStageItem {
  stageKey: string;
  title: string;
  signposts: string[];
  hint: string;
  modelAnswer: string;
}

/**
 * Cấu trúc 4 chặng của giàn giáo thích ứng
 */
export interface AdaptiveScaffoldStages {
  stage1: AdaptiveScaffoldStageItem;
  stage2: AdaptiveScaffoldStageItem;
  stage3: AdaptiveScaffoldStageItem;
  stage4?: AdaptiveScaffoldStageItem;
}

/**
 * Giàn giáo tư duy thích ứng hoàn chỉnh (Adaptive Scaffold)
 */
export interface SpeakingAdaptiveScaffold {
  frameworkType: FrameworkType;
  frameworkName: string;
  frameworkDescription: string;
  topicCollocations: TopicCollocationItem[];
  stages: AdaptiveScaffoldStages;
}

/**
 * Trạng thái Spaced Repetition của từ vựng
 * - due: Thẻ từ vựng đã đến hạn cần ôn tập (due <= now)
 * - learning: Thẻ đang trong chu kỳ học tập tích cực
 * - mastered: Thẻ đã đạt độ vững chắc cao (stability >= 30 ngày)
 * - new: Thẻ mới lưu, chưa qua lần ôn tập nào
 * - unsaved: Từ vựng trích xuất từ bài học hoặc đề bài, người học có thể bấm lưu vào bộ từ
 */
export type SrsStatus = "due" | "learning" | "mastered" | "new" | "unsaved";

/**
 * Cấu hình một chặng trong giàn giáo PREP (Legacy)
 */
export interface SpeakingScaffoldStage {
  stage: "point" | "reason" | "example" | "conclusion";
  title: string;
  signposts: string[];
  hint: string;
  modelAnswer: string;
}

/**
 * Trọn bộ giàn giáo PREP 4 chặng (Legacy)
 */
export interface SpeakingPrepScaffold {
  point: SpeakingScaffoldStage;
  reason: SpeakingScaffoldStage;
  example: SpeakingScaffoldStage;
  conclusion: SpeakingScaffoldStage;
}

/**
 * Từ vựng trọng tâm kèm phát âm IPA, định nghĩa và nhãn FSRS
 */
export interface TargetKeywordItem {
  word: string;
  ipa?: string;
  meaning: string;
  /** Trạng thái ôn tập giãn cách FSRS của từ */
  srsStatus?: SrsStatus;
  /** Đánh dấu từ vựng được tự động bơm từ FSRS engine để kích hoạt phản xạ */
  isInjected?: boolean;
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
 * Trạng thái tra cứu chi tiết của Job trong BullMQ (REST Fallback)
 */
export interface SpeakingQuizJobStatusResponse {
  jobId: string;
  status: "waiting" | "active" | "completed" | "failed" | "delayed" | "queued";
  progress: number;
  result?: {
    questionId: string;
    topic?: string;
    question?: string;
    level?: CefrLevel;
    tokenUsage?: {
      promptTokens: number;
      completionTokens: number;
      totalTokens: number;
    };
  } | null;
  error?: string | null;
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
  adaptiveScaffold?: SpeakingAdaptiveScaffold;
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
