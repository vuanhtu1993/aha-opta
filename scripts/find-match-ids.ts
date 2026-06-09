import * as dotenv from "dotenv";
import { connectDB } from "../src/lib/db/mongoose";
import { Team } from "../src/lib/db/models/Team";
import { Match } from "../src/lib/db/models/Match";

import mongoose from "mongoose";

dotenv.config();

async function find() {
  await connectDB();
  try {
    // Gọi Team.modelName để ép buộc TypeScript không loại bỏ import
    console.log("Kích hoạt đăng ký model:", Team.modelName);
    console.log("Các models đã đăng ký:", mongoose.modelNames());
    const matches = await Match.find({}).populate("homeTeamId awayTeamId").limit(5).lean();
    console.log(`Tìm thấy ${matches.length} trận đấu trong DB:`);
    matches.forEach(m => {
      const home = m.homeTeamId as any;
      const away = m.awayTeamId as any;
      console.log(`- Match ID: ${m._id}`);
      console.log(`  Cặp đấu: ${home?.name} (ID: ${home?._id}) vs ${away?.name} (ID: ${away?._id})`);
      console.log(`  Status: ${m.status}, Date: ${m.matchDate}`);
    });
  } catch (error) {
    console.error("Lỗi:", error);
  } finally {
    process.exit(0);
  }
}

find();
