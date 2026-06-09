/**
 * World Cup 2026 Static Data Seeder
 * 
 * Khởi tạo dữ liệu tĩnh cho 48 đội tuyển quốc gia và 72 trận đấu vòng bảng 
 * của giải đấu FIFA World Cup 2026 nhằm kiểm thử hệ thống.
 */

import { Team } from "../db/models/Team";
import { Match } from "../db/models/Match";
import { Types } from "mongoose";

// Cấu trúc định nghĩa Đội tuyển
interface TeamDef {
  apiFootballId: number;
  name: string;
  shortName: string;
  slug: string;
  country: string;
  iso: string;
  group: string;
  confederation: "UEFA" | "CONMEBOL" | "AFC" | "CAF" | "CONCACAF" | "OFC";
  fifaRanking: number;
}

// 48 đội bóng được bốc thăm chia vào 12 bảng đấu (A-L)
const WC2026_TEAMS: TeamDef[] = [
  // Group A
  { apiFootballId: 16, name: "Mexico", shortName: "MEX", slug: "mexico", country: "Mexico", iso: "mx", group: "A", confederation: "CONCACAF", fifaRanking: 15 },
  { apiFootballId: 43, name: "South Africa", shortName: "RSA", slug: "south-africa", country: "South Africa", iso: "za", group: "A", confederation: "CAF", fifaRanking: 59 },
  { apiFootballId: 18, name: "South Korea", shortName: "KOR", slug: "south-korea", country: "South Korea", iso: "kr", group: "A", confederation: "AFC", fifaRanking: 23 },
  { apiFootballId: 50, name: "Czechia", shortName: "CZE", slug: "czechia", country: "Czechia", iso: "cz", group: "A", confederation: "UEFA", fifaRanking: 36 },

  // Group B
  { apiFootballId: 11, name: "Canada", shortName: "CAN", slug: "canada", country: "Canada", iso: "ca", group: "B", confederation: "CONCACAF", fifaRanking: 40 },
  { apiFootballId: 62, name: "Bosnia and Herzegovina", shortName: "BIH", slug: "bosnia-and-herzegovina", country: "Bosnia and Herzegovina", iso: "ba", group: "B", confederation: "UEFA", fifaRanking: 74 },
  { apiFootballId: 1566, name: "Qatar", shortName: "QAT", slug: "qatar", country: "Qatar", iso: "qa", group: "B", confederation: "AFC", fifaRanking: 34 },
  { apiFootballId: 15, name: "Switzerland", shortName: "SUI", slug: "switzerland", country: "Switzerland", iso: "ch", group: "B", confederation: "UEFA", fifaRanking: 19 },

  // Group C
  { apiFootballId: 6, name: "Brazil", shortName: "BRA", slug: "brazil", country: "Brazil", iso: "br", group: "C", confederation: "CONMEBOL", fifaRanking: 5 },
  { apiFootballId: 31, name: "Morocco", shortName: "MAR", slug: "morocco", country: "Morocco", iso: "ma", group: "C", confederation: "CAF", fifaRanking: 12 },
  { apiFootballId: 993, name: "Haiti", shortName: "HAI", slug: "haiti", country: "Haiti", iso: "ht", group: "C", confederation: "CONCACAF", fifaRanking: 90 },
  { apiFootballId: 1110, name: "Scotland", shortName: "SCO", slug: "scotland", country: "Scotland", iso: "gb-sct", group: "C", confederation: "UEFA", fifaRanking: 39 },

  // Group D
  { apiFootballId: 12, name: "United States", shortName: "USA", slug: "united-states", country: "United States", iso: "us", group: "D", confederation: "CONCACAF", fifaRanking: 11 },
  { apiFootballId: 17, name: "Paraguay", shortName: "PAR", slug: "paraguay", country: "Paraguay", iso: "py", group: "D", confederation: "CONMEBOL", fifaRanking: 56 },
  { apiFootballId: 24, name: "Australia", shortName: "AUS", slug: "australia", country: "Australia", iso: "au", group: "D", confederation: "AFC", fifaRanking: 24 },
  { apiFootballId: 40, name: "Turkey", shortName: "TUR", slug: "turkey", country: "Turkey", iso: "tr", group: "D", confederation: "UEFA", fifaRanking: 42 },

  // Group E
  { apiFootballId: 9, name: "Germany", shortName: "GER", slug: "germany", country: "Germany", iso: "de", group: "E", confederation: "UEFA", fifaRanking: 16 },
  { apiFootballId: 1007, name: "Curacao", shortName: "CUW", slug: "curacao", country: "Curacao", iso: "cw", group: "E", confederation: "CONCACAF", fifaRanking: 91 },
  { apiFootballId: 29, name: "Cote d'Ivoire", shortName: "CIV", slug: "cote-divoire", country: "Cote d'Ivoire", iso: "ci", group: "E", confederation: "CAF", fifaRanking: 38 },
  { apiFootballId: 14, name: "Ecuador", shortName: "ECU", slug: "ecuador", country: "Ecuador", iso: "ec", group: "E", confederation: "CONMEBOL", fifaRanking: 31 },

  // Group F
  { apiFootballId: 1118, name: "Netherlands", shortName: "NED", slug: "netherlands", country: "Netherlands", iso: "nl", group: "F", confederation: "UEFA", fifaRanking: 7 },
  { apiFootballId: 19, name: "Japan", shortName: "JPN", slug: "japan", country: "Japan", iso: "jp", group: "F", confederation: "AFC", fifaRanking: 18 },
  { apiFootballId: 13, name: "Sweden", shortName: "SWE", slug: "sweden", country: "Sweden", iso: "se", group: "F", confederation: "UEFA", fifaRanking: 28 },
  { apiFootballId: 28, name: "Tunisia", shortName: "TUN", slug: "tunisia", country: "Tunisia", iso: "tn", group: "F", confederation: "CAF", fifaRanking: 41 },

  // Group G
  { apiFootballId: 1, name: "Belgium", shortName: "BEL", slug: "belgium", country: "Belgium", iso: "be", group: "G", confederation: "UEFA", fifaRanking: 3 },
  { apiFootballId: 32, name: "Egypt", shortName: "EGY", slug: "egypt", country: "Egypt", iso: "eg", group: "G", confederation: "CAF", fifaRanking: 37 },
  { apiFootballId: 22, name: "Iran", shortName: "IRN", slug: "iran", country: "Iran", iso: "ir", group: "G", confederation: "AFC", fifaRanking: 20 },
  { apiFootballId: 23, name: "New Zealand", shortName: "NZL", slug: "new-zealand", country: "New Zealand", iso: "nz", group: "G", confederation: "OFC", fifaRanking: 104 },

  // Group H
  { apiFootballId: 9617, name: "Spain", shortName: "ESP", slug: "spain", country: "Spain", iso: "es", group: "H", confederation: "UEFA", fifaRanking: 8 },
  { apiFootballId: 1142, name: "Cabo Verde", shortName: "CPV", slug: "cabo-verde", country: "Cabo Verde", iso: "cv", group: "H", confederation: "CAF", fifaRanking: 65 },
  { apiFootballId: 21, name: "Saudi Arabia", shortName: "KSA", slug: "saudi-arabia", country: "Saudi Arabia", iso: "sa", group: "H", confederation: "AFC", fifaRanking: 53 },
  { apiFootballId: 7, name: "Uruguay", shortName: "URU", slug: "uruguay", country: "Uruguay", iso: "uy", group: "H", confederation: "CONMEBOL", fifaRanking: 14 },

  // Group I
  { apiFootballId: 2, name: "France", shortName: "FRA", slug: "france", country: "France", iso: "fr", group: "I", confederation: "UEFA", fifaRanking: 2 },
  { apiFootballId: 30, name: "Senegal", shortName: "SEN", slug: "senegal", country: "Senegal", iso: "sn", group: "I", confederation: "CAF", fifaRanking: 17 },
  { apiFootballId: 25, name: "Iraq", shortName: "IRQ", slug: "iraq", country: "Iraq", iso: "iq", group: "I", confederation: "AFC", fifaRanking: 58 },
  { apiFootballId: 60, name: "Norway", shortName: "NOR", slug: "norway", country: "Norway", iso: "no", group: "I", confederation: "UEFA", fifaRanking: 47 },

  // Group J
  { apiFootballId: 26, name: "Argentina", shortName: "ARG", slug: "argentina", country: "Argentina", iso: "ar", group: "J", confederation: "CONMEBOL", fifaRanking: 1 },
  { apiFootballId: 27, name: "Algeria", shortName: "ALG", slug: "algeria", country: "Algeria", iso: "dz", group: "J", confederation: "CAF", fifaRanking: 43 },
  { apiFootballId: 35, name: "Austria", shortName: "AUT", slug: "austria", country: "Austria", iso: "at", group: "J", confederation: "UEFA", fifaRanking: 25 },
  { apiFootballId: 1567, name: "Jordan", shortName: "JOR", slug: "jordan", country: "Jordan", iso: "jo", group: "J", confederation: "AFC", fifaRanking: 71 },

  // Group K
  { apiFootballId: 20, name: "Portugal", shortName: "POR", slug: "portugal", country: "Portugal", iso: "pt", group: "K", confederation: "UEFA", fifaRanking: 6 },
  { apiFootballId: 1128, name: "DR Congo", shortName: "COD", slug: "dr-congo", country: "DR Congo", iso: "cd", group: "K", confederation: "CAF", fifaRanking: 61 },
  { apiFootballId: 1568, name: "Uzbekistan", shortName: "UZB", slug: "uzbekistan", country: "Uzbekistan", iso: "uz", group: "K", confederation: "AFC", fifaRanking: 64 },
  { apiFootballId: 8, name: "Colombia", shortName: "COL", slug: "colombia", country: "Colombia", iso: "co", group: "K", confederation: "CONMEBOL", fifaRanking: 12 },

  // Group L
  { apiFootballId: 10, name: "England", shortName: "ENG", slug: "england", country: "England", iso: "gb-eng", group: "L", confederation: "UEFA", fifaRanking: 4 },
  { apiFootballId: 3, name: "Croatia", shortName: "CRO", slug: "croatia", country: "Croatia", iso: "hr", group: "L", confederation: "UEFA", fifaRanking: 10 },
  { apiFootballId: 33, name: "Ghana", shortName: "GHA", slug: "ghana", country: "Ghana", iso: "gh", group: "L", confederation: "CAF", fifaRanking: 68 },
  { apiFootballId: 1105, name: "Panama", shortName: "PAN", slug: "panama", country: "Panama", iso: "pa", group: "L", confederation: "CONCACAF", fifaRanking: 44 }
];

