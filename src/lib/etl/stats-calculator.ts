/**
 * Stats Calculator — ETL Module
 *
 * Tính toán và cập nhật toàn bộ chỉ số thống kê (stats) của một đội bóng.
 * Được gọi TỰ ĐỘNG sau mỗi lần admin nhập kết quả trận đấu WC 2026.
 *
 * Nguồn dữ liệu:
 * - W/D/L, GF/GA, xG avg, Possession avg → Collection `matches` (WC 2026)
 * - Form Index → Hybrid: WC 2026 matches + lịch sử recentEloMatches (không giao hữu)
 *   Lý do: WC 2026 chưa bắt đầu nên cần dữ liệu lịch sử để bootstrap Form Index
 */

import { Match } from "../db/models/Match";
import { Team } from "../db/models/Team";
import { Types } from "mongoose";

// ─── Hằng số & Helper ────────────────────────────────────────────────────────

/**
 * Danh sách từ khóa xác định trận giao hữu.
 * Các trận có tournament chứa các từ khóa này sẽ bị bỏ qua khi tính Form Index.
 * Trade-off: Có thể miss một số giải đấu lạ, nhưng tốt hơn việc tính sai phong độ
 * bằng cách đưa giao hữu vào.
 */
const FRIENDLY_KEYWORDS = ["friendly", "friendlies", "international friendlies", "giao hữu"];

/**
 * Kiểm tra một trận có phải giao hữu không.
 * @returns true nếu là thi đấu chính thức (KHÔNG phải giao hữu)
 */
function isCompetitiveMatch(tournament: string): boolean {
  const lower = tournament.toLowerCase().trim();
  return !FRIENDLY_KEYWORDS.some((kw) => lower.includes(kw));
}

/**
 * Trọng số (weights) cho Form Index.
 * Trận gần nhất có trọng số cao nhất (index 0 = mới nhất).
 * 5 mức weight cộng lại = 1.0
 */
const FORM_WEIGHTS = [0.35, 0.25, 0.20, 0.12, 0.08];

// ─── Hàm chính ───────────────────────────────────────────────────────────────

/**
 * Tính lại toàn bộ stats của một đội bóng và update vào MongoDB.
 *
 * @param teamId - ObjectId string của đội bóng cần cập nhật
 *
 * Quy trình:
 * 1. Query tất cả WC 2026 matches đã kết thúc của team từ Collection `matches`
 * 2. Tính toán các chỉ số tổng hợp (aggregation in application layer)
 * 3. Hybrid Form Index: WC matches + lịch sử Elo (không giao hữu), top 5 gần nhất
 * 4. Upsert vào trường `stats` của Team document
 */
