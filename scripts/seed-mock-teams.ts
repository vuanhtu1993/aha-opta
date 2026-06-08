/**
 * Seed Mock Data for aha-opta (WC 2022 & 2026 Mock)
 * 
 * Lệnh chạy: `npx ts-node scripts/seed-mock-teams.ts`
 * 
 * Mục tiêu: Tạo dữ liệu mẫu của 5 đội bóng lớn và 4 trận đấu (2 đã kết thúc, 2 sắp diễn ra)
 * để kiểm tra toàn bộ luồng LangGraph và UI Dashboard ngoại tuyến (offline) 
 * mà không bị chặn bởi API-Football Key.
 */

import * as dotenv from "dotenv";
import { connectDB } from "../src/lib/db/mongoose";
import { Team } from "../src/lib/db/models/Team";
import { Match } from "../src/lib/db/models/Match";

dotenv.config();

const mockTeams = [
  {
    apiFootballId: 26,
    name: "Argentina",
    shortName: "ARG",
    slug: "argentina",
    country: "Argentina",
    flag: "https://media.api-sports.io/football/teams/26.png",
    group: "C",
    confederation: "CONMEBOL" as const,
    fifaRanking: 3,
    stats: {
      matchesPlayed: 7,
      wins: 4,
      draws: 2,
      losses: 1,
      goalsFor: 15,
      goalsAgainst: 8,
      xGoalsFor: 15.6,
      xGoalsAgainst: 4.8,
      possessionAvg: 57,
      shotsOnTargetAvg: 5.7,
      passAccuracyAvg: 85,
      formIndex: 85
    },
    aiRating: 92
  },
  {
    apiFootballId: 2,
    name: "France",
    shortName: "FRA",
    slug: "france",
    country: "France",
    flag: "https://media.api-sports.io/football/teams/2.png",
    group: "D",
    confederation: "UEFA" as const,
    fifaRanking: 4,
    stats: {
      matchesPlayed: 7,
      wins: 5,
      draws: 1,
      losses: 1,
      goalsFor: 16,
      goalsAgainst: 8,
      xGoalsFor: 13.8,
      xGoalsAgainst: 7.2,
      possessionAvg: 52,
      shotsOnTargetAvg: 5.3,
      passAccuracyAvg: 83,
      formIndex: 80
    },
    aiRating: 90
  },
  {
    apiFootballId: 6,
    name: "Brazil",
    shortName: "BRA",
    slug: "brazil",
    country: "Brazil",
    flag: "https://media.api-sports.io/football/teams/6.png",
    group: "G",
    confederation: "CONMEBOL" as const,
    fifaRanking: 1,
    stats: {
      matchesPlayed: 5,
      wins: 3,
      draws: 1,
      losses: 1,
      goalsFor: 8,
      goalsAgainst: 3,
      xGoalsFor: 12.1,
      xGoalsAgainst: 3.2,
      possessionAvg: 58,
      shotsOnTargetAvg: 6.2,
      passAccuracyAvg: 88,
      formIndex: 75
    },
    aiRating: 88
  },
  {
    apiFootballId: 3,
    name: "Croatia",
    shortName: "CRO",
    slug: "croatia",
    country: "Croatia",
    flag: "https://media.api-sports.io/football/teams/3.png",
    group: "F",
    confederation: "UEFA" as const,
    fifaRanking: 12,
    stats: {
      matchesPlayed: 7,
      wins: 2,
      draws: 4,
      losses: 1,
      goalsFor: 8,
      goalsAgainst: 7,
      xGoalsFor: 7.4,
      xGoalsAgainst: 9.8,
      possessionAvg: 54,
      shotsOnTargetAvg: 3.9,
      passAccuracyAvg: 84,
      formIndex: 70
    },
    aiRating: 82
  },
  {
    apiFootballId: 31,
    name: "Morocco",
    shortName: "MAR",
    slug: "morocco",
    country: "Morocco",
    flag: "https://media.api-sports.io/football/teams/31.png",
    group: "F",
    confederation: "CAF" as const,
    fifaRanking: 22,
    stats: {
      matchesPlayed: 7,
      wins: 3,
      draws: 2,
      losses: 2,
      goalsFor: 6,
      goalsAgainst: 5,
      xGoalsFor: 6.1,
      xGoalsAgainst: 7.4,
      possessionAvg: 39,
      shotsOnTargetAvg: 2.9,
      passAccuracyAvg: 80,
      formIndex: 65
    },
    aiRating: 78
  }
];