// Danh sách các sân vận động đăng cai WC 2026 chính thức
const WC2026_VENUES = [
  "MetLife Stadium (East Rutherford, USA)",
  "Azteca Stadium (Mexico City, Mexico)",
  "BC Place (Vancouver, Canada)",
  "Mercedes-Benz Stadium (Atlanta, USA)",
  "Gillette Stadium (Boston, USA)",
  "AT&T Stadium (Dallas, USA)",
  "NRG Stadium (Houston, USA)",
  "Arrowhead Stadium (Kansas City, USA)",
  "SoFi Stadium (Los Angeles, USA)",
  "Hard Rock Stadium (Miami, USA)",
  "Lincoln Financial Field (Philadelphia, USA)",
  "Levi's Stadium (San Francisco, USA)",
  "Lumen Field (Seattle, USA)",
  "BMO Field (Toronto, Canada)",
  "Akron Stadium (Guadalajara, Mexico)",
  "BBVA Stadium (Monterrey, Mexico)"
];

/**
 * Hàm khởi tạo dữ liệu World Cup 2026 thủ công
 */
export async function seedWorldCup2026(): Promise<{ teamsCount: number; matchesCount: number }> {
  console.log("[Seeder] Bắt đầu dọn dẹp toàn bộ dữ liệu Teams và Matches cũ...");
  
  // Làm sạch database để tránh xung đột unique index
  await Team.deleteMany({});
  await Match.deleteMany({});
  
  // 1. Lưu danh sách Đội bóng (Team)
  const seededTeams = [];
  for (const t of WC2026_TEAMS) {
    const payload = {
      apiFootballId: t.apiFootballId,
      name: t.name,
      shortName: t.shortName,
      slug: t.slug,
      country: t.country,
      flag: `https://flagcdn.com/w320/${t.iso}.png`, // Cờ chất lượng cao từ FlagCDN
      group: t.group,
      confederation: t.confederation,
      fifaRanking: t.fifaRanking,
      lastUpdated: new Date()
    };

    const doc = await Team.findOneAndUpdate(
      { apiFootballId: t.apiFootballId },
      { $set: payload },
      { upsert: true, new: true }
    );
    seededTeams.push(doc);
  }
  
  console.log(`[Seeder] Đã đồng bộ ${seededTeams.length} đội bóng WC 2026 vào MongoDB.`);

  // Khởi tạo Mapping tên đội bóng và Mongoose ObjectId
  const teamIdMap: Record<string, Types.ObjectId> = {};
  seededTeams.forEach((t) => {
    teamIdMap[t.name] = t._id;
  });

  // 2. Dọn dẹp các trận đấu WC 2026 cũ (được tạo thủ công) trước khi insert mới
  // Tránh việc trùng lặp lịch thi đấu khi người dùng click Seed nhiều lần
  const matchApiIdsRange = Array.from({ length: 72 }, (_, i) => 202600 + i + 1);
  await Match.deleteMany({ apiFootballId: { $in: matchApiIdsRange } });

  // 3. Tự động sinh 72 trận đấu vòng bảng
  // 12 bảng đấu, mỗi bảng 4 đội đấu vòng tròn một lượt = 6 trận/bảng
  const mockMatches: any[] = [];
  let matchCounter = 0;

  // Nhóm các đội tuyển theo bảng đấu
  const groups: Record<string, typeof seededTeams> = {};
  seededTeams.forEach((t) => {
    if (!groups[t.group]) groups[t.group] = [];
    groups[t.group].push(t);
  });

  // Duyệt qua từng bảng đấu (A đến L)
  for (const [groupName, teamList] of Object.entries(groups)) {
    if (teamList.length !== 4) {
      console.warn(`Bảng ${groupName} có số lượng đội tuyển không chuẩn (${teamList.length}), bỏ qua.`);
      continue;
    }

    const [t1, t2, t3, t4] = teamList;

    // Định nghĩa 6 cặp đấu vòng bảng
    const fixturesDef = [
      { home: t1, away: t2, round: 1 },
      { home: t3, away: t4, round: 1 },
      { home: t1, away: t3, round: 2 },
      { home: t2, away: t4, round: 2 },
      { home: t1, away: t4, round: 3 },
      { home: t2, away: t3, round: 3 }
    ];

    // Lấy chỉ số bảng đấu (A = 0, B = 1, C = 2, ...)
    const gIndex = groupName.charCodeAt(0) - "A".charCodeAt(0);

    fixturesDef.forEach((fix, fIndex) => {
      matchCounter++;
      const apiFootballId = 202600 + matchCounter; // Dummy ID từ 202601 đến 202672
      
      // Tính toán ngày thi đấu (phân bổ từ 11/06/2026 đến 27/06/2026)
      let dayOffset = 0;
      if (fix.round === 1) {
        dayOffset = gIndex % 4; // Spreads Round 1: Jun 11 - Jun 14
      } else if (fix.round === 2) {
        dayOffset = 5 + (gIndex % 4); // Spreads Round 2: Jun 16 - Jun 19
      } else {
        dayOffset = 10 + (gIndex % 4); // Spreads Round 3: Jun 21 - Jun 24
      }

      const matchDate = new Date("2026-06-11T00:00:00Z");
      matchDate.setDate(matchDate.getDate() + dayOffset);
      
      // Gán giờ thi đấu (xoay vòng 15h, 18h, 21h)
      const hoursList = [15, 18, 21];
      const selectedHour = hoursList[(gIndex + fIndex) % 3];
      matchDate.setHours(selectedHour, 0, 0, 0);

      // Chọn ngẫu nhiên/xoay vòng sân vận động
      const venue = WC2026_VENUES[(gIndex + fIndex) % WC2026_VENUES.length];

      mockMatches.push({
        apiFootballId,
        homeTeamId: teamIdMap[fix.home.name],
        awayTeamId: teamIdMap[fix.away.name],
        homeScore: null, // Trận đấu chưa diễn ra
        awayScore: null,
        status: "scheduled",
        matchDate,
        stage: "Group Stage",
        group: groupName,
        venue,
        homeStats: null,
        awayStats: null,
        xgSource: "none",
        lastUpdated: new Date()
      });
    });
  }

  // Lưu lịch thi đấu vào MongoDB
  let matchesUpserted = 0;
  for (const m of mockMatches) {
    await Match.findOneAndUpdate(
      { apiFootballId: m.apiFootballId },
      { $set: m },
      { upsert: true }
    );
    matchesUpserted++;
  }

  console.log(`[Seeder] Đã sinh và lưu ${matchesUpserted} trận đấu vòng bảng WC 2026.`);
  return { teamsCount: seededTeams.length, matchesCount: matchesUpserted };
}
