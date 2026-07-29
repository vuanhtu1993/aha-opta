# AI Story Shadowing — System Design

> **Tài liệu kiến trúc tổng quan (Living Document)**
> Đọc tài liệu này để hiểu toàn bộ hệ thống trước khi đọc `implementation_plan.md`.

---

## 1. Mục tiêu sản phẩm (Product Goal)

Micro-app học tiếng Anh theo phương pháp **Shadowing** — nghe và lặp lại câu theo AI. Người dùng nhập văn bản hoặc link YouTube, hệ thống xử lý và tạo ra một bài luyện tập có cấu trúc.

**Phương pháp Shadowing:**

```
AI đọc câu → Dừng → Người dùng lặp lại trong khoảng dừng → Chuyển câu tiếp theo
```

---

## 2. Tech Stack

| Layer                      | Technology                                       | Ghi chú                                              |
| -------------------------- | ------------------------------------------------ | ----------------------------------------------------- |
| **Frontend**         | Next.js 16 (App Router), React 19                | App Router, Server/Client Components                  |
| **Styling**          | TailwindCSS v4                                   | Design tokens trong`globals.css`                    |
| **UI Components**    | Shadcn UI                                        | Card, Button, Dialog, Accordion, Input                |
| **State Machine**    | Custom Hooks (React)                             | `useShadowingPlayer`, `useYouTubeShadowingPlayer` |
| **AI Orchestration** | LangGraph (`@langchain/langgraph@1.3.6`)       | Pipeline xử lý đa bước                           |
| **AI Model**         | Gemini 2.5 Flash (`@langchain/google-genai@2`) | Sentence splitting, IPA, Keywords                     |
| **TTS**              | Google Cloud TTS REST API                        | Không cần SDK, gọi trực tiếp qua`fetch`        |
| **YouTube**          | `youtube-transcript` package                   | Bóc phụ đề;`react-youtube` cho Player           |
| **Web Scraping**     | `@mozilla/readability` + `jsdom`             | Bóc nội dung bài báo từ URL                      |
| **Database**         | MongoDB (Mongoose)                               | Lưu Storybook (bài luyện tập)                     |
| **Validation**       | Zod v4                                           | Validate cả API input và Gemini output              |
| **Real-time**        | Server-Sent Events (SSE)                         | Streaming log tiến trình về UI                     |

---

## 3. Kiến trúc Tổng thể (High-Level Architecture)

```
┌─────────────────────────────────────────────────────────────┐
│                        FRONTEND                              │
│  ┌─────────────┐  ┌──────────────┐  ┌────────────────────┐  │
│  │  Create Page│  │ History Page │  │    Player Page     │  │
│  │(Text / URL) │  │(List + Group)│  │(TTS / YouTube)     │  │
│  └──────┬──────┘  └──────────────┘  └────────┬───────────┘  │
│         │  fetch()                            │              │
└─────────┼───────────────────────────────────-┼──────────────┘
          │                                     │
┌─────────▼───────────────────────────────────-▼──────────────┐
│                    NEXT.JS API ROUTES                         │
│  POST /process   POST /youtube   GET /scrape  GET /[id]      │
│  POST /create-series             GET /suggest-segments        │
└─────────┬───────────────────────────────────────────────────┘
          │
┌─────────▼───────────────────────────────────────────────────┐
│                  LANGGRAPH PIPELINES                          │
│                                                               │
│  storyShadowingGraph (Text Input):                            │
│  [sentenceSplitter] → [ttsGenerator]                         │
│                                                               │
│  youtubeShadowingGraph (YouTube Input):                       │
│  [transcriptFetcher] → [sentenceConsolidator]                │
│               ↕ (parallel)                                   │
│          [keywordExtractor]                                   │
└─────────┬───────────────────────────────────────────────────┘
          │
┌─────────▼───────────────────────────────────────────────────┐
│               EXTERNAL SERVICES                               │
│  Gemini 2.5 Flash    Google Cloud TTS    YouTube Transcript  │
│  Free Dictionary API (dictionaryapi.dev) — IPA + Definitions │
└─────────┬───────────────────────────────────────────────────┘
          │
┌─────────▼───────────────────────────────────────────────────┐
│              MONGODB (Mongoose)                               │
│  Collection: storybooks (model: Storybook_v5)                │
└─────────────────────────────────────────────────────────────┘
```

