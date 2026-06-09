# Kế hoạch Thực hiện: Web Scraper Agent cho WC 2026

Mục tiêu: Xây dựng hệ thống crawl dữ liệu thực tế từ web để bổ sung dữ liệu phân tích AI thay thế cho API-Football (free plan bị hạn chế). Toàn bộ stack giữ nguyên TypeScript, không thêm Python microservice.

---

## Kiến trúc Tổng thể

```
┌──────────────────────────────────────────────────────┐
│                  Next.js App (Vercel)                │
│                                                      │
│  /apps/opta/sync ──► /api/opta/scrape/elo            │
│     (UI Button)       (fetch + cheerio)              │
│                           │                          │
│                    eloratings.net                    │
│                    (HTML tĩnh, không JS)              │
└──────────────────────────┬───────────────────────────┘
                           │ upsert
                    MongoDB Atlas
                           │
┌──────────────────────────┴───────────────────────────┐
│            Scripts Local / GitHub Actions            │
│                                                      │
│  scripts/crawl-fbref.ts  (playwright npm)            │
│  scripts/crawl-h2h.ts    (playwright npm)            │
│     │                                                │
│  fbref.com, sofascore.com (JS render)                │
└──────────────────────────────────────────────────────┘
```

**Phân công rõ ràng:**

| Layer | Công cụ | Target | Deploy |
|---|---|---|---|
| **Vercel Route** | `fetch` + `cheerio` | `eloratings.net` | ✅ Vercel |
| **Local Script** | `playwright` (npm) | `fbref.com` | 🖥️ Dev Machine / GitHub Actions |

---

## Phase 1 — Vercel-Native: Crawl Elo từ `eloratings.net`

### Mục tiêu
Bổ sung `eloRating` vào Team document để Market Signal Node có thêm tín hiệu định lượng chất lượng thực sự của mỗi đội.

### Phân tích `eloratings.net`

`eloratings.net` dùng HTML bảng cổ điển (table), **không render bằng JavaScript**. Có thể `fetch()` trực tiếp từ Vercel serverless mà không cần browser.

**URL target:**
- `https://www.eloratings.net/World` → Bảng xếp hạng Elo tất cả đội hiện tại
- `https://www.eloratings.net/en/World/{team-slug}/matches` → Lịch sử trận đấu (H2H data)

**Data sẽ trích xuất:**
```json
{
  "team": "Brazil",
  "eloRating": 2083,
  "eloRank": 1,
  "recentEloChange": +12
}
```

---

### 1.1 — Database: Bổ sung trường `eloRating`

#### [MODIFY] [Team.ts](file:///Users/anhtus/Documents/Development/NextJS/aha-tools/src/lib/db/models/Team.ts)

Thêm 2 trường mới vào `ITeam` interface và `TeamSchema`:
```typescript
eloRating: number;       // Hệ số Elo hiện tại (ví dụ: 2083)
eloRank: number;         // Thứ hạng Elo toàn cầu (không phải FIFA)
eloLastSynced: Date;     // Thời điểm crawl lần cuối
```

> [!NOTE]
> **Tại sao Elo khác FIFA Ranking?**
> FIFA Ranking dùng thuật toán điểm tích lũy có gia trọng theo giải đấu → bias với đội chơi nhiều. Elo là zero-sum, phản ánh sức mạnh tương đối chính xác hơn trong head-to-head prediction.

---

### 1.2 — Scraper Service

#### [NEW] [elo-scraper.ts](file:///Users/anhtus/Documents/Development/NextJS/aha-tools/src/lib/services/elo-scraper.ts)

```typescript
// Hàm chính: Lấy bảng xếp hạng Elo hiện tại cho 48 đội WC 2026
export async function scrapeEloRatings(teamSlugs: string[]): Promise<EloResult[]>

// Mapping: tên đội trên eloratings.net → slug trong MongoDB
// Cần vì tên có thể khác: "USA" vs "United States", "Iran" vs "IR Iran"
export const ELO_TEAM_NAME_MAP: Record<string, string>
```

**Công nghệ:** `node-fetch` (native trong Next.js) + `cheerio` (HTML parser)

**Cần install:**
```bash
pnpm add cheerio
pnpm add -D @types/cheerio
```

---

### 1.3 — API Route

#### [NEW] [route.ts](file:///Users/anhtus/Documents/Development/NextJS/aha-tools/src/app/api/opta/scrape/elo/route.ts)

```
POST /api/opta/scrape/elo
Authorization: Bearer opta-2026
```

**Logic:**
1. Lấy tất cả teams từ MongoDB (`Team.find({ group: { $exists: true } })`)
2. Gọi `scrapeEloRatings(teamSlugs)`
3. Upsert `eloRating`, `eloRank`, `eloLastSynced` vào từng Team document
4. Trả về: `{ synced: 48, failed: 0, data: [...] }`

**Trade-off Vercel timeout:**
- Crawl 1 trang duy nhất (`/World`) lấy tất cả đội → ~3-5s → an toàn trong giới hạn 10s (Hobby) / 60s (Pro)
- Không crawl từng trang riêng lẻ (sẽ hết timeout)

---

### 1.4 — UI Sync Panel

#### [MODIFY] [page.tsx](file:///Users/anhtus/Documents/Development/NextJS/aha-tools/src/app/apps/opta/sync/page.tsx)

