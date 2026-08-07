# Kế hoạch Cập nhật SYSTEM_DESIGN.md cho Hệ Thống Story Shadowing & Vocab SRS

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Nâng cấp toàn diện tài liệu thiết kế kiến trúc hệ thống `SYSTEM_DESIGN.md` để phản ánh đầy đủ các cải tiến lớn từ commit `a167078737bd6d0c982ec12c631ab09a3fa562c4` đến nay (Vocab SRS, FSRS-4.5, Next.js 16 PPR, Brand System, Create Flow Mobile Refactor).

**Architecture:** Áp dụng phương pháp sư phạm (Pedagogical Approach) với Definition Anatomy, sơ đồ Mermaid trực quan, phân tích Trade-off, và hệ thống hóa chi tiết mã nguồn, mô hình dữ liệu MongoDB, thuật toán FSRS và Partial Prerendering.

**Tech Stack:** Next.js 16 (App Router + PPR), React 19 (Suspense), FSRS-4.5 SRS Engine, MongoDB (Mongoose), LangGraph, Gemini 2.5 Flash, TailwindCSS v4, PWA.

---

### Task 1: Khảo sát và tổng hợp chi tiết các modules mới từ Git History

**Files:**
- Reference: `src/lib/srs/fsrs-engine.ts`
- Reference: `src/lib/srs/review-session.service.ts`
- Reference: `src/lib/srs/distractor-bank.ts`
- Reference: `src/lib/db/models/VocabCard.ts`
- Reference: `src/lib/db/models/VocabReviewLog.ts`
- Reference: `src/components/vocab/review/QuizPlayer.tsx`
- Reference: `src/lib/config/brand.ts`
- Reference: `src/components/story-shadowing/segment-preview-dialog.tsx`
- Reference: `src/components/story-shadowing/agent-progress-toast.tsx`
- Target: `src/app/apps/story-shadowing/design/SYSTEM_DESIGN.md`

- [ ] **Step 1: Đọc và trích xuất thông số chính của các models và services**
- [ ] **Step 2: Phác thảo cấu trúc 13 phần cho SYSTEM_DESIGN.md**

---

### Task 2: Soạn thảo và cập nhật SYSTEM_DESIGN.md toàn diện

**Files:**
- Modify: `src/app/apps/story-shadowing/design/SYSTEM_DESIGN.md`

- [ ] **Step 1: Viết Mục 1 & 2 — Mục tiêu sản phẩm, Hệ sinh thái & Bảng Tech Stack mới**
- [ ] **Step 2: Viết Mục 3 & 4 — Sơ đồ Kiến trúc Tổng thể (Mermaid) & File Tree cập nhật**
- [ ] **Step 3: Viết Mục 5 & 6 — Data Model chi tiết (Storybook, VocabCard, VocabReviewLog) & Thuật toán FSRS-4.5**
- [ ] **Step 4: Viết Mục 7 & 8 — Multi-Tier Distractor Engine & Next.js 16 Partial Prerendering (PPR)**
- [ ] **Step 5: Viết Mục 9, 10 & 11 — State Machines, Danh mục API Routes & Brand Asset System**
- [ ] **Step 6: Viết Mục 12 & 13 — Phases Status (1 đến 13), Design Decisions & Trade-offs**

---

### Task 3: Kiểm thử và hoàn thiện tài liệu

**Files:**
- Target: `src/app/apps/story-shadowing/design/SYSTEM_DESIGN.md`

- [ ] **Step 1: Kiểm tra tính hợp lệ của cú pháp Mermaid và Markdown**
- [ ] **Step 2: Kiểm tra liên kết các file và xác nhận tính chính xác so với codebase hiện tại**
