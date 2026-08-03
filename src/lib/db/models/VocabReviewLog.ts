import mongoose, { Schema, Document, Types } from "mongoose";

export interface IVocabReviewLog extends Document {
  vocabCardId: Types.ObjectId;
  word: string;
  rating: number; // 1: Again, 2: Hard, 3: Good, 4: Easy
  state: number; // State before review
  due: Date; // Due before review
  stability: number;
  difficulty: number;
  elapsed_days: number;
  scheduled_days: number;
  responseTimeMs: number;
  isCorrect: boolean;
  reviewedAt: Date;
}

const VocabReviewLogSchema = new Schema<IVocabReviewLog>(
  {
    vocabCardId: { type: Schema.Types.ObjectId, ref: "VocabCard_v1", required: true, index: true },
    word: { type: String, required: true },
    rating: { type: Number, required: true },
    state: { type: Number, required: true, default: 0 },
    due: { type: Date, required: true, default: Date.now },
    stability: { type: Number, required: true, default: 0 },
    difficulty: { type: Number, required: true, default: 0 },
    elapsed_days: { type: Number, required: true, default: 0 },
    scheduled_days: { type: Number, required: true, default: 0 },
    responseTimeMs: { type: Number, required: true, default: 0 },
    isCorrect: { type: Boolean, required: true },
    reviewedAt: { type: Date, default: Date.now, index: true },
  },
  {
    timestamps: true,
  }
);

if (mongoose.models.VocabReviewLog_v1) {
  delete mongoose.models.VocabReviewLog_v1;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  delete (mongoose.connection.models as any).VocabReviewLog_v1;
}

const VocabReviewLog = mongoose.model<IVocabReviewLog>(
  "VocabReviewLog_v1",
  VocabReviewLogSchema,
  "vocab_review_logs"
);

export default VocabReviewLog;
