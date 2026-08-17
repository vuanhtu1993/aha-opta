import mongoose, { Schema, Document, Types } from "mongoose";
import { IFSRSCardState } from "@/lib/srs/fsrs-engine";

export interface IVocabExampleSentence {
  sentence: string;
  answer: string;
}

export interface IVocabWordFamily {
  word: string;
  partOfSpeech?: string;
  ipa?: string;
  explanation: string;
}

export interface IVocabCollocation {
  collocation: string;
  explanation: string;
}

export interface IVocabCard extends Document {
  word: string;
  ipa?: string;
  explanation: string;
  level: "A1" | "A2" | "B1" | "B2" | "C1" | "C2";
  audioUrl?: string;
  exampleSentences?: IVocabExampleSentence[];
  wordFamily?: IVocabWordFamily[];
  collocations?: IVocabCollocation[];
  
  sourceStorybookId?: Types.ObjectId;
  sourceStorybookTitle?: string;

  fsrs: IFSRSCardState;

  createdAt: Date;
  updatedAt: Date;
}

const VocabExampleSentenceSchema = new Schema<IVocabExampleSentence>(
  {
    sentence: { type: String, required: true },
    answer: { type: String, required: true },
  },
  { _id: false }
);

const VocabWordFamilySchema = new Schema<IVocabWordFamily>(
  {
    word: { type: String, required: true },
    partOfSpeech: { type: String, required: false },
    ipa: { type: String, required: false },
    explanation: { type: String, required: true },
  },
  { _id: false }
);

const VocabCollocationSchema = new Schema<IVocabCollocation>(
  {
    collocation: { type: String, required: true },
    explanation: { type: String, required: true },
  },
  { _id: false }
);

const FSRSCardStateSchema = new Schema<IFSRSCardState>(
  {
    due: { type: Date, required: true, index: true },
    stability: { type: Number, required: true, default: 0 },
    difficulty: { type: Number, required: true, default: 0 },
    elapsed_days: { type: Number, required: true, default: 0 },
    scheduled_days: { type: Number, required: true, default: 0 },
    reps: { type: Number, required: true, default: 0 },
    lapses: { type: Number, required: true, default: 0 },
    state: { type: Number, required: true, default: 0 }, // 0: New, 1: Learning, 2: Review, 3: Relearning
    last_review: { type: Date, required: false },
  },
  { _id: false }
);

const VocabCardSchema = new Schema<IVocabCard>(
  {
    word: { type: String, required: true, index: true },
    ipa: { type: String, required: false },
    explanation: { type: String, required: true },
    level: {
      type: String,
      enum: ["A1", "A2", "B1", "B2", "C1", "C2"],
      required: true,
      default: "B1",
    },
    audioUrl: { type: String, required: false },
    exampleSentences: { type: [VocabExampleSentenceSchema], required: false },
    wordFamily: { type: [VocabWordFamilySchema], required: false },
    collocations: { type: [VocabCollocationSchema], required: false },
    sourceStorybookId: { type: Schema.Types.ObjectId, ref: "Storybook_v5", required: false },
    sourceStorybookTitle: { type: String, required: false },
    fsrs: { type: FSRSCardStateSchema, required: true },
  },
  {
    timestamps: true,
  }
);

// Prevent model overwrite in Next.js hot-reload
if (mongoose.models.VocabCard_v1) {
  delete mongoose.models.VocabCard_v1;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  delete (mongoose.connection.models as any).VocabCard_v1;
}

const VocabCard = mongoose.model<IVocabCard>(
  "VocabCard_v1",
  VocabCardSchema,
  "vocab_cards"
);

export default VocabCard;
