# Speaking Quiz Adaptive UI (Contract v1.3) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Nâng cấp toàn diện giao diện Speaking Quiz (`SpeakYourMind`) tương thích chuẩn API Contract v1.3: Hỗ trợ 4 khung tư duy thích ứng (PREP, PAR, STAR, CCR), hiển thị bộ cụm từ bản xứ (Topic Collocations) và tích hợp cơ chế 1-tap lưu từ vựng/collocation vào kho SRS Vocab Review.

**Architecture:** Mở rộng Type definitions theo Contract v1.3, đa hình hóa Card hiển thị giàn giáo hỗ trợ 4 khung tư duy với nhận diện màu sắc/ngữ nghĩa chuyên biệt, bổ sung component tương tác `TopicCollocationsCard`, xây dựng hook `useVocabSave` quản lý trạng thái đồng bộ hai chiều với `/api/vocab` và `/api/vocab/check`, đồng thời duy trì 100% Backward Compatibility với dữ liệu bài học cũ.

**Tech Stack:** Next.js 16 (App Router), React 19, TypeScript 5, TailwindCSS 4, Lucide React, SWR/Fetch.

---

### Task 1: Cập nhật TypeScript Types & Helper Functions theo Contract v1.3

**Files:**
- Modify: `src/lib/types/speaking-quiz.ts`
- Modify: `src/lib/services/speaking-quiz-client.ts`

- [ ] **Step 1: Cập nhật `src/lib/types/speaking-quiz.ts` với đầy đủ Type v1.3**

Bổ sung các Type và Interface:
```typescript
export type FrameworkType = 'PREP' | 'PAR' | 'STAR' | 'CCR';

export interface TopicCollocationItem {
  phrase: string;
  meaning: string;
  ipa?: string;
}

export interface AdaptiveScaffoldStageItem {
  stageKey: string;
  title: string;
  signposts: string[];
  hint: string;
  modelAnswer: string;
}

export interface AdaptiveScaffoldStages {
  stage1: AdaptiveScaffoldStageItem;
  stage2: AdaptiveScaffoldStageItem;
  stage3: AdaptiveScaffoldStageItem;
  stage4?: AdaptiveScaffoldStageItem;
}

export interface SpeakingAdaptiveScaffold {
  frameworkType: FrameworkType;
  frameworkName: string;
  frameworkDescription: string;
  topicCollocations: TopicCollocationItem[];
  stages: AdaptiveScaffoldStages;
}

export type SrsStatus = 'due' | 'learning' | 'mastered' | 'new' | 'unsaved';
```
Cập nhật `TargetKeywordItem` bổ sung `srsStatus?: SrsStatus; isInjected?: boolean;`.
Cập nhật `SpeakingQuestionDetail` bổ sung `adaptiveScaffold?: SpeakingAdaptiveScaffold;`.

- [ ] **Step 2: Bổ sung helper `getSrsBadgeConfig` và cấu hình màu Framework trong service/client**

Bổ sung hàm helper định dạng badge trạng thái SRS và cấu hình thẻ Framework (PREP, PAR, STAR, CCR) vào `src/lib/services/speaking-quiz-client.ts`.

- [ ] **Step 3: Kiểm tra tính tương thích TypeScript**

Chạy: `npx tsc --noEmit`
Kỳ vọng: Không có lỗi biên dịch.

- [ ] **Step 4: Commit thay đổi Task 1**

```bash
git add src/lib/types/speaking-quiz.ts src/lib/services/speaking-quiz-client.ts
git commit -m "feat(vocab): update speaking quiz types and helpers to contract v1.3"
```

---

### Task 2: Xây dựng Hook `useVocabSave` đồng bộ và lưu từ vựng vào SRS

**Files:**
- Create: `src/lib/hooks/use-vocab-save.ts`

- [ ] **Step 1: Viết hook `useVocabSave`**

Hook hỗ trợ:
- Kiểm tra danh sách từ đã lưu ban đầu qua `POST /api/vocab/check`.
- Hàm `saveWord(item: { word: string; ipa?: string; explanation: string; level?: string; sourceStorybookId?: string; sourceStorybookTitle?: string })`: gọi `POST /api/vocab`.
- Trạng thái phản hồi: `isSaved(word)`, `isSaving(word)`.
- Tự động cập nhật `savedWordsSet` ngay khi lưu thành công để UI phản hồi tức thì (Optimistic UI update).

