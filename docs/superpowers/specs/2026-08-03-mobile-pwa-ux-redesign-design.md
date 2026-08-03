# AHA-MIND — Mobile PWA UX Redesign

> **Design Spec** — Chuyển đổi UX từ website sang mobile-first PWA
> Ngày tạo: 2026-08-03
> Trạng thái: Approved (Brainstorming hoàn tất)

---

## 1. Tổng quan & Động lực

### Vấn đề hiện tại
AHA-MIND hiện là một website truyền thống với layout desktop-first. Ứng dụng chính — **Story Shadowing** — là công cụ luyện phát âm, bản chất phù hợp với trải nghiệm mobile hơn (người dùng luyện tập khi di chuyển, trước khi ngủ, v.v.).

### Mục tiêu
Chuyển đổi toàn bộ UX sang **mobile-first app** với:
- **Unified App Shell** layout (giống nhau trên mọi device)
- **Bottom Tab Bar** navigation (4 tabs)
- **PWA** (Progressive Web App) — cài đặt được như native app
- Story Shadowing là **core experience**, các micro-app khác là phụ trợ

### Approach đã chọn: Progressive Enhancement
Giữ nguyên Next.js App Router hiện tại, thêm mobile-first layout layer. Không breaking change về API/data.

---

## 2. Navigation Architecture

### 2.1 Bottom Tab Bar

```
┌────────────────────────────────────────────────┐
│                                                │
│              Page Content Area                 │
│         (full height - tab bar height)         │
│                                                │
├────────────────────────────────────────────────┤
│  🏠         📖          📝         ⚙️         │
│  Home      Story      Vocab     Profile       │
│  (active)                                      │
└────────────────────────────────────────────────┘
```

### 2.2 Route Mapping

| Tab | Route | Mô tả |
|-----|-------|--------|
| **Home** | `/` | Dashboard thông minh (landing tab mặc định) |
| **Story** | `/apps/story-shadowing` | Danh sách bài Shadowing (History) |
| **Vocab** | `/vocab` | Placeholder — phát triển ở phase sau |
| **Profile** | `/profile` | Cài đặt cơ bản (localStorage) |

### 2.3 Sub-pages (navigate bình thường, tab bar vẫn visible)

| Page | Route | Parent Tab |
|------|-------|------------|
| Create | `/apps/story-shadowing/create` | Story |
| Player | `/apps/story-shadowing/player/[id]` | Story |
| App detail (White Noise, etc.) | `/apps/[slug]` | Home |

### 2.4 Tab Bar Behavior
- **Luôn hiển thị** ở tất cả pages (bao gồm Player — không immersive)
- **Active state** highlight dựa trên pathname matching
- Fixed bottom, `z-index` cao
- Safe-area padding cho notch devices (`env(safe-area-inset-bottom)`)

---

## 3. Unified App Shell Layout

### 3.1 Quyết định thiết kế
Thay vì responsive (2 layout riêng cho desktop/mobile), chọn **unified layout** — 1 layout duy nhất cho mọi device.

**Lý do:**
- Giảm 50% effort phát triển — không cần conditional rendering
- PWA trên desktop cũng trông giống app
- Dễ test — chỉ 1 layout
- Phù hợp loại app: personal learning tool, không phải content site

### 3.2 App Shell Structure

```tsx
// Root layout.tsx
<body>
  <main className="app-shell">  {/* max-width: 480px, centered */}
    {children}
  </main>
  <MobileTabBar />  {/* Fixed bottom, cùng max-width */}
</body>
```

```css
.app-shell {
  max-width: 480px;
  margin: 0 auto;
  min-height: 100dvh;
  padding-bottom: 64px; /* tab bar height */
}
```

### 3.3 Desktop Background
- Subtle gradient hoặc pattern phía sau app shell container
- App shell có thể có subtle border/shadow để tách biệt với background

### 3.4 Tham khảo
Pattern này được dùng bởi: Telegram Web, Instagram Web, WhatsApp Web.

---

## 4. Home Tab — Smart Dashboard

Landing screen khi mở app. Thiết kế compact, scannable, action-oriented.

