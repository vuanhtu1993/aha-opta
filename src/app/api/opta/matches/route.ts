/**
 * GET /api/opta/matches
 *
 * Lấy danh sách trận đấu
 * Query Params:
 *  - status: "scheduled", "live", "finished"
 *  - teamId: ObjectId của đội
 *  - limit: Số lượng trả về
 *
 * PUT /api/opta/matches
 *
 * Cập nhật kết quả trận đấu thủ công (Self-Managed Pipeline).
 * Sau khi lưu kết quả, tự động kích hoạt recalculateTeamStats() cho cả 2 đội
 * để cập nhật W/D/L, xG avg, Form Index... ngay lập tức.
 */

import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db/mongoose";
import { Match } from "@/lib/db/models/Match";
import { recalculateTeamStats } from "@/lib/etl/stats-calculator";

export async function GET(request: NextRequest) {
  try {
    await connectDB();

    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status");
    const teamId = searchParams.get("teamId");
    const dateParam = searchParams.get("date");
    const limit = parseInt(searchParams.get("limit") || "50", 10);

    const filter: any = {};
    if (status) filter.status = status;
    if (teamId) {
      filter.$or = [{ homeTeamId: teamId }, { awayTeamId: teamId }];
    }
    if (dateParam) {
      const startOfDay = new Date(`${dateParam}T00:00:00.000Z`);
      const endOfDay = new Date(`${dateParam}T23:59:59.999Z`);
      filter.matchDate = { $gte: startOfDay, $lte: endOfDay };
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

export async function PUT(request: NextRequest) {
  try {
    await connectDB();
    const body = await request.json();
    const {
      matchId,
      homeScore,
      awayScore,
      homePossession,
      homeShots,
      awayShots,
      homeSOT,
      awaySOT,
      homeXG,
      awayXG,
      // Trường mới: Pass Accuracy do admin tự nhập (thay vì hard-code)
      homePassAccuracy,
      awayPassAccuracy,
    } = body;

    if (!matchId) {
      return NextResponse.json({ success: false, error: "Missing matchId" }, { status: 400 });
    }

    const updatedMatch = await Match.findByIdAndUpdate(
      matchId,
      {
        $set: {
          homeScore: parseInt(homeScore, 10),
          awayScore: parseInt(awayScore, 10),
          status: "finished",
          homeStats: {
            possession: parseInt(homePossession, 10),
            shots: parseInt(homeShots, 10),
            shotsOnTarget: parseInt(homeSOT, 10),
            xGoals: parseFloat(homeXG),
            // Dùng giá trị admin nhập, fallback về 82 nếu không có
            passAccuracy: homePassAccuracy ? parseInt(homePassAccuracy, 10) : 82,
            corners: 5,
            fouls: 11,
            yellowCards: 1,
            redCards: 0,
          },
          awayStats: {
            possession: 100 - parseInt(homePossession, 10),
            shots: parseInt(awayShots, 10),
            shotsOnTarget: parseInt(awaySOT, 10),
            xGoals: parseFloat(awayXG),
            // Dùng giá trị admin nhập, fallback về 80 nếu không có
            passAccuracy: awayPassAccuracy ? parseInt(awayPassAccuracy, 10) : 80,
            corners: 4,
            fouls: 13,
            yellowCards: 2,
            redCards: 0,
          },
          xgSource: "manual",
          lastUpdated: new Date(),
        },
      },
      { new: true }
    )
      .populate("homeTeamId", "name shortName slug flag fifaRanking _id")
      .populate("awayTeamId", "name shortName slug flag fifaRanking _id");

    if (!updatedMatch) {
      return NextResponse.json({ success: false, error: "Match not found" }, { status: 404 });
    }

    // ── Tự động tính lại chỉ số thống kê cho cả 2 đội ─────────────────────────
    // Chạy song song bằng Promise.all để tiết kiệm thời gian (~2x nhanh hơn tuần tự)
    // Không await lỗi để không block response trả về client
    try {
      const homeTeamId = (updatedMatch.homeTeamId as any)._id.toString();
      const awayTeamId = (updatedMatch.awayTeamId as any)._id.toString();

      await Promise.all([
        recalculateTeamStats(homeTeamId),
        recalculateTeamStats(awayTeamId),
      ]);
    } catch (calcError) {
      // Ghi log lỗi nhưng KHÔNG fail toàn bộ request
      // Lý do: kết quả trận đấu đã được lưu thành công — đây là bước enrichment phụ
      console.error("[API] PUT /api/opta/matches - recalculateTeamStats thất bại:", calcError);
    }

    return NextResponse.json({ success: true, data: updatedMatch });
  } catch (error) {
    console.error("[API] PUT /api/opta/matches error:", error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : "Internal server error" },
      { status: 500 }
    );
  }
}
