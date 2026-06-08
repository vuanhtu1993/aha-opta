/**
 * API-Football: Matches Service
 */

import { footballClient } from "./client";

export interface ApiFootballMatch {
  fixture: {
    id: number;
    date: string;
    status: {
      short: string; // TBD, NS, 1H, HT, 2H, FT, PEN, CAN, POSTP
      long: string;
    };
    venue: { name: string; city: string };
  };
  league: {
    id: number;
    name: string;
    round: string; // "Group Stage - 1", "Round of 16"...
  };
  teams: {
    home: { id: number; name: string; winner: boolean | null };
    away: { id: number; name: string; winner: boolean | null };
  };
  goals: {
    home: number | null;
    away: number | null;
  };
}

export interface ApiFootballFixtureStats {
  team: { id: number; name: string };
  statistics: Array<{ type: string; value: string | number | null }>;
}

/**
 * Lấy lịch thi đấu và kết quả World Cup.
 */
export async function fetchWorldCupMatches(season = 2022): Promise<ApiFootballMatch[]> {
  const response = await footballClient.get("/fixtures", {
    params: {
      league: 1, // FIFA World Cup
      season: season,
    },
  });

  return response.data.response as ApiFootballMatch[];
}

/**
 * Lấy thống kê chi tiết của một trận đấu (possession, shots, passes...).
 * Yêu cầu: Trận đấu phải đang đá (live) hoặc đã kết thúc.
 */
export async function fetchMatchStats(fixtureId: number): Promise<ApiFootballFixtureStats[]> {
  const response = await footballClient.get("/fixtures/statistics", {
    params: {
      fixture: fixtureId,
    },
  });

  return response.data.response as ApiFootballFixtureStats[];
}
