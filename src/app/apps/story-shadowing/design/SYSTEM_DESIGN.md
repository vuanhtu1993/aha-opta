# AI Story Shadowing — System Design

> **Tài liệu kiến trúc tổng quan (Living Document)**
> Đọc tài liệu này để hiểu toàn bộ hệ thống trước khi đọc `implementation_plan.md`.

---

## 1. Mục tiêu sản phẩm (Product Goal)

Micro-app học tiếng Anh theo phương pháp **Shadowing** — nghe và lặp lại câu theo AI. Người dùng nhập văn bản hoặc link YouTube, hệ thống xử lý và tạo ra một bài luyện tập có cấu trúc hoàn chỉnh.

Ứng dụng được thiết kế theo tư duy **Mobile-First PWA (Progressive Web App)**, tối ưu cho thao tác một tay trên thiết bị di động, hoạt động độc lập như một Native App và tích hợp trong hệ sinh thái AHA-MIND.

**Phương pháp Shadowing:**

```
AI đọc câu → Dừng → Người dùng lặp lại trong khoảng dừng → Chuyển câu tiếp theo
```

---

## 2. Tech Stack

| Layer                      | Technology                                       | Ghi chú                                              |
| -------------------------- | ------------------------------------------------ | ----------------------------------------------------- |
| **Frontend Framework**     | Next.js 16 (App Router), React 19                | App Router, Server/Client Components                  |
| **PWA & Offline**          | Web App Manifest (`manifest.ts`) + Service Worker (`sw.js`) | Standalone mode, static asset caching, portrait lock |
| **Styling**                | TailwindCSS v4                                   | Safe-area insets (`pt-safe`, `pb-safe`), Dark Mode    |
| **UI Components**          | Shadcn UI + Lucide Icons                         | Card, Button, Dialog, Accordion, Input, Icons         |
| **App Shell & Layout**     | Mobile-First Shell (`max-w-[480px]`)             | Bottom Tab Bar 4 tabs, Sticky Mobile Header           |
| **Local State / Settings** | React Hooks + `localStorage`                     | `useSettings`, `useShadowingPlayer`, `useYouTubeShadowingPlayer` |
| **AI Orchestration**       | LangGraph (`@langchain/langgraph@1.3.6`)         | Pipeline xử lý đa bước (Text & YouTube)               |
| **AI Model**               | Gemini 2.5 Flash (`@langchain/google-genai@2`)   | Sentence splitting, IPA, Keywords, Video Segmenting   |
| **TTS**                    | Google Cloud TTS REST API                        | Gọi trực tiếp REST API qua `fetch`                    |
| **YouTube Integration**    | `youtube-transcript` + `react-youtube`           | Bóc phụ đề; custom YouTube Player controller          |
| **Web Scraping**           | `@mozilla/readability` + `jsdom`                 | Bóc nội dung bài báo từ URL                           |
| **Database**               | MongoDB (Mongoose)                               | Collection `storybooks` (Model: `Storybook_v5`)       |
| **Validation**             | Zod v4                                           | Validate API input/output & Gemini LLM response       |
| **Real-time Streaming**    | Server-Sent Events (SSE)                         | Streaming log tiến trình về Toast UI (Progress)       |

---

## 3. Kiến trúc Tổng thể (High-Level Architecture)