```typescript
import { useState, useEffect, useCallback } from 'react';

export interface SaveWordInput {
  word: string;
  ipa?: string;
  explanation: string;
  level?: string;
  sourceStorybookId?: string;
  sourceStorybookTitle?: string;
}

export function useVocabSave(initialWords: string[] = []) {
  const [savedWords, setSavedWords] = useState<Set<string>>(new Set());
  const [savingWords, setSavingWords] = useState<Set<string>>(new Set());

  // Đồng bộ kiểm tra từ đã lưu trong SRS
  useEffect(() => {
    if (!initialWords || initialWords.length === 0) return;
    const checkWords = async () => {
      try {
        const res = await fetch('/api/vocab/check', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ words: initialWords }),
        });
        if (res.ok) {
          const data = await res.json();
          if (Array.isArray(data.savedWords)) {
            setSavedWords(new Set(data.savedWords.map((w: string) => w.toLowerCase())));
          }
        }
      } catch (err) {
        console.error('[useVocabSave] Check error:', err);
      }
    };
    checkWords();
  }, [JSON.stringify(initialWords)]);

  const isSaved = useCallback((word: string) => {
    return savedWords.has(word.trim().toLowerCase());
  }, [savedWords]);

  const isSaving = useCallback((word: string) => {
    return savingWords.has(word.trim().toLowerCase());
  }, [savingWords]);

  const saveWord = useCallback(async (input: SaveWordInput): Promise<boolean> => {
    const key = input.word.trim().toLowerCase();
    setSavingWords((prev) => new Set(prev).add(key));

    try {
      const res = await fetch('/api/vocab', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          word: input.word.trim(),
          ipa: input.ipa,
          explanation: input.explanation,
          level: input.level || 'B1',
          sourceStorybookId: input.sourceStorybookId,
          sourceStorybookTitle: input.sourceStorybookTitle,
        }),
      });

      if (res.ok) {
        setSavedWords((prev) => new Set(prev).add(key));
        return true;
      }
      return false;
    } catch (err) {
      console.error('[useVocabSave] Save error:', err);
      return false;
    } finally {
      setSavingWords((prev) => {
        const next = new Set(prev);
        next.delete(key);
        return next;
      });
    }
  }, []);

  return { isSaved, isSaving, saveWord };
}
```

- [ ] **Step 2: Kiểm tra biên dịch TypeScript**

Chạy: `npx tsc --noEmit`
Kỳ vọng: PASS

- [ ] **Step 3: Commit thay đổi Task 2**

```bash
git add src/lib/hooks/use-vocab-save.ts
git commit -m "feat(vocab): add useVocabSave hook for 1-tap SRS integration"
```

---

### Task 3: Đa hình hóa Card Giàn Giáo `SpeakingPrepCard` hỗ trợ 4 Khung (PREP, PAR, STAR, CCR)

**Files:**
- Modify: `src/components/vocab/speaking/SpeakingPrepCard.tsx`

- [ ] **Step 1: Mở rộng `SpeakingPrepCard.tsx`**

Cập nhật props và cấu hình màu sắc để hỗ trợ cả 4 khung:
- **PREP:** Point (Emerald), Reason (Blue), Example (Amber), Conclusion/Point (Purple).
- **PAR:** Problem (Rose), Advice/Action (Blue), Result/Alternative (Emerald).
- **STAR:** Situation (Sky), Task (Indigo), Action (Blue), Result (Emerald).
- **CCR:** Claim (Blue), Concession/Counter (Amber), Resolution (Emerald).
- Hỗ trợ truyền linh hoạt `stageLetter`, `stageLabel`, `hint`, `signposts`, `modelAnswer`, hoặc cấu trúc `AdaptiveScaffoldStageItem`.
- Đảm bảo 100% tương thích ngược với code cũ sử dụng `stageKey="P" | "R" | "E" | "P2"`.

- [ ] **Step 2: Kiểm tra biên dịch TypeScript**

Chạy: `npx tsc --noEmit`
Kỳ vọng: PASS

- [ ] **Step 3: Commit thay đổi Task 3**

```bash
git add src/components/vocab/speaking/SpeakingPrepCard.tsx
git commit -m "feat(vocab): adapt SpeakingPrepCard to support PREP, PAR, STAR, CCR frameworks"
```

---

### Task 4: Xây dựng Component `TopicCollocationsCard` tương tác và lưu từ vựng

**Files:**
- Create: `src/components/vocab/speaking/TopicCollocationsCard.tsx`

- [ ] **Step 1: Viết `TopicCollocationsCard.tsx`**

