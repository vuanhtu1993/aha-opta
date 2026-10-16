# Fun Feed Virtual Windowing & Predictive Prefetch Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Triển khai cơ chế **Active Viewport Windowing & Predictive Prefetching** cho Fun Feed, chỉ mount `<iframe>` video tại card đang xem thực tế ($i = \text{activeIndex}$), tự động hủy phát khi lướt qua ($i - 1$), pre-cache trước ảnh GIF và poster HD cho card kế tiếp ($i + 1$), và giữ các card ở xa dưới dạng ảnh đại diện tĩnh, giúp giảm 90% dung lượng RAM, triệt tiêu xung đột âm thanh, và duy trì 60 FPS ổn định trên thiết bị di động.

**Architecture:** 
1. **Active Card Tracking Hook (`src/hooks/useActiveFeedIndex.ts`):** Sử dụng `IntersectionObserver` với ngưỡng `threshold: 0.6` để theo dõi chính xác chỉ số card đang chiếm lĩnh màn hình người dùng.
2. **Predictive Prefetch Engine in `FunFeedCard.tsx`:** Nhận prop `isActive` và `isPrefetchTarget`. Nếu `isActive === true`, mount YouTube `<iframe>` hoặc play GIF. Nếu `isActive === false`, chỉ hiển thị ảnh đại diện tĩnh `thumbnailUrl` (zero iframe). Nếu `isPrefetchTarget === true`, kích hoạt tải trước file GIF vào browser cache qua `new Image().src`.
3. **Mute/Audio State Control in `page.tsx`:** Bổ sung nút chuyển đổi âm thanh toàn cục (Global Mute Toggle) ở thanh điều hướng nổi, truyền trạng thái `isMuted` đồng bộ xuống player.

**Tech Stack:** Next.js 16 (App Router), React 19, TypeScript, IntersectionObserver API, Browser Image Pre-caching.

---

### Task 1: Record Architectural Decision in OpenLore

**Files:**
- Command: `npx openlore decisions record`

- [x] **Step 1: Record decision via OpenLore CLI**

Run:
```bash
npx openlore decisions record \
  --title "Adopt Virtual Sliding Window and Predictive Prefetch for Fun Feed Video" \
  --rationale "Mounting multiple concurrent YouTube iframes causes catastrophic RAM bloat and thread contention. A sliding window [i-1, i, i+1] where only the active card mounts an iframe and the next card prefetches poster/GIF assets guarantees 60 FPS and zero background audio leakage" \
  --consequences "Only 1 YouTube iframe exists in the DOM at any moment; inactive cards show lightweight poster thumbnails; next GIF assets are pre-cached in memory" \
  --files "src/hooks/useActiveFeedIndex.ts,src/components/fun-feed/FunFeedCard.tsx,src/app/apps/fun-feed/page.tsx"
```
Expected output: Decision recorded with draft ID.

- [x] **Step 2: Verify OpenLore decisions list**

Run:
```bash
npx openlore decisions --list
```
Expected output: The new decision is listed.

---

### Task 2: Build `useActiveFeedIndex` Custom Hook

**Files:**
- Create: `src/hooks/useActiveFeedIndex.ts`

- [x] **Step 1: Write `src/hooks/useActiveFeedIndex.ts`**

```typescript
/**
 * @file useActiveFeedIndex.ts
 * @description Hook theo dõi Card nào đang chiếm lĩnh khung nhìn (>60% diện tích)
 * phục vụ cơ chế Virtual Sliding Window cho TikTok-style Feed
 * 
 * Made by Anh Tu - Share to be share
 */

"use client";

import { useState, useEffect, RefObject } from "react";

interface UseActiveFeedIndexOptions {
  containerRef: RefObject<HTMLDivElement | null>;
  itemSelector?: string;
  threshold?: number;
}

export function useActiveFeedIndex({
  containerRef,
  itemSelector = "[data-feed-index]",
  threshold = 0.6,
}: UseActiveFeedIndexOptions) {
  const [activeIndex, setActiveIndex] = useState<number>(0);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const cards = container.querySelectorAll<HTMLElement>(itemSelector);
    if (!cards.length) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const rawIndex = entry.target.getAttribute("data-feed-index");
            if (rawIndex !== null) {
              const index = parseInt(rawIndex, 10);
              if (!isNaN(index)) {
                setActiveIndex(index);
              }
            }
          }
        });
      },
      {
        root: container,
        threshold,
      }
    );

    cards.forEach((card) => observer.observe(card));

    return () => {
      observer.disconnect();
    };
  }, [containerRef, itemSelector, threshold]);

  return { activeIndex };
}
```

