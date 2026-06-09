/**
 * Elo Scraper Service
 *
 * Nhiệm vụ: Crawl hệ số Elo từ eloratings.net bằng fetch trực tiếp các file TSV dữ liệu (không cần cheerio/browser).
 * Đây là giải pháp Vercel-native, không vi phạm giới hạn bundle size và cực kỳ robust chống thay đổi giao diện HTML.
 *
 * Tại sao eloratings.net?
 * → Dữ liệu Elo chính xác hơn FIFA Ranking cho head-to-head prediction
 * → Cung cấp các file TSV dữ liệu thô (World.tsv, en.teams.tsv) nên không cần crawl HTML.
 * → Miễn phí, công khai, không cần API key
 *
 * Trade-off:
 * → Nếu eloratings.net thay đổi đường dẫn file TSV → scraper bị gãy (cần cập nhật URL)
 */
import { IEloMatch } from "../db/models/Team";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface EloResult {
  teamName: string;      // Tên trên eloratings.net
  slug: string;          // Slug trong MongoDB (sau khi map)
  eloRating: number;
  eloRank: number;
  code: string;          // Mã viết tắt (e.g. BR)
  recentEloMatches: IEloMatch[];
}

// ─── Team Name Mapping ────────────────────────────────────────────────────────
//
// Vấn đề: Tên đội trên eloratings.net khác với tên trong MongoDB (từ WC 2026 seeder)
// Giải pháp: Mapping table thủ công — lowercase key → slug trong MongoDB
// Tại sao không dùng fuzzy match? → Dễ gây lỗi âm thầm, mapping rõ ràng hơn
//
// KEY  = tên đội trên eloratings.net (lowercase, đã trim)
// VALUE = slug đội trong MongoDB (trùng với ITeam.slug)

export const ELO_TEAM_MAP: Record<string, string> = {
  // ── Group A ──────────────────────────────────────────────────────────────
  "mexico": "mexico",
  "south africa": "south-africa",
  "south korea": "south-korea",
  "czechia": "czechia",
  "czech republic": "czechia",         // alias eloratings.net có thể dùng

  // ── Group B ──────────────────────────────────────────────────────────────
  "canada": "canada",
  "bosnia and herzegovina": "bosnia-and-herzegovina",
  "bosnia": "bosnia-and-herzegovina", // alias rút gọn
  "qatar": "qatar",
  "switzerland": "switzerland",

  // ── Group C ──────────────────────────────────────────────────────────────
  "brazil": "brazil",
  "morocco": "morocco",
  "haiti": "haiti",
  "scotland": "scotland",

  // ── Group D ──────────────────────────────────────────────────────────────
  "united states": "united-states",
  "usa": "united-states",   // alias phổ biến trên eloratings.net
  "paraguay": "paraguay",
  "australia": "australia",
  "turkey": "turkey",

  // ── Group E ──────────────────────────────────────────────────────────────
  "germany": "germany",
  "curacao": "curacao",
  "curaçao": "curacao",
  "cote d'ivoire": "cote-divoire",
  "ivory coast": "cote-divoire",    // alias tiếng Anh
  "ecuador": "ecuador",

  // ── Group F ──────────────────────────────────────────────────────────────
  "netherlands": "netherlands",
  "japan": "japan",
  "sweden": "sweden",
  "tunisia": "tunisia",

  // ── Group G ──────────────────────────────────────────────────────────────
  "belgium": "belgium",
  "egypt": "egypt",
  "iran": "iran",
  "ir iran": "iran",            // alias eloratings.net
  "new zealand": "new-zealand",

  // ── Group H ──────────────────────────────────────────────────────────────
  "spain": "spain",
  "cabo verde": "cabo-verde",
  "cape verde": "cabo-verde",      // alias tiếng Anh
  "saudi arabia": "saudi-arabia",
  "uruguay": "uruguay",

  // ── Group I ──────────────────────────────────────────────────────────────
  "france": "france",
  "senegal": "senegal",
  "iraq": "iraq",
  "norway": "norway",

  // ── Group J ──────────────────────────────────────────────────────────────
  "argentina": "argentina",
  "algeria": "algeria",
  "austria": "austria",
  "jordan": "jordan",

  // ── Group K ──────────────────────────────────────────────────────────────
  "portugal": "portugal",
  "dr congo": "dr-congo",
  "democratic republic of congo": "dr-congo", // alias đầy đủ
  "uzbekistan": "uzbekistan",
  "colombia": "colombia",

  // ── Group L ──────────────────────────────────────────────────────────────
  "england": "england",
  "croatia": "croatia",
  "ghana": "ghana",
  "panama": "panama",
};