```
┌─────────────────────────────────────────────────────────────────────────┐
│                      UNIFIED MOBILE-FIRST APP SHELL                     │
│                           (max-w-[480px] Centered)                      │
│                                                                         │
│  ┌───────────────────────────────────────────────────────────────────┐  │
│  │             MobileHeader (Sticky Top: Logo + Back Button)         │  │
│  └───────────────────────────────────────────────────────────────────┘  │
│                                                                         │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  ┌─────────────┐  │
│  │   Home Tab   │  │  Story Tab   │  │  Vocab Tab   │  │ Profile Tab │  │
│  │ (Dashboard)  │  │  (History)   │  │(Flashcards)  │  │ (Settings)  │  │
│  └──────┬───────┘  └──────┬───────┘  └──────────────┘  └─────────────┘  │
│         │                 │                                             │
│         │          ┌──────▼────────┐  ┌────────────────┐                │
│         │          │  Create Page  │  │  Player Page   │ (Tabs Hidden)  │
│         │          │ (Text/YouTube)│  │(TTS / YouTube) │                │
│         │          └──────┬────────┘  └───────┬────────┘                │
│  ┌──────┴─────────────────┴───────────────────┴──────────────────────┐  │
│  │           MobileTabBar (4 Tabs Bottom Nav - Auto Hide on Player)   │  │
│  └───────────────────────────────────────────────────────────────────┘  │
└────────────────────────────────────┬────────────────────────────────────┘
                                     │
┌────────────────────────────────────▼────────────────────────────────────┐
│                    PWA & SERVICE WORKER LAYER                           │
│  Manifest (standalone, theme_color)  │ Service Worker (Static Cache)   │
└────────────────────────────────────┬────────────────────────────────────┘
                                     │ fetch()
┌────────────────────────────────────▼────────────────────────────────────┐
│                    NEXT.JS API ROUTES (Backend)                         │
│  POST /process   POST /youtube   GET /scrape  GET /[id]                 │
│  POST /create-series             GET /suggest-segments                  │
└────────────────────────────────────┬────────────────────────────────────┘
                                     │
┌────────────────────────────────────▼────────────────────────────────────┐
│                  LANGGRAPH MULTI-STEP PIPELINES                         │
│  storyShadowingGraph (Text)    │  youtubeShadowingGraph (YouTube)       │
│  [sentenceSplitter] → [TTS]    │  [transcriptFetcher] → [consolidator]  │
│         ↕ (parallel)           │               ↕ (parallel)             │
│    [keywordIdentifier]         │          [keywordIdentifier]           │
│            ↓                   │                   ↓                    │
│    [keywordEnricher]           │          [keywordEnricher]             │
└────────────────────────────────────┬────────────────────────────────────┘
                                     │
┌────────────────────────────────────▼────────────────────────────────────┐
│               EXTERNAL AI & MEDIA SERVICES                              │
│  Gemini 2.5 Flash  │ Google Cloud TTS │ YouTube CC │ Dict API (IPA)     │
└────────────────────────────────────┬────────────────────────────────────┘
                                     │
┌────────────────────────────────────▼────────────────────────────────────┐
│              MONGODB DATABASE (Collection: storybooks)                  │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## 4. File Structure Map

```
src/
├── app/
│   ├── layout.tsx                          ← Root Layout tích hợp AppShell, PWA & Toasts
│   ├── page.tsx                            ← [PWA] Smart Mobile Dashboard (Home Tab)
│   ├── globals.css                         ← Tailwind v4, safe-area tokens (pt-safe, pb-safe)
│   ├── manifest.ts                         ← [PWA] Web App Manifest definition
│   │
│   ├── vocab/
│   │   └── page.tsx                        ← [PWA] Vocab & Flashcards Placeholder Tab
│   │
│   ├── profile/
│   │   └── page.tsx                        ← [PWA] Settings & User Profile Tab
│   │
│   ├── apps/
│   │   └── story-shadowing/
│   │       ├── page.tsx                    ← [PWA] Mobile History (Search + Filter chips)
│   │       ├── layout.tsx
│   │       ├── create/
│   │       │   └── page.tsx                ← Create Page (Text / YouTube / Scraping)
│   │       └── player/
│   │           └── [id]/
│   │               └── page.tsx            ← [PWA] Mobile Player Page (Bottom bar hidden)
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
├── public/
│   ├── sw.js                               ← [PWA] Service worker caching static assets
│   └── logo.svg                            ← Vector App Icon
│
├── components/
│   ├── mobile-shell/                       ← [PWA] Unified App Shell System
│   │   ├── app-shell.tsx                   ← 480px width container + safe-area wrapper
│   │   ├── mobile-header.tsx               ← Header tối giản + Back button logic
│   │   ├── mobile-tab-bar.tsx              ← 4-Tab Bottom Nav (Auto-hide on Player)
│   │   └── pwa-register.tsx                ← Client Service Worker auto-register
│   │
│   ├── dashboard/                          ← [PWA] Smart Dashboard Components
│   │   ├── greeting-section.tsx            ← Lời chào theo buổi (Sáng/Chiều/Tối)
│   │   ├── continue-learning.tsx           ← Card tiếp tục bài học gần nhất
│   │   ├── app-shortcuts.tsx               ← Lưới tiện ích micro-apps
│   │   └── recent-stories.tsx              ← Carousel cuộn ngang bài học gần đây
│   │
│   ├── settings/                           ← [PWA] Profile & Settings Components
│   │   ├── settings-group.tsx              ← Khung nhóm cấu hình
│   │   ├── toggle-setting.tsx              ← Switch toggle (Dark mode, auto-advance)
│   │   └── select-setting.tsx              ← Dropdown/Modal selector
│   │
│   └── story-shadowing/
│       ├── sentence-card.tsx               ← Hiển thị câu + IPA ruby annotation
│       ├── shadowing-player.tsx            ← [PWA] Player với fixed bottom controls 480px
│       ├── progress-countdown.tsx          ← Thanh đếm ngược
│       ├── segment-preview-dialog.tsx      ← Dialog xác nhận chia video dài
│       └── agent-progress-toast.tsx        ← Global SSE Toast tiến trình Agent
│
├── lib/
│   ├── hooks/
│   │   ├── use-settings.ts                 ← [PWA] LocalStorage settings & theme toggle
│   │   ├── use-shadowing-player.ts         ← State Machine cho TTS Player
│   │   └── useYouTubeShadowingPlayer.ts    ← State Machine cho YouTube Player
│   │
│   ├── agents/
│   │   └── story-shadowing-agent/
│   │       ├── state.ts                    ← State Text pipeline
│   │       ├── graph.ts                    ← Text Pipeline: split → TTS
│   │       ├── youtube-state.ts            ← State YouTube pipeline
│   │       ├── youtube-graph.ts            ← YouTube Pipeline: fetch → consolidate
│   │       └── nodes/                      ← Các Graph Nodes (Splitter, TTS, Keywords, CC)
│   │
│   ├── schemas/
│   │   └── story-shadowing.schema.ts       ← Zod validation schemas
│   │
│   └── db/
│       └── models/
│           └── Storybook.ts                ← MongoDB Mongoose Model
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

  // === Series ===
  seriesId?: string;      // UUID — liên kết các parts cùng video
  partIndex?: number;     // Thứ tự part trong series (0-indexed)
  partTitle?: string;     // Tiêu đề riêng của part
  totalParts?: number;    // Tổng số parts trong series
}

