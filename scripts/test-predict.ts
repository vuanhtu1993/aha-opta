import * as dotenv from "dotenv";
import { connectDB } from "../src/lib/db/mongoose";
import { runOptaPrediction } from "../src/lib/ai/opta-agent/graph";

dotenv.config();

async function test() {
  console.log("Connecting to DB...");
  await connectDB();

  try {
    // Match ID, Home Team ID, Away Team ID từ Mexico vs South Africa của 2026
    const matchId = "6a26fae04fa7373ce1115aa5";
    const homeTeamId = "6a26fade4fa7373ce1115a75";
    const awayTeamId = "6a26fade4fa7373ce1115a76";

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
