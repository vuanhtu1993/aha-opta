# Phase 09 — Vocab Cloze Quiz: From Recognition to Production

> **Design Spec** — Nâng cấp hệ thống ôn tập từ vựng từ MCQ (nhận diện) sang Cloze (sản xuất câu)
> Ngày tạo: 2026-08-17
> Trạng thái: Approved (Brainstorming hoàn tất)

---

## 1. Problem Statement

### Gap hiện tại
Hệ thống quiz hiện tại chỉ test **passive recognition**: nhìn từ → chọn định nghĩa đúng (MCQ).
Kết quả: user nhớ từ tại thời điểm học, nhưng không biết đặt câu trong ngữ cảnh thực tế.

### Cognitive gap
```
Passive Recognition (MCQ)  ≠  Active Production (Usage)
"Biết từ credentials là gì"  ≠  "Dùng credentials đúng trong câu"
```

### Root cause
MCQ chỉ kích hoạt **recognition memory** (nhận diện). Để làm chủ từ vựng, cần kích hoạt thêm **production memory** — tức là buộc não phải *tự sinh ra* từ đó trong ngữ cảnh đúng.

---

## 2. Solution: FSRS-Driven Progressive Difficulty

### Core idea
Khi từ đã quen (stability ≥ 3 ngày), tự động chuyển quiz mode từ MCQ sang **Cloze** — điền từ vào câu hoàn chỉnh.

```
stability < 3 ngày  → MCQ Mode:   "What does 'credentials' mean?" → [A] [B] [C] [D]
stability ≥ 3 ngày  → Cloze Mode: "Your ___ are required to log in." → [text input]
```

### Tại sao threshold = 3 ngày?
- `stability = 1` → từ hoàn toàn mới, chưa ổn định trong ký ức
- `stability = 3` → đã qua ~2 lần review thành công, nhớ tạm ổn
- Đây là điểm lý tưởng để "thách thức" não bằng production task

---

## 3. Data Layer

### 3.1 Schema Extension — VocabCard MongoDB Document

Thêm field `exampleSentences` vào VocabCard document:

```ts
// Thêm vào VocabCard Mongoose Model
exampleSentences: [{
  sentence: String,    // "Your ___ are required to log into the system."
  answer: String,      // "credentials" — từ gốc, dùng để fuzzy match
}]
```

Schema Zod validation:
```ts
exampleSentences: z.array(z.object({
  sentence: z.string(),
  answer: z.string(),
})).optional()
```

### 3.2 AI Generation Strategy

**Gemini Prompt (English 100%):**
```
You are an English vocabulary teacher. Generate exactly 3 fill-in-the-blank sentences for the word "${word}" (${level} level).

Definition: "${explanation}"

Requirements:
- Each sentence must be natural, native-speaker quality
- The word "${word}" must appear exactly once per sentence, replaced with "___"
- Sentences should reflect real IT/professional/academic usage contexts
- Vary sentence structure (simple, compound, complex)

Return ONLY valid JSON (no markdown, no explanation):
[
  {"sentence": "Your ___ are required to log into the system.", "answer": "${word}"},
  {"sentence": "...", "answer": "${word}"},
  {"sentence": "...", "answer": "${word}"}
]
```

### 3.3 Generation Triggers

**Trigger 1: Backfill Script (One-time)**
- File: `/scripts/enrich-vocab-sentences.ts`
- Chạy: `npx ts-node --project tsconfig.scripts.json scripts/enrich-vocab-sentences.ts`
- Logic:
  1. Fetch toàn bộ VocabCards không có `exampleSentences`
  2. Gọi Gemini API với rate-limiting (100ms delay giữa các calls)
  3. Lưu kết quả vào MongoDB
  4. Log tiến trình: `Processed 12/45 cards...`

**Trigger 2: Auto-Gen khi Save New Card**
- Endpoint: `POST /api/vocab` (save vocab card từ Story Shadowing)
- Flow hiện tại: save card → return response
- Flow mới: save card → **trigger background gen** (non-blocking) → return response ngay
- Implementation: Fire-and-forget async call sau khi save, không block response