Tính năng:
- Hiển thị danh sách cụm từ bản xứ (`TopicCollocationItem[]`).
- Mỗi item bao gồm: Cụm từ in đậm (`phrase`), phiên âm IPA (`ipa`), định nghĩa tiếng Việt (`meaning`).
- Nút phát âm âm thanh (Audio pronunciation) bằng `vocabSpeaker.speak(item.phrase)`.
- Nút tương tác **1-Tap Save to Vocab Review**:
  - Trạng thái chưa lưu: Icon `BookmarkPlus` hoặc `Plus` + chữ "Save".
  - Trạng thái đang lưu: Icon `Loader2` xoay nhẹ.
  - Trạng thái đã lưu: Icon `Check` màu xanh ngọc + chữ "Saved" (vô hiệu hóa bấm lại).

- [ ] **Step 2: Kiểm tra biên dịch TypeScript**

Chạy: `npx tsc --noEmit`
Kỳ vọng: PASS

- [ ] **Step 3: Commit thay đổi Task 4**

```bash
git add src/components/vocab/speaking/TopicCollocationsCard.tsx
git commit -m "feat(vocab): implement TopicCollocationsCard with audio and 1-tap save"
```

---

### Task 5: Nâng cấp Container `SpeakYourMindPlayer` tích hợp đầy đủ 3 tính năng

**Files:**
- Modify: `src/components/vocab/speaking/SpeakYourMindPlayer.tsx`

- [ ] **Step 1: Tích hợp `useVocabSave` vào `SpeakYourMindPlayer`**

- Gom danh sách từ vựng từ `targetKeywords` và `topicCollocations` để đưa vào hook `useVocabSave`.
- Gắn nút lưu 1-tap cho từng thẻ trong `Target Vocabulary` (kèm hiển thị trạng thái `srsStatus` nếu có).
- Nhúng `TopicCollocationsCard` ngay dưới phần Target Vocabulary.
- Nhận diện `adaptiveScaffold`:
  - Nếu câu hỏi có `adaptiveScaffold`: Render dynamic header (`frameworkName`, `frameworkDescription`), badge khung (`PAR`, `STAR`, `CCR`, `PREP`), và render danh sách stages động theo framework tương ứng.
  - Nếu câu hỏi chỉ có `prepScaffold` (legacy): Fallback về 4 thẻ PREP truyền thống.

- [ ] **Step 2: Kiểm tra biên dịch TypeScript**

Chạy: `npx tsc --noEmit`
Kỳ vọng: PASS

- [ ] **Step 3: Commit thay đổi Task 5**

```bash
git add src/components/vocab/speaking/SpeakYourMindPlayer.tsx
git commit -m "feat(vocab): upgrade SpeakYourMindPlayer with adaptive frameworks, collocations, and save flow"
```

---

### Task 6: Nâng cấp `SpeakYourMindHub` (Methodology Guide 4 Khung & Badges)

**Files:**
- Modify: `src/components/vocab/speaking/SpeakYourMindHub.tsx`

- [ ] **Step 1: Cập nhật Methodology Guide và Question Item Card**

- Phần hướng dẫn phương pháp: Thêm tab chuyển đổi hoặc hiển thị tổng quan 4 khung tư duy (PREP, PAR, STAR, CCR) kèm giải thích trực quan khi nào nên dùng từng khung.
- Trên thẻ câu hỏi (Daily Featured Challenge & danh sách câu hỏi): Hiển thị badge Framework Type (`PREP`, `PAR`, `STAR`, `CCR`) bên cạnh badge cấp độ CEFR (`B1`, `B2`, `C1`).

- [ ] **Step 2: Kiểm tra biên dịch TypeScript**

Chạy: `npx tsc --noEmit`
Kỳ vọng: PASS

- [ ] **Step 3: Commit thay đổi Task 6**

```bash
git add src/components/vocab/speaking/SpeakYourMindHub.tsx
git commit -m "feat(vocab): update SpeakYourMindHub with 4-framework guide and badges"
```

---

### Task 7: Xác thực Toàn diện (Type Safety & Build Verification)

**Files:**
- Toàn bộ codebase liên quan

- [ ] **Step 1: Chạy kiểm tra TypeScript nghiêm ngặt**

Chạy: `npx tsc --noEmit`
Kỳ vọng: 0 lỗi.

- [ ] **Step 2: Chạy kiểm tra Next.js Build**

Chạy: `npm run build`
Kỳ vọng: Build thành công không có warning phá vỡ cấu trúc.

---

*Made by Anh Tu - Share to be share*