---

## 4. File Structure Map (Thực tế hiện tại)

```
src/
├── app/
│   ├── apps/
│   │   └── story-shadowing/
│   │       ├── page.tsx                    ← History Page (danh sách bài học)
│   │       ├── layout.tsx
│   │       ├── create/
│   │       │   └── page.tsx                ← Create Page (nhập text / URL)
│   │       └── player/
│   │           └── [id]/
│   │               └── page.tsx            ← Player Page (shadowing session)
│   │
│   └── api/
│       └── story-shadowing/
│           ├── route.ts                    ← GET /api/story-shadowing (list)
│           ├── [id]/
│           │   └── route.ts                ← GET /api/story-shadowing/[id] (detail)
│           ├── process/
│           │   └── route.ts                ← POST: Text → LangGraph TTS Pipeline
│           ├── scrape/
│           │   └── route.ts                ← GET: URL → Readability scrape
│           ├── series/
│           │   └── [seriesId]/
│           │       └── route.ts            ← GET: Lấy danh sách parts trong series
│           └── youtube/
│               ├── route.ts                ← POST: YouTube URL → LangGraph Pipeline
│               ├── suggest-segments/
│               │   └── route.ts            ← POST: Phân tích & gợi ý chia segment
│               └── create-series/
│                   └── route.ts            ← POST (SSE): Tạo hàng loạt Storybook
│
├── lib/
│   ├── agents/
│   │   └── story-shadowing-agent/
│   │       ├── state.ts                    ← LangGraph State (Text pipeline)
│   │       ├── graph.ts                    ← Text Pipeline: split → TTS
│   │       ├── youtube-state.ts            ← LangGraph State (YouTube pipeline)
│   │       ├── youtube-graph.ts            ← YouTube Pipeline: fetch → consolidate
│   │       └── nodes/
│   │           ├── sentence-splitter.node.ts           ← Gemini: chia câu + IPA + level
│   │           ├── tts-generator.node.ts               ← Google TTS: base64 audio
│   │           ├── keyword-identifier.node.ts          ← [Phase 8] Gemini: identify từ khó + idiom
│   │           ├── keyword-enricher.node.ts            ← [Phase 8] Dict API + Gemini: enrich details
│   │           ├── youtube-transcript-fetcher.node.ts  ← youtube-transcript package
│   │           ├── youtube-sentence-consolidator.node.ts ← Gemini: gộp phụ đề thô
│   │           └── youtube-segment-suggester.node.ts   ← Gemini: gợi ý chia video dài
│   │
│   ├── schemas/
│   │   └── story-shadowing.schema.ts           ← Tất cả Zod schemas (shared)
│   │
│   ├── services/
│   │   └── dictionary-api.service.ts           ← [Phase 8] Wrapper Free Dictionary API
│   │
│   ├── db/
│   │   └── models/
│   │       └── Storybook.ts                ← Mongoose Model (Storybook_v5)
│   │
│   └── hooks/
│       ├── use-shadowing-player.ts         ← State Machine cho TTS Player
│       └── [use-youtube-shadowing-player]  ← State Machine cho YouTube Player (dự kiến)
│
└── components/
    └── story-shadowing/
        ├── sentence-card.tsx               ← Hiển thị câu + IPA ruby annotation
        ├── shadowing-player.tsx            ← Player component chính (TTS)
        ├── progress-countdown.tsx          ← Thanh đếm ngược
        └── segment-preview-dialog.tsx      ← Dialog xác nhận chia video dài
```

---

## 5. Data Model (MongoDB)

### `Storybook` (Collection: `storybooks`, Model: `Storybook_v5`)

