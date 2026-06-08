/**
 * Form Index Calculator
 *
 * Tính "phong độ gần đây" của đội bóng từ 5 trận gần nhất.
 *
 * Tại sao cần weighted scoring thay vì simple average?
 * → Trận gần nhất phản ánh phong độ hiện tại tốt hơn trận cũ
 * → Ví dụ: Thua 3 trận đầu nhưng thắng 2 trận gần nhất → phong độ đang lên
 * → Weighted score: trận gần nhất có trọng số cao hơn
 *
 * Công thức:
 *   weights = [5, 4, 3, 2, 1] (từ gần → xa)
 *   points  = Win: 3, Draw: 1, Loss: 0
 *   score   = sum(points[i] * weights[i])
 *   maxScore = (5+4+3+2+1) * 3 = 45
 *   formIndex = (score / maxScore) * 100
 *
 * → Kết quả: 0-100
 *   100 = Thắng cả 5 trận (kể cả trận nhất có weight cao nhất)
 *   0   = Thua cả 5 trận
 */

export type MatchResult = "W" | "D" | "L";

const WEIGHTS = [5, 4, 3, 2, 1]; // Index 0 = trận gần nhất
const POINTS: Record<MatchResult, number> = { W: 3, D: 1, L: 0 };
const MAX_SCORE = WEIGHTS.reduce((a, b) => a + b, 0) * 3; // = 45

/**
 * Tính form index từ mảng kết quả (mới nhất trước)
 * @param results - Mảng kết quả theo thứ tự từ gần nhất → xa nhất
 *                  Ví dụ: ["W", "W", "D", "L", "W"]
 * @returns Form index 0-100
 *
 * @example
 * calculateFormIndex(["W", "W", "D", "L", "W"])
 * // Score: (3*5) + (3*4) + (1*3) + (0*2) + (3*1) = 15+12+3+0+3 = 33
 * // Index: (33/45) * 100 ≈ 73
 */
export function calculateFormIndex(results: MatchResult[]): number {
  if (results.length === 0) return 0;

  // Chỉ lấy tối đa 5 trận gần nhất
  const recentResults = results.slice(0, 5);

  const score = recentResults.reduce((sum, result, i) => {
    const weight = WEIGHTS[i] ?? 1; // Fallback weight nếu < 5 trận
    return sum + POINTS[result] * weight;
  }, 0);

  // Điều chỉnh maxScore nếu có ít hơn 5 trận
  const adjustedMax =
    recentResults.length < 5
      ? WEIGHTS.slice(0, recentResults.length).reduce((a, b) => a + b, 0) * 3
      : MAX_SCORE;

  return Math.round((score / adjustedMax) * 100);
}

/**
 * Chuyển đổi từ match scores → MatchResult từ góc nhìn của 1 team
 * @param teamId - ObjectId string của team cần tính
 * @param homeTeamId - ObjectId string của home team
 * @param homeScore - Bàn thắng của home team
 * @param awayScore - Bàn thắng của away team
 * @returns "W", "D", "L", hoặc null nếu chưa có kết quả
 */
export function getResultForTeam(
  teamId: string,
  homeTeamId: string,
  awayScore: number | null,
  homeScore: number | null
): MatchResult | null {
  // Trận chưa kết thúc
  if (homeScore === null || awayScore === null) return null;

  const isHome = teamId === homeTeamId;
  const teamScore = isHome ? homeScore : awayScore;
  const opponentScore = isHome ? awayScore : homeScore;

  if (teamScore > opponentScore) return "W";
  if (teamScore < opponentScore) return "L";
  return "D";
}

/**
 * Tính xG average từ mảng xG values của các trận gần nhất
 * Simple average — không weighted vì xG là absolute metric
 * (khác form: xG không "lên dốc" hay "xuống dốc" theo thời gian rõ ràng)
 */
export function calculateXGAverage(xgValues: number[]): number {
  if (xgValues.length === 0) return 0;
  const sum = xgValues.reduce((a, b) => a + b, 0);
  return Math.round((sum / xgValues.length) * 100) / 100; // Round 2 decimals
}

/**
 * Tính Defensive Rating từ xG Against
 * Inverted: xGA thấp → phòng thủ tốt → rating cao
 *
 * @param xgAgainstValues - Mảng xG conceded trong các trận gần nhất
 * @param maxXGA - xGA tối đa để normalize (default: 3.0 = khá tệ)
 * @returns Rating 0-100, cao = phòng thủ tốt
 */
export function calculateDefensiveRating(
  xgAgainstValues: number[],
  maxXGA = 3.0
): number {
  const avgXGA = calculateXGAverage(xgAgainstValues);
  // Clamp về [0, maxXGA] rồi invert
  const clamped = Math.min(avgXGA, maxXGA);
  return Math.round((1 - clamped / maxXGA) * 100);
}