```ts
// Trong POST /api/vocab handler
const savedCard = await VocabCard.create(validatedData);

// Non-blocking: trigger example generation in background
generateAndSaveExampleSentences(savedCard._id.toString(), savedCard.word, savedCard.explanation, savedCard.level)
  .catch(err => console.error('[vocab-enrich] Failed:', err));

return NextResponse.json({ success: true, card: savedCard });
```

---

## 4. Quiz Mode Logic

### 4.1 QuizQuestion Interface (Extended)

```ts
export interface QuizQuestion {
  cardId: string;
  word: string;
  ipa?: string;
  level: string;
  wordFamily?: any[];
  collocations?: any[];
  sourceStorybookTitle?: string;
  explanation: string;
  options: QuizOption[];           // MCQ options (populated always, used only in MCQ mode)
  exampleSentences?: Array<{       // NEW
    sentence: string;
    answer: string;
  }>;
  quizMode: 'mcq' | 'cloze';      // NEW — determined by stability threshold
  fsrsState: {
    due: string;
    reps: number;
    stability: number;
  };
}
```

### 4.2 Mode Selection Logic (in `review-session.service.ts`)

```ts
const CLOZE_THRESHOLD_DAYS = 3;

// Trong map() tạo QuizQuestion:
const stability = card.fsrs?.stability ?? 0;
const hasExamples = card.exampleSentences && card.exampleSentences.length > 0;
const quizMode: 'mcq' | 'cloze' =
  stability >= CLOZE_THRESHOLD_DAYS && hasExamples ? 'cloze' : 'mcq';
```

**Fallback rule:** Nếu card có stability ≥ 3 nhưng chưa có `exampleSentences` (chưa gen kịp) → fall back về MCQ. Không bao giờ hiện Cloze trống.

---

## 5. UX Design — ClozeQuizCard Component

### 5.1 Quiz Flow

```
┌─────────────────────────────────────────┐
│  ✏️ Fill in the Blank   1 / 5          │  ← Header (mode badge + progress)
├─────────────────────────────────────────┤
│                                         │
│  "Your ___ are required to              │
│   log into the system."                 │  ← Câu với ___ chỗ trống
│                                         │
│  [credentials / level: B2]             │  ← Hint: word level (không hiện chữ)
│                                         │
├─────────────────────────────────────────┤
│  ┌──────────────────────────────────┐  │
│  │  Type the missing word...       │  │  ← Text input (auto-focus)
│  └──────────────────────────────────┘  │
│                                         │
│              [Check Answer]             │  ← Submit button (hoặc Enter key)
└─────────────────────────────────────────┘
```

### 5.2 Feedback After Submit

**Correct answer:**
```
┌─────────────────────────────────────────┐
│  ✅ Correct!                            │
│                                         │
│  "Your credentials are required to     │
│   log into the system."                │  ← Câu đầy đủ, từ được BOLD + highlight
│                                         │
│  ⚡ 2.3s  │  📈 Next review: +14 days │
│                                         │
│              [Next →]                   │
└─────────────────────────────────────────┘
```

**Incorrect/Fuzzy near-miss:**
```
┌─────────────────────────────────────────┐
│  ✏️ Almost! The correct word is:        │
│  → credentials                          │  ← Hiện đáp án đúng
│                                         │
│  "Your credentials are required to     │
│   log into the system."                │
│                                         │
│  📉 Scheduled for review sooner         │
│                                         │
│              [Next →]                   │
└─────────────────────────────────────────┘
```

### 5.3 Fuzzy Match Algorithm

```ts
import { distance } from 'fastest-levenshtein';  // 0-dependency, ~1KB

const CLOZE_THRESHOLD = 2; // max edit distance allowed

export function isClozeCorrect(userInput: string, answer: string): boolean {
  const normalized_input = userInput.trim().toLowerCase();
  const normalized_answer = answer.trim().toLowerCase();
  return distance(normalized_input, normalized_answer) <= CLOZE_THRESHOLD;
}
```

**Ví dụ:**
- `"credentials"` vs `"credentials"` → distance = 0 → ✅ Correct
- `"credencials"` vs `"credentials"` → distance = 2 → ✅ Accepted (fuzzy)
- `"credential"` vs `"credentials"` → distance = 1 → ✅ Accepted (missing 's')
- `"cred"` vs `"credentials"` → distance = 8 → ❌ Wrong

### 5.4 Component Architecture

