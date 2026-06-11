/**
 * POST /api/opta/matches/autofetch
 *
 * Tự động thu thập kết quả trận đấu từ internet bằng Gemini (Google Search grounding).
 *
 * Trade-off kỹ thuật quan trọng:
 * → searchGrounding=true KHÔNG tương thích với withStructuredOutput() trong @langchain/google-genai
 *   Lý do: Search grounding thay đổi nội bộ cách Gemini xử lý output, xung đột với schema enforcement
 * → Giải pháp: 2-step approach
 *   Step 1: Gemini + Search grounding → raw text (tìm kết quả)
 *   Step 2: Gemini không grounding + withStructuredOutput → parse text ra JSON chuẩn
 */

import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db/mongoose";
import { Match } from "@/lib/db/models/Match";
import { Team } from "@/lib/db/models/Team";
import { ChatGoogleGenerativeAI } from "@langchain/google-genai";
import { z } from "zod";

// ─── Schema kết quả trả về ────────────────────────────────────────────────────

const MatchResultSchema = z.object({
  played: z.boolean().describe("Trận đấu đã diễn ra chưa. false nếu chưa đến ngày hoặc chưa có kết quả."),
  message: z.string().optional().describe("Thông báo nếu trận chưa diễn ra hoặc không tìm thấy thông tin."),
  homeScore: z.number().int().min(0).optional().describe("Số bàn thắng của đội chủ nhà"),
  awayScore: z.number().int().min(0).optional().describe("Số bàn thắng của đội khách"),
  homeXG: z.number().min(0).optional().describe("Expected Goals (xG) của đội chủ nhà"),
  awayXG: z.number().min(0).optional().describe("Expected Goals (xG) của đội khách"),
  homePossession: z.number().min(0).max(100).optional().describe("% kiểm soát bóng của đội chủ nhà"),
  homeShots: z.number().int().min(0).optional().describe("Tổng số cú sút của đội chủ nhà"),
  awayShots: z.number().int().min(0).optional().describe("Tổng số cú sút của đội khách"),
  homeSOT: z.number().int().min(0).optional().describe("Số cú sút trúng đích của đội chủ nhà"),
  awaySOT: z.number().int().min(0).optional().describe("Số cú sút trúng đích của đội khách"),
  homePassAccuracy: z.number().int().min(50).max(100).optional().describe("% chính xác chuyền bóng của đội chủ nhà"),
  awayPassAccuracy: z.number().int().min(50).max(100).optional().describe("% chính xác chuyền bóng của đội khách"),
  source: z.string().optional().describe("Tên nguồn dữ liệu (ví dụ: 'BBC Sport', 'SofaScore', 'FBref')"),
  confidence: z.enum(["high", "medium", "low"]).describe("Mức độ tin cậy của kết quả"),
});

export type AutoFetchResult = z.infer<typeof MatchResultSchema>;

// ─── Route Handler ─────────────────────────────────────────────────────────────

export async function POST(request: NextRequest) {
  try {
    await connectDB();

    const { matchId } = await request.json();
    if (!matchId) {
      return NextResponse.json({ success: false, error: "Missing matchId" }, { status: 400 });
    }

    // 1. Lấy thông tin trận đấu từ DB
    const match = await Match.findById(matchId).lean();
    if (!match) {
      return NextResponse.json({ success: false, error: "Match not found" }, { status: 404 });
    }

    const [homeTeam, awayTeam] = await Promise.all([
      Team.findById(match.homeTeamId).select("name shortName").lean(),
      Team.findById(match.awayTeamId).select("name shortName").lean(),
    ]);

    if (!homeTeam || !awayTeam) {
      return NextResponse.json({ success: false, error: "Team info not found" }, { status: 404 });
    }

    // 2. Kiểm tra sớm: trận chưa diễn ra → không cần gọi AI
    const matchDate = new Date(match.matchDate);
    const now = new Date();

    if (matchDate > now) {
      return NextResponse.json({
        success: true,
        data: {
          played: false,
          confidence: "high" as const,
          message: `Trận đấu ${homeTeam.name} vs ${awayTeam.name} sẽ diễn ra vào ${matchDate.toLocaleDateString("vi-VN", {
            weekday: "long",
            year: "numeric",
            month: "long",
            day: "numeric",
          })}. Chưa có kết quả.`,
        },
      });
    }

    const modelName = process.env.GEMINI_MODEL || "gemini-2.5-flash";
    const dateStr = matchDate.toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" });

    // ── Step 1: Search grounding — Tìm kết quả trận đấu từ internet ──────────
    // searchGrounding=true KHÔNG tương thích withStructuredOutput → dùng text output
    // Type cast vì @langchain/google-genai types chưa export searchGrounding trong interface public
    const searchLlm = new ChatGoogleGenerativeAI({ model: modelName, temperature: 0, searchGrounding: true } as any);


    const searchPrompt = `Find the final match result for this football game:
Match: ${homeTeam.name} vs ${awayTeam.name}
Date: ${dateStr}
Competition: FIFA World Cup 2026

Return the information you find including:
- Final score (home team score - away team score)
- Ball possession percentage (if available)  
- Total shots (if available)
- Shots on target (if available)
- Expected goals xG (if available from FBref, Understat, or SofaScore)
- Pass accuracy % (if available)
- The source/website where you found this data

If the match has not been played yet or results are unavailable, clearly state that.`;

    const searchResponse = await searchLlm.invoke(searchPrompt);
    const rawContent = typeof searchResponse.content === "string"
      ? searchResponse.content
      : JSON.stringify(searchResponse.content);

    console.log(`[AutoFetch] Step 1 Search kết quả (${rawContent.length} chars): ${rawContent.substring(0, 200)}...`);

    // ── Step 2: Parse — Dùng Gemini thứ 2 extract JSON chuẩn từ raw text ─────
    const parseLlm = new ChatGoogleGenerativeAI({ model: modelName, temperature: 0 });
    const parserLlm = parseLlm.withStructuredOutput(MatchResultSchema);

    const parsePrompt = `Based on the following search results about a football match, extract the information into a structured format.

Match being searched: ${homeTeam.name} (home) vs ${awayTeam.name} (away) on ${dateStr}

Search results:
---
${rawContent}
---

Instructions:
- If the search results clearly show the match has been played with a confirmed score, set played=true and extract the score.
- If the match has NOT happened yet, or results are unclear/not found, set played=false.
- Only include statistics (xG, possession, shots) if they are EXPLICITLY mentioned in the search results.
- Set confidence: "high" if from official sources (BBC, FIFA, major sports sites), "medium" if from reliable fan sites, "low" if uncertain.
- homeScore is the score of "${homeTeam.name}", awayScore is the score of "${awayTeam.name}".`;

    const result = await parserLlm.invoke(parsePrompt);

    console.log(`[AutoFetch] Step 2 Parse: played=${result.played}, score=${result.homeScore}-${result.awayScore}, confidence=${result.confidence}`);

    return NextResponse.json({ success: true, data: result });

  } catch (error) {
    console.error("[API] POST /api/opta/matches/autofetch error:", error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : "Internal server error" },
      { status: 500 }
    );
  }
}
