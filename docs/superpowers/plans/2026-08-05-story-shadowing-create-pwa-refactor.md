# Story Shadowing Create PWA Mobile-First Refactor Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Refactor Story Shadowing Create Page, Segment Preview Dialog, and Agent Progress Toast to modern PWA Mobile-First standards with touch gestures, bottom sheets, dynamic island HUD, dark mode, and thumb-friendly ergonomics.

**Architecture:** Replace desktop modals and layouts with mobile drawer sheets (`vaul` / `framer-motion`), top-anchored dynamic capsule progress HUD, and mobile segmented controls with sticky bottom action dock.

**Tech Stack:** Next.js 16 (App Router), React 19, Tailwind CSS v4, Framer Motion, Vaul Drawer, Lucide React, Zustand.

---

### Task 1: Refactor `AgentProgressToast` to Mobile Dynamic Island HUD

**Files:**
- Modify: `src/components/story-shadowing/agent-progress-toast.tsx`

- [ ] **Step 1: Update AgentProgressToast layout and styling for mobile viewport**
  - Anchor at `fixed top-16 left-1/2 -translate-x-1/2 w-[calc(100%-2rem)] max-w-[448px] z-50`
  - Add dark glassmorphism styling (`bg-slate-900/95 dark:bg-slate-900/95 backdrop-blur-md shadow-2xl border border-white/10 text-white rounded-2xl`)
  - Implement dynamic animated progress bar with amber highlight (`#FFBA49`)
  - Add micro-stepper with smooth transitions for active/completed steps

- [ ] **Step 2: Verify component compiles without errors**

---

### Task 2: Refactor `SegmentPreviewDialog` to Mobile Bottom Sheet Drawer

**Files:**
- Modify: `src/components/story-shadowing/segment-preview-dialog.tsx`

- [ ] **Step 1: Replace desktop centered modal with Mobile Bottom Sheet**
  - Implement smooth bottom sheet overlay with backdrop blur and drag handle pill
  - Add quick action filter pills ("Chọn tất cả", "Bỏ chọn tất cả", Counter badge)
  - Style segment cards for easy touch toggles, clear duration tags, and clean inline editing
  - Anchor sticky footer confirm button at the bottom of the drawer

- [ ] **Step 2: Verify component compiles without errors**

---

### Task 3: Refactor `CreatePlayerPage` to PWA Mobile-First Layout

**Files:**
- Modify: `src/app/apps/story-shadowing/create/page.tsx`

- [ ] **Step 1: Redesign page layout and tab navigation**
  - Replace `max-w-2xl py-12` container with `px-4 pt-3 pb-28 space-y-4`
  - Implement animated Segmented Control tab switcher (🎬 YouTube, 🌐 Web URL, ✍️ Nhập Text)
  - Add Quick Paste from Clipboard feature for inputs
  - Add YouTube video preview card with thumbnail and title
  - Redesign Voice Selector with clear, touch-friendly visual cards
  - Implement Sticky Floating Action Dock at bottom of the mobile shell (`fixed bottom-16 left-1/2 -translate-x-1/2 max-w-[480px]`)
  - Full Dark Mode support across all elements

- [ ] **Step 2: Run build to verify TypeScript and linting**
  - Run `pnpm build` or check next dev compile status.

---

<div align="center" style="margin-top: 2rem; opacity: 0.75; font-size: 0.85rem;">
Made by Anh Tu - Share to be share
</div>