### 4.1 Layout (top → bottom)

```
┌────────────────────────────────────────────────┐
│  👋 Chào Anh Tú!                    🌙        │  ← Greeting + theme toggle
│  Hôm nay bạn muốn luyện gì?                   │
├────────────────────────────────────────────────┤
│  ▶️ Tiếp tục luyện tập                        │  ← Continue Learning Card
│  ┌──────────────────────────────────────────┐  │
│  │  📖 "The Power of Habit" - Part 2       │  │
│  │  ████████░░░░  65% · 8/12 câu           │  │
│  │                        [Tiếp tục →]     │  │
│  └──────────────────────────────────────────┘  │
├────────────────────────────────────────────────┤
│  📱 Ứng dụng                                  │  ← App Shortcuts Grid
│  ┌────────┐ ┌────────┐ ┌────────┐             │
│  │  🎵   │ │  ⚽   │ │  📰   │             │
│  │ White  │ │  aha-  │ │ Tin    │             │
│  │ Noise  │ │  opta  │ │ tức   │             │
│  └────────┘ └────────┘ └────────┘             │
├────────────────────────────────────────────────┤
│  📖 Bài luyện tập gần đây                    │  ← Recent Stories
│  ┌──────┐ ┌──────┐ ┌──────┐ ┌──────┐         │
│  │thumb │ │thumb │ │thumb │ │thumb │  →       │
│  │title │ │title │ │title │ │title │          │
│  └──────┘ └──────┘ └──────┘ └──────┘         │
└────────────────────────────────────────────────┘
```

### 4.2 Components

| Component | Dữ liệu | Ghi chú |
|-----------|----------|---------|
| **Greeting** | Hardcode tên (chưa có auth) | Hiển thị theo giờ: Chào buổi sáng/chiều/tối |
| **Continue Learning** | Storybook gần nhất (`createdAt` desc) | Nếu chưa có bài → CTA "Tạo bài đầu tiên" |
| **App Shortcuts** | Grid các micro-app hiện có | Icon grid, tap → navigate |
| **Recent Stories** | 5 bài gần nhất, horizontal scroll | Thumbnail + title, tap → Player |

### 4.3 Quyết định: Không có Quick Stats
Bỏ phần thống kê (streak, thời gian, v.v.) vì chưa có hệ thống tracking thực sự. Tránh hiển thị data giả gây misleading.

### 4.4 Home page hiện tại
Layout desktop card grid hiện tại (`page.tsx`) sẽ **thay thế hoàn toàn** bằng Dashboard mới (vì unified layout).

---

## 5. Story Tab — Mobile-Optimized History

Route `/apps/story-shadowing` — giữ nguyên, chỉ thay layout.

### 5.1 Layout

```
┌────────────────────────────────────────────────┐
│  📖 Story Shadowing          [+ Tạo mới]      │  ← Header + CTA
├────────────────────────────────────────────────┤
│  🔍 Tìm kiếm...                               │  ← Search bar
│  [Tất cả] [Text] [YouTube] [Series]           │  ← Filter chips
├────────────────────────────────────────────────┤
│  ┌──────────────────────────────────────────┐  │
│  │ 🟣 The Power of Habit              Hard │  │  ← Story Card
│  │ 📖 12 câu · 5 từ vựng · 2 ngày trước   │  │
│  └──────────────────────────────────────────┘  │
│  ┌──────────────────────────────────────────┐  │
│  │ 🔴 YouTube: TED Talk...           Medium│  │
│  │ 🎬 Series (3 parts) · 1 tuần trước     │  │
│  └──────────────────────────────────────────┘  │
│  ...                                           │
└────────────────────────────────────────────────┘
```

### 5.2 Thay đổi so với hiện tại

| Khác biệt | Hiện tại | Mobile-first |
|-----------|----------|-------------|
| Layout | Grid cards (desktop) | Vertical list, 1 column, full-width |
| Navigation | Sidebar/header | Bottom tab bar |
| Create button | Link trong page | Fixed header CTA |
| Card info | Nhiều text | Compact — 1-2 dòng meta |