interface IStorybookSentence {
  id: number;
  text: string;
  audioBase64?: string;   // TTS audio
  words?: { word: string; ipa: string }[];  // IPA annotation
  startMs?: number;       // YouTube timestamp
  endMs?: number;         // YouTube timestamp
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

## 6. PWA & Navigation Architecture

### 6.1 Unified 4-Tab Navigation Model

Hệ thống điều hướng sử dụng mô hình cố định ở đáy (**Bottom Tab Bar**) theo chuẩn ứng dụng di động:

```
┌────────────────────────────────────────────────────────┐
│                        APP SHELL                       │
│  Tab 1: Home (/)             → Dashboard & Shortcuts  │
│  Tab 2: Story (/apps/...)    → Kho bài học Shadowing   │
│  Tab 3: Vocab (/vocab)       → Flashcards (Phase sau)  │
│  Tab 4: Profile (/profile)   → Cài đặt & Tùy biến      │
└────────────────────────────────────────────────────────┘
```

- **Quy tắc hiển thị Tab Bar**:
  - Tab Bar hiển thị trên các màn hình chính (`/`, `/apps/story-shadowing`, `/vocab`, `/profile`).
  - Tự động **ẨN** khi người dùng vào màn hình chi tiết như Player (`/apps/story-shadowing/player/*`) để nhường toàn bộ không gian cho thanh điều khiển phát âm.

### 6.2 Settings Store (`useSettings`)

Quản lý trạng thái cá nhân hóa thông qua `localStorage` (không yêu cầu tài khoản/auth ở phase hiện tại):
- `darkMode`: Tự động toggle class `dark` trên thẻ `<html>`.
- `defaultVoice`: Giọng đọc TTS ưa thích (`en-US-Journey-F`, `en-US-Journey-D`, ...).
- `repeatTimeoutSeconds`: Thời gian chờ lặp lại sau mỗi câu.
- `autoAdvance`: Tự động nhảy sang câu tiếp theo khi hết thời gian chờ.

---

## 7. State Machine — Player

### 7.1 TTS Player (`useShadowingPlayer`)

```
IDLE ──play()──→ AI_SPEAKING ──audio.ended──→ USER_SHADOWING ──timeout──→ (next sentence)
 ↑                    │                              │                         │
 │               pause()                        pause()                   AI_SPEAKING
 │                    ↓                              ↓
 └───────────── PAUSED ◄────────────────────────── PAUSED
                                                                          DONE (last sentence)
```

### 7.2 YouTube Player (`useYouTubeShadowingPlayer`)

```
IDLE ──play()──→ AI_SPEAKING ──endMs reached──→ USER_SHADOWING ──timeout──→ (next sentence)
```

- Điều khiển YouTube IFrame Player qua `requestAnimationFrame` và `player.getCurrentTime()`.
- Đảm bảo thanh điều khiển Player được cố định ở đáy, căn chỉnh chuẩn trong khung 480px kèm `pb-safe`.

---

## 8. User Flow

### 8.1 Dashboard & Tiếp Tục Bài Học (Home Flow)

```
Mở App (/)
  ├── Chào theo thời gian (Sáng / Chiều / Tối)
  ├── Bấm [Luyện tập] ở Card bài gần nhất → /apps/story-shadowing/player/[id]
  ├── Bấm Icon [Story Shadowing] → /apps/story-shadowing (Kho bài)
  └── Bấm Tiện ích khác (White Noise, AHA-Opta) → Mở micro-app tương ứng
```

### 8.2 Luyện Tập Shadowing (Player Flow)

```
/apps/story-shadowing/player/[id]
  ├── Step 1: Vocabulary Review (Nếu có từ vựng then chốt)
  │     └── Xem Word Family, Collocations, IPA → Bấm [Bắt đầu Shadowing]
  └── Step 2: Shadowing Session
        ├── Ẩn Bottom Tab Bar
        ├── AI / Speaker đọc câu hiện tại (Highlight ruby IPA)
        ├── Đếm ngược thời gian chờ người dùng lặp lại
        └── Chuyển câu tiếp theo (hoặc bấm Next/Prev/Pause)
```

---

## 9. API Routes Reference

| Method   | Route                                             | Mô tả                          | Input                                      | Output                                          |
| -------- | ------------------------------------------------- | -------------------------------- | ------------------------------------------ | ----------------------------------------------- |
| `GET`  | `/api/story-shadowing`                          | Danh sách bài luyện tập      | -                                          | `IStorybook[]` (projection)                   |
| `GET`  | `/api/story-shadowing/[id]`                     | Chi tiết 1 bài                 | `id` (param)                             | `IStorybook` (full)                           |
| `POST` | `/api/story-shadowing/process`                  | Tạo bài từ text               | `{text, title?, thumbnail?, voice?}`     | `{id, totalCount}`                            |
| `GET`  | `/api/story-shadowing/scrape`                   | Bóc nội dung từ URL           | `?url=...`                               | `{title, thumbnail, text}`                    |
| `POST` | `/api/story-shadowing/youtube`                  | Tạo bài từ YouTube            | `{youtubeUrl, voice?}`                   | SSE Stream → `{id}`                           |
| `POST` | `/api/story-shadowing/youtube/suggest-segments` | Phân tích & gợi ý chia video | `{youtubeUrl}`                           | `{needsSplitting, segments?, rawTranscript?}` |
| `POST` | `/api/story-shadowing/youtube/create-series`    | Tạo series từ segments         | `{selectedSegments, rawTranscript, ...}` | SSE Stream → `{done, seriesId, firstStoryId}` |
| `GET`  | `/api/story-shadowing/series/[seriesId]`        | Lấy tất cả parts trong series | `seriesId` (param)                       | `IStorybook[]` (projection)                   |

---

## 10. Phases Overview

| Phase | Tên | Trạng thái | Mô tả ngắn |
| :--- | :--- | :---: | :--- |
| **Phase 1** | Core Shadowing (Text) | ✅ Done | Nhập text → TTS → Player state machine |
| **Phase 2** | Voice & AI Leveling | ✅ Done | Chọn giọng đọc, Gemini đánh giá level |
| **Phase 3** | IPA Phonetic | ✅ Done | Ruby annotation hiển thị phiên âm IPA |
| **Phase 4** | Article URL Import | ✅ Done | Scrape bài báo bằng Readability |
| **Phase 5** | Core Vocabulary | ✅ Done | Trích xuất từ vựng khó + Vocab step trước Player |
| **Phase 5.1** | Deep Vocabulary | ✅ Done | Word Family + Collocations + IPA cho từ vựng |
| **Phase 6** | YouTube Shadowing | ✅ Done | YouTube transcript → Shadowing với real audio |
| **Phase 6.1** | Vocabulary Enrichment | ✅ Done | Nâng cấp schema + UI accordion cho vocabulary |
| **Phase 7** | Smart Video Splitting | ✅ Done | Video dài → AI gợi ý chia → Series management |
| **Phase 8** | Keyword Pipeline Refactor | 🔲 Planned | Hybrid pipeline: Gemini identify + Dict API enrich |
| **Phase 9** | Realtime Progress Toast | ✅ Done | Toast UI Agent Progress + SSE Stream logs |
| **Phase 10** | **Mobile-First PWA UX Redesign** | ✅ **Done** | **App Shell 480px, 4-Tab Bottom Nav, Smart Dashboard, PWA Manifest & Service Worker, Settings Store** |

---

## 11. Key Design Decisions & Trade-offs

| Quyết định | Lý do | Đánh đổi (Trade-off) |
| :--- | :--- | :--- |
| **Unified 480px App Shell trên Desktop** | Đồng nhất trải nghiệm Mobile-First trên mọi màn hình | Màn hình máy tính lớn có khoảng viền 2 bên (giống giao diện mobile preview) |
| **PWA Standalone thay vì Native App** | 1 codebase Next.js duy nhất, cập nhật tức thì không cần qua App Store | Một số API phần cứng sâu của iOS bị hạn chế |
| **Ẩn Bottom Tab Bar khi vào Player** | Nhường trọn vẹn diện tích màn hình cho thanh điều khiển audio | Người dùng phải bấm nút Back trên Header để quay lại các tab khác |
| **LocalStorage Settings Store** | Lưu cấu hình nhanh chóng, không yêu cầu người dùng phải đăng nhập | Cấu hình chỉ lưu trên thiết bị hiện tại, chưa đồng bộ qua cloud |
| **Hybrid IPA (Phase 8)** | Dict API có IPA chuẩn (~98%), Gemini hiểu idiom ngữ cảnh | Thêm external call, latency tăng nhẹ |
| **Zero-shifting timestamps (YouTube)** | Chống Time Hallucination của Gemini | Cần thêm bước tính toán offset |

---

## 12. Environment Variables

```bash
GEMINI_API_KEY=           # Google AI Studio API Key
GOOGLE_TTS_API_KEY=       # Google Cloud TTS API Key
MONGODB_URI=              # MongoDB connection string
```

---

*Made by Anh Tu - Share to be share*
