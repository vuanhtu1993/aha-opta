import * as dotenv from "dotenv";
import { connectDB } from "../src/lib/db/mongoose";
import { runOptaPrediction } from "../src/lib/ai/opta-agent/graph";

dotenv.config();

async function test() {
  console.log("Connecting to DB...");
  await connectDB();

  try {
    // Match ID, Home Team ID, Away Team ID từ South Africa vs Mexico của 2026
    const matchId = "6a26f6604fa7373ce111595e";
    const homeTeamId = "6a26f65e4fa7373ce111592e";
    const awayTeamId = "6a26f65e4fa7373ce111592f";

    console.log("Running prediction...");
    const result = await runOptaPrediction(matchId, homeTeamId, awayTeamId);
    console.log("Prediction Result:", JSON.stringify(result, null, 2));
  } catch (error) {
    console.error("Test execution failed:", error);
  } finally {
    process.exit(0);
  }
}

test();
