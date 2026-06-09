/**
 * Node 3: Market Signal (Tín hiệu thị trường)
 *
 * Nhiệm vụ:
 * 1. Gọi The Odds API lấy kèo H2H (Home/Draw/Away)
 * 2. Nếu không có kèo → Fallback tính xác suất từ Elo Difference
 * 3. Loại bỏ Margin (Vig) và chuyển thành Implied Probability thực tế
 *
 * Elo Fallback (khi không có Odds API):
 * Dùng công thức Elo chuẩn quốc tế: P(A wins) = 1 / (1 + 10^((Rb - Ra) / 400))
 * Đây là công thức mà FIFA, FIDE (cờ vua) và eloratings.net đều dùng.
 * Trade-off: Elo không phân biệt được "hòa" → ta phân bổ xác suất hòa cố định (~20%)
 * dựa trên thống kê lịch sử WC (22-25% trận kết thúc hòa vòng bảng).
 */

import { OptaStateType } from "../state";
import axios from "axios";
import { aggregateBookmakerOdds } from "@/lib/utils/odds-converter";

const ODDS_API_KEY = process.env.ODDS_API_KEY;
const SPORT = process.env.ODDS_API_SPORT || "soccer_fifa_world_cup";

// ─── Elo Probability Calculator ───────────────────────────────────────────────

/**
 * Tính xác suất thắng/hòa/thua từ Elo rating của 2 đội
 * Công thức: P(Home wins) = 1 / (1 + 10^((eloAway - eloHome) / 400))
 * Hòa được phân bổ cố định 22% (thống kê lịch sử WC group stage)
 */
function calcEloProbabilities(homeElo: number, awayElo: number) {
  // Xác suất thắng thuần túy (chưa tính hòa)
  const homeWinRaw = 1 / (1 + Math.pow(10, (awayElo - homeElo) / 400));
  const awayWinRaw = 1 - homeWinRaw;

  // Phân bổ xác suất hòa: 22% cố định, lấy đều từ home và away
  const DRAW_PROB = 0.22;
  const homeProb = (homeWinRaw * (1 - DRAW_PROB)) * 100;
  const awayProb = (awayWinRaw * (1 - DRAW_PROB)) * 100;
  const drawProb = DRAW_PROB * 100;

  return {
    homeProb: parseFloat(homeProb.toFixed(2)),
    drawProb: parseFloat(drawProb.toFixed(2)),
    awayProb: parseFloat(awayProb.toFixed(2)),
    vig: 0, // Elo-based không có Vig
  };
}

// ─── Main Node ────────────────────────────────────────────────────────────────

export async function marketSignalNode(state: OptaStateType): Promise<Partial<OptaStateType>> {
  console.log(`[LangGraph] Node 3: Fetching market signals...`);

  const homeName  = state.homeTeamInfo?.name;
  const awayName  = state.awayTeamInfo?.name;
  const homeElo   = state.homeTeamInfo?.eloRating ?? 1500;
  const awayElo   = state.awayTeamInfo?.eloRating ?? 1500;

  if (!homeName || !awayName) {
    return { marketOdds: null };
  }

  // ─── Thử lấy Odds từ The Odds API ────────────────────────────────────────
  if (ODDS_API_KEY) {
    try {
      const res = await axios.get(`https://api.the-odds-api.com/v4/sports/${SPORT}/odds`, {
        params: {
          apiKey: ODDS_API_KEY,
          regions: "eu", // Nhà cái Châu Âu thường chuẩn xác cho bóng đá
          markets: "h2h",
          oddsFormat: "decimal",
        },
        timeout: 5000,
      });

      const matches = res.data;

      // Tìm trận đấu tương ứng — so sánh linh hoạt vì tên đội có thể khác nhau nhỏ
      const targetMatch = matches.find((m: any) =>
        (m.home_team.includes(homeName) || homeName.includes(m.home_team)) &&
        (m.away_team.includes(awayName) || awayName.includes(m.away_team))
      );

      if (targetMatch) {
        const normalized = aggregateBookmakerOdds(targetMatch.bookmakers, homeName, awayName);
        console.log(`[LangGraph] Node 3: [ODDS API] Home ${normalized?.homeProb}% - Draw ${normalized?.drawProb}% - Away ${normalized?.awayProb}%`);
        return { marketOdds: normalized };
      }

      console.log(`[LangGraph] Node 3: Không có kèo cho trận ${homeName} vs ${awayName}. Chuyển sang Elo fallback.`);

    } catch (error) {
      console.warn("[LangGraph] Node 3: Odds API thất bại. Chuyển sang Elo fallback.", error);
    }
  }

  // ─── Elo Fallback ─────────────────────────────────────────────────────────
  // Khi không có Odds API hoặc không tìm thấy kèo cho trận đấu này
  const isEloAvailable = state.homeTeamInfo?.eloLastSynced && state.awayTeamInfo?.eloLastSynced;
  if (isEloAvailable) {
    // Chỉ dùng Elo fallback nếu đã có data thực (eloLastSynced !== null)
    const eloProbs = calcEloProbabilities(homeElo, awayElo);
    console.log(
      `[LangGraph] Node 3: [ELO FALLBACK] Home Elo ${homeElo} vs Away Elo ${awayElo} ` +
      `→ Home ${eloProbs.homeProb}% - Draw ${eloProbs.drawProb}% - Away ${eloProbs.awayProb}%`
    );
    return { marketOdds: eloProbs };
  }

  // Không có Odds và không có Elo data thực → trả về null
  console.warn("[LangGraph] Node 3: Không có Odds API lẫn Elo data. marketOdds = null.");
  return { marketOdds: null };
}
