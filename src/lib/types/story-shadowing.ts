/**
 * @file story-shadowing.ts
 * @description Định nghĩa Type & Interface cho module Story Shadowing (Text & YouTube Pipelines)
 * 
 * Target Application: aha-tools (Next.js Frontend / PWA & Server Services)
 * Synchronized with: aha-mind-agents (NestJS Agent Gateway)
 * 
 * Made by Anh Tu - Share to be share
 */

/**
 * 1 từ kèm phiên âm chuẩn IPA (International Phonetic Alphabet)
 */
export interface IWordItem {
  word: string;
  ipa: string;
}

/**
 * 1 câu hoàn chỉnh trong bài học luyện Shadowing
 */
export interface IStorybookSentence {
  id: number;
  text: string;
  audioBase64?: string; // Dữ liệu âm thanh nén base64 (chỉ có trong Text Pipeline)
  words?: IWordItem[];  // Danh sách từ vựng kèm phiên âm IPA từng từ
  startMs?: number;     // Mốc bắt đầu tính theo mili-giây (cho YouTube Video)
  endMs?: number;       // Mốc kết thúc tính theo mili-giây (cho YouTube Video)
}

/**
 * Mục từ cùng họ từ loại (Word Family)
 */
export interface IWordFamilyItem {
  word: string;
  partOfSpeech?: string; // e.g. noun, verb, adjective, adverb
  ipa?: string;
  explanation: string;
}

/**
 * Cụm từ cố định tự nhiên (Collocation)
 */
export interface ICollocationItem {
  collocation: string;
  explanation: string;
}

/**
 * Từ vựng trọng tâm được bóc tách và giải nghĩa chuyên sâu
 */
export interface IStorybookKeyword {
  word: string;
  ipa?: string;
  audioUrl?: string;
  explanation: string;
  level: "A1" | "A2" | "B1" | "B2" | "C1" | "C2";
  wordFamily?: IWordFamilyItem[];
  collocations?: ICollocationItem[];
}

/**
 * Thực thể bài học Storybook lưu trữ trong MongoDB (Collection: storybooks)
 */
export interface IStorybook {
  _id: string;
  title: string;
  thumbnail?: string;
  originalText: string;
  sentences: IStorybookSentence[];
  keywords?: IStorybookKeyword[];
  level: "easy" | "medium" | "hard";
  voice: string;
  speakingRate: number;
  sourceType: "text" | "youtube";
  youtubeVideoId?: string;
  seriesId?: string;
  partIndex?: number;
  partTitle?: string;
  totalParts?: number;
  createdAt?: string;
  updatedAt?: string;
}

/**
 * Payload gửi lên để kích hoạt Text Shadowing Pipeline
 */
export interface CreateTextShadowingRequest {
  text: string;
  voice?: string; // Default: "FEMALE" (en-US-Journey-F)
}

/**
 * Payload gửi lên để kích hoạt YouTube Shadowing Pipeline
 */
export interface CreateYoutubeShadowingRequest {
  youtubeUrl: string;
}

/**
 * Dữ liệu trả về trong Payload của sự kiện hoàn tất (status: "done")
 */
export interface StoryShadowingDonePayload {
  storyId: string;
  id: string;
  title?: string;
  youtubeTitle?: string;
  youtubeVideoId?: string;
  level: "easy" | "medium" | "hard";
  speakingRate: number;
  sentences: IStorybookSentence[];
  keywords: IStorybookKeyword[];
  rawText?: string;
  tokenUsage?: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
}

/**
 * Sự kiện tiến trình thời gian thực nhận từ Server-Sent Events (SSE)
 */
export interface StoryShadowingProgressEvent {
  status?: "init" | "running" | "completed" | "done" | "failed";
  stepId?: "sentenceSplitter" | "ttsGenerator" | "keywordIdentifier" | "keywordEnricher" | "youtubeFetcher" | "youtubeConsolidator" | string;
  progress?: number; // 0 -> 100%
  message?: string;
  payload?: StoryShadowingDonePayload;
  error?: string;
}
