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
 * Trọng số (weights) cho Form Index (10 trận gần nhất, Geometric Decay).
 * Trận gần nhất có trọng số cao nhất (index 0 = mới nhất).
 * Dùng cấp số nhân với r = 0.75, tổng cộng lại = 1.0.
 */
const FORM_WEIGHTS = [
  0.2649, 0.1987, 0.1490, 0.1118, 0.0838,
  0.0629, 0.0471, 0.0354, 0.0265, 0.0199
];

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

  let totalXgFor = 0, totalXgAgainst = 0, xgCount = 0;
  let totalPossession = 0, possCount = 0;
  let totalSOT = 0, sotCount = 0;
  let totalPassAcc = 0, passCount = 0;

  for (const match of wcMatches) {
    const isHome = match.homeTeamId.toString() === teamId;

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

  const wcFormData = wcMatches.map((match) => {
    const isHome = match.homeTeamId.toString() === teamId;
    const gf = isHome ? (match.homeScore ?? 0) : (match.awayScore ?? 0);
    const ga = isHome ? (match.awayScore ?? 0) : (match.homeScore ?? 0);
    return {
      dateMs: new Date(match.matchDate).getTime(),
      outcome: gf > ga ? "win" : gf === ga ? "draw" : ("loss" as const),
      gf,
      ga,
    };
  });

  /**
   * Lịch sử Elo: chỉ lấy trận thi đấu chính thức (không giao hữu).
   */
  const teamName = teamDoc.name.toLowerCase();
  const historicalFormData = (teamDoc.recentEloMatches || [])
    .filter((m: any) => isCompetitiveMatch(m.tournament))
    .map((m: any) => {
      // Xác định vai trò chủ nhà/khách
      const isHome = m.homeTeam.toLowerCase().includes(teamName) || teamName.includes(m.homeTeam.toLowerCase());
      const myScore = isHome ? m.homeScore : m.awayScore;
      const oppScore = isHome ? m.awayScore : m.homeScore;
      return {
        dateMs: new Date(m.date).getTime(),
        outcome: myScore > oppScore ? "win" : myScore === oppScore ? "draw" : ("loss" as const),
        gf: myScore,
        ga: oppScore,
      };
    })
    .filter((m: any) => !isNaN(m.dateMs));

  /**
   * Merge WC + lịch sử, sort descending (mới nhất trước), lấy top 10.
   */
  const allFormData = [...wcFormData, ...historicalFormData]
    .sort((a, b) => b.dateMs - a.dateMs)
    .slice(0, 10);

  // Áp dụng Weighted Average và tính lại W/D/L từ 10 trận này
  let wins = 0, draws = 0, losses = 0;
  let goalsFor = 0, goalsAgainst = 0;
  let formIndex = 0;
  let weightSum = 0;

  for (let i = 0; i < allFormData.length; i++) {
    const data = allFormData[i];
    goalsFor += data.gf;
    goalsAgainst += data.ga;
    
    let score = 0;
    if (data.outcome === "win") { wins++; score = 100; }
    else if (data.outcome === "draw") { draws++; score = 50; }
    else { losses++; score = 0; }

    const weight = FORM_WEIGHTS[i] ?? 0.02;
    formIndex += score * weight;
    weightSum += weight;
  }
  
  if (weightSum > 0) {
    formIndex = Math.round(formIndex / weightSum);
  } else {
    formIndex = 0;
  }
  
  const matchesPlayed = allFormData.length;

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

// ─── Bootstrap từ lịch sử Elo ───────────────────────────────────────────────

/**
 * Bootstrap stats cho TẤT CẢ đội bóng từ dữ liệu `recentEloMatches` đã có sẵn.
 *
 * Dùng khi: WC 2026 chưa diễn ra → không có dữ liệu trong Collection `matches` →
 * cần lấy 5 trận thi đấu chính thức gần nhất trong lịch sử để hiển thị bảng Phong độ.
 *
 * Nguồn dữ liệu: Team.recentEloMatches (từ eloratings.net — đã sync bằng "Sync Elo Ratings")
 * Điều kiện tiên quyết: Phải chạy "Sync Elo Ratings" trước để có recentEloMatches.
 *
 * Chỉ số có thể tính từ Elo history:
 * ✅ matchesPlayed (5 trận gần nhất chính thức)
 * ✅ wins, draws, losses
 * ✅ goalsFor, goalsAgainst
 * ✅ formIndex (weighted average)
 * ❌ xGoalsFor/Against, possessionAvg, shotsOnTargetAvg, passAccuracyAvg
 *    → Sẽ giữ nguyên 0 cho đến khi admin nhập kết quả WC thủ công
 *
 * Lưu ý về thiết kế (Trade-off):
 * → Hàm này KHÔNG ghi đè xG/possession nếu đã có (nhờ conditional $set)
 * → Khi WC bắt đầu và admin nhập kết quả → recalculateTeamStats() sẽ
 *   tự động merge WC data vào, thay thế dần dữ liệu bootstrap này.
 *
 * @returns Thống kê: số đội đã bootstrap, số đội bị bỏ qua (thiếu data)
 */
export async function bootstrapStatsFromEloHistory(): Promise<{
  bootstrapped: number;
  skipped: number;
  details: Array<{ name: string; wins: number; draws: number; losses: number; formIndex: number }>;
}> {
  console.log("[StatsCalculator] Bắt đầu bootstrap stats từ lịch sử Elo...");

  // Lấy tất cả teams có recentEloMatches (đã sync Elo)
  const teams = await Team.find({ "recentEloMatches.0": { $exists: true } })
    .select("_id name recentEloMatches stats")
    .lean();

  console.log(`[StatsCalculator] Tìm thấy ${teams.length} đội có dữ liệu Elo history.`);

  let bootstrapped = 0;
  let skipped = 0;
  const details: Array<{ name: string; wins: number; draws: number; losses: number; formIndex: number }> = [];

  for (const team of teams) {
    const teamName = team.name.toLowerCase();

    // ── Lọc 10 trận thi đấu chính thức gần nhất ─────────────────────────────
    // recentEloMatches đã được scraper đảo ngược (trận mới nhất ở đầu mảng)
    const competitiveMatches = (team.recentEloMatches || [])
      .filter((m) => isCompetitiveMatch(m.tournament))
      .slice(0, 10); // Top 10 gần nhất

    if (competitiveMatches.length === 0) {
      console.warn(`[StatsCalculator] Bỏ qua ${team.name}: Không có trận đấu chính thức nào.`);
      skipped++;
      continue;
    }

    // ── Tính W/D/L, GF, GA ──────────────────────────────────────────────────
    let wins = 0, draws = 0, losses = 0;
    let goalsFor = 0, goalsAgainst = 0;

    for (const m of competitiveMatches) {
      // Xác định đội đang bootstrap là chủ nhà hay khách dựa trên tên đội
      const isHome = m.homeTeam.toLowerCase() === teamName;
      const gf = isHome ? m.homeScore : m.awayScore;
      const ga = isHome ? m.awayScore : m.homeScore;

      goalsFor += gf;
      goalsAgainst += ga;

      if (gf > ga) wins++;
      else if (gf === ga) draws++;
      else losses++;
    }

    // ── Tính Form Index (weighted average) ──────────────────────────────────
    // Dùng cùng logic với recalculateTeamStats để nhất quán
    let formIndex = 0;
    let weightSum = 0;
    for (let i = 0; i < competitiveMatches.length; i++) {
      const m = competitiveMatches[i];
      const isHome = m.homeTeam.toLowerCase().includes(teamName) || teamName.includes(m.homeTeam.toLowerCase());
      const gf = isHome ? m.homeScore : m.awayScore;
      const ga = isHome ? m.awayScore : m.homeScore;
      const score = gf > ga ? 100 : gf === ga ? 50 : 0;
      
      const weight = FORM_WEIGHTS[i] ?? 0.02;
      formIndex += score * weight;
      weightSum += weight;
    }
    
    if (weightSum > 0) {
      formIndex = Math.round(formIndex / weightSum);
    } else {
      formIndex = 0;
    }

    // ── Cập nhật Team document ──────────────────────────────────────────────
    // Chiến lược update quan trọng:
    // - Ghi matchesPlayed, W/D/L, GF/GA, formIndex từ Elo history
    // - KHÔNG ghi đè xGoals/possession/shotsOnTarget/passAccuracy
    //   vì các chỉ số này sẽ được điền dần khi WC diễn ra
    await Team.findByIdAndUpdate(team._id, {
      $set: {
        "stats.matchesPlayed": competitiveMatches.length,
        "stats.wins": wins,
        "stats.draws": draws,
        "stats.losses": losses,
        "stats.goalsFor": goalsFor,
        "stats.goalsAgainst": goalsAgainst,
        "stats.formIndex": formIndex,
        lastUpdated: new Date(),
      },
    });

    bootstrapped++;
    details.push({ name: team.name, wins, draws, losses, formIndex });
  }

  console.log(
    `[StatsCalculator] Bootstrap hoàn tất: ${bootstrapped} đội cập nhật, ${skipped} đội bỏ qua.`
  );

  return { bootstrapped, skipped, details };
}

