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

  // Thay vì tự tính toán từ mảng matches (có thể rỗng nếu World Cup chưa đá),
  // chúng ta sử dụng trực tiếp chỉ số `stats` đã được tổng hợp sẵn trong Database (bao gồm cả lịch sử Elo).
  
  const getTeamAnalysis = (teamInfo: any) => {
    const stats = teamInfo?.stats || {};
    const matchesPlayed = stats.matchesPlayed || 1; // Tránh chia cho 0
    
    return {
      formIndex: stats.formIndex || 0,
      goalsForAvg: Math.round((stats.goalsFor || 0) / matchesPlayed * 100) / 100,
      goalsAgainstAvg: Math.round((stats.goalsAgainst || 0) / matchesPlayed * 100) / 100,
      shotsOnTargetAvg: stats.shotsOnTargetAvg || 0,
    };
  };

  const homeAnalysis = getTeamAnalysis(state.homeTeamInfo);
  const awayAnalysis = getTeamAnalysis(state.awayTeamInfo);

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
