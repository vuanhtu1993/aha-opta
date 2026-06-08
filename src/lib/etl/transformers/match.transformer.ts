/**
 * Match Transformer (ETL Phase 2)
 *
 * Nhiệm vụ: Chuyển đổi dữ liệu raw từ API-Football thành dạng chuẩn của Mongoose Match schema.
 * Liên kết với TeamObjectId dựa vào apiFootballId của các đội.
 */

import { ApiFootballMatch, ApiFootballFixtureStats } from "../../services/football-api/matches.service";
import { Types } from "mongoose";

interface TeamIdMap {
  [apiFootballId: number]: Types.ObjectId;
}

export function determineMatchStage(roundStr: string): "Group Stage" | "Round of 32" | "Round of 16" | "Quarter-Final" | "Semi-Final" | "Third Place" | "Final" {
  const lower = roundStr.toLowerCase();
  if (lower.includes("group")) return "Group Stage";
  if (lower.includes("32")) return "Round of 32";
  if (lower.includes("16")) return "Round of 16";
  if (lower.includes("quarter")) return "Quarter-Final";
  if (lower.includes("semi")) return "Semi-Final";
  if (lower.includes("third")) return "Third Place";
  if (lower.includes("final")) return "Final";
  return "Group Stage"; // Default
}

export function determineMatchStatus(statusShort: string): "scheduled" | "live" | "finished" | "postponed" | "cancelled" {
  switch (statusShort) {
    case "TBD":
    case "NS":
      return "scheduled";
    case "1H":
    case "HT":
    case "2H":
    case "ET":
    case "BT":
    case "P":
    case "SUSP":
    case "INT":
    case "LIVE":
      return "live";
    case "FT":
    case "AET":
    case "PEN":
      return "finished";
    case "PST":
      return "postponed";
    case "CANC":
    case "ABD":
    case "AWD":
    case "WO":
      return "cancelled";
    default:
      return "scheduled";
  }
}

/**
 * Trích xuất stats từ API-Football statistics array
 * Chuyển "54%" -> 54, v.v.
 */
export function parseApiStats(statsArray: Array<{ type: string; value: string | number | null }>) {
  const findValue = (type: string): number => {
    const item = statsArray.find((s) => s.type === type);
    if (!item || item.value === null) return 0;
    if (typeof item.value === "string") {
      return parseFloat(item.value.replace("%", ""));
    }
    return item.value;
  };

  return {
    possession: findValue("Ball Possession"),
    shots: findValue("Total Shots"),
    shotsOnTarget: findValue("Shots on Goal"),
    passAccuracy: findValue("Passes %"),
    corners: findValue("Corner Kicks"),
    fouls: findValue("Fouls"),
    yellowCards: findValue("Yellow Cards"),
    redCards: findValue("Red Cards"),
    xGoals: 0, // Sẽ được cập nhật từ FBref hoặc StatsBomb sau
  };
}

/**
 * Transform data từ API-Football sang payload Mongoose.
 * Bỏ qua nếu team không có trong database (TeamIdMap).
 */
export function transformApiMatchToMongoPayload(
  apiMatch: ApiFootballMatch,
  apiStats: ApiFootballFixtureStats[] | null,
  teamIdMap: TeamIdMap
) {
  const { fixture, league, teams, goals } = apiMatch;

  const homeMongoId = teamIdMap[teams.home.id];
  const awayMongoId = teamIdMap[teams.away.id];

  // Nếu không map được team (ví dụ đội đó chưa được sync vào DB), return null
  if (!homeMongoId || !awayMongoId) {
    return null;
  }

  // Parse Stats nếu có
  let homeStats = null;
  let awayStats = null;

  if (apiStats && apiStats.length === 2) {
    const homeApiStats = apiStats.find((s) => s.team.id === teams.home.id)?.statistics;
    const awayApiStats = apiStats.find((s) => s.team.id === teams.away.id)?.statistics;

    if (homeApiStats) homeStats = parseApiStats(homeApiStats);
    if (awayApiStats) awayStats = parseApiStats(awayApiStats);
  }

  // Lấy Group từ tên vòng bảng, ví dụ "Group Stage - Group A" -> "A"
  let group = null;
  const groupMatch = league.round.match(/Group ([A-L])/i);
  if (groupMatch) {
    group = groupMatch[1].toUpperCase();
  }

  return {
    apiFootballId: fixture.id,
    homeTeamId: homeMongoId,
    awayTeamId: awayMongoId,
    homeScore: goals.home,
    awayScore: goals.away,
    status: determineMatchStatus(fixture.status.short),
    matchDate: new Date(fixture.date),
    stage: determineMatchStage(league.round),
    group,
    venue: fixture.venue.name || "",
    // Chỉ cập nhật stats nếu apiStats không null (bảo tồn xG cũ bằng update strategy)
    ...(homeStats ? { homeStats } : {}),
    ...(awayStats ? { awayStats } : {}),
    lastUpdated: new Date(),
  };
}