// ─── Tournament Codes and Page Helpers ────────────────────────────────────────

const TOURNAMENT_CODES: Record<string, string> = {
  "F": "Giao hữu (Friendly)",
  "WC": "World Cup",
  "QC": "Vòng loại World Cup",
  "SA": "Copa América",
  "EC": "UEFA Euro",
  "EQ": "Vòng loại Euro",
  "CC": "Confederations Cup",
  "CG": "Asian Games",
  "C1": "AFC Asian Cup",
  "CQ": "Vòng loại Asian Cup",
  "G": "CONCACAF Gold Cup",
  "GQ": "Vòng loại Gold Cup",
  "UNL": "UEFA Nations League",
  "CNL": "CONCACAF Nations League",
  "ANC": "Africa Cup of Nations",
  "ANQ": "Vòng loại AFCON",
  "OC": "OFC Nations Cup",
};

function translateTournament(code: string): string {
  return TOURNAMENT_CODES[code] || code;
}

function getTeamPageName(text: string): string {
  return text
    ? text
        .replace(/ /g, "_")
        .replace(/[àáâãäå]/g, "a")
        .replace(/ç/g, "c")
        .replace(/[èéêë]/g, "e")
        .replace(/[ìíîï]/g, "i")
        .replace(/[òóôõö]/g, "o")
        .replace(/[ùúûü]/g, "u")
        .replace(/ñ/g, "n")
    : "";
}

// ─── Main Scraper Function ────────────────────────────────────────────────────

const ELO_TEAMS_URL = "https://www.eloratings.net/en.teams.tsv";
const ELO_RATINGS_URL = "https://www.eloratings.net/World.tsv";

/**
 * Crawl bảng xếp hạng Elo toàn thế giới từ eloratings.net (qua file TSV)
 * Lọc ra chỉ 48 đội tham gia WC 2026 dựa trên ELO_TEAM_MAP
 *
 * @returns Danh sách EloResult chỉ chứa các đội WC 2026
 */
