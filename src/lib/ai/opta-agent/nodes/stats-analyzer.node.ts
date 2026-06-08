/**
 * Node 2: Stats Analyzer
 *
 * Nhiệm vụ:
 * Đọc raw data từ Node 1 (Recent Matches), tính toán các chỉ số:
 * 1. Form Index (phong độ 0-100)
 * 2. xG Average (Sức mạnh tấn công)
 * 3. Defensive Rating (Sức mạnh phòng thủ)
 */

import { OptaStateType } from "../state";
import {
  calculateFormIndex,
  getResultForTeam,
  calculateXGAverage,
  calculateDefensiveRating,
  MatchResult
} from "@/lib/utils/form-calculator";

// Định nghĩa kiểu dữ liệu tối thiểu cần thiết cho trận đấu (từ kết quả của Node 1)
interface MinimalMatchData {
  homeTeamId: { _id: any; name: string };
  awayTeamId: { _id: any; name: string };
  homeScore: number;
  awayScore: number;
  homeStats?: { xGoals: number };
  awayStats?: { xGoals: number };
}

export async function statsAnalyzerNode(state: OptaStateType): Promise<Partial<OptaStateType>> {
  console.log(`[LangGraph] Node 2: Analyzing stats...`);

  // Hàm helper phân tích 1 team
  const analyzeTeam = (teamId: string, matches: MinimalMatchData[]) => {
    const results: MatchResult[] = [];
    const xgFor: number[] = [];
    const xgAgainst: number[] = [];

    matches.forEach(match => {
      const isHome = match.homeTeamId._id.toString() === teamId;
      
      // Tính W/D/L
      const res = getResultForTeam(
        teamId,
        match.homeTeamId._id.toString(),
        match.awayScore,
        match.homeScore
      );
      if (res) results.push(res);

      // Tính xG
      if (isHome) {
        if (match.homeStats?.xGoals !== undefined) xgFor.push(match.homeStats.xGoals);
        if (match.awayStats?.xGoals !== undefined) xgAgainst.push(match.awayStats.xGoals);
      } else {
        if (match.awayStats?.xGoals !== undefined) xgFor.push(match.awayStats.xGoals);
        if (match.homeStats?.xGoals !== undefined) xgAgainst.push(match.homeStats.xGoals);
      }
    });

    return {
      formIndex: calculateFormIndex(results),
      xgAvg: calculateXGAverage(xgFor),
      defRating: calculateDefensiveRating(xgAgainst),
    };
  };

  const homeAnalysis = analyzeTeam(state.homeTeamId, state.homeRecentMatches || []);
  const awayAnalysis = analyzeTeam(state.awayTeamId, state.awayRecentMatches || []);

  console.log(`[LangGraph] Node 2 -> Home Form: ${homeAnalysis.formIndex}, xG: ${homeAnalysis.xgAvg}`);
  console.log(`[LangGraph] Node 2 -> Away Form: ${awayAnalysis.formIndex}, xG: ${awayAnalysis.xgAvg}`);

  return {
    homeFormIndex: homeAnalysis.formIndex,
    homeXgAverage: homeAnalysis.xgAvg,
    homeDefRating: homeAnalysis.defRating,

    awayFormIndex: awayAnalysis.formIndex,
    awayXgAverage: awayAnalysis.xgAvg,
    awayDefRating: awayAnalysis.defRating,
  };
}
