# Speak Your Mind Hub Dynamic SSR & Cache Cleanup Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Chuyển đổi trang `/vocab/speak-your-mind` sang Dynamic Server Rendering (`force-dynamic`, `revalidate = 0`), gỡ bỏ hoàn toàn Data Cache (`cache: 'no-store'`) và loại bỏ các thao tác `revalidatePath`/`updateTag` không cần thiết, đảm bảo tính nhất quán dữ liệu tức thì (Read-Your-Own-Writes) cho học viên.

**Architecture:** 
1. **Dynamic SSR Transition**: Khai báo `export const dynamic = "force-dynamic"` và `export const revalidate = 0` tại `src/app/vocab/speak-your-mind/page.tsx` nhằm đưa trang về cùng chuẩn kiến trúc với toàn bộ hệ thống `/vocab`.
2. **Direct Data Fetching**: Cập nhật hàm `fetchSpeakingQuestionsList` tại `src/lib/services/speaking-quiz-client.ts` từ Next.js Data Cache Tag (`next: { tags: [...] }`) sang `cache: "no-store"`, chấm dứt việc đóng băng kết quả ở tầng server.
3. **Invalidation Elimination**: Loại bỏ hoàn toàn các lệnh gọi Server Action `revalidateSpeakingHub()` trong flow tạo câu hỏi (`CreateSpeakingQuizClient.tsx` và `SpeakingQuizGenerator.tsx`), tối giản hóa điều hướng client với `router.push("/vocab/speak-your-mind")`.
4. **Architectural Traceability**: Ghi nhận quyết định kiến trúc vào OpenLore để đảm bảo tính liên tục của hệ thống.

**Tech Stack:** Next.js 16 (App Router), React 19, TypeScript, OpenLore Architectural Memory

---

### Task 1: Record Architectural Decision in OpenLore

**Files:**
- Command: `npx openlore decisions record`

- [ ] **Step 1: Ghi nhận quyết định kiến trúc đảo ngược Static ISR sang Dynamic SSR**

Chạy lệnh OpenLore CLI để ghi nhận việc chuyển đổi kiến trúc và lý do đánh đổi:

```bash
npx openlore decisions record \
  --title "Revert Speak Your Mind Hub to Dynamic SSR and Eliminate Invalidation Boilerplate" \
  --rationale "Static ISR introduced multi-layer stale data (Client Router Cache + Full Route Cache SWR delay). Reverting to force-dynamic with cache: no-store restores instant read-your-own-writes consistency after quiz generation and aligns with the rest of /vocab routes." \
  --consequences "The hub is dynamically rendered per request; TTFB is determined by Agent API latency (~150-200ms); all manual revalidation actions and tags are eliminated; zero stale data risk." \
  --files "src/app/vocab/speak-your-mind/page.tsx,src/lib/services/speaking-quiz-client.ts,src/app/vocab/speak-your-mind/create/CreateSpeakingQuizClient.tsx,src/components/vocab/speaking/SpeakingQuizGenerator.tsx,src/lib/actions/speaking-quiz.actions.ts"
```

Expected: Command hoàn tất thành công, in ra Decision ID.

- [ ] **Step 2: Kiểm tra danh sách decisions trong OpenLore**

```bash
npx openlore decisions --list
```

Expected: Bản nháp quyết định mới xuất hiện trong danh sách.

---

### Task 2: Cập nhật Data Fetching Client sang `cache: "no-store"`

**Files:**
- Modify: `src/lib/services/speaking-quiz-client.ts:125-135`

- [ ] **Step 1: Thay thế Next.js Data Cache tag bằng `cache: "no-store"`**

Tại `src/lib/services/speaking-quiz-client.ts`, sửa hàm `fetchSpeakingQuestionsList` để không lưu trữ cache ở máy chủ:

```typescript
export async function fetchSpeakingQuestionsList(filters?: {
  storybookId?: string;
  level?: CefrLevel;
}): Promise<SpeakingQuestionsListResponse> {
  const baseUrl = getAgentsApiBaseUrl();
  const params = new URLSearchParams();
  if (filters?.storybookId) params.append("storybookId", filters.storybookId);
  if (filters?.level) params.append("level", filters.level);

  const query = params.toString() ? `?${params.toString()}` : "";
  const res = await fetch(`${baseUrl}/agents/speaking-quiz/questions${query}`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
    },
    // Không lưu Data Cache để Server Component luôn nhận danh sách đề bài mới nhất từ backend
    cache: "no-store",
  });

  if (!res.ok) {
    throw new Error("Failed to fetch speaking questions list");
  }

  return res.json();
}
```

- [ ] **Step 2: Kiểm tra type check cho file vừa sửa**

```bash
npx tsc --noEmit
```

Expected: Exit code 0, không có lỗi TypeScript.

---

### Task 3: Chuyển đổi Hub Page sang Dynamic Server Rendering

**Files:**
- Modify: `src/app/vocab/speak-your-mind/page.tsx:1-24`

- [ ] **Step 1: Khai báo `dynamic = "force-dynamic"` và `revalidate = 0`**

Cập nhật `src/app/vocab/speak-your-mind/page.tsx` thành:

```tsx
import React from "react";
import { getSpeakingQuestions } from "@/lib/srs/speaking-quiz.service";
import { SpeakYourMindHub } from "@/components/vocab/speaking/SpeakYourMindHub";

/**
 * @file page.tsx
 * @description Dynamic Server Rendered Page for Speak Your Mind Hub.
 * Always fetches the freshest speaking challenge list from the backend on request,
 * eliminating stale data issues without relying on complex cache invalidation.
 *
 * Mapped Spec: FR-VOCAB-06 | FR-VOCAB-07 | US-VOCAB-03
 * Made by Anh Tu - Share to be share
 */

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function SpeakYourMindPage() {
  const questions = await getSpeakingQuestions();

  return (
    <div className="p-4 pt-2">
      <SpeakYourMindHub questions={questions} />
    </div>
  );
}
```

