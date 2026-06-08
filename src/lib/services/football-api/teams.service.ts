/**
 * API-Football: Teams Service
 */

import { footballClient } from "./client";

export interface ApiFootballTeam {
  team: {
    id: number;
    name: string;
    code: string;
    country: string;
    founded: number;
    national: boolean;
    logo: string;
  };
  venue: {
    id: number;
    name: string;
    address: string;
    city: string;
    capacity: number;
    surface: string;
    image: string;
  };
}

/**
 * Lấy danh sách các đội tham gia World Cup 2026.
 * Lưu ý: World Cup League ID trên API-Football là 1.
 * Season cho WC 2026 chưa active, nên có thể lấy historical season hoặc filter tĩnh.
 * Đối với WC 2026, ta sẽ query theo group/league khi có data, hoặc query theo tên.
 * 
 * Tạm thời: Fetch league_id=1 (World Cup), season 2022 để lấy cấu trúc data tham khảo,
 * Khi WC 2026 (season 2026) có trên API, chỉ cần đổi tham số.
 */
export async function fetchWorldCupTeams(season = 2022): Promise<ApiFootballTeam[]> {
  // GET /teams?league=1&season=2022
  const response = await footballClient.get("/teams", {
    params: {
      league: 1, // FIFA World Cup
      season: season,
    },
  });

  return response.data.response as ApiFootballTeam[];
}

/**
 * Lấy FIFA Ranking (Standings endpoint trên API-Football)
 * Note: FIFA ranking có thể cần gọi endpoint /standings hoặc /rankings
 * Đối với quốc gia, API-Football có endpoint riêng cho rankings.
 */
export async function fetchFifaRankings(): Promise<Record<number, number>> {
  // GET /fifa/rankings (requires specific API-Football endpoint)
  // Tính năng này có thể tùy thuộc vào tier của API-Football.
  // Nếu endpoint fifa ranking không khả dụng ở free tier, ta sẽ mock hoặc hardcode map cho 48 đội.
  
  try {
    const response = await footballClient.get("/fifa/rankings");
    const rankings: Record<number, number> = {};
    
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    response.data.response.forEach((item: any) => {
      // Giả sử item trả về team.id và ranking
      if (item.team?.id) {
        rankings[item.team.id] = item.ranking;
      }
    });
    
    return rankings;
  } catch (err) {
    console.warn("Lỗi khi fetch FIFA rankings, sẽ dùng ranking mặc định.", err);
    return {};
  }
}
