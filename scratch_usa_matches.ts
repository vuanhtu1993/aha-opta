import { connectDB } from "./src/lib/db/mongoose";
import { Match } from "./src/lib/db/models/Match";
import { Team } from "./src/lib/db/models/Team";

async function main() {
  await connectDB();
  const usa = await Team.findOne({ name: "Hoa Kỳ" }) || await Team.findOne({ name: "USA" });
  if (!usa) {
    console.log("USA not found");
    process.exit(1);
  }
  console.log("USA Team ID:", usa._id);
  console.log("USA Form:", usa.stats?.formIndex);

  const matches = await Match.find({
    $or: [{ homeTeamId: usa._id }, { awayTeamId: usa._id }],
    status: "finished"
  }).sort({ matchDate: -1 });

  console.log(`Found ${matches.length} finished matches for USA`);
  for (const m of matches) {
    console.log(`Match: ${m.homeScore} - ${m.awayScore} (Home: ${m.homeTeamId.toString() === usa._id.toString() ? 'USA' : 'Opp'}, Away: ${m.awayTeamId.toString() === usa._id.toString() ? 'USA' : 'Opp'})`);
  }
  process.exit(0);
}
main();