- [ ] **Step 2: Xác nhận cấu hình đồng bộ**

Kiểm tra bằng lệnh tìm kiếm cấu hình `force-dynamic` trong thư mục `src/app/vocab`:

```bash
grep -rn "export const dynamic = \"force-dynamic\"" src/app/vocab/
```

Expected: Cả `vocab/page.tsx`, `vocab/review/page.tsx`, `vocab/speak-your-mind/page.tsx` và `vocab/speak-your-mind/[id]/page.tsx` đều có `force-dynamic`.

---

### Task 4: Loại bỏ các thao tác Invalidation không cần thiết

**Files:**
- Modify: `src/app/vocab/speak-your-mind/create/CreateSpeakingQuizClient.tsx:1-50`
- Modify: `src/components/vocab/speaking/SpeakingQuizGenerator.tsx:1-35,80-96`
- Modify: `src/lib/actions/speaking-quiz.actions.ts:1-26`

- [ ] **Step 1: Dọn dẹp `CreateSpeakingQuizClient.tsx`**

Bỏ `revalidateSpeakingHub` và `try/catch` revalidate không cần thiết tại `src/app/vocab/speak-your-mind/create/CreateSpeakingQuizClient.tsx`:

```tsx
"use client";

/**
 * @file CreateSpeakingQuizClient.tsx
 * @description Client Island wrapper for SpeakingQuizGenerator on the dedicated create page.
 * Navigates back to the Hub on completion where Dynamic SSR serves fresh data.
 *
 * Mapped Spec: FR-VOCAB-07 | US-VOCAB-04 | AC-VOCAB-11 | AC-VOCAB-12
 * Made by Anh Tu - Share to be share
 */

import React from "react";
import { useRouter } from "next/navigation";
import { SpeakingQuizGenerator } from "@/components/vocab/speaking/SpeakingQuizGenerator";
import { ISpeakingQuestion } from "@/lib/types/speaking-quiz";

interface CreateSpeakingQuizClientProps {
  initialStorybookId?: string;
}

export function CreateSpeakingQuizClient({
  initialStorybookId,
}: CreateSpeakingQuizClientProps) {
  const router = useRouter();

  const handleQuizReady = (_newQuestion: ISpeakingQuestion) => {
    // Điều hướng người dùng quay lại trang Hub; Dynamic SSR tự động truy vấn danh sách câu hỏi mới nhất từ database
    router.push("/vocab/speak-your-mind");
    router.refresh();
  };

  return (
    <SpeakingQuizGenerator
      initialStorybookId={initialStorybookId}
      onQuizReady={handleQuizReady}
      onCancel={() => {
        router.push("/vocab/speak-your-mind");
      }}
    />
  );
}
```

- [ ] **Step 2: Dọn dẹp `SpeakingQuizGenerator.tsx`**

Xóa bỏ import `revalidateSpeakingHub` và logic gọi Server Action tại nhánh fallback (dòng ~85-95) trong `src/components/vocab/speaking/SpeakingQuizGenerator.tsx`:

1. Xóa dòng import:
```diff
- import { revalidateSpeakingHub } from "@/lib/actions/speaking-quiz.actions";
```

2. Cập nhật nhánh hoàn tất tạo quiz trong `handleGenerate`:
```typescript
      if (onQuizReady) {
        await onQuizReady(question);
      } else {
        // Trang Hub là Dynamic SSR nên chỉ cần điều hướng trực tiếp
        router.push("/vocab/speak-your-mind");
        router.refresh();
      }
```

- [ ] **Step 3: Biến `speaking-quiz.actions.ts` thành No-op / Deprecated**

Cập nhật `src/lib/actions/speaking-quiz.actions.ts` để không chạy các lệnh cache invalidate rườm rà:

```typescript
"use server";

/**
 * @file speaking-quiz.actions.ts
 * @description Server Actions for Speak Your Mind (PREP Speaking).
 * (Deprecated: Route and service now use Dynamic Server Rendering with cache: 'no-store').
 *
 * Mapped Spec: FR-VOCAB-06 | FR-VOCAB-07 | US-VOCAB-03 | US-VOCAB-04
 * Made by Anh Tu - Share to be share
 */

/**
 * @deprecated Speak Your Mind Hub is now configured with Dynamic SSR (force-dynamic).
 * Explicit cache revalidation is no longer required.
 */
export async function revalidateSpeakingHub(): Promise<void> {
  // No-op: Trang Hub đã chuyển sang Dynamic SSR với cache: 'no-store', không cần invalidate thủ công
}
```

---

### Task 5: Xác minh và Kiểm thử toàn diện (Verification)

**Files:**
- Commands: `npm run build`, `npm run lint`

- [ ] **Step 1: Chạy kiểm tra tĩnh linter**

```bash
npm run lint
```

Expected: Exit code 0, không có cảnh báo unhandled imports hoặc type errors.

- [ ] **Step 2: Chạy Next.js Production Build**

```bash
npm run build
```

Expected:
1. Build thành công (Exit code 0).
2. Tuyến đường `/vocab/speak-your-mind` hiển thị biểu tượng `ƒ Dynamic` (Server-rendered on demand), thay vì `○ Static`.

Ví dụ output mong đợi trong bảng Routes của Next.js:
```
ƒ /vocab/speak-your-mind                      ... Dynamic
```

- [ ] **Step 3: Đồng bộ OpenLore decisions**

```bash
npx openlore decisions --sync
```

Expected: Exit code 0, lưu vết hoàn tất.

---
*Made by Anh Tu - Share to be share*