Thêm card mới **"Sync Elo Ratings"** vào grid (hiện có 3 cards):
- Icon: `TrendingUp` (lucide)
- Badge: `"Vercel Native"` màu xanh lá
- Description: Crawl hệ số Elo từ eloratings.net, cập nhật 48 đội WC 2026
- Button: Gọi `POST /api/opta/scrape/elo`

---

### 1.5 — Tích hợp vào AI Agent

#### [MODIFY] [market-signal.node.ts](file:///Users/anhtus/Documents/Development/NextJS/aha-tools/src/lib/ai/opta-agent/nodes/market-signal.node.ts)

Bổ sung `eloRating` vào signal tính toán:
```typescript
// Hiện tại: chỉ dùng fifaRanking
// Sau khi cải tiến: dùng cả eloRating + fifaRanking
const eloDiff = homeTeam.eloRating - awayTeam.eloRating;
// eloDiff > 100 → home team mạnh hơn rõ ràng
// Ánh xạ eloDiff → probability adjustment theo công thức Elo chuẩn
```

---

## Phase 2 — Local Script: Crawl xG từ `fbref.com`

> [!IMPORTANT]
> Phase 2 chạy bằng script TypeScript cục bộ (`pnpm tsx`), **không deploy lên Vercel**. Phù hợp để crawl sau mỗi matchday khi WC 2026 đang diễn ra.

### 2.1 — Cài đặt Playwright (npm)

```bash
pnpm add -D playwright
pnpm exec playwright install chromium
```

### 2.2 — Script Crawler

#### [NEW] [crawl-fbref.ts](file:///Users/anhtus/Documents/Development/NextJS/aha-tools/scripts/crawl-fbref.ts)

**LangGraph workflow (TypeScript):**

```
Dispatcher Node  →  Scraper Node  →  Parser Node  →  Quality Check  →  Ingestion Node
(Đọc match list    (Playwright      (Cheerio +        (Validate       (Upsert vào
 từ MongoDB)        navigate)        regex extract)     schema)          MongoDB)
```

**Data crawl từ fbref.com:**
```typescript
interface FbrefMatchStats {
  matchId: string;      // Khớp với apiFootballId trong MongoDB
  homeXg: number;       // xG thực từ StatsBomb event data
  awayXg: number;
  homePossession: number;
  homeShots: number;
  homeShotsOnTarget: number;
  // ... tương tự cho away
}
```

**Anti-bot measures:**
```typescript
// Rotate User-Agent
const userAgents = ['Mozilla/5.0 ...Chrome...', 'Mozilla/5.0 ...Firefox...'];
// Random delay giữa requests: 2-5 giây
await page.waitForTimeout(Math.random() * 3000 + 2000);
// Tắt webdriver fingerprint
await page.addInitScript(() => { delete navigator.webdriver; });
```

### 2.3 — package.json scripts

```json
{
  "scripts": {
    "crawl:elo": "tsx scripts/crawl-elo.ts",
    "crawl:fbref": "tsx scripts/crawl-fbref.ts",
    "crawl:all": "pnpm crawl:elo && pnpm crawl:fbref"
  }
}
```

---

## Open Questions

> [!IMPORTANT]
> **Vấn đề tên đội bóng (Name Mapping)**
> `eloratings.net` dùng tên tiếng Anh đôi khi khác với WC 2026 official:
> - "USA" → "United States" ✓ hay "USA" ✓?
> - "IR Iran" → "Iran"?
> - "Republic of Ireland" → "Ireland"?
>
> Cần xây dựng mapping table thủ công trong code. Tôi sẽ handle việc này trong lúc implement.

> [!NOTE]
> **Về fbref.com cho WC 2026**
> fbref.com có data WC 2026 **chỉ sau khi trận đã diễn ra** (thường cập nhật sau 2-3 ngày). Phase 2 nên được chạy thủ công sau mỗi matchday, không phải realtime.

---

## Thứ tự Thực hiện

| Bước | Task | Thời gian ước tính |
|---|---|---|
| 1 | Cài `cheerio`, cập nhật Team schema | 10 phút |
| 2 | Viết `elo-scraper.ts` + test local | 30 phút |
| 3 | Tạo API route `/api/opta/scrape/elo` | 20 phút |
| 4 | Cập nhật Sync UI + market-signal.node.ts | 20 phút |
| 5 | Cài `playwright`, viết `crawl-fbref.ts` | 45 phút |
| 6 | Test end-to-end: Sync Elo → Predict | 15 phút |

---

## Verification Plan

### Phase 1 (Vercel Route)
```bash
# Test crawl Elo
curl -X POST http://localhost:3000/api/opta/scrape/elo \
  -H "Authorization: Bearer opta-2026" \
  -H "Content-Type: application/json"

# Kỳ vọng: { synced: 48, failed: 0 }
# Verify: MongoDB team "Brazil" có eloRating > 2000
```

### Phase 2 (Local Script)
```bash
pnpm crawl:fbref
# Kỳ vọng: Update homeStats.xGoals, awayStats.xGoals cho các trận "finished"
# Verify: Match.xgSource === "fbref"
```

### AI Integration
- Chạy `/api/opta/predict` cho một cặp đấu sau khi đã có Elo data
- Xác nhận `marketSignal` trong response có sử dụng `eloDiff` (không còn chỉ fifaRanking)

---

*Made by Anh Tu - Share to be share*
