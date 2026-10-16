# AppShell React Server Component (RSC) Architecture Optimization Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Khôi phục `AppShell` thành **Pure React Server Component (RSC)** tĩnh 100%, loại bỏ chỉ thị `"use client"` và hook `usePathname()`, đồng thời áp dụng cơ chế triệt tiêu khoảng đệm (Negative Margin Padding Negation) tại trang `/apps/fun-feed` để bảo toàn trải nghiệm TikTok 100vh tràn viền mà không vi phạm ranh giới Client-Server của Next.js 16 / React 19 (`CON-01`).

**Architecture:** 
1. **Root Layout Decoupling (`src/components/mobile-shell/app-shell.tsx`):** Xóa bỏ toàn bộ runtime logic kiểm tra đường dẫn (`usePathname`) khỏi `AppShell`, biến component này thành Server Component thuần túy không chứa mã JavaScript runtime phía Client.
2. **Localized Viewport Isolation (`src/app/apps/fun-feed/page.tsx`):** Sử dụng lớp `-mb-24` trên thẻ gốc của Fun Feed để triệt tiêu trực tiếp `pb-24` từ `<main>`, giúp khung nhìn khớp chính xác `100dvh` và kích hoạt tính năng CSS Scroll-Snap 60 FPS hoàn hảo.
3. **Architectural Decision Tracking (OpenLore):** Ghi nhận quyết định kiến trúc chuẩn hóa RSC Boundary vào OpenLore store.

**Tech Stack:** Next.js 16 (App Router), React 19 (Server Components), Tailwind CSS 4.

---

### Task 1: Record Architectural Optimization in OpenLore

**Files:**
- Command: `npx openlore decisions record`

- [x] **Step 1: Record decision via OpenLore CLI**

Run:
```bash
npx openlore decisions record \
  --title "Preserve Pure RSC AppShell and Localize Fullscreen Padding Negation" \
  --rationale "Reverting AppShell to a pure Server Component upholds Next.js 16 RSC boundary guidelines (CON-01), keeps root layout zero-runtime JS, and decouples shell from individual sub-app route names" \
  --consequences "AppShell stays route-agnostic; full-screen pages like /apps/fun-feed absorb shell padding locally via negative margin (-mb-24)" \
  --files "src/components/mobile-shell/app-shell.tsx,src/app/apps/fun-feed/page.tsx"
```
Expected output: Decision recorded with draft ID.

- [x] **Step 2: Verify OpenLore decisions list**

Run:
```bash
npx openlore decisions --list
```
Expected output: The optimization decision is listed in the OpenLore store.

---

### Task 2: Revert `AppShell` to Pure React Server Component

**Files:**
- Modify: `src/components/mobile-shell/app-shell.tsx`

- [x] **Step 1: Revert `src/components/mobile-shell/app-shell.tsx`**

Write clean, route-agnostic Server Component code without `"use client"`:
```typescript
import React from "react";

interface AppShellProps {
  children: React.ReactNode;
}

export function AppShell({ children }: AppShellProps) {
  return (
    <div className="min-h-screen w-full bg-slate-200/60 dark:bg-slate-950 flex justify-center selection:bg-amber-400 selection:text-slate-900">
      <div className="w-full max-w-[480px] min-h-screen bg-slate-50 dark:bg-slate-900 border-x border-slate-200/80 dark:border-slate-800 flex flex-col relative app-shell-shadow">
        <main className="flex-1 pb-24 overflow-x-hidden">
          {children}
        </main>
      </div>
    </div>
  );
}
```

- [x] **Step 2: Run ESLint on `AppShell`**

Run:
```bash
npx eslint src/components/mobile-shell/app-shell.tsx
```
Expected output: 0 errors, 0 warnings.

---

### Task 3: Localize Fullscreen Padding Negation in Fun Feed Page

**Files:**
- Modify: `src/app/apps/fun-feed/page.tsx`

- [x] **Step 1: Add `-mb-24` to Root Container in `src/app/apps/fun-feed/page.tsx`**

Update the root container `className` from:
```typescript
<div className="relative w-full h-[100dvh] max-h-[100dvh] bg-black overflow-hidden flex flex-col">
```
To:
```typescript
<div className="relative w-full h-[100dvh] max-h-[100dvh] -mb-24 bg-black overflow-hidden flex flex-col">
```

- [x] **Step 2: Run ESLint on `FunFeedPage`**

Run:
```bash
npx eslint src/app/apps/fun-feed/page.tsx
```
Expected output: 0 errors, 0 warnings.

---

### Task 4: End-to-End Build & Boundary Verification

**Files:**
- Command: `npx tsc --noEmit` & `npm run build`

- [x] **Step 1: Verify TypeScript compilation**

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
Expected output:
- `AppShell` compiles as pure Server Component.
- `/apps/fun-feed` compiles as static route `○ (Static)` without hydration errors.
- Build completes with exit code 0.

- [x] **Step 3: Commit optimization changes**

Run:
```bash
git add src/components/mobile-shell/app-shell.tsx src/app/apps/fun-feed/page.tsx docs/superpowers/plans/2026-10-16-app-shell-rsc-optimization.md
git commit -m "refactor(shell): revert AppShell to pure Server Component and localize fullscreen padding in fun-feed"
```

---

*Made by Anh Tu - Share to be share*