### 5.3 Không đổi
- Data fetching logic giữ nguyên
- API routes giữ nguyên
- Create page flow giữ nguyên (navigate tới `/apps/story-shadowing/create`, mobile-optimized form)
- Player flow giữ nguyên

---

## 6. Vocab Tab — Placeholder

Route `/vocab` — hiển thị placeholder "Coming soon".

### 6.1 Tầm nhìn (Phase sau)
- Kho từ vựng tổng hợp từ mọi bài Shadowing
- Mini Anki/flashcard deck
- Aggregate tất cả `keywords` từ MongoDB

### 6.2 Phase hiện tại
- Render placeholder UI: icon + message "Tính năng đang phát triển"
- Tab vẫn hiển thị trên tab bar (consistent UI)

---

## 7. Profile Tab — Settings

Route `/profile` — cài đặt cơ bản, lưu `localStorage`.

### 7.1 Layout

```
┌────────────────────────────────────────────────┐
│  ⚙️ Cài đặt                                   │
├────────────────────────────────────────────────┤
│  Giao diện                                     │
│  ┌──────────────────────────────────────────┐  │
│  │  🌙 Chế độ tối              [  toggle ] │  │
│  │  🌐 Ngôn ngữ               Tiếng Việt ▸│  │
│  └──────────────────────────────────────────┘  │
│                                                │
│  Shadowing                                     │
│  ┌──────────────────────────────────────────┐  │
│  │  🎙️ Giọng đọc mặc định    en-US-Std ▸ │  │
│  │  ⏱️ Thời gian lặp lại      5 giây    ▸ │  │
│  │  🔄 Tự động chuyển câu     [  toggle ] │  │
│  └──────────────────────────────────────────┘  │
│                                                │
│  Thông tin                                     │
│  ┌──────────────────────────────────────────┐  │
│  │  📱 Phiên bản               1.0.0       │  │
│  │  📖 Hướng dẫn sử dụng              ▸   │  │
│  │  💬 Góp ý / Phản hồi               ▸   │  │
│  └──────────────────────────────────────────┘  │
│                                                │
│  Made by Anh Tu - Share to be share            │
└────────────────────────────────────────────────┘
```

### 7.2 Settings Items

| Group | Setting | Storage | Ghi chú |
|-------|---------|---------|---------|
| **Giao diện** | Dark/Light mode | `localStorage` | Toggle class trên `<html>` |
| | Ngôn ngữ | `localStorage` | Phase đầu: chỉ VI, placeholder |
| **Shadowing** | Giọng đọc mặc định | `localStorage` | Override default khi tạo bài mới |
| | Thời gian lặp lại | `localStorage` | Override default 5s trong Player |
| | Tự động chuyển câu | `localStorage` | On/Off auto-advance |
| **Thông tin** | Version, Hướng dẫn, Góp ý | Static | Link/text thuần |

### 7.3 Scope giới hạn
- **Không có auth** — không login/logout
- **Không sync** — settings chỉ lưu local
- Settings Shadowing được đọc bởi Player hook qua utility function đọc `localStorage`

---

## 8. PWA Configuration

### 8.1 Manifest

```json
{
  "name": "AHA-MIND",
  "short_name": "AHA-MIND",
  "description": "AI-powered learning tools",
  "start_url": "/",
  "display": "standalone",
  "background_color": "#0f172a",
  "theme_color": "#10b981",
  "orientation": "portrait",
  "icons": [
    { "src": "/icons/icon-192.png", "sizes": "192x192", "type": "image/png" },
    { "src": "/icons/icon-512.png", "sizes": "512x512", "type": "image/png" }
  ]
}
```

### 8.2 Service Worker Strategy (Phase đầu)

| Resource | Strategy | Lý do |
|----------|----------|-------|
| Static assets (CSS, JS, fonts) | Cache-first | Không thay đổi thường xuyên |
| API calls | Network-first | Cần data mới nhất (MongoDB) |
| Images/Thumbnails | Cache-first | Thumbnail storybook ít đổi |