- [x] **Step 2: Verify TypeScript Compilation for Hook**

Run:
```bash
npx tsc --noEmit
```
Expected output: Exited with code 0.

---

### Task 3: Upgrade `FunFeedCard` with Sliding Window & Prefetch

**Files:**
- Modify: `src/components/fun-feed/FunFeedCard.tsx`

- [x] **Step 1: Update `FunFeedCardProps` and Media Rendering Logic in `FunFeedCard.tsx`**

1. Nhận thêm `index: number`, `isActive: boolean`, `isPrefetchTarget: boolean`, `isMuted: boolean`.
2. Khi `isPrefetchTarget === true && item.type === "gif"`, dùng `useEffect` để chạy `new Image().src = item.mediaUrl` nạp trước vào cache trình duyệt.
3. Khi `isActive === true`:
   - Nếu là YouTube (`item.source === "youtube"`): Render thẻ `<iframe>` với `src={`${item.mediaUrl}?autoplay=1&mute=${isMuted ? 1 : 0}&loop=1&controls=0&modestbranding=1&rel=0`}`.
   - Nếu là GIF: Render thẻ `<img>` với `src={item.mediaUrl}`.
4. Khi `isActive === false`:
   - Tuyệt đối **không render `<iframe>`**!
   - Thay vào đó render ảnh đại diện tĩnh `thumbnailUrl` (hoặc placeholder) kèm một nút Play mờ tinh tế ở trung tâm (poster mode).

