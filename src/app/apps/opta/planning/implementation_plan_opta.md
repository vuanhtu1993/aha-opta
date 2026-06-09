# Implementation Plan: aha-opta — World Cup 2026 AI Evaluator

Xây dựng micro-app **aha-opta** trong hệ sinh thái **aha-tools** — một AI Agent workflow thông minh để đánh giá và dự đoán kết quả các trận đấu World Cup 2026.

---

## Tech Stack đã xác định

| Layer | Technology | Lý do chọn |
|---|---|---|
| Framework | Next.js 16 + TypeScript | Existing |
| Styling | TailwindCSS v4 + shadcn/ui | Existing |
| Database | MongoDB Atlas | Existing cluster |
| ODM | **Mongoose** | Quen thuộc, mature |
| AI Reasoning | **LangGraph.js** + Gemini Flash | Agent workflow |
| Football Data | **API-Football** (api-football.com) | Free tier |
| News Data | **NewsAPI.org** | Free tier, morale node |
| Charts | **Recharts** | React-native, nhẹ |
| Data Fetching | **SWR** | Vercel-native, đơn giản |
| Job Scheduling | Vercel Cron Jobs | Built-in với Vercel |

---

## Quyết định Kiến trúc đã cập nhật

### 🎯 Vấn đề 1: Nguồn xG thực — Ưu tiên độ chính xác

> [!IMPORTANT]
> **Hướng giải quyết: Hybrid 2 tầng (không dùng heuristic)**
>
> Vì bạn muốn **độ chính xác**, mình sẽ dùng dữ liệu xG đã được xác thực từ nguồn uy tín thay vì tính gần đúng.