```typescript
interface IStorybook {
  // === Core ===
  title: string;
  thumbnail?: string;
  originalText: string;
  level: "easy" | "medium" | "hard";   // AI-generated
  voice: string;                        // Google TTS voice ID
  speakingRate: number;                 // TTS speaking rate
  createdAt: Date;

  // === Content ===
  sentences: IStorybookSentence[];
  keywords?: IStorybookKeyword[];

  // === Source ===
  sourceType: "text" | "youtube";
  youtubeVideoId?: string;

  // === Series (Phase 7) ===
  seriesId?: string;      // UUID — group nhiều parts cùng video
  partIndex?: number;     // Thứ tự part trong series (0-indexed)
  partTitle?: string;     // Tiêu đề riêng của part
  totalParts?: number;    // Tổng số parts trong series
}

interface IStorybookSentence {
  id: number;
  text: string;
  audioBase64?: string;   // TTS source
  words?: { word: string; ipa: string }[];  // IPA annotation
  startMs?: number;       // YouTube source
  endMs?: number;         // YouTube source
}

interface IStorybookKeyword {
  word: string;
  ipa?: string;
  explanation: string;
  level: "medium" | "hard";
  wordFamily?: { word: string; partOfSpeech?: string; ipa?: string; explanation: string }[];
  collocations?: { collocation: string; explanation: string }[];
}
```

---

## 6. Zod Schemas (Shared, `story-shadowing.schema.ts`)

| Schema                            | Mục đích                                                                      |
| --------------------------------- | ------------------------------------------------------------------------------- |
| `WordSchema`                    | `{word, ipa}` — 1 từ kèm phiên âm                                       |
| `KeywordSchema`                 | Từ vựng khó (word, ipa, explanation, level, wordFamily, collocations)       |
| `SentenceSchema`                | 1 câu processed (id, text, audioBase64, words, startMs, endMs)                |
| `ProcessResponseSchema`         | Response từ POST /process và POST /youtube                                   |
| `TtsRequestSchema`              | Request vào POST /tts (không còn dùng riêng biệt)                        |
| `GeminiSentenceListSchema`      | Raw output từ Gemini khi chia câu (level + sentences + words IPA)            |
| `IdentifiedKeywordListSchema`   | **[Phase 8]** Raw output từ Gemini khi identify từ khó (word, type, context) |
| `GeminiKeywordListSchema`       | Raw output từ Gemini khi enrich idiom/phrasal verb (explanation + wordFamily) |

---

## 7. LangGraph Pipelines

### 7.1 Text Pipeline (`graph.ts`)

```
Input: rawText (string)
       ↓
[Node 1] sentenceSplitterNode
  → Gọi Gemini Flash
  → Trả về: rawSentences (với IPA), level
       ↓ (parallel)
[Node 2a] ttsGeneratorNode              [Node 2b] keywordIdentifierNode  ← [Phase 8]
  → Gọi Google Cloud TTS                  → Gemini: identify từ khó + idiom + phrasal verb
  → Trả về: sentences (+ audioBase64)     → Trả về: identifiedKeywords[]
                                                 ↓
                                          [Node 2c] keywordEnricherNode  ← [Phase 8]
                                            → type="word": Dictionary API → Gemini fallback
                                            → type="idiom": Gemini (giải thích theo context)
                                            → Trả về: keywords[] (đầy đủ IPA, explanation, ...)
       ↓ (merge)
Output: sentences, keywords, level
```

### 7.2 YouTube Pipeline (`youtube-graph.ts`)

```
Input: youtubeUrl (string)
       ↓
[Node 1] transcriptFetcherNode
  → Dùng youtube-transcript package
  → Ưu tiên phụ đề thủ công (Manual CC)
  → Trả về: rawTranscript (blocks), youtubeVideoId, title
       ↓ (parallel)
[Node 2a] sentenceConsolidatorNode      [Node 2b] keywordIdentifierNode  ← [Phase 8]
  → Gemini: Map-Reduce + Chunking          → Gemini: identify từ khó + idiom
  → Zero-shifting + Mid-point clamping     → Trả về: identifiedKeywords[]
  → Trả về: sentences (startMs, endMs)           ↓
                                          [Node 2c] keywordEnricherNode  ← [Phase 8]
                                            → Shared logic với Text pipeline
                                            → Trả về: keywords[]
       ↓ (merge)
Output: sentences, keywords, level, youtubeVideoId
```

### 7.3 Smart Splitting (Phase 7 — Video dài > 200 blocks)

