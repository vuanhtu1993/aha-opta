/**
 * Odds Converter Utilities
 *
 * Chuyển đổi tỷ lệ kèo từ nhà cái → implied probability thực tế.
 *
 * Tại sao cần "loại bỏ vig"?
 * → Nhà cái luôn đặt margin (vig/overround) để đảm bảo lợi nhuận
 * → Ví dụ: Brazil 2.10, Draw 3.40, Germany 3.80
 *   Raw implied: 47.6% + 29.4% + 26.3% = 103.3% (không phải 100%)
 *   Phần 3.3% dư là margin của nhà cái
 * → Nếu đưa thẳng raw probability vào AI → bị lệch
 * → Cần normalize về 100% để có probability thực
 *
 * Công thức:
 *   Implied(X) = (1/odds_X) / (1/odds_home + 1/odds_draw + 1/odds_away)
 */

export interface NormalizedOdds {
  homeProb: number;  // % (0-100)
  drawProb: number;
  awayProb: number;
  // Thông tin debug
  vig: number;       // % margin của nhà cái (thường 3-8%)
}

/**
 * Chuyển decimal odds của 1 outcome → raw implied probability
 * @param odds - Decimal odds (ví dụ: 2.10 cho Brazil)
 * @returns Raw probability (0-1), CHƯA normalize
 */
export function oddsToRawProbability(odds: number): number {
  if (odds <= 0) throw new Error(`Invalid odds: ${odds}. Must be > 0`);
  return 1 / odds;
}

/**
 * Normalize 3 odds → implied probabilities sau khi loại bỏ bookmaker margin
 * @param homeOdds - Decimal odds của home team win
 * @param drawOdds - Decimal odds của draw
 * @param awayOdds - Decimal odds của away team win
 * @returns NormalizedOdds với probabilities tổng = 100%
 *
 * @example
 * // Brazil 2.10, Draw 3.40, Germany 3.80
 * normalizeOdds(2.10, 3.40, 3.80)
 * // → { homeProb: 46.1, drawProb: 28.5, awayProb: 25.4, vig: 3.3 }
 */
export function normalizeOdds(
  homeOdds: number,
  drawOdds: number,
  awayOdds: number
): NormalizedOdds {
  const rawHome = oddsToRawProbability(homeOdds);
  const rawDraw = oddsToRawProbability(drawOdds);
  const rawAway = oddsToRawProbability(awayOdds);

  // Tổng raw probability > 1 → phần dư là vig
  const rawTotal = rawHome + rawDraw + rawAway;
  const vig = (rawTotal - 1) * 100; // Convert về %

  // Normalize: chia mỗi raw probability cho tổng → đảm bảo tổng = 100%
  return {
    homeProb: (rawHome / rawTotal) * 100,
    drawProb: (rawDraw / rawTotal) * 100,
    awayProb: (rawAway / rawTotal) * 100,
    vig: Math.round(vig * 100) / 100, // Round 2 chữ số thập phân
  };
}

/**
 * Tính median odds từ nhiều bookmakers
 * Tại sao dùng median thay vì average?
 * → Một số nhà cái nhỏ có odds bất thường (outlier) → median robust hơn
 *
 * @param oddsArray - Mảng decimal odds từ nhiều bookmakers
 * @returns Median odds
 */
export function medianOdds(oddsArray: number[]): number {
  if (oddsArray.length === 0) throw new Error("oddsArray cannot be empty");

  const sorted = [...oddsArray].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);

  // Nếu số lẻ → lấy phần tử giữa; số chẵn → trung bình 2 phần tử giữa
  return sorted.length % 2 !== 0
    ? sorted[mid]
    : (sorted[mid - 1] + sorted[mid]) / 2;
}

/**
 * Parse raw bookmaker data từ The Odds API response
 * → Aggregate nhiều bookmakers → lấy median → normalize
 *
 * @param bookmakers - Array bookmaker objects từ The Odds API
 * @returns NormalizedOdds ready to use trong AI prompt
 */
export function aggregateBookmakerOdds(
  bookmakers: Array<{
    key: string;
    markets: Array<{
      key: string;
      outcomes: Array<{ name: string; price: number }>;
    }>;
  }>,
  homeTeamName: string,
  awayTeamName: string
): NormalizedOdds | null {
  const homeOddsArr: number[] = [];
  const drawOddsArr:  number[] = [];
  const awayOddsArr:  number[] = [];

  for (const bookmaker of bookmakers) {
    const h2hMarket = bookmaker.markets.find((m) => m.key === "h2h");
    if (!h2hMarket) continue;

    for (const outcome of h2hMarket.outcomes) {
      if (outcome.name === homeTeamName) homeOddsArr.push(outcome.price);
      else if (outcome.name === awayTeamName) awayOddsArr.push(outcome.price);
      else if (outcome.name === "Draw") drawOddsArr.push(outcome.price);
    }
  }

  // Không đủ data
  if (!homeOddsArr.length || !drawOddsArr.length || !awayOddsArr.length) {
    return null;
  }

  return normalizeOdds(
    medianOdds(homeOddsArr),
    medianOdds(drawOddsArr),
    medianOdds(awayOddsArr)
  );
}
