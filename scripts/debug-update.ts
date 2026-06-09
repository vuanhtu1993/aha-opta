import * as dotenv from "dotenv";
import { connectDB } from "../src/lib/db/mongoose";
import { Team } from "../src/lib/db/models/Team";

dotenv.config();

async function debugUpdate() {
  await connectDB();
  try {
    console.log("Tìm đội Argentina...");
    const teamBefore = await Team.findOne({ slug: "argentina" });
    if (!teamBefore) {
      console.error("Không tìm thấy Argentina trong DB!");
      return;
    }
    
    console.log("Dữ liệu Argentina trước khi update:", {
      name: teamBefore.name,
      eloRating: teamBefore.eloRating,
      recentMatchesLength: teamBefore.recentEloMatches?.length
    });

    const mockMatches = [
      {
        date: "2026-06-06",
        homeTeam: "Argentina",
        awayTeam: "Honduras",
        homeScore: 2,
        awayScore: 0,
        tournament: "Friendly",
        ratingChange: 1,
        ratingAfter: 2114,
        rankAfter: 2
      }
    ];

    console.log("Thực hiện findOneAndUpdate...");
    const teamAfter = await Team.findOneAndUpdate(
      { slug: "argentina" },
      {
        $set: {
          eloRating: 2114,
          recentEloMatches: mockMatches
        }
      },
      { new: true }
    );

    if (teamAfter) {
      console.log("Dữ liệu Argentina sau khi update:", {
        name: teamAfter.name,
        eloRating: teamAfter.eloRating,
        recentMatchesLength: teamAfter.recentEloMatches?.length,
        rawRecentMatches: teamAfter.recentEloMatches
      });
    } else {
      console.error("findOneAndUpdate trả về null!");
    }
  } catch (error) {
    console.error("Gặp lỗi khi thực hiện update:", error);
  } finally {
    process.exit(0);
  }
}

debugUpdate();
