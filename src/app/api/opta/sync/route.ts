/**
 * API Route: /api/opta/sync
 *
 * Webhook/Endpoint để kích hoạt ETL process (từ Vercel Cron hoặc thủ công).
 * Phương thức: POST
 * Headers: Authorization: Bearer <CRON_SECRET>
 * Body: { "type": "teams" | "matches" | "all", "season": 2022, "scrapeXg": false }
 */

import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db/mongoose";
import { syncTeamsETL, syncMatchesETL } from "@/lib/etl/sync";
import { RateLimitError } from "@/lib/services/football-api/client";

export async function POST(request: NextRequest) {
  // 1. Kiểm tra Security
  const authHeader = request.headers.get("authorization");
  const secret = process.env.CRON_SECRET;

  if (!secret) {
    return NextResponse.json({ error: "Server misconfiguration: CRON_SECRET is missing." }, { status: 500 });
  }

  if (authHeader !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // 2. Lấy params từ body (fallback nếu không có)
  let type = "all";
  let season = 2022; // Default WC 2022 (đổi thành 2026 khi API có data)
  let scrapeXg = false;

  try {
    const body = await request.json();
    if (body.type) type = body.type;
    if (body.season) season = parseInt(body.season, 10);
    if (body.scrapeXg) scrapeXg = !!body.scrapeXg;
  } catch (e) {
    // Body is optional
  }

  // 3. Thực thi ETL
  try {
    await connectDB();

    const results: Record<string, unknown> = {};

    if (type === "teams" || type === "all") {
      const teamCount = await syncTeamsETL(season);
      results.teamsSynced = teamCount;
    }

    if (type === "matches" || type === "all") {
      const matchResult = await syncMatchesETL(season, scrapeXg);
      results.matchesSynced = matchResult;
    }

    return NextResponse.json({
      success: true,
      message: "ETL Sync hoàn tất.",
      results,
    });
  } catch (error) {
    console.error("[API/Sync] ETL Lỗi:", error);
    
    if (error instanceof RateLimitError) {
      return NextResponse.json({ success: false, error: "Rate Limit Exceeded", message: error.message }, { status: 429 });
    }

    return NextResponse.json({
      success: false,
      error: "Internal Error",
      message: error instanceof Error ? error.message : "Unknown",
    }, { status: 500 });
  }
}
