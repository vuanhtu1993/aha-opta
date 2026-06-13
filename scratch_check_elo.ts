import { connectDB } from "./src/lib/db/mongoose";
import { Team } from "./src/lib/db/models/Team";

async function main() {
  await connectDB();
  const usa = await Team.findOne({ name: "United States" });
  console.log("USA:", usa?.name, "Elo:", usa?.eloRating);
  process.exit(0);
}
main();
