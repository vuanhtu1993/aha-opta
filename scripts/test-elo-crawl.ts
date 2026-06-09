import * as dotenv from "dotenv";
import { scrapeEloRatings } from "../src/lib/services/elo-scraper";

dotenv.config();

async function test() {
  console.log("Bắt đầu chạy thử Elo Scraper...");
  try {
    const results = await scrapeEloRatings();
    console.log(`Cào thành công ${results.length} đội tuyển.`);
    
    // In ra kết quả của 3 đội đầu tiên để kiểm tra
    const sample = results.slice(0, 3);
    for (const team of sample) {
      console.log(`-----------------------------------`);
      console.log(`Đội tuyển: ${team.teamName} (Slug: ${team.slug}, Code: ${team.code})`);
      console.log(`Elo Rating: ${team.eloRating}, Rank: ${team.eloRank}`);
      console.log(`Số trận đấu gần đây cào được: ${team.recentEloMatches.length}`);
      if (team.recentEloMatches.length > 0) {
        console.log("Trận gần nhất:", JSON.stringify(team.recentEloMatches[0], null, 2));
      }
    }
  } catch (error) {
    console.error("Lỗi trong quá trình chạy scraper:", error);
  }
}

test();
