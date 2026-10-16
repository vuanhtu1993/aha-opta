/**
 * @file fun-feed.ts
 * @description Định nghĩa Type & Interface chuẩn cho module Fun Feed (Funny English Memes & Reels)
 * 
 * Target Application: aha-tools (Next.js Frontend PWA)
 * Synchronized with: aha-mind-agents (NestJS Ingestion & AI Gateway)
 * Mapped Spec: requirements/modules/fun-feed/fun-feed-api-contract.md
 * 
 * Made by Anh Tu - Share to be share
 */

export type FunFeedTopic = 
  | 'grammar' 
  | 'vocabulary' 
  | 'pronunciation' 
  | 'idiom' 
  | 'conversation';

export type FunFeedLevel = 
  | 'beginner' 
  | 'intermediate' 
  | 'advanced';

export type FunFeedMediaType = 
  | 'gif' 
  | 'image' 
  | 'video' 
  | 'short_video';

export type FunFeedAction = 
  | 'view' 
  | 'like' 
  | 'skip' 
  | 'save' 
  | 'report';

export interface FunFeedItemStats {
  views: number;
  likes: number;
  saves: number;
  reports: number;
}

export interface FunFeedItem {
  _id: string;
  source: 'giphy' | 'youtube' | 'generated';
  sourceId: string;
  sourceUrl: string;
  type: FunFeedMediaType;
  title: string;
  mediaUrl: string;
  thumbnailUrl?: string;
  attribution?: string;
  topic?: FunFeedTopic;
  level?: FunFeedLevel;
  whyFunny?: string;
  youLearned?: string;
  explanation?: string;
  learningScore?: number;
  stats: FunFeedItemStats;
  status: 'published' | 'hidden';
  publishedAt: string;
}

export interface FunFeedResponse {
  items: FunFeedItem[];
  nextCursor: string | null;
  hasMore: boolean;
}

export interface FunFeedQuery {
  topic?: FunFeedTopic;
  level?: FunFeedLevel;
  cursor?: string;
  limit?: number;
}

export interface FunFeedInteractPayload {
  action: FunFeedAction;
  reportReason?: string;
}

export interface FunFeedInteractionResponse {
  success: boolean;
}
