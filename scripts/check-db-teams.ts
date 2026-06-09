import * as dotenv from "dotenv";
import { connectDB } from "../src/lib/db/mongoose";
import { Team } from "../src/lib/db/models/Team";

dotenv.config();

async function check() {
  await connectDB();
  try {
    const teams = await Team.find({}).lean();
    console.log(`Tổng số đội bóng trong DB: ${teams.length}`);
    
    if (teams.length > 0) {
      console.log("Danh sách slug của 10 đội đầu tiên trong DB:");
      teams.slice(0, 10).forEach(t => {
        console.log(`- Name: ${t.name}, Slug: ${t.slug}, Elo: ${t.eloRating || "chưa có"}, RecentMatchesCount: ${t.recentEloMatches?.length || 0}`);
      });
      
      const populatedTeams = teams.filter(t => t.recentEloMatches && t.recentEloMatches.length > 0);
      console.log(`Số lượng đội đã có dữ liệu recentEloMatches: ${populatedTeams.length}/${teams.length}`);
    } else {
      console.log("Cơ sở dữ liệu Trống (chưa có đội bóng nào).");
    }
  } catch (error) {
    console.error("Lỗi khi kiểm tra DB:", error);
  } finally {
    process.exit(0);
  }
}

check();
