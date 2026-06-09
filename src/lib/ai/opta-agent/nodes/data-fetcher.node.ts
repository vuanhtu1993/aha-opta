/**
 * Node 1: Data Fetcher
 *
 * Nhiệm vụ:
 * 1. Truy cập MongoDB
 * 2. Lấy thông tin cơ bản của 2 đội (Home & Away)
 * 3. Lấy 5 trận gần nhất của mỗi đội
 * 4. Lấy lịch sử đối đầu (H2H) nếu có
 * 5. Bơm toàn bộ vào State
 */

import { OptaStateType } from "../state";
import { connectDB } from "@/lib/db/mongoose";
import { Team } from "@/lib/db/models/Team";
import { Match } from "@/lib/db/models/Match";

export async function dataFetcherNode(state: OptaStateType): Promise<Partial<OptaStateType>> {
  console.log(`[LangGraph] Node 1: Fetching data for Match ID ${state.matchId}`);
  
  await connectDB();

  // 1. Lấy thông tin Team (chỉ lấy các trường cần thiết để tiết kiệm token)
  const homeTeam = await Team.findById(state.homeTeamId).select("name shortName country group confederation fifaRanking eloRating eloRank eloLastSynced recentEloMatches").lean();
  const awayTeam = await Team.findById(state.awayTeamId).select("name shortName country group confederation fifaRanking eloRating eloRank eloLastSynced recentEloMatches").lean();

  if (!homeTeam || !awayTeam) {
    throw new Error("DataFetcher: Không tìm thấy Team trong DB");
  }

  // 2. Hàm helper lấy 5 trận gần nhất của 1 đội (đã đá xong)
  const getRecentMatches = async (teamId: string) => {
    return Match.find({
      $or: [{ homeTeamId: teamId }, { awayTeamId: teamId }],
      status: "finished",
    })
      .sort({ matchDate: -1 })
      .limit(5)
      .populate("homeTeamId", "name shortName")
      .populate("awayTeamId", "name shortName")
      .lean();
  };

  const homeRecent = await getRecentMatches(state.homeTeamId);
  const awayRecent = await getRecentMatches(state.awayTeamId);

  // 3. Lấy H2H (Đối đầu trực tiếp giữa 2 đội)
  const h2hMatches = await Match.find({
    $or: [
      { homeTeamId: state.homeTeamId, awayTeamId: state.awayTeamId },
      { homeTeamId: state.awayTeamId, awayTeamId: state.homeTeamId }
    ],
    status: "finished",
  })
    .sort({ matchDate: -1 })
    .limit(3)
    .populate("homeTeamId", "name")
    .populate("awayTeamId", "name")
    .lean();

  return {
    homeTeamInfo: homeTeam,
    awayTeamInfo: awayTeam,
    homeRecentMatches: homeRecent,
    awayRecentMatches: awayRecent,
    h2hMatches: h2hMatches,
  };
}