```
components/vocab/review/
├── QuizPlayer.tsx          ← [MODIFY] Detect quizMode, render MCQ or Cloze
├── MCQCard.tsx             ← [NEW] Extract MCQ UI from QuizPlayer
├── ClozeCard.tsx           ← [NEW] Cloze fill-in-the-blank UI
├── QuizFeedback.tsx        ← [NEW] Shared feedback drawer (used by both modes)
└── QuizSkeleton.tsx        ← [KEEP] Unchanged
```

**QuizPlayer.tsx orchestration:**
```tsx
// QuizPlayer điều phối giữa 2 modes
{currentQ.quizMode === 'cloze' && currentQ.exampleSentences?.length > 0
  ? <ClozeCard question={currentQ} onSubmit={handleClozeSubmit} />
  : <MCQCard question={currentQ} onSelect={handleSelectOption} />
}
```

---

## 6. API Layer

### 6.1 Không thêm endpoint mới

Cloze quiz sử dụng **cùng endpoint** `/api/vocab/review` với MCQ. FSRS engine không phân biệt quiz mode — chỉ cần `{cardId, isCorrect, responseTimeMs}`.

```ts
// POST /api/vocab/review — không thay đổi contract
{
  cardId: string;
  isCorrect: boolean;   // true nếu fuzzy match pass
  responseTimeMs: number;
}
```

### 6.2 New Utility Function

```ts
// lib/vocab/cloze-enricher.ts — NEW
export async function generateAndSaveExampleSentences(
  cardId: string,
  word: string,
  explanation: string,
  level: string
): Promise<void>
```

---

## 7. File Structure (Dự kiến thay đổi)

```
src/
├── lib/
│   ├── vocab/
│   │   └── cloze-enricher.ts         ← [NEW] AI generation utility
│   └── srs/
│       ├── review-session.service.ts  ← [MODIFY] Add quizMode selection logic
│       └── cloze-scorer.ts            ← [NEW] Fuzzy match scoring
│
├── components/vocab/review/
│   ├── QuizPlayer.tsx                 ← [MODIFY] Route MCQ/Cloze
│   ├── MCQCard.tsx                    ← [NEW] Extracted MCQ UI
│   ├── ClozeCard.tsx                  ← [NEW] Fill-in-the-blank UI
│   └── QuizFeedback.tsx               ← [NEW] Shared feedback component
│
├── app/api/vocab/
│   └── route.ts                       ← [MODIFY] Auto-gen trigger on POST
│
└── scripts/
    └── enrich-vocab-sentences.ts      ← [NEW] One-time backfill script
```

---

## 8. Key Design Decisions & Trade-offs

| Quyết định | Lý do | Trade-off |
|------------|-------|-----------|
| **Stability ≥ 3d → Cloze** | Đủ để nhớ, sớm để thử production | Threshold có thể cần tune sau |
| **Fallback về MCQ** nếu chưa gen xong | Không bao giờ block quiz session | User có thể không thấy Cloze ngay |
| **Fire-and-forget gen** khi save card | Non-blocking UX, không chậm save flow | Cloze không available ngay lập tức |
| **Levenshtein ≤ 2** fuzzy match | Thân thiện với typo nhỏ | Có thể accept wrong word nếu tên tương tự |
| **Cùng `/api/vocab/review` endpoint** | Không cần thay đổi FSRS engine | FSRS không phân biệt quiz mode |
| **Extract MCQCard component** | Separation of concerns, dễ test | Thêm 1 file nhỏ |

---

## 9. Phạm vi Phase 09

### ✅ Trong scope
- `exampleSentences` field trong VocabCard schema
- Gemini-based example sentence generation utility
- One-time backfill script
- Auto-gen trigger khi save vocab card mới
- Cloze Quiz mode trong QuizPlayer
- Fuzzy match scoring (Levenshtein)
- MCQCard component (extracted)
- ClozeCard component (new)
- QuizFeedback shared component

### ❌ Ngoài scope
- AI scoring (Gemini check semantic correctness)
- Cloze-specific FSRS parameters (ratings khác MCQ)
- Configurable threshold trong Settings UI
- Batch regenerate nếu câu không tốt
- Hint system (số chữ cái, gợi ý đầu từ)

---

*Made by Anh Tu - Share to be share*
