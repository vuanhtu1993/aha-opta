/**
 * POST /api/opta/matches/autofetch
 *
 * Tự động thu thập kết quả trận đấu:
 * 1. Lấy Tỷ số & Kiểm soát bóng trực tiếp từ FIFA API (Nhanh & Chính xác 100%)
 * 2. Lấy các chỉ số nâng cao (xG, Shots, Pass Accuracy) bằng Gemini Search Grounding
 */

import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db/mongoose";
import { Match } from "@/lib/db/models/Match";
import { Team } from "@/lib/db/models/Team";
import { ChatGoogleGenerativeAI } from "@langchain/google-genai";
import { z } from "zod";

export interface AutoFetchResult {
  played: boolean;
  message?: string;
  homeScore?: number;
  awayScore?: number;
  homeXG?: number;
  awayXG?: number;
  homePossession?: number;
  homeShots?: number;
  awayShots?: number;
  homeSOT?: number;
  awaySOT?: number;
  homePassAccuracy?: number;
  awayPassAccuracy?: number;
  source?: string;
  confidence: "high" | "medium" | "low";
}

// Schema cho phần Gemini parse
const AdvancedStatsSchema = z.object({
  homeXG: z.number().min(0).optional().describe("Expected Goals (xG) của đội chủ nhà"),
  awayXG: z.number().min(0).optional().describe("Expected Goals (xG) của đội khách"),
  homeShots: z.number().int().min(0).optional().describe("Tổng số cú sút của đội chủ nhà"),
  awayShots: z.number().int().min(0).optional().describe("Tổng số cú sút của đội khách"),
  homeSOT: z.number().int().min(0).optional().describe("Số cú sút trúng đích của đội chủ nhà"),
  awaySOT: z.number().int().min(0).optional().describe("Số cú sút trúng đích của đội khách"),
  homePassAccuracy: z.number().int().min(50).max(100).optional().describe("% chính xác chuyền bóng của đội chủ nhà"),
  awayPassAccuracy: z.number().int().min(50).max(100).optional().describe("% chính xác chuyền bóng của đội khách"),
  source: z.string().optional().describe("Nguồn lấy dữ liệu nâng cao (ví dụ: FBref, SofaScore)"),
});