async function seed() {
  console.log("Connecting to MongoDB...");
  await connectDB();

  console.log("Seeding Teams...");
  const seededTeams = [];
  for (const t of mockTeams) {
    const doc = await Team.findOneAndUpdate(
      { apiFootballId: t.apiFootballId },
      { $set: t },
      { upsert: true, new: true }
    );
    seededTeams.push(doc);
    console.log(`- Seeded Team: ${doc.name} (${doc.shortName})`);
  }

  // Map to get ObjectIds
  const teamMap: Record<string, any> = {};
  seededTeams.forEach((t) => {
    teamMap[t.name] = t._id;
  });

  console.log("Seeding Matches...");
  const mockMatches = [
    {
      apiFootballId: 999901,
      homeTeamId: teamMap["Argentina"],
      awayTeamId: teamMap["France"],
      homeScore: 3,
      awayScore: 3,
      status: "finished" as const,
      matchDate: new Date("2022-12-18T18:00:00Z"),
      stage: "Final" as const,
      group: null,
      venue: "Lusail Iconic Stadium",
      homeStats: {
        possession: 54,
        shots: 20,
        shotsOnTarget: 10,
        xGoals: 3.3,
        passAccuracy: 85,
        corners: 6,
        fouls: 26,
        yellowCards: 4,
        redCards: 0
      },
      awayStats: {
        possession: 46,
        shots: 10,
        shotsOnTarget: 5,
        xGoals: 2.2,
        passAccuracy: 80,
        corners: 5,
        fouls: 19,
        yellowCards: 3,
        redCards: 0
      },
      xgSource: "statsbomb" as const
    },
    {
      apiFootballId: 999902,
      homeTeamId: teamMap["Croatia"],
      awayTeamId: teamMap["Morocco"],
      homeScore: 2,
      awayScore: 1,
      status: "finished" as const,
      matchDate: new Date("2022-12-17T18:00:00Z"),
      stage: "Third Place" as const,
      group: null,
      venue: "Khalifa International Stadium",
      homeStats: {
        possession: 51,
        shots: 12,
        shotsOnTarget: 4,
        xGoals: 0.7,
        passAccuracy: 82,
        corners: 4,
        fouls: 13,
        yellowCards: 0,
        redCards: 0
      },
      awayStats: {
        possession: 49,
        shots: 9,
        shotsOnTarget: 2,
        xGoals: 0.5,
        passAccuracy: 81,
        corners: 3,
        fouls: 11,
        yellowCards: 2,
        redCards: 0
      },
      xgSource: "statsbomb" as const
    },
    // Trận giả lập sắp tới để người dùng nhấn Predict
    {
      apiFootballId: 999903,
      homeTeamId: teamMap["Argentina"],
      awayTeamId: teamMap["Brazil"],
      homeScore: null,
      awayScore: null,
      status: "scheduled" as const,
      matchDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000), // 2 ngày sau
      stage: "Group Stage" as const,
      group: "A",
      venue: "MetLife Stadium",
      homeStats: null,
      awayStats: null,
      xgSource: "none" as const
    },
    {
      apiFootballId: 999904,
      homeTeamId: teamMap["France"],
      awayTeamId: teamMap["Croatia"],
      homeScore: null,
      awayScore: null,
      status: "scheduled" as const,
      matchDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000), // 3 ngày sau
      stage: "Group Stage" as const,
      group: "B",
      venue: "Hard Rock Stadium",
      homeStats: null,
      awayStats: null,
      xgSource: "none" as const
    }
  ];

  for (const m of mockMatches) {
    const doc = await Match.findOneAndUpdate(
      { apiFootballId: m.apiFootballId },
      { $set: m },
      { upsert: true, new: true }
    );
    console.log(`- Seeded Match: ${doc.apiFootballId} (status: ${doc.status})`);
  }

  console.log("Seeding complete!");
  process.exit(0);
}

seed().catch(err => {
  console.error("Seeding error:", err);
  process.exit(1);
});
