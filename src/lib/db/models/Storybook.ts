import mongoose, { Schema, Document } from "mongoose";

export interface IStorybookSentence {
  id: string;
  text: string;
  audioBase64: string;
}

export interface IStorybook extends Document {
  title: string;
  thumbnail?: string;
  originalText: string;
  sentences: IStorybookSentence[];
  level: "easy" | "medium" | "hard";
  voice: string;
  speakingRate: number;
  createdAt: Date;
}

const StorybookSentenceSchema = new Schema<IStorybookSentence>({
  id: { type: String, required: true },
  text: { type: String, required: true },
  audioBase64: { type: String, required: true },
}, { _id: false });

const StorybookSchema = new Schema<IStorybook>(
  {
    title: { type: String, required: true },
    thumbnail: { type: String, required: false },
    originalText: { type: String, required: true },
    sentences: { type: [StorybookSentenceSchema], required: true },
    level: { type: String, enum: ["easy", "medium", "hard"], required: true },
    voice: { type: String, required: true },
    speakingRate: { type: Number, required: true },
  },
  {
    timestamps: true,
  }
);

// Tránh lỗi overwrite model trong môi trường dev Next.js
const Storybook = mongoose.models.Storybook || mongoose.model<IStorybook>("Storybook", StorybookSchema);

export default Storybook;
