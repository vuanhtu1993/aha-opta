/**
 * Team Model — Mongoose Schema
 *
 * Lưu thông tin đội bóng và aggregated stats tổng hợp từ ETL.
 *
 * Quyết định thiết kế:
 * → stats là embedded subdocument (không phải collection riêng)
 *   Lý do: Team stats luôn được đọc cùng với team info → 1 query thay vì 2
 *   Trade-off: Update stats sẽ update toàn bộ document → acceptable vì size nhỏ
 *
 * → apiFootballId là unique key cho ETL upsert
 *   Lý do: Đảm bảo chạy ETL nhiều lần không tạo duplicate
 */

import mongoose, { Document, Schema, Types } from "mongoose";

// ─── Interface Types ──────────────────────────────────────────────────────────

export interface ITeamStats {
  matchesPlayed: number;
  wins: number;
  draws: number;
  losses: number;
  goalsFor: number;
  goalsAgainst: number;
  // xG thực từ StatsBomb Open Data hoặc FBref scraper
  xGoalsFor: number;
  xGoalsAgainst: number;
  // Metrics trung bình per match
  possessionAvg: number;      // % kiểm soát bóng (0-100)
  shotsOnTargetAvg: number;
  passAccuracyAvg: number;
  // Form index từ 5 trận gần nhất (0-100, weighted)
  formIndex: number;
}

export interface ITeam extends Document {
  _id: Types.ObjectId;
  // ID từ API-Football — khóa chính cho ETL upsert
  apiFootballId: number;
  name: string;
  shortName: string;
  // URL-friendly: "brazil", "argentina" — dùng cho routing /teams/[slug]
  slug: string;
  country: string;
  // URL logo (từ API-Football hoặc Cloudinary)
  flag: string;
  // World Cup 2026 có 12 groups (A-L), 4 teams mỗi group
  group: string;
  // Liên đoàn bóng đá khu vực
  confederation: "UEFA" | "CONMEBOL" | "AFC" | "CAF" | "CONCACAF" | "OFC";
  fifaRanking: number;
  // Hệ số Elo từ eloratings.net (chính xác hơn FIFA Ranking cho head-to-head prediction)
  eloRating: number;
  eloRank: number;
  // Thời điểm crawl Elo lần cuối — giúp biết data có stale không
  eloLastSynced: Date | null;
  stats: ITeamStats;
  // Điểm AI tổng hợp (0-100), null nếu chưa phân tích
  aiRating: number | null;
  lastUpdated: Date;
}

// ─── Sub-schemas ──────────────────────────────────────────────────────────────

const TeamStatsSchema = new Schema<ITeamStats>(
  {
    matchesPlayed: { type: Number, default: 0 },
    wins:          { type: Number, default: 0 },
    draws:         { type: Number, default: 0 },
    losses:        { type: Number, default: 0 },
    goalsFor:      { type: Number, default: 0 },
    goalsAgainst:  { type: Number, default: 0 },
    xGoalsFor:     { type: Number, default: 0 },
    xGoalsAgainst: { type: Number, default: 0 },
    possessionAvg:      { type: Number, default: 0 },
    shotsOnTargetAvg:   { type: Number, default: 0 },
    passAccuracyAvg:    { type: Number, default: 0 },
    formIndex:          { type: Number, default: 0, min: 0, max: 100 },
  },
  { _id: false } // Không cần _id cho subdocument
);

// ─── Main Schema ──────────────────────────────────────────────────────────────

const TeamSchema = new Schema<ITeam>(
  {
    apiFootballId: {
      type: Number,
      required: true,
      unique: true,
      index: true, // Index để upsert nhanh trong ETL
    },
    name:      { type: String, required: true, trim: true },
    shortName: { type: String, required: true, trim: true },
    slug: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      index: true, // Index để query /teams/[slug] nhanh
    },
    country:   { type: String, required: true },
    flag:      { type: String, default: "" },
    group:     { type: String, required: true, uppercase: true },
    confederation: {
      type: String,
      required: true,
      enum: ["UEFA", "CONMEBOL", "AFC", "CAF", "CONCACAF", "OFC"],
    },
    fifaRanking: { type: Number, required: true },
    // Elo Rating từ eloratings.net
    // Tại sao default 1500? → Đây là Elo "trung bình" chuẩn, tránh null gây lỗi tính toán
    eloRating:     { type: Number, default: 1500 },
    eloRank:       { type: Number, default: 0 },
    eloLastSynced: { type: Date, default: null },
    stats:       { type: TeamStatsSchema, default: () => ({}) },
    aiRating:    { type: Number, default: null, min: 0, max: 100 },
    lastUpdated: { type: Date, default: Date.now },
  },
  {
    timestamps: true, // Tự động thêm createdAt, updatedAt
    collection: "teams", // Tên collection rõ ràng
  }
);

// ─── Model Export (Singleton Pattern cho Next.js hot-reload) ──────────────────

// Tại sao check mongoose.models.Team trước?
// → Next.js hot-reload có thể call mongoose.model() nhiều lần → OverwriteModelError
// → Check trước để tái sử dụng model đã đăng ký
export const Team =
  (mongoose.models.Team as mongoose.Model<ITeam>) ||
  mongoose.model<ITeam>("Team", TeamSchema);
