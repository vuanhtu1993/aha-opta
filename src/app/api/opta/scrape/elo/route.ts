/**
 * API Route: POST /api/opta/scrape/elo
 *
 * Kích hoạt crawl hệ số Elo từ eloratings.net và cập nhật vào MongoDB.
 *
 * Tại sao tách thành route riêng (không gộp vào /api/opta/sync)?
 * → Single Responsibility: /sync xử lý API-Football, /scrape/elo xử lý web scraping
 * → Dễ debug độc lập, dễ thêm rate limit riêng sau này
 *
 * Security: Dùng cùng CRON_SECRET với /api/opta/sync để nhất quán
 */

import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db/mongoose";
import { Team } from "@/lib/db/models/Team";
import { scrapeEloRatings } from "@/lib/services/elo-scraper";
import { bootstrapStatsFromEloHistory } from "@/lib/etl/stats-calculator";

export async function POST(request: NextRequest) {
  // ─── 1. Auth ─────────────────────────────────────────────────────────────
  const authHeader = request.headers.get("authorization");
  const secret = process.env.CRON_SECRET;

  if (!secret) {
    return NextResponse.json(
      { error: "Server misconfiguration: CRON_SECRET is missing." },
      { status: 500 }
    );
  }

  if (authHeader !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // ─── 2. Scrape & Upsert ───────────────────────────────────────────────────
  try {
    await connectDB();

    // Bước 1: Crawl eloratings.net
    const eloData = await scrapeEloRatings();

    if (eloData.length === 0) {
      return NextResponse.json(
        {
          error: "Scraper không tìm thấy dữ liệu Elo nào. Có thể HTML structure đã thay đổi.",
          tip: "Kiểm tra log server để xem raw HTML từ eloratings.net",
        },
        { status: 422 }
      );
    }

    // Bước 2: Upsert vào MongoDB theo slug
    // Dùng Promise.allSettled để không bị lỗi vì 1 team bị miss
    const now = new Date();
    const upsertResults = await Promise.allSettled(
      eloData.map((team) =>
        Team.findOneAndUpdate(
          { slug: team.slug },
          {
            $set: {
              eloRating: team.eloRating,
              eloRank: team.eloRank,
              recentEloMatches: team.recentEloMatches,
              eloLastSynced: now,
              lastUpdated: now,
            },
          },
          {
            new: true,
            // Không tạo mới nếu slug không tồn tại — chỉ update
            upsert: false,
          }
        )
      )
    );

    // Bước 3: Thống kê kết quả
    const synced: string[]  = [];
    const failed: string[]  = [];
    const notFound: string[] = [];

    upsertResults.forEach((result, index) => {
      const teamName = eloData[index].teamName;
      if (result.status === "rejected") {
        failed.push(teamName);
      } else if (result.value === null) {
        // findOneAndUpdate trả về null → slug không tồn tại trong DB
        notFound.push(teamName);
      } else {
        synced.push(teamName);
      }
    });

    console.log(`[EloScraper] Hoàn thành: ${synced.length} synced, ${notFound.length} not found, ${failed.length} failed`);

    // ── Bước 4: Auto-bootstrap stats từ Elo history ────────────────────────
    // Chạy ngay sau khi có recentEloMatches mới → UI hiển thị Phong độ luôn
    let bootstrapResult = { bootstrapped: 0, skipped: 0 };
    if (synced.length > 0) {
      try {
        bootstrapResult = await bootstrapStatsFromEloHistory();
        console.log(`[EloScraper] Bootstrap stats: ${bootstrapResult.bootstrapped} đội cập nhật.`);
      } catch (bsErr) {
        // Không fail toàn bộ request nếu bootstrap lỗi
        console.error("[EloScraper] Bootstrap stats thất bại:", bsErr);
      }
    }

    return NextResponse.json({
      success: true,
      message: `Đã cập nhật Elo cho ${synced.length}/${eloData.length} đội WC 2026`,
      results: {
        synced: synced.length,
        notFound: notFound.length,  // Slug trong DB khác với ELO_TEAM_MAP → cần cập nhật map
        failed: failed.length,
        syncedTeams: synced,
        notFoundTeams: notFound,    // Log để debug tên đội bị miss
        statsBootstrapped: bootstrapResult.bootstrapped,
      },
      scrapedAt: now.toISOString(),
    });
  } catch (error: any) {
    console.error("[EloScraper] Lỗi nghiêm trọng:", error);
    return NextResponse.json(
      {
        error: "Scraper failed",
        message: error?.message || String(error),
      },
      { status: 500 }
    );
  }
}