```typescript
/**
 * @file FunFeedCard.tsx
 * @description Card hiển thị Meme/Reel tràn màn hình 100vh với Virtual Windowing
 * Chỉ mount Iframe khi isActive = true, nạp trước cache khi isPrefetchTarget = true
 * 
 * Made by Anh Tu - Share to be share
 */

"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { Heart, Bookmark, Flag, Share2, Play } from "lucide-react";
import { FunFeedItem } from "@/lib/types/fun-feed";
import { cn } from "@/lib/utils";
import { ReportModal } from "./ReportModal";

interface FunFeedCardProps {
  index: number;
  item: FunFeedItem;
  isActive: boolean;
  isPrefetchTarget: boolean;
  isMuted?: boolean;
  isLiked: boolean;
  isSaved: boolean;
  onLike: (id: string) => void;
  onSave: (id: string) => void;
  onReport: (id: string, reason: string) => Promise<void>;
}

export function FunFeedCard({
  index,
  item,
  isActive,
  isPrefetchTarget,
  isMuted = true,
  isLiked,
  isSaved,
  onLike,
  onSave,
  onReport,
}: FunFeedCardProps) {
  const [reportModalOpen, setReportModalOpen] = useState(false);
  const [copiedToast, setCopiedToast] = useState(false);

  // 1. Predictive Prefetching: Nạp trước tài nguyên GIF khi là mục tiêu kế tiếp (i + 1)
  useEffect(() => {
    if (isPrefetchTarget && item.type === "gif" && item.mediaUrl) {
      const img = new window.Image();
      img.src = item.mediaUrl;
    }
  }, [isPrefetchTarget, item.type, item.mediaUrl]);

  // Xử lý chia sẻ (Web Share API hoặc Copy link)
  const handleShare = async () => {
    const shareUrl = item.sourceUrl || window.location.href;
    if (navigator.share) {
      try {
        await navigator.share({
          title: item.title,
          text: `Học tiếng Anh hài hước cùng AhaTools: ${item.title}`,
          url: shareUrl,
        });
      } catch {
        // Share cancelled
      }
    } else {
      await navigator.clipboard.writeText(shareUrl);
      setCopiedToast(true);
      setTimeout(() => setCopiedToast(false), 2000);
    }
  };

  const isYouTube = item.type === "short_video" || item.source === "youtube";
  const posterUrl = item.thumbnailUrl || (isYouTube && item.sourceId ? `https://i.ytimg.com/vi/${item.sourceId}/hqdefault.jpg` : undefined);

  return (
    <div
      data-feed-index={index}
      className="relative w-full h-[100dvh] max-h-[100dvh] snap-start flex flex-col justify-between overflow-hidden bg-slate-950 select-none"
    >
      {/* 1. Media Canvas Layer với Virtual Windowing */}
      <div className="absolute inset-0 z-0 flex items-center justify-center bg-black">
        {isActive ? (
          /* ĐANG XEM: Mount Player thực thụ */
          isYouTube ? (
            <iframe
              src={`${item.mediaUrl}?autoplay=1&mute=${isMuted ? 1 : 0}&loop=1&controls=0&modestbranding=1&rel=0&playsinline=1`}
              title={item.title}
              className="w-full h-full border-0 pointer-events-auto"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            />
          ) : (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={item.mediaUrl}
              alt={item.title}
              className="w-full h-full object-contain pointer-events-none"
            />
          )
        ) : (
          /* KHÔNG ACTIVE: Chỉ render Poster Thumbnail tĩnh (0% CPU, 0 Iframe) */
          <div className="relative w-full h-full flex items-center justify-center">
            {posterUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={posterUrl}
                alt={item.title}
                loading={isPrefetchTarget ? "eager" : "lazy"}
                className="w-full h-full object-contain opacity-75"
              />
            ) : (
              <div className="w-full h-full bg-slate-900 flex items-center justify-center text-slate-700">
                <Play className="w-12 h-12 opacity-30" />
              </div>
            )}
          </div>
        )}

        {/* Gradient bóng mờ chân trang */}
        <div className="absolute inset-x-0 bottom-0 h-64 bg-gradient-to-t from-black/90 via-black/40 to-transparent pointer-events-none" />
      </div>

      {/* 2. Top spacer cho Floating Navigation */}
      <div className="h-14 w-full z-10 pointer-events-none" />

      {/* 3. Bottom Layer: Tiêu đề & Cột nút tương tác */}
      <div className="relative z-10 w-full px-4 pb-6 pt-2 flex items-end justify-between gap-3">
        {/* Left: Thông tin học tập tinh gọn */}
        <div className="flex-1 space-y-2 max-w-[82%]">
          {/* Badges: Topic & Level */}
          <div className="flex items-center gap-1.5 flex-wrap">
            {item.topic && (
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-amber-500/90 text-slate-950 backdrop-blur-md shadow-xs">
                #{item.topic}
              </span>
            )}
            {item.level && (
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-emerald-500/90 text-slate-950 backdrop-blur-md shadow-xs">
                {item.level}
              </span>
            )}
            {item.attribution && (
              <span className="text-[10px] text-white/60 font-medium">
                @{item.attribution}
              </span>
            )}
          </div>

          {/* Title */}
          <h2 className="text-sm sm:text-base font-bold text-white leading-snug drop-shadow-md line-clamp-2">
            {item.title}
          </h2>

          {/* Hộp ghi chú sư phạm (Thuần typography không icon thừa) */}
          {(item.whyFunny || item.youLearned) && (
            <div className="p-3 rounded-2xl bg-white/10 dark:bg-slate-900/40 backdrop-blur-md border border-white/15 text-white shadow-lg space-y-1.5">
              {item.whyFunny && (
                <div className="text-xs text-amber-200/95 leading-relaxed">
                  <p>
                    <strong className="font-semibold text-amber-300">Tại sao hài: </strong>
                    {item.whyFunny}
                  </p>
                </div>
              )}

              {item.youLearned && (
                <div className="text-xs text-emerald-200/95 leading-relaxed border-t border-white/10 pt-1.5">
                  <p>
                    <strong className="font-semibold text-emerald-300">Bạn học được: </strong>
                    {item.youLearned}
                  </p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Right: Cột nút hành động chức năng */}
        <div className="flex flex-col items-center gap-3.5 pb-1">
          {/* Like Button */}
          <button
            onClick={() => onLike(item._id)}
            className="flex flex-col items-center gap-1 group"
            title="Thích"
          >
            <div
              className={cn(
                "p-2.5 rounded-full backdrop-blur-md transition-all active:scale-75",
                isLiked
                  ? "bg-rose-500/90 text-white shadow-lg shadow-rose-500/40"
                  : "bg-black/40 text-white/90 hover:bg-black/60 border border-white/15"
              )}
            >
              <Heart
                className={cn(
                  "w-5 h-5 transition-transform",
                  isLiked ? "fill-current scale-110" : "stroke-2"
                )}
              />
            </div>
            <span className="text-[10px] font-bold text-white drop-shadow-md">
              {item.stats.likes}
            </span>
          </button>

          {/* Save Button */}
          <button
            onClick={() => onSave(item._id)}
            className="flex flex-col items-center gap-1 group"
            title="Lưu lại"
          >
            <div
              className={cn(
                "p-2.5 rounded-full backdrop-blur-md transition-all active:scale-75",
                isSaved
                  ? "bg-amber-500/90 text-slate-950 shadow-lg shadow-amber-500/40"
                  : "bg-black/40 text-white/90 hover:bg-black/60 border border-white/15"
              )}
            >
              <Bookmark
                className={cn(
                  "w-5 h-5 transition-transform",
                  isSaved ? "fill-current scale-110" : "stroke-2"
                )}
              />
            </div>
            <span className="text-[10px] font-bold text-white drop-shadow-md">
              {item.stats.saves}
            </span>
          </button>

          {/* Share Button */}
          <button
            onClick={handleShare}
            className="flex flex-col items-center gap-1 group"
            title="Chia sẻ"
          >
            <div className="p-2.5 rounded-full bg-black/40 text-white/90 hover:bg-black/60 backdrop-blur-md border border-white/15 transition-all active:scale-75">
              <Share2 className="w-5 h-5 stroke-2" />
            </div>
            <span className="text-[10px] font-bold text-white drop-shadow-md">
              {copiedToast ? "Đã copy!" : "Share"}
            </span>
          </button>

          {/* Report Button */}
          <button
            onClick={() => setReportModalOpen(true)}
            className="flex flex-col items-center gap-1 group text-white/60 hover:text-rose-400"
            title="Báo cáo vi phạm"
          >
            <div className="p-2 rounded-full bg-black/30 backdrop-blur-md border border-white/10 transition-all active:scale-75">
              <Flag className="w-4 h-4 stroke-2" />
            </div>
          </button>
        </div>
      </div>

      {/* Modal Báo cáo */}
      <ReportModal
        isOpen={reportModalOpen}
        contentTitle={item.title}
        onClose={() => setReportModalOpen(false)}
        onSubmit={(reason) => onReport(item._id, reason)}
      />
    </div>
  );
}
```

- [x] **Step 2: Run ESLint on `FunFeedCard.tsx`**

Run:
```bash
npx eslint src/components/fun-feed/FunFeedCard.tsx
```
Expected output: 0 errors, 0 warnings.

---

### Task 4: Integrate Active Index Tracking & Audio Toggle in `page.tsx`

**Files:**
- Modify: `src/app/apps/fun-feed/page.tsx`

- [x] **Step 1: Update `page.tsx` to Use `useActiveFeedIndex` and Sound Toggle**

1. Tích hợp hook `useActiveFeedIndex({ containerRef })` để nhận biết `activeIndex`.
2. Thêm state `isMuted` với nút bật/tắt âm thanh (`Volume2` / `VolumeX`) trên thanh header.
3. Truyền `index`, `isActive={index === activeIndex}`, `isPrefetchTarget={index === activeIndex + 1}`, `isMuted` vào từng `FunFeedCard`.
4. Gọi `handleSkip(item._id)` nếu lướt qua card mà dừng lại $< 2$ giây.

- [x] **Step 2: Run ESLint on `page.tsx`**

Run:
```bash
npx eslint src/app/apps/fun-feed/page.tsx
```
Expected output: 0 errors, 0 warnings.

Run:
```bash
npx eslint src/app/apps/fun-feed/page.tsx
```
Expected output: 0 errors, 0 warnings.

---

### Task 5: End-to-End Verification & Production Build

**Files:**
- Command: `npx tsc --noEmit` & `npm run build`

- [x] **Step 1: Run TypeScript compiler check**

Run:
```bash
npx tsc --noEmit
```
Expected output: Exited with code 0.

- [x] **Step 2: Run Next.js production build**

Run:
```bash
npm run build
```
Expected output: Static build passes with code 0.

- [ ] **Step 3: Commit changes**

Run:
```bash
git add src/hooks/useActiveFeedIndex.ts src/components/fun-feed/FunFeedCard.tsx src/app/apps/fun-feed/page.tsx docs/superpowers/plans/2026-10-16-fun-feed-video-prefetch-windowing.md
git commit -m "feat(fun-feed): implement virtual sliding window, active iframe mounting, and predictive GIF prefetch"
```

---

*Made by Anh Tu - Share to be share*