export async function POST(request: NextRequest) {
    try {
    const isReadOnly = process.env.NEXT_PUBLIC_READ_ONLY_MODE === "true";
    if (isReadOnly) {
      return NextResponse.json({ success: false, error: "Hệ thống đang ở chế độ Read-Only" }, { status: 403 });
    }

try {
    await connectDB();

    const { matchId } = await request.json();
    if (!matchId) {
      return NextResponse.json({ success: false, error: "Missing matchId" }, { status: 400 });
    }

    const match = await Match.findById(matchId).lean();
    if (!match) {
      return NextResponse.json({ success: false, error: "Match not found" }, { status: 404 });
    }

    const matchDate = new Date(match.matchDate);
    const now = new Date();

    if (matchDate > now) {
      return NextResponse.json({
        success: true,
        data: {
          played: false,
          confidence: "high",
          message: "Trận đấu chưa diễn ra.",
        } as AutoFetchResult,
      });
    }

    if (!match.fifaUrl) {
      return NextResponse.json({ success: false, error: "Trận đấu chưa có link FIFA (fifaUrl) để lấy dữ liệu." }, { status: 400 });
    }

    // ── Bước 1: Fetch Tỷ số từ FIFA API ──────────────────────────────────────────
    const urlParts = match.fifaUrl.split("/");
    const idMatch = urlParts[urlParts.length - 1];
    const idStage = urlParts[urlParts.length - 2];
    const idSeason = urlParts[urlParts.length - 3];
    const idCompetition = urlParts[urlParts.length - 4];

    const apiUrl = `https://api.fifa.com/api/v3/live/football/${idCompetition}/${idSeason}/${idStage}/${idMatch}?language=en`;
    console.log(`[AutoFetch] Đang lấy dữ liệu từ FIFA API: ${apiUrl}`);
    
    const res = await fetch(apiUrl, { headers: { "Accept": "application/json" } });
    if (!res.ok) {
      return NextResponse.json({ success: false, error: "Không thể kết nối đến FIFA API" }, { status: 502 });
    }

    const data = await res.json();
    
    if (data.MatchStatus === 1 || data.HomeTeam?.Score === null || data.HomeTeam?.Score === undefined) {
      return NextResponse.json({
        success: true,
        data: {
          played: false,
          confidence: "high",
          message: "Trận đấu chưa bắt đầu hoặc chưa có kết quả trên hệ thống FIFA.",
        } as AutoFetchResult,
      });
    }

    const homeScore = data.HomeTeam?.Score ?? 0;
    const awayScore = data.AwayTeam?.Score ?? 0;
    let homePossession = 50;
    if (data.BallPossession && data.BallPossession.OverallHome) {
      homePossession = Math.round(data.BallPossession.OverallHome);
    }

    const resultData: AutoFetchResult = {
      played: true,
      confidence: "high",
      source: "FIFA Official API",
      homeScore,
      awayScore,
      homePossession,
    };

    // ── Bước 2: Dùng Gemini bổ sung các chỉ số nâng cao (Shots, xG) ─────────────
    try {
      const [homeTeam, awayTeam] = await Promise.all([
        Team.findById(match.homeTeamId).select("name").lean(),
        Team.findById(match.awayTeamId).select("name").lean(),
      ]);

      if (homeTeam && awayTeam) {
        console.log(`[AutoFetch] Đang dùng AI Agent tìm kiếm các chỉ số nâng cao cho trận đấu...`);
        const modelName = process.env.GEMINI_MODEL || "gemini-2.5-flash";
        const dateStr = matchDate.toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" });
        
        // Search Grounding
        const searchLlm = new ChatGoogleGenerativeAI({ model: modelName, temperature: 0, searchGrounding: true } as any);
        const searchPrompt = `Find detailed match statistics for this football game:
Match: ${homeTeam.name} vs ${awayTeam.name}
Date: ${dateStr}
Final Score was: ${homeScore} - ${awayScore}

Search and return ONLY these specific advanced statistics:
- Total shots for both teams
- Shots on target for both teams
- Expected goals (xG) for both teams
- Pass accuracy % for both teams

Include the source website. If a stat cannot be found, omit it.`;

        const searchResponse = await searchLlm.invoke(searchPrompt);
        const rawContent = typeof searchResponse.content === "string" ? searchResponse.content : JSON.stringify(searchResponse.content);

        // Parsing
        const parseLlm = new ChatGoogleGenerativeAI({ model: modelName, temperature: 0 });
        const parserLlm = parseLlm.withStructuredOutput(AdvancedStatsSchema);
        const parsePrompt = `Based on the search results, extract the advanced statistics.
Match: ${homeTeam.name} (home) vs ${awayTeam.name} (away)

Search results:
${rawContent}

Only extract stats if they are clearly mentioned. Do not guess.`;

        const advancedStats = await parserLlm.invoke(parsePrompt);
        
        console.log(`[AutoFetch] Advanced Stats from AI:`, advancedStats);

        // Merge data
        if (advancedStats.homeXG !== undefined) resultData.homeXG = advancedStats.homeXG;
        if (advancedStats.awayXG !== undefined) resultData.awayXG = advancedStats.awayXG;
        if (advancedStats.homeShots !== undefined) resultData.homeShots = advancedStats.homeShots;
        if (advancedStats.awayShots !== undefined) resultData.awayShots = advancedStats.awayShots;
        if (advancedStats.homeSOT !== undefined) resultData.homeSOT = advancedStats.homeSOT;
        if (advancedStats.awaySOT !== undefined) resultData.awaySOT = advancedStats.awaySOT;
        if (advancedStats.homePassAccuracy !== undefined) resultData.homePassAccuracy = advancedStats.homePassAccuracy;
        if (advancedStats.awayPassAccuracy !== undefined) resultData.awayPassAccuracy = advancedStats.awayPassAccuracy;
        if (advancedStats.source) resultData.source += ` & ${advancedStats.source}`;
        
        console.log(`[AutoFetch] Đã merge thành công các chỉ số nâng cao từ AI. ResultData:`, resultData);
      }
    } catch (aiError) {
      console.warn(`[AutoFetch] AI Agent failed to fetch advanced stats. Continuing with basic FIFA stats.`, aiError);
    }

    return NextResponse.json({
      success: true,
      data: resultData,
    });

  } catch (error) {
    console.error("[API] POST /api/opta/matches/autofetch error:", error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : "Internal server error" },
      { status: 500 }
    );
  }
}
