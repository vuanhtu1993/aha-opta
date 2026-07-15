import mongoose, { Schema, Document } from "mongoose";

export interface IStorybookSentenceWord {
  word: string;
  ipa: string;
}

export interface IStorybookSentence {
  id: number;
  text: string;
  audioBase64?: string;
  words?: IStorybookSentenceWord[];
  startMs?: number;
  endMs?: number;
}

export interface IStorybookKeyword {
  word: string;
  explanation: string;
  level: "medium" | "hard";
  wordFamily?: string[];
  collocations?: string[];
}

export interface IStorybook extends Document {
  title: string;
  thumbnail?: string;
  originalText: string;
  sentences: IStorybookSentence[];
  keywords?: IStorybookKeyword[];
  level: "easy" | "medium" | "hard";
  voice: string;
  speakingRate: number;
  createdAt: Date;
  sourceType: "text" | "youtube";
  youtubeVideoId?: string;
}

const StorybookSentenceSchema = new Schema<IStorybookSentence>({
  id: { type: Number, required: true },
  text: { type: String, required: true },
  audioBase64: { type: String, required: false },
  startMs: { type: Number, required: false },
  endMs: { type: Number, required: false },
  // Mảng từ kèm IPA — optional vì các bài cũ chưa có
  words: {
    type: [{ word: String, ipa: String }],
    required: false,
    default: undefined,
  },
}, { _id: false });

const StorybookKeywordSchema = new Schema<IStorybookKeyword>({
  word: { type: String, required: true },
  explanation: { type: String, required: true },
  level: { type: String, enum: ["medium", "hard"], required: true },
  wordFamily: { type: [String], required: false },
  collocations: { type: [String], required: false }
}, { _id: false });

const StorybookSchema = new Schema<IStorybook>(
  {
    title: { type: String, required: true },
    thumbnail: { type: String, required: false },
    originalText: { type: String, required: true },
    sentences: { type: [StorybookSentenceSchema], required: true },
    keywords: { type: [StorybookKeywordSchema], required: false, default: undefined },
    level: { type: String, enum: ["easy", "medium", "hard"], required: true },
    voice: { type: String, required: true },
    speakingRate: { type: Number, required: true },
    sourceType: { type: String, enum: ["text", "youtube"], required: true, default: "text" },
    youtubeVideoId: { type: String, required: false },
  },
  {
    timestamps: true,
  }
);

// Tránh lỗi overwrite model và cập nhật schema mới nhất trong môi trường dev Next.js
if (mongoose.models.Storybook_v4) {
  delete mongoose.models.Storybook_v4;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  delete (mongoose.connection.models as any).Storybook_v4;
}
const Storybook = mongoose.model<IStorybook>("Storybook_v4", StorybookSchema, "storybooks");

export default Storybook;