#### Tầng 1: StatsBomb Open Data (Historical xG — xác thực 100%)
- **Nguồn**: [github.com/statsbomb/open-data](https://github.com/statsbomb/open-data)
- **Có sẵn**: WC 2022 đầy đủ, qualifiers UEFA/CONMEBOL một phần
- **Format**: JSON event-level, có `shot.statsbomb_xg` field cho từng cú sút
- **Cách dùng**: Chạy **seed script một lần** để tải về và parse vào MongoDB
- **Attribution**: Bắt buộc credit StatsBomb (thêm vào footer UI)

```typescript
// scripts/seed-statsbomb.ts — Chạy 1 lần khi setup
// Tải competitions.json → filter World Cup → tải từng match event
// Parse shots → sum xg per team per match → upsert vào Match collection
const WC2022_COMPETITION_ID = 43;
const WC2022_SEASON_ID = 106;
```

#### Tầng 2: FBref Scraping (WC 2026 Live xG — khi tournament đang diễn ra)
- **Nguồn**: `fbref.com/en/comps/1/World-Cup-Stats`
- **Có**: xG column trong Scores & Fixtures table
- **Cách dùng**: Playwright headless scraper (vì FBref có Cloudflare)
- **Frequency**: Sau mỗi trận (cron hoặc trigger thủ công)
- **Trade-off**: FBref cập nhật xG ~30 phút sau trận → acceptable

```typescript
// lib/services/fbref/scraper.ts
// Dùng Playwright (đã có trong Next.js ecosystem)
// Scrape bảng "Scores & Fixtures" → parse xG columns
// Rate limit: 1 request/10 giây, robots.txt-compliant
```

> [!NOTE]
> **WC 2026 xG availability**: FBref đã có xG cho WC 2022 và đang có UEFA Nations League, CONMEBOL qualifiers. Khi WC 2026 bắt đầu, FBref sẽ có xG live trong vài giờ sau trận.

> [!WARNING]
> **FBref ToS**: Chỉ dùng cho mục đích cá nhân/phi thương mại. Rate limit nghiêm ngặt. **Không deploy lên production public** nếu không muốn bị block IP.

---

### 🎯 Vấn đề 2: Nguồn "Tinh thần đội" — Tín hiệu Kèo Thị trường

> [!IMPORTANT]
> **Quyết định: Dùng Betting Odds thay vì News scraping**
>
> Thay vì cố gắng đọc tin tức, mình sẽ dùng **tỷ lệ kèo** từ nhà cái làm tín hiệu "thị trường" — đây là cách tiếp cận chuyên nghiệp và chính xác hơn nhiều.

**Lý do Odds tốt hơn News:**
- Odds là **trí tuệ đám đông** — tổng hợp từ hàng triệu người đặt cược, phản ánh cả thông tin về form, chấn thương, tinh thần
- Odds **real-time** và liên tục cập nhật — NewsAPI free lại chỉ có tin cũ 1 tháng
- Odds **có thể convert sang probability** trực tiếp (implied probability)
- **Không cần scraping trái phép** — có API chính thống

#### API được chọn: **The Odds API** (the-odds-api.com)
- **Free tier**: 500 credits/tháng (1 request = 1 credit)
- **WC 2026 support**: Cần verify `sport_key = soccer_fifa_world_cup` active
- **Bookmakers**: Aggregates Bet365, DraftKings, William Hill...
- **Response format**:
```json
{
  "home_team": "Brazil",
  "away_team": "Germany",
  "bookmakers": [{
    "key": "bet365",
    "markets": [{
      "key": "h2h",
      "outcomes": [
        { "name": "Brazil", "price": 2.1 },
        { "name": "Draw",   "price": 3.4 },
        { "name": "Germany", "price": 3.8 }
      ]
    }]
  }]
}
```

#### Chuyển đổi Odds → Implied Probability
```typescript
// lib/utils/odds-converter.ts
// Decimal odds → implied probability (trừ bookmaker margin)
export function oddsToImpliedProbability(odds: number): number {
  return 1 / odds; // Raw
}

export function normalizeOdds(home: number, draw: number, away: number) {
  // Loại bỏ "vig" (margin của nhà cái) để có probability thực
  const rawTotal = (1/home) + (1/draw) + (1/away);
  return {
    homeProb: (1/home) / rawTotal * 100,
    drawProb: (1/draw) / rawTotal * 100,
    awayProb: (1/away) / rawTotal * 100,
  };
}
```

#### Chiến lược dùng 500 credits hiệu quả
```
WC 2026: ~104 trận
Mỗi trận fetch odds 1 lần (trước khi AI phân tích): 104 credits
Dự phòng + testing: 200 credits
→ Tổng: ~300 credits / tháng → nằm trong free tier ✓
```

> [!IMPORTANT]
> **LangGraph.js version**: Package `@langchain/langgraph` đang phát triển nhanh, API có thể thay đổi. Sẽ **pin version cụ thể** trong `package.json` và kiểm tra docs trong `node_modules` SAU KHI install trước khi viết bất kỳ node nào.

---

## Full Folder Structure

```
src/
├── app/
│   ├── apps/
│   │   └── opta/                          # Route group cho aha-opta
│   │       ├── layout.tsx                 # [NEW] Layout riêng: dark theme
│   │       ├── page.tsx                   # [NEW] Dashboard: upcoming matches
│   │       ├── teams/
│   │       │   └── [slug]/
│   │       │       └── page.tsx           # [NEW] Team detail page
│   │       └── predictions/
│   │           └── page.tsx               # [NEW] Lịch sử & accuracy AI
│   │
│   └── api/
│       └── opta/
│           ├── sync/route.ts              # [NEW] POST - ETL trigger (Cron target)
│           ├── teams/route.ts             # [NEW] GET - Danh sách đội
│           ├── matches/route.ts           # [NEW] GET - Lịch thi đấu + kết quả
│           └── predict/route.ts           # [NEW] GET ?matchId=xxx → AI Agent
│
└── lib/
    ├── db/
    │   ├── mongoose.ts                    # [NEW] Connection singleton
    │   └── models/
    │       ├── Team.ts                    # [NEW] Mongoose Schema
    │       ├── Match.ts                   # [NEW] Mongoose Schema
    │       └── Prediction.ts              # [NEW] Mongoose Schema
    │
    ├── services/
    │   ├── football-api/
    │   │   ├── client.ts                  # [NEW] API-Football HTTP client
    │   │   ├── teams.service.ts           # [NEW] Lấy thông tin đội
    │   │   └── matches.service.ts         # [NEW] Lấy lịch sử + stats
    │   └── news-api/
    │       └── news.service.ts            # [NEW] NewsAPI + RSS fallback
    │
    ├── etl/
    │   ├── transformers/
    │   │   ├── team.transformer.ts        # [NEW] Raw API → Team Schema
    │   │   └── match.transformer.ts       # [NEW] Raw API → Match (+ xG calc)
    │   └── sync.ts                        # [NEW] ETL Orchestrator
    │
    ├── ai/
    │   └── opta-agent/
    │       ├── state.ts                   # [NEW] LangGraph State definition
    │       ├── graph.ts                   # [NEW] StateGraph + compile
    │       └── nodes/
    │           ├── data-fetcher.node.ts   # [NEW] Node 1: Query MongoDB
    │           ├── stats-analyzer.node.ts # [NEW] Node 2: Compute metrics
    │           ├── news-morale.node.ts    # [NEW] Node 3: News + sentiment
    │           └── predictor.node.ts      # [NEW] Node 4: Gemini → JSON
    │
    └── utils/
        ├── xg-calculator.ts               # [NEW] Heuristic xG từ shots
        └── form-calculator.ts             # [NEW] Form index từ 5 trận
```

---

## Phase 1: Kiến trúc & Cơ sở dữ liệu

### [NEW] `src/lib/db/mongoose.ts` — Connection Singleton

```typescript
// Tại sao Global Cache thay vì import thẳng?
// → Next.js hot-reload tạo module mới mỗi lần → nhiều connections → exhaust pool
// → Global object tồn tại xuyên suốt process lifetime → tái sử dụng connection
const globalWithMongoose = global as typeof globalThis & {
  mongoose: { conn: typeof mongoose | null; promise: Promise<typeof mongoose> | null };
};
```

### [NEW] Mongoose Schemas

#### `Team.ts`
```typescript
interface ITeamStats {
  matchesPlayed: number;
  wins: number; draws: number; losses: number;
  goalsFor: number; goalsAgainst: number;
  // xG tính approximate từ shots (heuristic model)
  xGoalsFor: number;
  xGoalsAgainst: number;
  possessionAvg: number;    // % kiểm soát bóng TB
  shotsOnTargetAvg: number;
  passAccuracyAvg: number;
  formIndex: number;        // 0-100: weighted score từ 5 trận gần nhất
}

interface ITeam {
  apiFootballId: number;    // Khóa upsert cho ETL
  name: string; shortName: string; slug: string;
  country: string; flag: string;
  group: string;            // "A" → "L" (WC2026: 12 groups × 4 teams)
  confederation: "UEFA" | "CONMEBOL" | "AFC" | "CAF" | "CONCACAF" | "OFC";
  fifaRanking: number;
  stats: ITeamStats;
  aiRating: number | null;  // 0-100, null = chưa phân tích
  lastUpdated: Date;
}
```

#### `Match.ts`
```typescript
interface IMatchStats {
  possession: number; shots: number; shotsOnTarget: number;
  xGoals: number;        // Calculated từ heuristic
  passAccuracy: number; corners: number; fouls: number;
}

interface IMatch {
  apiFootballId: number;
  homeTeamId: Types.ObjectId; awayTeamId: Types.ObjectId;
  homeScore: number | null; awayScore: number | null;
  status: "scheduled" | "live" | "finished" | "postponed" | "cancelled";
  matchDate: Date;
  stage: "Group Stage" | "Round of 16" | "Quarter-Final" | "Semi-Final" | "Final";
  group: string | null; venue: string;
  homeStats: IMatchStats | null; awayStats: IMatchStats | null;
  lastUpdated: Date;
}
```

#### `Prediction.ts`
```typescript
// Tách FACT (Match) và OPINION (Prediction)
// → Chạy nhiều phiên AI, so sánh model versions
// → Back-test accuracy tự động sau khi trận kết thúc
interface IPrediction {
  matchId: Types.ObjectId;
  modelVersion: string;     // "gemini-2.5-flash@phase3-v1"
  predictedWinner: "home" | "away" | "draw";
  probabilities: { home: number; draw: number; away: number }; // Tổng = 100
  confidence: number;       // 0-1
  reasoning: string;
  keyFactors: string[];     // ["High xG advantage", "Strong form"]
  moraleScore: { home: number; away: number } | null;  // 0-10
  actualOutcome: "home" | "away" | "draw" | null;
  isCorrect: boolean | null;
  createdAt: Date;
}
```

---

## Phase 2: Data Pipeline (ETL)

### API-Football Rate Limit Strategy

```
Free tier: 100 calls/day
- syncTeams()  : ~3 calls  (teams + standings)
- syncMatches(): ~5 calls  (fixtures by date range)
→ Tổng ~8 calls/ngày → an toàn, còn dư buffer

client.ts interceptor:
  response.headers["x-ratelimit-requests-remaining"] < 5
  → throw RateLimitError (không gọi thêm)
```

### ETL Strategy — Hybrid xG Sources

```
Phase 2a — Seed (chạy 1 lần):
  scripts/seed-statsbomb.ts
  → Tải StatsBomb Open Data WC2022
  → Parse event JSON → extract shots + xg per team
  → Upsert vào Match collection (historical baseline)

Phase 2b — Live ETL (cron hàng đêm):
  API-Football: fixtures + basic stats (shots, possession)
  FBref scraper: xG columns (Playwright, rate-limited)
  → Merge: API-Football cho fixture data + FBref cho xG
  → Upsert Match với xG thực từ FBref
```

### Form Index Calculator

```typescript
// form-calculator.ts
// Weighted score từ 5 trận gần nhất (không liên quan đến xG)
// Trận gần nhất weight=5, xa nhất weight=1
// Win=3pts, Draw=1pt, Loss=0pt → normalize → 0-100
export function calculateFormIndex(results: Array<'W'|'D'|'L'>): number {
  const weights = [5, 4, 3, 2, 1];
  const points = { W: 3, D: 1, L: 0 };
  const maxScore = weights.reduce((a, b) => a + b) * 3; // max = 45
  const score = results.slice(0, 5).reduce(
    (sum, result, i) => sum + (points[result] * (weights[i] || 1)), 0
  );
  return Math.round((score / maxScore) * 100);
}
```

### Vercel Cron Job

**`vercel.json`** (NEW):
```json
{
  "crons": [{ "path": "/api/opta/sync", "schedule": "0 19 * * *" }]
}
```
> 19:00 UTC = 02:00 AM VN — sau khi World Cup matches kết thúc

---

## Phase 3: "Bộ não" AI — LangGraph Agent

### State Design (`state.ts`)

```typescript
// Tại sao Annotation thay vì plain object?
// → LangGraph quản lý state mutations an toàn, không mutate trực tiếp
import { Annotation } from "@langchain/langgraph";

export const AgentState = Annotation.Root({
  matchId: Annotation<string>,
  homeTeam: Annotation<ITeam | null>,
  awayTeam: Annotation<ITeam | null>,
  recentMatches: Annotation<{ home: IMatch[]; away: IMatch[] }>,
  analyzedStats: Annotation<{
    homeFormIndex: number; awayFormIndex: number;
    homeXGAvg: number; awayXGAvg: number;
    homeDefensiveRating: number; awayDefensiveRating: number;
    headToHeadAdvantage: "home" | "away" | "neutral";
  } | null>,
  moraleData: Annotation<{
    homeHeadlines: string[]; awayHeadlines: string[];
    homeMoraleScore: number; awayMoraleScore: number;
  } | null>,
  prediction: Annotation<IPrediction | null>,
  error: Annotation<string | null>,
});
```

### Node Flow (Updated)

```
[START]
   │
   ▼
[Node 1: dataFetcher]
   - Team.findOne({ slug }) × 2
   - Match.find({ teams }).sort(-date).limit(5) × 2
     → Các matches này có xG thực từ StatsBomb/FBref
   → state.homeTeam, awayTeam, recentMatches
   │
   ▼
[Node 2: statsAnalyzer]
   - Tính formIndex (weighted, 5 trận gần nhất)
   - Tính xGAvg từ match.homeStats.xGoals (xG THỰC)
   - Tính xGAvg defensive: xGoals conceded
   - So sánh head-to-head history
   → state.analyzedStats
   │
   ▼
[Node 3: marketSignal]  ← RENAMED từ "newsMorale"
   - Gọi The Odds API: GET /v4/sports/soccer_fifa_world_cup/odds
   - Filter theo matchId để lấy odds của trận cụ thể
   - Aggregate odds từ nhiều bookmakers (lấy median)
   - normalizeOdds() → implied probability (loại bỏ vig)
   - Gemini KHÔNG cần gọi ở bước này (pure math)
   → state.marketSignal: { homeImplied, drawImplied, awayImplied }
   │
   ▼
[Node 4: predictor]
   Prompt template:
   ┌─────────────────────────────────────────────────────────┐
   │ You are an elite football analyst.                      │
   │                                                         │
   │ STATISTICAL DATA (xG from StatsBomb/FBref):            │
   │ Home {name}: xG avg={xGAvg} | xGA avg={xGAAvg}        │
   │              Form={form}/100 | FIFA Rank={rank}         │
   │ Away {name}: xG avg={xGAvg} | xGA avg={xGAAvg}        │
   │              Form={form}/100 | FIFA Rank={rank}         │
   │ H2H: {headToHead}                                       │
   │                                                         │
   │ MARKET SIGNAL (Betting consensus, vig-removed):        │
   │ Home win implied: {homeImplied}%                        │
   │ Draw implied:     {drawImplied}%                        │
   │ Away win implied: {awayImplied}%                        │
   │                                                         │
   │ Analyze where stats AGREE or DIVERGE from market.      │
   │ A divergence may indicate market mis-pricing or        │
   │ a hidden factor (injury, weather, motivation).         │
   │                                                         │
   │ Return ONLY valid JSON:                                │
   │ {"home":55,"draw":30,"away":15,                       │
   │  "confidence":0.82,                                    │
   │  "reasoning":"...",                                    │
   │  "keyFactors":["xG edge","Market divergence: +8%"]}   │
   └─────────────────────────────────────────────────────────┘
   → Zod parse + validate → state.prediction
   → Save to MongoDB Prediction collection
   │
   ▼
[END]
```

> [!NOTE]
> **Tại sao đưa Market Signal vào prompt?** — AI được trang bị cả 2 nguồn:
> 1. **Stats** (xG, form) = bằng chứng thống kê khách quan
> 2. **Market** (odds) = wisdom of crowd (hàng triệu người đặt cược)
>
> Khi 2 nguồn *đồng thuận* → confidence cao. Khi *diverge* → AI phải lý giải (có thể là điểm quan trọng nhất trong analysis).

### Zod Validation cho AI Output

```typescript
// Tại sao Zod? → Validate + type-safe parse trong 1 bước
// Nếu Gemini trả sai format → throw ZodError → API trả 422 + log
const PredictionOutputSchema = z.object({
  home: z.number().min(0).max(100),
  draw: z.number().min(0).max(100),
  away: z.number().min(0).max(100),
  confidence: z.number().min(0).max(1),
  reasoning: z.string().min(10),
  keyFactors: z.array(z.string()).min(1).max(5),
}).refine(
  (d) => Math.abs(d.home + d.draw + d.away - 100) < 1,
  { message: "Probabilities must sum to 100" }
);
```

---

## Phase 4: Backend API Routes

### API Design

| Method | Endpoint | Mô tả | Auth |
|---|---|---|---|
| `POST` | `/api/opta/sync` | Kích hoạt ETL | `Bearer CRON_SECRET` |
| `GET` | `/api/opta/teams` | Danh sách 48 đội + stats | Public |
| `GET` | `/api/opta/matches` | Lịch + kết quả (filter: status, group) | Public |
| `GET` | `/api/opta/predict?matchId=xxx` | Chạy AI Agent, trả Prediction | Public |

### Security Pattern

```typescript
// API keys CHỈ sống trên server — Next.js Route Handlers
// không bundle vào client JS bundle
// → GOOGLE_API_KEY, MONGODB_URI không bao giờ đến browser

// Bảo vệ /api/opta/sync:
const auth = req.headers.get("authorization");
if (auth !== `Bearer ${process.env.CRON_SECRET}`) {
  return Response.json({ error: "Unauthorized" }, { status: 401 });
}
```

---

## Phase 5: Frontend & Visualization

### Layout `opta/layout.tsx`

Dark-themed layout **độc lập** với aha-tools root layout:
- Sidebar navigation: Dashboard / Teams / Predictions
- Màu nền: `#0a0f1e` (deep dark) + xanh neon accent `#00f5d4`
- Font: `Outfit` (Google Fonts) — hiện đại hơn Inter cho sports app

### Dashboard Wireframe

```
┌─────────────────────────────────────────────────┐
│  ⚽ aha-opta  │  Dashboard  Teams  Predictions  │
├─────────────────────────────────────────────────┤
│                                                 │
│  UPCOMING MATCHES          Sort: [Date ▾]       │
│                                                 │
│  ┌─────────────────────────────────────────┐   │
│  │ 🇧🇷 Brazil      vs      Germany 🇩🇪       │   │
│  │ Group A  •  Jun 12, 21:00             │   │
│  │ [AI Analyze →]          [55% - 30% - 15%] │   │
│  └─────────────────────────────────────────┘   │
│                                                 │
│  AI ACCURACY THIS TOURNAMENT:  68% ✓ (15/22)  │
└─────────────────────────────────────────────────┘
```

### Match Detail Wireframe

```
┌──────────────────────────────────────────────────┐
│  🇧🇷 Brazil  3 - 1  🇩🇪 Germany  │  Group A      │
├──────────────────────────────────────────────────┤
│  AI PREDICTION (before match)                    │
│                                                  │
│  Brazil Win  ████████████░░░░░░  55%            │
│  Draw        ████████░░░░░░░░░░  30%            │
│  Germany Win ████░░░░░░░░░░░░░░  15%            │
│                                                  │
│  Confidence: ⬡⬡⬡⬡⬡⬡⬡⬡░░  0.78                 │
│  Result: ✅ CORRECT                              │
├──────────────────────────────────────────────────┤
│  STRENGTH COMPARISON                             │
│          [Radar Chart — 6 metrics]               │
│  Attack xG / Defense / Form / Possession /       │
│  Morale / FIFA Ranking                           │
├──────────────────────────────────────────────────┤
│  AI REASONING                                    │
│  "Brazil shows stronger xG avg (1.8 vs 1.2)..."  │
│                                                  │
│  Key Factors:                                    │
│  ✓ xG superiority  ✓ High morale (9.2 vs 6.1)  │
│  △ Germany's solid defense (xGA 0.8)            │
└──────────────────────────────────────────────────┘
```

### SWR Pattern

```typescript
// Tại sao SWR thay vì fetch thủ công?
// → Auto-revalidate khi user focus tab → thấy score mới ngay
// → Deduplication: nhiều component cùng endpoint → 1 request
// → refreshInterval khi match live → real-time feel
const { data, isLoading, error } = useSWR<MatchWithPrediction>(
  matchId ? `/api/opta/predict?matchId=${matchId}` : null,
  fetcher,
  { refreshInterval: match?.status === "live" ? 30000 : 0 }
);
```

### Recharts Components

```typescript
// 1. RadarChart — So sánh 6 metrics 2 đội
const metrics = ["Attack xG", "Defense", "Form", "Possession", "Morale", "FIFA Rank"];
// 2 Radar lines, khác màu: home=cyan, away=orange

// 2. ProbabilityBar — Horizontal bar, gradient fill
// Custom ActiveShape để hiển thị % trong bar
// CSS animation: width 0 → final value khi mount (0.6s ease-out)
```

---

## Dependencies cần cài

```bash
# Phase 1 + 2: DB & HTTP
npm install mongoose axios

# Phase 2 (FBref scraper): Playwright
npm install playwright
npx playwright install chromium  # Chỉ cần chromium, nhẹ hơn

# Phase 3: AI Agent (pin versions!)
npm install @langchain/langgraph @langchain/google-genai zod

# Phase 5: Frontend
npm install swr recharts
```

> [!WARNING]
> `@langchain/langgraph` và `@langchain/google-genai` có breaking changes thường xuyên.
> Sẽ đọc docs trong `node_modules` SAU KHI install để dùng đúng API version hiện tại.

> [!NOTE]
> **Playwright trên Vercel**: Playwright headless có thể chạy trên Vercel Function nhưng cần `@sparticuz/chromium` package (optimized cho serverless). Scraper FBref nên chạy qua **Vercel Cron** (không phải trong request path) để tránh timeout.

---

## Environment Variables cần thêm vào `.env`

```bash
# Football Data (API-Football)
API_FOOTBALL_KEY=your_rapidapi_key_here
API_FOOTBALL_HOST=v3.football.api-sports.io

# Betting Market Signal (The Odds API)
ODDS_API_KEY=your_the_odds_api_key_here    # Đăng ký tại the-odds-api.com
ODDS_API_SPORT=soccer_fifa_world_cup        # Verify key này còn active khi WC bắt đầu

# Security
CRON_SECRET=generate_random_32_char_string

# StatsBomb: không cần API key (public GitHub data)
# FBref: không cần API key (Playwright scraping)
```

---

## Verification Plan

| Phase | Test | Expected Result |
|---|---|---|
| 1 | `npm run dev` | No TypeScript errors |
| 1 | `GET /api/opta/teams` | `{ data: [] }` |
| 2a | `npx ts-node scripts/seed-statsbomb.ts` | WC2022 matches với xG thực được insert |
| 2a | Query `Match.find({ xGoals: { $gt: 0 } })` | > 0 results (xG là số thực, không phải 0) |
| 2b | `POST /api/opta/sync` `{type:"teams"}` | 48 teams inserted |
| 2b | FBref scraper test | xG values match fbref.com manually |
| 2b | Sync lần 2 | 0 duplicate (upsert works) |
| 3 | Odds API test: `GET /api/opta/odds?matchId=xxx` | Implied probabilities sum ≈ 100% |
| 3 | `GET /api/opta/predict?matchId=xxx` | Valid Prediction JSON với market signal |
| 3 | Gemini trả sai format | `422 ZodError` với message rõ |
| 4 | `POST /api/opta/sync` no auth header | `401 Unauthorized` |
| 5 | Radar chart | 2 đường, khác màu, animated |
| 5 | Probability bars | Tổng 100%, smooth animation |

---

## Execution Timeline

```
Tuần 1: Phase 1 → Schema + MongoDB connection + folder structure
Tuần 2: Phase 2 → ETL pipeline + Cron + API-Football service
Tuần 3: Phase 3 → LangGraph 4-node agent + Zod validation
Tuần 4: Phase 4 → API Routes + Security + error handling
Tuần 5: Phase 5 → Dashboard + Radar Chart + Probability Bars + Polish
```

---

*Made by Anh Tu - Share to be share*
