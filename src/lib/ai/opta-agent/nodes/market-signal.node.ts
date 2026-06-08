/**
 * Node 3: Market Signal (Tín hiệu thị trường)
 *
 * Nhiệm vụ:
 * 1. Gọi The Odds API
 * 2. Lấy kèo H2H (Home/Draw/Away)
 * 3. Loại bỏ Margin (Vig) của nhà cái
 * 4. Chuyển đổi thành Implied Probability thực tế
 */

import { OptaStateType } from "../state";
import axios from "axios";
import { aggregateBookmakerOdds } from "@/lib/utils/odds-converter";

const ODDS_API_KEY = process.env.ODDS_API_KEY;
const SPORT = process.env.ODDS_API_SPORT || "soccer_fifa_world_cup";

export async function marketSignalNode(state: OptaStateType): Promise<Partial<OptaStateType>> {
  console.log(`[LangGraph] Node 3: Fetching market signals...`);

  if (!ODDS_API_KEY) {
    console.warn("[LangGraph] Node 3: Thiếu ODDS_API_KEY. Bỏ qua market signal.");
    return { marketOdds: null };
  }

  const homeName = state.homeTeamInfo?.name;
  const awayName = state.awayTeamInfo?.name;

  if (!homeName || !awayName) {
    return { marketOdds: null };
  }

  try {
    // 1. Gọi API lấy kèo
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

    // 2. Tìm trận đấu tương ứng (so sánh tên đội - lưu ý tên có thể khác biệt nhỏ)
    // Dùng regex hoặc includes để match linh hoạt hơn
    const targetMatch = matches.find((m: any) => 
      (m.home_team.includes(homeName) || homeName.includes(m.home_team)) &&
      (m.away_team.includes(awayName) || awayName.includes(m.away_team))
    );

    if (!targetMatch) {
      console.log(`[LangGraph] Node 3: Không có kèo cho trận ${homeName} vs ${awayName}`);
      return { marketOdds: null };
    }

    // 3. Tính toán Implied Probabilities
    const normalized = aggregateBookmakerOdds(targetMatch.bookmakers, homeName, awayName);

    console.log(`[LangGraph] Node 3: Tín hiệu thị trường -> Home ${normalized?.homeProb}% - Draw ${normalized?.drawProb}% - Away ${normalized?.awayProb}%`);

    return { marketOdds: normalized };

  } catch (error) {
    console.error("[LangGraph] Node 3: Lỗi khi gọi The Odds API", error);
    return { marketOdds: null };
  }
}
