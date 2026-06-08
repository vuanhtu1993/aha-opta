/**
 * ETL Orchestrator (Phase 2)
 *
 * Chịu trách nhiệm điều phối toàn bộ luồng ETL:
 * 1. Fetch từ API (API-Football)
 * 2. Transform qua các transformer
 * 3. Save (Upsert) vào MongoDB
 * 4. Gọi scraper để bổ sung dữ liệu xG (FBref)
 */

import { fetchWorldCupTeams, fetchFifaRankings } from "../services/football-api/teams.service";
import { fetchWorldCupMatches, fetchMatchStats } from "../services/football-api/matches.service";
import { transformApiTeamToMongoPayload } from "./transformers/team.transformer";
import { transformApiMatchToMongoPayload } from "./transformers/match.transformer";
import { Team, ITeam } from "../db/models/Team";
import { Match, IMatch } from "../db/models/Match";
import { scrapeFbrefXg } from "../services/fbref/scraper";
import { Types } from "mongoose";

/**
 * Đồng bộ toàn bộ danh sách Đội bóng
 */
export async function syncTeamsETL(season = 2022) {
  console.log(`[ETL] Bắt đầu đồng bộ Teams (season ${season})...`);
  
  const apiTeams = await fetchWorldCupTeams(season);
  const fifaRankings = await fetchFifaRankings();

  console.log(`[ETL] Lấy được ${apiTeams.length} teams từ API.`);

  let upsertedCount = 0;

  for (const apiData of apiTeams) {
    const payload = transformApiTeamToMongoPayload(apiData, fifaRankings);
    
    // Upsert: Nếu có team.apiFootballId thì update, chưa có thì insert
    await Team.findOneAndUpdate(
      { apiFootballId: payload.apiFootballId },
      { $set: payload },
      { upsert: true, new: true }
    );
    upsertedCount++;
  }

  console.log(`[ETL] Đã upsert ${upsertedCount} teams vào MongoDB.`);
  return upsertedCount;
}

/**
 * Đồng bộ toàn bộ Lịch thi đấu và Kết quả/Stats
 * @param scrapeXG Nếu true, sẽ gọi FBref scraper để lấy xG thực tế
 */
export async function syncMatchesETL(season = 2022, scrapeXG = false) {
  console.log(`[ETL] Bắt đầu đồng bộ Matches (season ${season})...`);

  // Lấy mapping ID giữa API-Football và MongoDB ObjectID
  const teams = await Team.find({}, { _id: 1, apiFootballId: 1 }).lean() as Pick<ITeam, "_id" | "apiFootballId">[];
  const teamIdMap: Record<number, Types.ObjectId> = {};
  teams.forEach((t) => {
    teamIdMap[t.apiFootballId] = t._id;
  });

  const apiMatches = await fetchWorldCupMatches(season);
  console.log(`[ETL] Lấy được ${apiMatches.length} matches từ API.`);

  let upsertedCount = 0;
  let statsFetched = 0;

  for (const match of apiMatches) {
    const status = match.fixture.status.short;
    
    // Chỉ lấy stats cho các trận đã/đang đá
    let apiStats = null;
    if (["1H", "HT", "2H", "ET", "P", "FT", "AET", "PEN"].includes(status)) {
      try {
        apiStats = await fetchMatchStats(match.fixture.id);
        statsFetched++;
      } catch (err) {
        console.warn(`[ETL] Lỗi lấy stats cho trận ${match.fixture.id}:`, err);
      }
    }

    const payload = transformApiMatchToMongoPayload(match, apiStats, teamIdMap);
    
    if (payload) {
      // Dùng aggregation pipeline trong update để không ghi đè xGoals nếu API-Football trả về 0 nhưng ta đã có xG từ FBref/Statsbomb
      const existingMatch = await Match.findOne({ apiFootballId: payload.apiFootballId }).lean();
      
      if (existingMatch && payload.homeStats && payload.awayStats) {
         // Giữ lại xGoals cũ nếu API-Football gửi null hoặc 0
         if (existingMatch.homeStats?.xGoals && payload.homeStats.xGoals === 0) {
           payload.homeStats.xGoals = existingMatch.homeStats.xGoals;
         }
         if (existingMatch.awayStats?.xGoals && payload.awayStats.xGoals === 0) {
           payload.awayStats.xGoals = existingMatch.awayStats.xGoals;
         }
      }

      await Match.findOneAndUpdate(
        { apiFootballId: payload.apiFootballId },
        { $set: payload },
        { upsert: true }
      );
      upsertedCount++;
    }
  }

  console.log(`[ETL] Đã upsert ${upsertedCount} matches (${statsFetched} trận có stats).`);

  // Bổ sung xG từ FBref nếu được yêu cầu
  if (scrapeXG) {
    await syncFbrefXg();
  }

  return { upsertedCount, statsFetched };
}

/**
 * Scrape xG từ FBref và update vào DB
 */
export async function syncFbrefXg() {
  console.log("[ETL] Bắt đầu scrape xG từ FBref...");
  // URL cho World Cup 2022 (Dùng tạm để test/seed. Khi WC 2026 có URL riêng, đổi URL này)
  const FBREF_URL = "https://fbref.com/en/comps/1/schedule/World-Cup-Scores-and-Fixtures";
  
  try {
    const xgData = await scrapeFbrefXg(FBREF_URL);
    let updatedCount = 0;

    for (const data of xgData) {
      // Map tên FBref -> Team slug/name trong DB
      // FBref đôi khi dùng tên khác (ví dụ "United States" vs "USA")
      // Có thể cần regex hoặc hàm mapping fuzzy
      const homeTeam = await Team.findOne({ $or: [{ name: new RegExp(data.homeTeam, 'i') }, { country: new RegExp(data.homeTeam, 'i') }] });
      const awayTeam = await Team.findOne({ $or: [{ name: new RegExp(data.awayTeam, 'i') }, { country: new RegExp(data.awayTeam, 'i') }] });

      if (homeTeam && awayTeam) {
        // Cập nhật match đã có
        const result = await Match.updateOne(
          { homeTeamId: homeTeam._id, awayTeamId: awayTeam._id, xgSource: { $ne: "statsbomb" } }, // Không đè data của Statsbomb
          { 
            $set: { 
              "homeStats.xGoals": data.homeXg,
              "awayStats.xGoals": data.awayXg,
              "xgSource": "fbref"
            } 
          }
        );
        if (result.modifiedCount > 0) updatedCount++;
      }
    }
    console.log(`[ETL] Cập nhật xG từ FBref cho ${updatedCount} trận.`);
  } catch (err) {
    console.error("[ETL] Lỗi khi sync FBref xG:", err);
  }
}