export async function recalculateTeamStats(teamId: string): Promise<void> {
  const objectId = new Types.ObjectId(teamId);

  // ── Bước 1: Fetch dữ liệu ──────────────────────────────────────────────────

  // WC 2026 matches đã kết thúc, sắp xếp từ mới → cũ
  const wcMatches = await Match.find({
    $or: [{ homeTeamId: objectId }, { awayTeamId: objectId }],
    status: "finished",
  })
    .sort({ matchDate: -1 })
    .lean();

  // Team document để lấy recentEloMatches + tên đội (để xác định home/away trong Elo history)
  const teamDoc = await Team.findById(objectId)
    .select("name recentEloMatches")
    .lean();

  if (!teamDoc) {
    console.warn(`[StatsCalculator] Không tìm thấy team với ID: ${teamId}`);
    return;
  }

  // ── Bước 2: Tính W/D/L, GF/GA, xG/Possession avg từ WC matches ────────────

  let wins = 0, draws = 0, losses = 0;
  let goalsFor = 0, goalsAgainst = 0;
  let totalXgFor = 0, totalXgAgainst = 0, xgCount = 0;
  let totalPossession = 0, possCount = 0;
  let totalSOT = 0, sotCount = 0;
  let totalPassAcc = 0, passCount = 0;

  for (const match of wcMatches) {
    const isHome = match.homeTeamId.toString() === teamId;
    const gf = isHome ? (match.homeScore ?? 0) : (match.awayScore ?? 0);
    const ga = isHome ? (match.awayScore ?? 0) : (match.homeScore ?? 0);

    goalsFor += gf;
    goalsAgainst += ga;

    if (gf > ga) wins++;
    else if (gf === ga) draws++;
    else losses++;

    // Thống kê lối chơi: chỉ tính nếu có dữ liệu (> 0 để tránh ảnh hưởng trận chưa có stats)
    const myStats = isHome ? match.homeStats : match.awayStats;
    const oppStats = isHome ? match.awayStats : match.homeStats;

    if (myStats) {
      if ((myStats.xGoals ?? 0) > 0) {
        totalXgFor += myStats.xGoals ?? 0;
        totalXgAgainst += oppStats?.xGoals ?? 0;
        xgCount++;
      }
      if ((myStats.possession ?? 0) > 0) {
        totalPossession += myStats.possession ?? 0;
        possCount++;
      }
      if ((myStats.shotsOnTarget ?? 0) > 0) {
        totalSOT += myStats.shotsOnTarget ?? 0;
        sotCount++;
      }
      if ((myStats.passAccuracy ?? 0) > 0) {
        totalPassAcc += myStats.passAccuracy ?? 0;
        passCount++;
      }
    }
  }

  const matchesPlayed = wcMatches.length;

  // ── Bước 3: Tính Form Index (Hybrid) ───────────────────────────────────────

  /**
   * Chuẩn bị WC matches dưới dạng { dateMs: number, outcome: "win"|"draw"|"loss" }
   * để merge với lịch sử Elo, sau đó sort và lấy top 5
   */
  const wcFormData = wcMatches.map((match) => {
    const isHome = match.homeTeamId.toString() === teamId;
    const gf = isHome ? (match.homeScore ?? 0) : (match.awayScore ?? 0);
    const ga = isHome ? (match.awayScore ?? 0) : (match.homeScore ?? 0);
    return {
      dateMs: new Date(match.matchDate).getTime(),
      outcome: gf > ga ? "win" : gf === ga ? "draw" : ("loss" as const),
    };
  });

  /**
   * Lịch sử Elo: chỉ lấy trận thi đấu chính thức (không giao hữu).
   * Dùng homeScore/awayScore thực tế để xác định kết quả, KHÔNG dùng ratingChange
   * vì ratingChange có thể dương khi hòa với đội yếu hơn.
   */
  const teamName = teamDoc.name.toLowerCase();
  const historicalFormData = (teamDoc.recentEloMatches || [])
    .filter((m) => isCompetitiveMatch(m.tournament))
    .map((m) => {
      // Xác định vai trò chủ nhà/khách dựa trên tên đội
      const isHome = m.homeTeam.toLowerCase() === teamName;
      const myScore = isHome ? m.homeScore : m.awayScore;
      const oppScore = isHome ? m.awayScore : m.homeScore;
      return {
        dateMs: new Date(m.date).getTime(),
        outcome: myScore > oppScore ? "win" : myScore === oppScore ? "draw" : ("loss" as const),
      };
    })
    .filter((m) => !isNaN(m.dateMs)); // Loại bỏ entry có date không hợp lệ

  /**
   * Merge WC + lịch sử, sort descending (mới nhất trước), lấy top 5.
   * WC matches sẽ tự động được ưu tiên vì ngày tháng mới hơn.
   */
  const allFormData = [...wcFormData, ...historicalFormData]
    .sort((a, b) => b.dateMs - a.dateMs)
    .slice(0, 5);

  // Áp dụng Weighted Average với FORM_WEIGHTS
  let formIndex = 0;
  for (let i = 0; i < allFormData.length; i++) {
    const score =
      allFormData[i].outcome === "win" ? 100 : allFormData[i].outcome === "draw" ? 50 : 0;
    formIndex += score * (FORM_WEIGHTS[i] ?? 0.08);
  }
  formIndex = Math.round(formIndex);

  // ── Bước 4: Update Team document ──────────────────────────────────────────

  const updatedStats = {
    matchesPlayed,
    wins,
    draws,
    losses,
    goalsFor,
    goalsAgainst,
    // Trung bình xG — chỉ tính khi có đủ data, không chia cho 0
    xGoalsFor: xgCount > 0 ? parseFloat((totalXgFor / xgCount).toFixed(2)) : 0,
    xGoalsAgainst: xgCount > 0 ? parseFloat((totalXgAgainst / xgCount).toFixed(2)) : 0,
    possessionAvg: possCount > 0 ? Math.round(totalPossession / possCount) : 0,
    shotsOnTargetAvg: sotCount > 0 ? parseFloat((totalSOT / sotCount).toFixed(1)) : 0,
    passAccuracyAvg: passCount > 0 ? Math.round(totalPassAcc / passCount) : 0,
    formIndex,
  };

  await Team.findByIdAndUpdate(objectId, {
    $set: {
      stats: updatedStats,
      lastUpdated: new Date(),
    },
  });

  console.log(
    `[StatsCalculator] Cập nhật stats cho team ${teamDoc.name}:`,
    `${wins}W-${draws}D-${losses}L | Form=${formIndex}`
  );
}
