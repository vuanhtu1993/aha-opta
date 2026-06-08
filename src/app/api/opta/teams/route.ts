/**
 * GET /api/opta/teams
 *
 * Trả về danh sách tất cả các đội bóng trong database.
 * Đây là endpoint public — không cần auth.
 *
 * Query params (optional):
 *   ?group=A       → Filter theo group (A-L)
 *   ?confederation=UEFA → Filter theo confederation
 *   ?limit=10      → Giới hạn số kết quả
 *
 * Response:
 *   { success: true, data: Team[], total: number }
 */

import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db/mongoose";
import { Team } from "@/lib/db/models/Team";

export async function GET(request: NextRequest) {
  try {
    // Kết nối DB (Singleton — không tạo connection mới nếu đã có)
    await connectDB();

    // Parse query params
    const { searchParams } = new URL(request.url);
    const group         = searchParams.get("group")?.toUpperCase();
    const confederation = searchParams.get("confederation");
    const limit         = parseInt(searchParams.get("limit") ?? "48", 10);

    // Build query filter động
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const filter: Record<string, any> = {};
    if (group)         filter.group         = group;
    if (confederation) filter.confederation = confederation;

    const teams = await Team.find(filter)
      .sort({ fifaRanking: 1 })   // Sắp xếp theo FIFA ranking
      .limit(Math.min(limit, 48)) // Max 48 teams (World Cup 2026)
      .select("-__v")              // Bỏ Mongoose version key
      .lean();                     // Plain JS objects, nhanh hơn Mongoose Documents

    return NextResponse.json({
      success: true,
      data: teams,
      total: teams.length,
    });
  } catch (error) {
    console.error("[API] GET /api/opta/teams error:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Internal server error",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
