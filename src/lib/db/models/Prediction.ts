/**
 * Prediction Model — Mongoose Schema
 *
 * Lưu OPINION (dự đoán) của AI — tách biệt với FACT (Match).
 *
 * Triết lý thiết kế:
 * → Tách Prediction ra collection riêng vì:
 *   1. Chạy nhiều lần phân tích cho 1 trận (so sánh model versions)
 *   2. Match lưu kết quả thực tế (immutable FACT)
 *   3. Prediction có thể sai — cần track accuracy riêng
 *   4. Back-testing: Sau trận, fill actualOutcome → tính accuracy rate
 *
 * → marketSignal lưu lại odds tại thời điểm dự đoán
 *   Lý do: Odds thay đổi theo thời gian, cần snapshot để audit sau này
 */

import mongoose, { Document, Schema, Types } from "mongoose";

// ─── Interface Types ──────────────────────────────────────────────────────────

export interface IProbabilities {
  home: number; // % (0-100)
  draw: number;
  away: number;
  // Constraint: home + draw + away ≈ 100 (enforced by Zod, not DB)
}

export interface IMarketSignal {
  // Odds thô từ nhà cái tại thời điểm dự đoán (lưu để audit)
  homeOdds:   number; // Decimal odds, ví dụ: 2.10
  drawOdds:   number;
  awayOdds:   number;
  // Implied probability sau khi loại bỏ bookmaker margin (vig)
  homeImplied: number; // %
  drawImplied: number;
  awayImplied: number;
  // Bookmaker được dùng (median của nhiều bookmakers)
  source: string; // "bet365", "median_all", ...
}

export type MatchOutcome = "home" | "away" | "draw";

export interface IPrediction extends Document {
  _id: Types.ObjectId;
  matchId: Types.ObjectId;          // ref: Match
  // Versioning để so sánh giữa các lần chạy hoặc model updates
  modelVersion: string;             // "gemini-2.5-flash@opta-v1"
  predictedWinner: MatchOutcome;
  predictedScore: string | null;    // Ví dụ: "2-1", "0-0"
  probabilities: IProbabilities;    // Output của Node 4 (Predictor)
  confidence: number;               // 0-1: mức tự tin của AI
  reasoning: string;                // Chuỗi giải thích chi tiết
  keyFactors: string[];             // Top 3-5 factors quyết định
  // Market signal tại thời điểm dự đoán (snapshot)
  marketSignal: IMarketSignal | null;
  // Điền sau khi trận kết thúc — dùng để back-test accuracy
  actualOutcome: MatchOutcome | null;
  isCorrect: boolean | null;        // Computed từ actualOutcome vs predictedWinner
  createdAt: Date;
  updatedAt: Date;
}

// ─── Sub-schemas ──────────────────────────────────────────────────────────────

const ProbabilitiesSchema = new Schema<IProbabilities>(
  {
    home: { type: Number, required: true, min: 0, max: 100 },
    draw: { type: Number, required: true, min: 0, max: 100 },
    away: { type: Number, required: true, min: 0, max: 100 },
  },
  { _id: false }
);

const MarketSignalSchema = new Schema<IMarketSignal>(
  {
    homeOdds:    { type: Number, required: true },
    drawOdds:    { type: Number, required: true },
    awayOdds:    { type: Number, required: true },
    homeImplied: { type: Number, required: true, min: 0, max: 100 },
    drawImplied: { type: Number, required: true, min: 0, max: 100 },
    awayImplied: { type: Number, required: true, min: 0, max: 100 },
    source:      { type: String, default: "median_all" },
  },
  { _id: false }
);

// ─── Main Schema ──────────────────────────────────────────────────────────────

const PredictionSchema = new Schema<IPrediction>(
  {
    matchId: {
      type: Schema.Types.ObjectId,
      ref: "Match",
      required: true,
      index: true,
    },
    modelVersion: {
      type: String,
      required: true,
      default: `${process.env.GEMINI_MODEL ?? "gemini-2.5-flash"}@opta-v1`,
    },
    predictedWinner: {
      type: String,
      required: true,
      enum: ["home", "away", "draw"],
    },
    predictedScore: { type: String, default: null },
    probabilities:  { type: ProbabilitiesSchema, required: true },
    confidence:     { type: Number, required: true, min: 0, max: 1 },
    reasoning:      { type: String, required: true },
    keyFactors:     { type: [String], default: [] },
    marketSignal:   { type: MarketSignalSchema, default: null },
    actualOutcome:  { type: String, enum: ["home", "away", "draw", null], default: null },
    isCorrect:      { type: Boolean, default: null },
  },
  {
    timestamps: true,
    collection: "predictions",
  }
);

// ─── Index ────────────────────────────────────────────────────────────────────

// Query "Tất cả dự đoán cho 1 trận, sắp xếp mới nhất trước"
PredictionSchema.index({ matchId: 1, createdAt: -1 });

// Query "Tính accuracy rate theo model version"
PredictionSchema.index({ modelVersion: 1, isCorrect: 1 });

// ─── Model Export ─────────────────────────────────────────────────────────────

export const Prediction =
  (mongoose.models.Prediction as mongoose.Model<IPrediction>) ||
  mongoose.model<IPrediction>("Prediction", PredictionSchema);
