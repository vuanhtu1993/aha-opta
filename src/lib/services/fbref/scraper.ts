/**
 * FBref Scraper (Phase 2b)
 *
 * Scrape xG (Expected Goals) từ FBref cho các trận live.
 *
 * Lưu ý:
 * - Dùng Playwright với stealth pattern để bypass basic protections
 * - Rate limit strict: Phải sleep giữa các requests (>= 10s)
 * - Tôn trọng robots.txt
 */

import { chromium } from "playwright";

export interface FbrefMatchXg {
  homeTeam: string;
  awayTeam: string;
  homeXg: number;
  awayXg: number;
  date: string;
}

/**
 * Scrape bảng "Scores & Fixtures" của một giải đấu trên FBref
 * URL ví dụ: https://fbref.com/en/comps/1/schedule/World-Cup-Scores-and-Fixtures
 */
export async function scrapeFbrefXg(url: string): Promise<FbrefMatchXg[]> {
  console.log(`[FBref Scraper] Đang khởi động trình duyệt...`);
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    userAgent:
      "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36",
    viewport: { width: 1280, height: 800 },
  });

  const page = await context.newPage();
  const results: FbrefMatchXg[] = [];

  try {
    console.log(`[FBref Scraper] Điều hướng đến: ${url}`);
    await page.goto(url, { waitUntil: "domcontentloaded", timeout: 30000 });

    // FBref có thể hiện bảng đồng ý cookies
    try {
      const cookieBtn = await page.locator("button.qc-cmp2-summary-buttons").first();
      if (await cookieBtn.isVisible()) {
        await cookieBtn.click();
      }
    } catch (e) {
      // Ignore if no cookie banner
    }

    // Đợi bảng scores load
    await page.waitForSelector("table.stats_table tbody tr", { timeout: 15000 });

    // Parse từng hàng trong bảng
    const rows = await page.locator("table.stats_table tbody tr").all();

    for (const row of rows) {
      // Bỏ qua các hàng trống (e.g. spacer rows giữa các vòng đấu)
      const hasClass = await row.getAttribute("class");
      if (hasClass && (hasClass.includes("spacer") || hasClass.includes("thead"))) {
        continue;
      }

      const dateStr = await row.locator("[data-stat='date']").innerText();
      const homeTeam = await row.locator("[data-stat='home_team']").innerText();
      const awayTeam = await row.locator("[data-stat='away_team']").innerText();
      const homeXgText = await row.locator("[data-stat='home_xg']").innerText();
      const awayXgText = await row.locator("[data-stat='away_xg']").innerText();

      // Nếu trận chưa đá hoặc không có xG data, FBref thường để trống
      if (homeTeam && awayTeam && homeXgText && awayXgText) {
        const homeXg = parseFloat(homeXgText);
        const awayXg = parseFloat(awayXgText);

        if (!isNaN(homeXg) && !isNaN(awayXg)) {
          results.push({
            date: dateStr.trim(),
            homeTeam: homeTeam.trim(),
            awayTeam: awayTeam.trim(),
            homeXg,
            awayXg,
          });
        }
      }
    }

    console.log(`[FBref Scraper] Lấy thành công ${results.length} trận có xG data.`);
    return results;
  } catch (error) {
    console.error("[FBref Scraper] Lỗi trong quá trình scraping:", error);
    throw error;
  } finally {
    await browser.close();
  }
}