```
[API] suggest-segments
  → Fetch transcript
  → Nếu > 200 blocks: gọi youtubeSegmentSuggesterNode (Gemini)
  → Trả về danh sách segments gợi ý (title, startMs, endMs, blockStart, blockEnd)
       ↓ (User confirm trên UI)
[API] create-series (SSE Stream)
  → Slice transcript cho từng segment
  → Chạy YouTube Pipeline tuần tự cho từng segment (tránh rate limit)
  → Lưu mỗi segment thành 1 Storybook riêng (seriesId liên kết)
  → Stream log về UI real-time
```

---

## 8. State Machine — Player

### 8.1 TTS Player (`useShadowingPlayer`)

```
IDLE ──play()──→ AI_SPEAKING ──audio.ended──→ USER_SHADOWING ──timeout──→ (next sentence)
 ↑                    │                              │                         │
 │               pause()                        pause()                   AI_SPEAKING
 │                    ↓                              ↓
 └───────────── PAUSED ◄────────────────────────── PAUSED
                                                                          DONE (last sentence)
```

**Refs dùng để tránh memory leak:**

- `audioRef` — HTMLAudioElement hiện tại
- `shadowTimeoutRef` — setTimeout chờ user lặp
- `countdownIntervalRef` — setInterval cập nhật countdown

### 8.2 YouTube Player (`useYouTubeShadowingPlayer`)

```
IDLE ──play()──→ AI_SPEAKING ──endMs reached──→ USER_SHADOWING ──timeout──→ (next sentence)
```

Thay vì `<audio>`, hook điều khiển YouTube IFrame Player:

- `requestAnimationFrame` để theo dõi `player.getCurrentTime()`
- `hasSeekedRef` flag để xử lý Async Seek khi bấm Back

---

## 9. User Flow

### 9.1 Text Shadowing

```
/apps/story-shadowing (History)
    → [Tạo bài luyện tập]
        → /apps/story-shadowing/create
            Form: Title | Thumbnail | Text (5000 ký tự) | Voice Select
            → Submit → POST /api/story-shadowing/process
                → LangGraph: split + TTS + keywords
                → Redirect → /apps/story-shadowing/player/[id]
```

### 9.2 YouTube Shadowing

```
/apps/story-shadowing/create (Tab: "Từ YouTube")
    → Nhập YouTube URL
    → [Phân tích link]
        → POST /api/story-shadowing/youtube/suggest-segments
            Nếu video ngắn (< 200 blocks):
                → Trực tiếp POST /api/story-shadowing/youtube
                → Redirect → /apps/story-shadowing/player/[id]
            Nếu video dài (>= 200 blocks):
                → Hiển thị SegmentPreviewDialog
                → User confirm segments
                → POST /api/story-shadowing/youtube/create-series (SSE)
                → Hiển thị terminal log real-time
                → Redirect → /apps/story-shadowing (History, group by seriesId)
```

### 9.3 Article Scraping

```
/apps/story-shadowing/create (Tab: "Nhập từ Link")
    → Nhập URL bài báo
    → [Phân tích link]
        → GET /api/story-shadowing/scrape?url=...
        → Tự động điền: Title, Thumbnail, Text vào form
        → Người dùng duyệt → Submit → flow Text Shadowing
```

---

## 10. API Routes Reference

| Method   | Route                                             | Mô tả                          | Input                                      | Output                                          |
| -------- | ------------------------------------------------- | -------------------------------- | ------------------------------------------ | ----------------------------------------------- |
| `GET`  | `/api/story-shadowing`                          | Danh sách bài luyện tập      | -                                          | `IStorybook[]` (projection)                   |
| `GET`  | `/api/story-shadowing/[id]`                     | Chi tiết 1 bài                 | `id` (param)                             | `IStorybook` (full)                           |
| `POST` | `/api/story-shadowing/process`                  | Tạo bài từ text               | `{text, title?, thumbnail?, voice?}`     | `{id, totalCount}`                            |
| `GET`  | `/api/story-shadowing/scrape`                   | Bóc nội dung từ URL           | `?url=...`                               | `{title, thumbnail, text}`                    |
| `POST` | `/api/story-shadowing/youtube`                  | Tạo bài từ YouTube            | `{youtubeUrl, voice?}`                   | SSE Stream →`{id}`                           |
| `POST` | `/api/story-shadowing/youtube/suggest-segments` | Phân tích & gợi ý chia video | `{youtubeUrl}`                           | `{needsSplitting, segments?, rawTranscript?}` |
| `POST` | `/api/story-shadowing/youtube/create-series`    | Tạo series từ segments         | `{selectedSegments, rawTranscript, ...}` | SSE Stream →`{done, seriesId, firstStoryId}` |
| `GET`  | `/api/story-shadowing/series/[seriesId]`        | Lấy tất cả parts trong series | `seriesId` (param)                       | `IStorybook[]` (projection)                   |