export async function scrapeEloRatings(): Promise<EloResult[]> {
  console.log(`[EloScraper] Fetching data files from ${ELO_RATINGS_URL}...`);

  // 1. Fetch en.teams.tsv để làm mapping code -> team name
  const teamsResponse = await fetch(ELO_TEAMS_URL, {
    headers: {
      "User-Agent":
        "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) " +
        "AppleWebKit/537.36 (KHTML, like Gecko) " +
        "Chrome/124.0.0.0 Safari/537.36",
    },
    next: { revalidate: 3600 },
  });

  if (!teamsResponse.ok) {
    throw new Error(`[EloScraper] HTTP ${teamsResponse.status} khi fetch teams mapping từ ${ELO_TEAMS_URL}`);
  }

  const teamsTsv = await teamsResponse.text();
  const codeToName: Record<string, string> = {};

  teamsTsv.split("\n").forEach((line) => {
    const parts = line.split("\t");
    if (parts.length < 2) return;
    const code = parts[0].trim();
    if (code.endsWith("_loc")) return; // Bỏ qua nhãn locative
    const canonicalName = parts[1].trim();
    codeToName[code] = canonicalName;
  });

  console.log(`[EloScraper] Đã tải ${Object.keys(codeToName).length} tên đội bóng từ mapping tsv.`);

  // 2. Fetch World.tsv chứa bảng xếp hạng Elo
  const ratingsResponse = await fetch(ELO_RATINGS_URL, {
    headers: {
      "User-Agent":
        "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) " +
        "AppleWebKit/537.36 (KHTML, like Gecko) " +
        "Chrome/124.0.0.0 Safari/537.36",
    },
    next: { revalidate: 3600 },
  });

  if (!ratingsResponse.ok) {
    throw new Error(`[EloScraper] HTTP ${ratingsResponse.status} khi fetch ratings tsv từ ${ELO_RATINGS_URL}`);
  }

  const ratingsTsv = await ratingsResponse.text();
  const results: EloResult[] = [];

  ratingsTsv.split("\n").forEach((line) => {
    const parts = line.split("\t");
    if (parts.length < 4) return;

    const rank = parseInt(parts[1], 10);
    const code = parts[2].trim();
    const elo = parseInt(parts[3], 10);

    if (isNaN(rank) || isNaN(elo) || !code) return;

    const canonicalName = codeToName[code];
    if (!canonicalName) return;

    const slug = ELO_TEAM_MAP[canonicalName.toLowerCase()];
    if (!slug) return; // Không phải đội WC 2026 → bỏ qua

    results.push({
      teamName: canonicalName,
      slug,
      eloRating: elo,
      eloRank: rank,
      code,
      recentEloMatches: [],
    });
  });

  // 3. Crawl lịch sử trận đấu (recent matches) cho từng đội tuyển WC 2026
  console.log(`[EloScraper] Bắt đầu crawl lịch sử trận đấu cho ${results.length} đội WC 2026...`);
  
  // Concurrency limit = 8
  const CONCURRENCY_LIMIT = 8;
  const batches = [];
  for (let i = 0; i < results.length; i += CONCURRENCY_LIMIT) {
    batches.push(results.slice(i, i + CONCURRENCY_LIMIT));
  }

  for (const batch of batches) {
    await Promise.all(
      batch.map(async (team) => {
        try {
          const pageName = getTeamPageName(team.teamName);
          const url = `https://www.eloratings.net/${pageName}.tsv`;
          
          const matchResponse = await fetch(url, {
            headers: {
              "User-Agent":
                "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) " +
                "AppleWebKit/537.36 (KHTML, like Gecko) " +
                "Chrome/124.0.0.0 Safari/537.36",
            },
            next: { revalidate: 3600 },
          });

          if (!matchResponse.ok) {
            console.warn(`[EloScraper] Bỏ qua trận đấu cho ${team.teamName}: HTTP ${matchResponse.status}`);
            return;
          }

          const matchTsv = await matchResponse.text();
          const lines = matchTsv.split("\n").map(l => l.trim()).filter(Boolean);
          
          // Lấy tối đa 15 trận đấu gần đây nhất (ở cuối file)
          const recentLines = lines.slice(-15);
          const recentMatches: IEloMatch[] = [];

          for (const line of recentLines) {
            const fields = line.split("\t");
            if (fields.length < 16) continue;

            const year = fields[0];
            const month = fields[1];
            const day = fields[2];
            const homeCode = fields[3].trim();
            const awayCode = fields[4].trim();
            const homeScore = parseInt(fields[5], 10);
            const awayScore = parseInt(fields[6], 10);
            const tournamentCode = fields[7].trim();
            const changeRaw = parseInt(fields[9], 10);
            const homeRatingAfter = parseInt(fields[10], 10);
            const awayRatingAfter = parseInt(fields[11], 10);
            const homeRankAfter = parseInt(fields[14], 10);
            const awayRankAfter = parseInt(fields[15], 10);

            if (
              !year || !month || !day || !homeCode || !awayCode ||
              isNaN(homeScore) || isNaN(awayScore)
            ) {
              continue;
            }

            const homeTeamName = codeToName[homeCode] || homeCode;
            const awayTeamName = codeToName[awayCode] || awayCode;
            const dateStr = `${year}-${month}-${day}`;
            const tournamentName = translateTournament(tournamentCode);

            // Xác định xem đội tuyển hiện tại là Home hay Away để tính chỉ số tương ứng
            const isHome = homeCode === team.code;
            const ratingChange = isHome ? changeRaw : -changeRaw;
            const ratingAfter = isHome ? homeRatingAfter : awayRatingAfter;
            const rankAfter = isHome ? homeRankAfter : awayRankAfter;

            recentMatches.push({
              date: dateStr,
              homeTeam: homeTeamName,
              awayTeam: awayTeamName,
              homeScore,
              awayScore,
              tournament: tournamentName,
              ratingChange: isNaN(ratingChange) ? 0 : ratingChange,
              ratingAfter: isNaN(ratingAfter) ? 1500 : ratingAfter,
              rankAfter: isNaN(rankAfter) ? 0 : rankAfter,
            });
          }

          // Đảo ngược để trận mới nhất lên đầu tiên
          team.recentEloMatches = recentMatches.reverse();
        } catch (err) {
          console.error(`[EloScraper] Lỗi khi crawl lịch sử trận đấu của ${team.teamName}:`, err);
        }
      })
    );
  }

  console.log(`[EloScraper] Tìm thấy ${results.length}/48 đội WC 2026 trong bảng Elo (đã nạp lịch sử trận đấu)`);

  return results;
}
