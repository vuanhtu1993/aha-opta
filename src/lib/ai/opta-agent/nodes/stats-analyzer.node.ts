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
  MatchResult
} from "@/lib/utils/form-calculator";

// Định nghĩa kiểu dữ liệu tối thiểu cần thiết cho trận đấu
interface MinimalMatchData {
  homeTeamId: { _id: any; name: string };
  awayTeamId: { _id: any; name: string };
  homeScore: number;
  awayScore: number;
  homeStats?: { shotsOnTarget?: number };
  awayStats?: { shotsOnTarget?: number };
}

// Hàm tính trung bình
function calculateAverage(values: number[]): number {
  if (values.length === 0) return 0;
  return Math.round((values.reduce((a, b) => a + b, 0) / values.length) * 100) / 100;
}

export async function statsAnalyzerNode(state: OptaStateType): Promise<Partial<OptaStateType>> {
  console.log(`[LangGraph] Node 2: Analyzing traditional stats and Elo...`);

  // Hàm helper phân tích 1 team
  const analyzeTeam = (teamId: string, matches: MinimalMatchData[]) => {
    const results: MatchResult[] = [];
    const goalsFor: number[] = [];
    const goalsAgainst: number[] = [];
    const shotsOnTarget: number[] = [];

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

      if (isHome) {
        if (match.homeScore !== null) goalsFor.push(match.homeScore);
        if (match.awayScore !== null) goalsAgainst.push(match.awayScore);
        if (match.homeStats?.shotsOnTarget) shotsOnTarget.push(match.homeStats.shotsOnTarget);
      } else {
        if (match.awayScore !== null) goalsFor.push(match.awayScore);
        if (match.homeScore !== null) goalsAgainst.push(match.homeScore);
        if (match.awayStats?.shotsOnTarget) shotsOnTarget.push(match.awayStats.shotsOnTarget);
      }
    });

    return {
      formIndex: calculateFormIndex(results),
      goalsForAvg: calculateAverage(goalsFor),
      goalsAgainstAvg: calculateAverage(goalsAgainst),
      shotsOnTargetAvg: calculateAverage(shotsOnTarget),
    };
  };

  const homeAnalysis = analyzeTeam(state.homeTeamId, state.homeRecentMatches || []);
  const awayAnalysis = analyzeTeam(state.awayTeamId, state.awayRecentMatches || []);

  console.log(`[LangGraph] Node 2 -> Home Form: ${homeAnalysis.formIndex}, GF: ${homeAnalysis.goalsForAvg}, GA: ${homeAnalysis.goalsAgainstAvg}`);
  console.log(`[LangGraph] Node 2 -> Away Form: ${awayAnalysis.formIndex}, GF: ${awayAnalysis.goalsForAvg}, GA: ${awayAnalysis.goalsAgainstAvg}`);

  // Tính Elo Win Probability
  // Công thức Elo: E_A = 1 / (1 + 10^((R_B - R_A)/400))
  let eloWinProbability = null;
  if (state.homeTeamInfo?.eloRating && state.awayTeamInfo?.eloRating) {
    const R_A = state.homeTeamInfo.eloRating;
    const R_B = state.awayTeamInfo.eloRating;
    
    // Elo thường tính win expectancy (thắng + nửa hòa). 
    // Tạm tính toán win probability cơ bản, giả định hòa chiếm 24% trong bóng đá
    const rawHomeExpected = 1 / (1 + Math.pow(10, (R_B - R_A) / 400));
    const rawAwayExpected = 1 / (1 + Math.pow(10, (R_A - R_B) / 400));
    
    const drawProb = 24; // 24% hòa mặc định
    const remainingProb = 100 - drawProb;
    
    const homeProb = rawHomeExpected * remainingProb;
    const awayProb = rawAwayExpected * remainingProb;

    eloWinProbability = {
      homeProb: Math.round(homeProb * 10) / 10,
      drawProb,
      awayProb: Math.round(awayProb * 10) / 10,
    };
    console.log(`[LangGraph] Node 2 -> Elo Probability: Home ${eloWinProbability.homeProb}%, Draw ${drawProb}%, Away ${eloWinProbability.awayProb}%`);
  }

  return {
    homeFormIndex: homeAnalysis.formIndex,
    homeGoalsForAvg: homeAnalysis.goalsForAvg,
    homeGoalsAgainstAvg: homeAnalysis.goalsAgainstAvg,
    homeShotsOnTargetAvg: homeAnalysis.shotsOnTargetAvg,

    awayFormIndex: awayAnalysis.formIndex,
    awayGoalsForAvg: awayAnalysis.goalsForAvg,
    awayGoalsAgainstAvg: awayAnalysis.goalsAgainstAvg,
    awayShotsOnTargetAvg: awayAnalysis.shotsOnTargetAvg,
    
    eloWinProbability,
  };
}
