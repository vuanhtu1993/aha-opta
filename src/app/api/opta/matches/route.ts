/**
 * GET /api/opta/matches
 *
 * Lấy danh sách trận đấu
 * Query Params:
 *  - status: "scheduled", "live", "finished"
 *  - teamId: ObjectId của đội
 *  - limit: Số lượng trả về
 */

import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db/mongoose";
import { Match } from "@/lib/db/models/Match";

export async function GET(request: NextRequest) {
  try {
    await connectDB();

    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status");
    const teamId = searchParams.get("teamId");
    const limit = parseInt(searchParams.get("limit") || "50", 10);

    const filter: any = {};
    if (status) filter.status = status;
    if (teamId) {
      filter.$or = [{ homeTeamId: teamId }, { awayTeamId: teamId }];
    }

    const matches = await Match.find(filter)
      .sort({ matchDate: 1 })
      .limit(limit)
      .populate("homeTeamId", "name shortName slug flag fifaRanking")
      .populate("awayTeamId", "name shortName slug flag fifaRanking")
      .lean();

    return NextResponse.json({ success: true, data: matches });
  } catch (error) {
    console.error("[API] GET /api/opta/matches error:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