---

## 11. Phases Overview

| Phase               | Tên                      | Trạng thái | Mô tả ngắn                                           |
| ------------------- | ------------------------- | ------------ | ------------------------------------------------------- |
| **Phase 1**   | Core Shadowing (Text)     | ✅ Done      | Nhập text → TTS → Player state machine               |
| **Phase 2**   | Voice & AI Leveling       | ✅ Done      | Chọn giọng đọc, Gemini đánh giá level            |
| **Phase 3**   | IPA Phonetic              | ✅ Done      | Ruby annotation hiển thị phiên âm IPA               |
| **Phase 4**   | Article URL Import        | ✅ Done      | Scrape bài báo bằng Readability                      |
| **Phase 5**   | Core Vocabulary           | ✅ Done      | Trích xuất từ vựng khó + Vocab step trước Player |
| **Phase 5.1** | Deep Vocabulary           | ✅ Done      | Word Family + Collocations + IPA cho từ vựng          |
| **Phase 6**   | YouTube Shadowing         | ✅ Done      | YouTube transcript → Shadowing với real audio         |
| **Phase 6.1** | Vocabulary Enrichment     | ✅ Done      | Nâng cấp schema + UI accordion cho vocabulary         |
| **Phase 7**   | Smart Video Splitting          | ✅ Done    | Video dài → AI gợi ý chia → Series management          |
| **Phase 8**   | Keyword Pipeline Refactor      | 🔲 Planned | Hybrid pipeline: Gemini identify + Dict API enrich      |

---

## 12. Key Design Decisions & Trade-offs

| Quyết định | Lý do | Trade-off |
|---|---|---|
| **[Phase 8] Hybrid IPA**: Dict API cho single words, Gemini cho idiom | Dict API có IPA chuẩn xác (~98%); Gemini hiểu ngữ cảnh idiom tốt hơn | Thêm external call, latency tăng ~1-2s |
| **[Phase 8] Tách keyword pipeline thành 2 nodes** | Single Responsibility: identifier chỉ list từ, enricher chỉ giải thích → Gemini tập trung hơn, coverage cao hơn | Thêm 1 LangGraph node, thêm intermediate state |
| **[Phase 8] Shared helper functions** cho cả Text & YouTube pipeline | DRY principle: tránh duplicate logic; khi sửa prompt chỉ sửa 1 chỗ | Phải quản lý state type mapping giữa 2 pipelines |
| **Pre-generate toàn bộ audio** (không stream TTS) | Tránh latency khi phát | Thời gian chờ ban đầu lâu hơn |
| **Standard voice** thay vì WaveNet | Rẻ hơn 4x | Chất lượng audio kém hơn một chút |
| **speakingRate = 1.0 cố định** | Tốc độ cao gây mất chữ | Không thể chậm hơn cho người mới |
| **Mỗi segment = 1 Storybook riêng** | Tái sử dụng 100% Player hiện tại | Không có view tổng hợp toàn series |
| **Zero-shifting timestamps** (YouTube) | Chống Time Hallucination của Gemini | Cần thêm bước tính toán offset |
| **Manual CC ưu tiên** (YouTube) | Phụ đề tay chuẩn hơn ASR | Video không có Manual CC sẽ bị từ chối |
| **SSE cho long-running tasks** | User thấy tiến trình real-time | Cần xử lý reconnect nếu mạng mất |

---

## 13. Environment Variables

```bash
GEMINI_API_KEY=           # Google AI Studio API Key
GOOGLE_TTS_API_KEY=       # Google Cloud TTS API Key
MONGODB_URI=              # MongoDB connection string
```

---

*Made by Anh Tu - Share to be share*
