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


// ─── Types ────────────────────────────────────────────────────────────────────

export interface EloResult {
  teamName: string;      // Tên trên eloratings.net
  slug: string;          // Slug trong MongoDB (sau khi map)
  eloRating: number;
  eloRank: number;
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
    });
  });

  console.log(`[EloScraper] Tìm thấy ${results.length}/48 đội WC 2026 trong bảng Elo`);

  return results;
}
