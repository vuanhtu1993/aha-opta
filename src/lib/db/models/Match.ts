/**
 * Match Model — Mongoose Schema
 *
 * Lưu thông tin từng trận đấu (FACT — sự thật khách quan).
 * Tách biệt hoàn toàn với Prediction (OPINION của AI).
 *
 * Quyết định thiết kế:
 * → homeStats và awayStats là embedded (không tách collection)
 *   Lý do: Luôn đọc cùng nhau khi AI phân tích, 1 query là đủ
 *
 * → xGoals trong stats là xG THỰC từ StatsBomb/FBref, KHÔNG phải heuristic
 *   Lý do: Đảm bảo độ chính xác của AI analysis
 *
 * → Ref đến Team bằng ObjectId (không embed team info)
 *   Lý do: Team info thay đổi (ranking, stats) → tránh stale data
 *   Trade-off: Cần populate() khi query, nhưng Next.js caching giải quyết vấn đề này
 */

import mongoose, { Document, Schema, Types } from "mongoose";

// ─── Interface Types ──────────────────────────────────────────────────────────

export interface IMatchStats {
  possession:     number; // % (0-100) của team này trong trận
  shots:          number;
  shotsOnTarget:  number;
  // xG thực từ StatsBomb (event-level) hoặc FBref (scraped)
  xGoals:         number;
  passAccuracy:   number; // % (0-100)
  corners:        number;
  fouls:          number;
  yellowCards:    number;
  redCards:       number;
}

export type MatchStatus = "scheduled" | "live" | "finished" | "postponed" | "cancelled";
export type MatchStage =
  | "Group Stage"
  | "Round of 32"
  | "Round of 16"
  | "Quarter-Final"
  | "Semi-Final"
  | "Third Place"
  | "Final";

export interface IMatch extends Document {
  _id: Types.ObjectId;
  apiFootballId: number;       // Khóa upsert cho ETL
  homeTeamId: Types.ObjectId;  // ref: Team
  awayTeamId: Types.ObjectId;  // ref: Team
  homeScore: number | null;    // null = chưa đá hoặc chưa kết thúc
  awayScore: number | null;
  status: MatchStatus;
  matchDate: Date;
  stage: MatchStage;
  group: string | null;        // "A"-"L" cho group stage, null cho knockout
  venue: string;
  // Stats null khi match chưa diễn ra hoặc API chưa có data
  homeStats: IMatchStats | null;
  awayStats: IMatchStats | null;
  // Nguồn xG: giúp debug và verify data quality
  xgSource: "statsbomb" | "fbref" | "none";
  fifaUrl?: string; // Link cập nhật kết quả trận đấu từ FIFA
  lastUpdated: Date;
}

// ─── Sub-schemas ──────────────────────────────────────────────────────────────

const MatchStatsSchema = new Schema<IMatchStats>(
  {
    possession:    { type: Number, default: 0, min: 0, max: 100 },
    shots:         { type: Number, default: 0 },
    shotsOnTarget: { type: Number, default: 0 },
    xGoals:        { type: Number, default: 0 },
    passAccuracy:  { type: Number, default: 0, min: 0, max: 100 },
    corners:       { type: Number, default: 0 },
    fouls:         { type: Number, default: 0 },
    yellowCards:   { type: Number, default: 0 },
    redCards:      { type: Number, default: 0 },
  },
  { _id: false }
);

// ─── Main Schema ──────────────────────────────────────────────────────────────

const MatchSchema = new Schema<IMatch>(
  {
    apiFootballId: {
      type: Number,
      required: true,
      unique: true,
      index: true,
    },
    homeTeamId: {
      type: Schema.Types.ObjectId,
      ref: "Team",
      required: true,
      index: true, // Index để query "5 trận gần nhất của team X"
    },
    awayTeamId: {
      type: Schema.Types.ObjectId,
      ref: "Team",
      required: true,
      index: true,
    },
    homeScore: { type: Number, default: null },
    awayScore: { type: Number, default: null },
    status: {
      type: String,
      required: true,
      enum: ["scheduled", "live", "finished", "postponed", "cancelled"],
      default: "scheduled",
      index: true, // Index để filter "upcoming matches"
    },
    matchDate: {
      type: Date,
      required: true,
      index: true, // Index để sort theo ngày
    },
    stage: {
      type: String,
      required: true,
      enum: [
        "Group Stage",
        "Round of 32",
        "Round of 16",
        "Quarter-Final",
        "Semi-Final",
        "Third Place",
        "Final",
      ],
    },
    group:     { type: String, default: null, uppercase: true },
    venue:     { type: String, default: "" },
    homeStats: { type: MatchStatsSchema, default: null },
    awayStats: { type: MatchStatsSchema, default: null },
    xgSource: {
      type: String,
      enum: ["statsbomb", "fbref", "none"],
      default: "none",
    },
    fifaUrl: { type: String, default: "" },
    lastUpdated: { type: Date, default: Date.now },
  },
  {
    timestamps: true,
    collection: "matches",
  }
);

// ─── Compound Index ───────────────────────────────────────────────────────────

// Index kết hợp để query "5 trận gần nhất của team X" nhanh
// Node 1 (dataFetcher) dùng query này nhiều nhất
MatchSchema.index({ homeTeamId: 1, matchDate: -1 });
MatchSchema.index({ awayTeamId: 1, matchDate: -1 });

// ─── Model Export ─────────────────────────────────────────────────────────────

export const Match =
  (mongoose.models.Match as mongoose.Model<IMatch>) ||
  mongoose.model<IMatch>("Match", MatchSchema);