### 8.3 Display: Standalone
- Ẩn browser chrome (address bar, back button)
- Bottom tab bar thay thế hoàn toàn browser navigation
- App chạy như native app khi cài từ browser

### 8.4 Giới hạn offline
App cần Gemini API + Google TTS + MongoDB → **không hỗ trợ offline-first**. Service worker chỉ cache static assets để tăng tốc load.

---

## 9. File Structure (Dự kiến thay đổi)

```
src/
├── app/
│   ├── page.tsx                    ← [MODIFY] Thay bằng MobileDashboard
│   ├── layout.tsx                  ← [MODIFY] Thêm AppShell + MobileTabBar
│   ├── manifest.ts                ← [NEW] PWA manifest
│   ├── profile/
│   │   └── page.tsx               ← [NEW] Settings page
│   ├── vocab/
│   │   └── page.tsx               ← [NEW] Placeholder page
│   └── apps/
│       └── story-shadowing/
│           └── page.tsx            ← [MODIFY] Mobile-optimized list layout
│
├── components/
│   ├── mobile-shell/
│   │   ├── app-shell.tsx           ← [NEW] Max-width container wrapper
│   │   ├── mobile-tab-bar.tsx      ← [NEW] Bottom tab bar navigation
│   │   └── tab-bar-item.tsx        ← [NEW] Individual tab button
│   ├── dashboard/
│   │   ├── greeting-section.tsx    ← [NEW] Time-based greeting
│   │   ├── continue-learning.tsx   ← [NEW] Last storybook card
│   │   ├── app-shortcuts.tsx       ← [NEW] Micro-app grid
│   │   └── recent-stories.tsx      ← [NEW] Horizontal scroll list
│   ├── settings/
│   │   ├── settings-group.tsx      ← [NEW] Grouped settings section
│   │   ├── toggle-setting.tsx      ← [NEW] Toggle switch item
│   │   └── select-setting.tsx      ← [NEW] Select/navigate item
│   └── story-shadowing/
│       └── ...                     ← [KEEP] Giữ nguyên
│
├── lib/
│   ├── hooks/
│   │   └── use-settings.ts         ← [NEW] Hook đọc/ghi localStorage settings
│   └── ...                         ← [KEEP] Giữ nguyên
│
└── public/
    ├── icons/
    │   ├── icon-192.png            ← [NEW] PWA icon
    │   └── icon-512.png            ← [NEW] PWA icon
    └── sw.js                       ← [NEW] Service Worker
```

---

## 10. Key Design Decisions & Trade-offs

| Quyết định | Lý do | Trade-off |
|------------|-------|-----------|
| **Unified layout** thay vì responsive | Giảm 50% effort, consistent UX, PWA-ready | Không tận dụng desktop screen space |
| **Bottom tab luôn visible** (kể cả Player) | User navigate linh hoạt, không bị kẹt | Mất ~64px vertical space khi đang luyện |
| **Home tab là landing** (không phải Story) | Dashboard overview, entry point cho mọi app | Thêm 1 tap để vào Story |
| **Bỏ Quick Stats** | Chưa có tracking system, tránh fake data | Dashboard ít thông tin hơn |
| **Vocab tab placeholder** | YAGNI — phát triển khi cần | Tab trống có thể gây confused |
| **localStorage settings** | Đơn giản, không cần auth/sync | Mất settings khi clear browser data |
| **Service Worker cache-only** | App cần external APIs, offline limited | Không dùng offline được |
| **max-width: 480px** | Kích thước mobile phone phổ biến | Content hẹp trên tablet |

---

## 11. Phạm vi Phase này

### ✅ Trong scope
- App Shell layout (max-width container)
- Bottom Tab Bar component
- Home tab (Dashboard)
- Story tab (mobile-optimized list)
- Profile tab (Settings với localStorage)
- Vocab tab (Placeholder)
- PWA manifest + basic service worker
- Dark/Light mode

### ❌ Ngoài scope
- User authentication
- Data sync / cloud storage
- Vocab flashcard system (phase sau)
- Offline-first capability
- Push notifications
- Learning stats / streak tracking

---

*Made by Anh Tu - Share to be share*
