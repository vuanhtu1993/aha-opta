/**
 * @file story-shadowing.ts
 * @description Định nghĩa Type & Interface cho module Story Shadowing (Text & YouTube Pipelines)
 * 
 * Target Application: aha-tools (Next.js Frontend / PWA & Server Services)
 * Synchronized with: aha-mind-agents (NestJS Agent Gateway v2)
 * 
 * Made by Anh Tu - Share to be share
 */

export interface IWordItem {
  word: string;
  ipa: string;
}

export interface IStorybookSentence {
  id: number;
  text: string;
  audioBase64?: string; // Tệp âm thanh nén base64 (chỉ có trong Text Pipeline)
  words?: IWordItem[];  // Danh sách từ vựng kèm phiên âm IPA từng từ
  startMs?: number;     // Mốc bắt đầu tính theo mili-giây (cho YouTube Video)
  endMs?: number;       // Mốc kết thúc tính theo mili-giây (cho YouTube Video)
}

export interface IWordFamilyItem {
  word: string;
  partOfSpeech?: string;
  ipa?: string;
  explanation: string;
}

export interface ICollocationItem {
  collocation: string;
  explanation: string;
}

export interface IStorybookKeyword {
  word: string;
  ipa?: string;
  audioUrl?: string;
  explanation: string;
  level: "A1" | "A2" | "B1" | "B2" | "C1" | "C2";
  wordFamily?: IWordFamilyItem[];
  collocations?: ICollocationItem[];
}

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

export interface CreateStoryShadowingJobRequest {
  pipeline: "text" | "youtube";
  text?: string;
  voice?: string;
  youtubeUrl?: string;
  forceRegenerate?: boolean;
}

export interface CreateStoryShadowingJobResponse {
  jobId: string;
  status: "queued" | "completed";
  sseUrl?: string;
  existingStoryId?: string;
  createdAt: string;
}

export interface StoryShadowingProgressEvent {
  jobId?: string;
  status?: "init" | "running" | "completed" | "done" | "failed";
  stepId?: string;
  progress?: number;
  message?: string;
  payload?: {
    storyId?: string;
    id?: string;
    title?: string;
    level?: string;
    sentenceCount?: number;
    sentences?: IStorybookSentence[];
    keywords?: IStorybookKeyword[];
  };
}
