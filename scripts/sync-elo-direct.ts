import * as dotenv from "dotenv";
import { connectDB } from "../src/lib/db/mongoose";
import { Team } from "../src/lib/db/models/Team";
import { scrapeEloRatings } from "../src/lib/services/elo-scraper";

dotenv.config();

async function run() {
  console.log("Connecting to MongoDB...");
  await connectDB();

  try {
    console.log("Bắt đầu cào dữ liệu Elo ratings và lịch sử trận đấu...");
    const eloData = await scrapeEloRatings();

    if (eloData.length === 0) {
      console.error("Không cào được dữ liệu Elo.");
      process.exit(1);
    }

    console.log(`Đang lưu trữ dữ liệu của ${eloData.length} đội tuyển vào MongoDB...`);
    const now = new Date();
    let updatedCount = 0;

    for (const team of eloData) {
      const result = await Team.findOneAndUpdate(
        { slug: team.slug },
        {
          $set: {
            eloRating: team.eloRating,
            eloRank: team.eloRank,
            recentEloMatches: team.recentEloMatches,
            eloLastSynced: now,
            lastUpdated: now,
          },
        },
        { new: true, upsert: false }
      );
      if (result) {
        updatedCount++;
      } else {
        console.warn(`- Không tìm thấy đội với slug: ${team.slug} (Tên ELO: ${team.teamName})`);
      }
    }

    console.log(`Đồng bộ thành công ${updatedCount}/${eloData.length} đội tuyển vào MongoDB.`);
  } catch (error) {
    console.error("Lỗi khi đồng bộ Elo:", error);
  } finally {
    process.exit(0);
  }
}

run();
