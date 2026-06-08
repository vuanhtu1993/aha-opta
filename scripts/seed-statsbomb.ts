/**
 * Seed StatsBomb Data (Phase 2a)
 *
 * Chạy 1 lần duy nhất bằng lệnh: `npx ts-node scripts/seed-statsbomb.ts`
 * (Hoặc biên dịch và chạy bằng node nếu ts-node có lỗi config)
 *
 * Nhiệm vụ:
 * 1. Tải dữ liệu các trận WC 2022 từ github.com/statsbomb/open-data
 * 2. Tính tổng xG (shot.statsbomb_xg) cho từng đội trong mỗi trận.
 * 3. Update collection Match (xgSource="statsbomb").
 */

import axios from "axios";
import * as dotenv from "dotenv";
import { connectDB } from "../src/lib/db/mongoose";
import { Team } from "../src/lib/db/models/Team";
import { Match } from "../src/lib/db/models/Match";

// Load .env để kết nối DB
dotenv.config();

const STATSBOMB_REPO_URL = "https://raw.githubusercontent.com/statsbomb/open-data/master/data";
const WC_COMPETITION_ID = 43; // FIFA World Cup
const WC_SEASON_ID = 106;     // 2022

interface SBEvent {
  type: { name: string };
  team: { id: number; name: string };
  shot?: { statsbomb_xg: number };
}

async function runSeed() {
  console.log("=== Bắt đầu Seed StatsBomb Data (WC 2022) ===");
  await connectDB();

  try {
    // 1. Lấy danh sách trận đấu
    console.log("Tải danh sách trận đấu từ StatsBomb...");
    const matchesRes = await axios.get(`${STATSBOMB_REPO_URL}/matches/${WC_COMPETITION_ID}/${WC_SEASON_ID}.json`);
    const sbMatches = matchesRes.data;
    console.log(`Tìm thấy ${sbMatches.length} trận đấu.`);

    let updatedCount = 0;

    for (const sbMatch of sbMatches) {
      const sbMatchId = sbMatch.match_id;
      const homeName = sbMatch.home_team.home_team_name;
      const awayName = sbMatch.away_team.away_team_name;

      // Tìm team trong DB của chúng ta (Mapping tên đội)
      const homeTeam = await Team.findOne({ $or: [{ name: new RegExp(homeName, "i") }, { country: new RegExp(homeName, "i") }] });
      const awayTeam = await Team.findOne({ $or: [{ name: new RegExp(awayName, "i") }, { country: new RegExp(awayName, "i") }] });

      if (!homeTeam || !awayTeam) {
        console.warn(`Không tìm thấy đội trong DB: ${homeName} hoặc ${awayName}. Bỏ qua trận ${sbMatchId}.`);
        continue;
      }

      // 2. Lấy event data để tính xG
      console.log(`Tải events cho trận: ${homeName} vs ${awayName}...`);
      const eventsRes = await axios.get(`${STATSBOMB_REPO_URL}/events/${sbMatchId}.json`);
      const events: SBEvent[] = eventsRes.data;

      let homeXg = 0;
      let awayXg = 0;

      // Tính tổng xG từ các cú sút
      for (const event of events) {
        if (event.type.name === "Shot" && event.shot && event.shot.statsbomb_xg) {
          if (event.team.name === homeName) {
            homeXg += event.shot.statsbomb_xg;
          } else if (event.team.name === awayName) {
            awayXg += event.shot.statsbomb_xg;
          }
        }
      }

      // Làm tròn 2 chữ số thập phân
      homeXg = Math.round(homeXg * 100) / 100;
      awayXg = Math.round(awayXg * 100) / 100;

      console.log(`  -> xG: ${homeName} (${homeXg}) vs ${awayName} (${awayXg})`);

      // 3. Update Match DB
      // Vì seed có thể chạy trước hoặc sau ETL từ API-Football, ta update dựa vào homeTeamId và awayTeamId
      // Nếu trận đấu chưa tồn tại từ API-Football, ta sẽ KHÔNG tạo mới (vì thiếu apiFootballId và các thông tin cơ bản khác).
      // StatsBomb chỉ được dùng để "đắp" xG vào trận đã có.
      
      const result = await Match.updateOne(
        { homeTeamId: homeTeam._id, awayTeamId: awayTeam._id },
        {
          $set: {
            "homeStats.xGoals": homeXg,
            "awayStats.xGoals": awayXg,
            xgSource: "statsbomb",
          }
        }
      );

      if (result.modifiedCount > 0) {
        updatedCount++;
      } else {
        console.log(`  (Trận này chưa được sync từ API-Football, bỏ qua)`);
      }
    }

    console.log(`=== Hoàn tất! Đã cập nhật xG thực cho ${updatedCount} trận. ===`);
  } catch (error) {
    console.error("Lỗi trong quá trình seed StatsBomb:", error);
  } finally {
    process.exit(0);
  }
}

runSeed();
