# AI Story Shadowing — Implementation Plan

> **Tài liệu kế hoạch triển khai** — Dành cho agentic workers và Anh Tú theo dõi tiến độ.
>
> 📐 **Kiến trúc tổng quan** → Xem [`SYSTEM_DESIGN.md`](./SYSTEM_DESIGN.md)
>
> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

---

## 📊 Trạng thái Tổng thể (Progress Overview)

| Phase | Tên | Trạng thái |
|---|---|---|
| Phase 1 | Core Shadowing (Text) | ✅ Done |
| Phase 2 | Voice & AI Leveling | ✅ Done |
| Phase 3 | IPA Phonetic Transcription | ✅ Done |
| Phase 4 | Article URL Import | ✅ Done |
| Phase 5 | Core Vocabulary Extraction | ✅ Done |
| Phase 5.1 | Deep Vocabulary (Word Family & Collocations) | ✅ Done |
| Phase 6 | YouTube Video Shadowing | ✅ Done |
| Phase 6.1 | Vocabulary Enrichment (Schema Refactor) | ✅ Done |
| Phase 7 | Smart Video Splitting (AI-Suggested Segments) | ✅ Done |
| **Phase 8** | **Keyword Pipeline Refactor** | 🔲 Planned |

---

## ✅ Đã hoàn thành (Phases 1–7)

> **Ghi chú:** Phases 1–7 đã được implement đầy đủ. Chi tiết thiết kế xem tại [`SYSTEM_DESIGN.md`](./SYSTEM_DESIGN.md).

---

## 🆕 Phase 8: Keyword Pipeline Refactor — Tách nhiệm vụ & Tăng Coverage

### 📌 Bối cảnh & Vấn đề

**Vấn đề 1: Keyword coverage thấp**
Node `keywordExtractorNode` hiện tại extract **5–10 từ** theo judgment của Gemini. Với bài dài hoặc chủ đề chuyên sâu, nhiều từ khó và idiom bị bỏ sót — người học không thể tra nghĩa ngay trong app.

**Vấn đề 2: Node làm quá nhiều việc (Single Responsibility bị vi phạm)**
Một node duy nhất đang thực hiện **4 nhiệm vụ** khác nhau:

```
keywordExtractorNode (hiện tại)
├── 1. Identify từ khó (B2–C2)
├── 2. Generate explanation (đơn giản B1)
├── 3. Generate IPA cho từ chính
└── 4. Generate wordFamily + collocations
```

Khi yêu cầu quá nhiều cùng một lúc, Gemini có xu hướng:
- Bỏ sót từ để giảm tải (coverage thấp)
- Hallucinate IPA không chuẩn (vì phải "nhớ" quá nhiều thứ)
- Cắt bớt wordFamily/collocations để tránh vượt limit

**Vấn đề 3: Duplicate code (DRY vi phạm)**
Có 2 file node riêng biệt (`keyword-extractor.node.ts` và `youtube-keyword-extractor.node.ts`) làm cùng logic nhưng nhận input state khác nhau. Khi refactor, cả 2 file sẽ được hợp nhất thông qua shared helper function.

---

### 🏛️ Architecture Decision: Hybrid Pipeline (AI + Dictionary API)

#### Phân tích Trade-off

| Giải pháp | Ưu điểm | Nhược điểm | Quyết định |
|---|---|---|---|
| **A: Chỉ dùng Gemini** (hiện tại) | Đơn giản, 1 call | Coverage thấp, IPA có thể sai, không có idiom | ❌ Vấn đề hiện tại |
| **B: Chỉ dùng Free Dictionary API** (dictionaryapi.dev) | Free, IPA chuẩn, có definitions | Không có idiom/phrasal verb, thiếu từ chuyên ngành | ❌ Không đủ |
| **C: Hybrid — Gemini identify + Dictionary API enrich** | Coverage rộng, IPA đáng tin cậy, Gemini giải thích idiom | Thêm external call, latency nhỉnh hơn | ✅ **CHỌN** |

#### Kiến trúc Pipeline mới (3 bước)

```
[Step 1] Keyword Identifier (Gemini)
  Input: rawText
  Task: Xác định TẤT CẢ từ khó, idiom, phrasal verb quan trọng
  Output: [{word, type: "word" | "idiom" | "phrasal_verb", context, level}]
        ↓ (parallel)
[Step 2a] Dictionary Enricher (Free Dict API)   [Step 2b] Gemini Enricher
  Input: items có type = "word"                   Input: items có type = "idiom" | "phrasal_verb"
  Fetch: IPA chuẩn, definition, synonyms          Task: Explain meaning + usage (từ context câu)
  Fallback nếu 404/timeout → Step 2b              Output: {explanation, example}
        ↓ (merge)
[Step 3] Final Assembler (trong keyword-enricher)
  Merge kết quả từ 2a và 2b
  Build KeywordSchema object đầy đủ
  Return: keywords[]
```

**Lý do tách Step 2a và 2b:**
- Dictionary API **không có** idiom/phrasal verb một cách nhất quán (nguồn Wiktionary, community-driven)
- Gemini **giỏi** giải thích ngữ cảnh idiom hơn (vì hiểu cả câu xung quanh qua `context` field)
- Dictionary API cung cấp IPA **chuẩn xác** hơn Gemini cho single words (~98% vs ~80%)

---

### 🏗️ Task Breakdown

#### Task 8.1: Tạo Node mới — `keyword-identifier.node.ts`

**Files:**
- Create: `src/lib/agents/story-shadowing-agent/nodes/keyword-identifier.node.ts`

**Nhiệm vụ duy nhất:** Chỉ xác định danh sách từ khó — **không** giải thích, **không** IPA.

**Prompt Engineering:** Yêu cầu Gemini đóng vai **biên tập viên từ điển học** (không phải giáo viên), liệt kê mọi đơn vị từ vựng cần giải thích cho học viên B1.

**Output schema:**

```typescript
z.object({
  items: z.array(z.object({
    word: z.string(),           // Từ hoặc cụm từ (idiom giữ nguyên cả cụm)
    type: z.enum(["word", "idiom", "phrasal_verb"]),
    context: z.string(),        // Câu chứa từ này (giúp Step 2b giải thích đúng nghĩa)
    level: z.enum(["medium", "hard"]),
  }))
})
```

**Quantity target:** Yêu cầu Gemini extract **ít nhất 5, tối đa 15 items** (tăng ceiling từ 10 lên 15).

- [ ] Viết System Prompt tập trung vào identification only (không explanation)
- [ ] Viết Zod schema cho output (`IdentifiedKeywordListSchema`)
- [ ] Implement node function nhận `rawText: string`
- [ ] Export shared helper: `identifyKeywords(rawText: string)` — dùng cho cả Text và YouTube pipeline

---

#### Task 8.2: Tạo Service — `dictionary-api.service.ts`

**Files:**
- Create: `src/lib/services/dictionary-api.service.ts`

**Nhiệm vụ:** Wrap Free Dictionary API (`https://api.dictionaryapi.dev/api/v2/entries/en/<word>`) thành helper function có timeout và fallback.

**Interface:**

```typescript
interface DictionaryResult {
  ipa: string | null;          // Lấy từ phonetics[0].text
  audioUrl: string | null;     // Lấy từ phonetics[].audio (bonus feature)
  definitions: {
    partOfSpeech: string;
    definition: string;
    example?: string;
    synonyms: string[];
  }[];
}

async function lookupWord(word: string): Promise<DictionaryResult | null>
```

**Xử lý edge cases:**
- Trả về `null` nếu API trả về 404 (từ không có → sẽ fallback sang Gemini)
- Timeout 3 giây — quá thời gian cũng trả về `null`
- Batch lookup với `Promise.allSettled()` — partial failure không làm crash toàn bộ

- [ ] Implement `lookupWord()` với timeout wrapper
- [ ] Xử lý 404 và network error trả về `null`
- [ ] Export `batchLookup(words: string[])` dùng `Promise.allSettled()`

---

#### Task 8.3: Tạo Node mới — `keyword-enricher.node.ts`

**Files:**
- Create: `src/lib/agents/story-shadowing-agent/nodes/keyword-enricher.node.ts`

**Nhiệm vụ:** Nhận `identifiedKeywords[]` từ state, enrich mỗi item với thông tin chi tiết từ nguồn phù hợp, trả về `keywords[]` đầy đủ theo `KeywordSchema`.

**Logic phân nhánh:**

```typescript
// Routing: word → Dictionary API → Gemini fallback
//          idiom/phrasal_verb → Gemini trực tiếp
async function enrichKeywords(items: IdentifiedItem[]): Promise<Keyword[]> {
  const results = await Promise.allSettled(
    items.map(async (item) => {
      if (item.type === "word") {
        const dictResult = await lookupWord(item.word);
        if (dictResult) return buildFromDictionary(item, dictResult);
        // Fallback nếu Dictionary API miss
      }
      // idiom / phrasal_verb hoặc fallback: Gemini với context
      return enrichWithGemini(item);
    })
  );
  return results
    .filter(r => r.status === "fulfilled")
    .map(r => (r as PromiseFulfilledResult<Keyword>).value);
}
```

**Gemini enrichment prompt (focused):** Chỉ yêu cầu `explanation + wordFamily + collocations` — **không** yêu cầu Gemini generate IPA (IPA đã được lấy từ Dictionary API với độ chính xác cao hơn).

- [ ] Implement enrichment router
- [ ] Implement `buildFromDictionary(item, dictResult)` — map Dictionary API response → KeywordSchema
- [ ] Implement `enrichWithGemini(item)` — prompt tập trung vào explanation + wordFamily + collocations
- [ ] Node wrapper nhận state, gọi `enrichKeywords()`, trả về `{ keywords }`
- [ ] Export shared helper `enrichKeywords()` — dùng cho cả Text và YouTube pipeline

---

#### Task 8.4: Refactor Graph — Cập nhật `graph.ts`

**Files:**
- Modify: `src/lib/agents/story-shadowing-agent/graph.ts`
- Delete: `src/lib/agents/story-shadowing-agent/nodes/keyword-extractor.node.ts`

**Pipeline mới:**

```
START → sentenceSplitter → ttsGenerator → END
START → keywordIdentifier → keywordEnricher → END
```

> [!IMPORTANT]
> `keywordEnricher` cần nhận output từ `keywordIdentifier` nên chúng phải **sequential** (không parallel được). Chỉ nhánh `sentenceSplitter` và nhánh `keyword` mới chạy parallel với nhau.

- [ ] Thêm node `keywordIdentifier` và `keywordEnricher` vào graph
- [ ] Kết nối edges: `START → keywordIdentifier → keywordEnricher → END`
- [ ] Xóa node `keywordExtractor` cũ (cả trong graph lẫn file)
- [ ] Cập nhật `runStorybookPipeline()`: stream handlers + log messages mới

---

#### Task 8.5: Cập nhật `state.ts` — Thêm intermediate state

**Files:**
- Modify: `src/lib/agents/story-shadowing-agent/state.ts`

Thêm field trung gian để truyền kết quả từ `keywordIdentifier` sang `keywordEnricher`:

```typescript
// === Node: KeywordIdentifier Output (intermediate) ===
identifiedKeywords: Annotation<Array<{
  word: string;
  type: "word" | "idiom" | "phrasal_verb";
  context: string;
  level: "medium" | "hard";
}>>({
  reducer: (_, y) => y,
}),
```

- [ ] Thêm `identifiedKeywords` annotation vào `StorybookAgentState`

---

#### Task 8.6: Hợp nhất YouTube Pipeline

**Files:**
- Modify: `src/lib/agents/story-shadowing-agent/youtube-graph.ts`
- Modify: `src/lib/agents/story-shadowing-agent/youtube-state.ts`
- Delete: `src/lib/agents/story-shadowing-agent/nodes/youtube-keyword-extractor.node.ts`

Tái sử dụng shared helpers `identifyKeywords()` và `enrichKeywords()` từ Task 8.1 và 8.3 — không viết lại logic. Chỉ cần node wrapper mỏng nhận đúng state type của YouTube pipeline.

- [ ] Thêm `identifiedKeywords` vào `YouTubeShadowingAgentState`
- [ ] Tạo YouTube-specific node wrappers gọi shared helpers
- [ ] Cập nhật `youtube-graph.ts` theo pattern mới
- [ ] Xóa file `youtube-keyword-extractor.node.ts`

---

#### Task 8.7: Verification

- [ ] **Build check:** `npx tsc --noEmit` — Expected: 0 errors
- [ ] **Manual test 1 — Word coverage:** Nhập đoạn văn IELTS C1 → Kiểm tra keywords nhiều hơn trước, đủ từ khó
- [ ] **Manual test 2 — Idiom:** Nhập đoạn văn chứa idiom (`bite the bullet`, `under the weather`) → Kiểm tra idiom xuất hiện với giải thích đúng nghĩa trong ngữ cảnh
- [ ] **Manual test 3 — IPA accuracy:** Chọn 5 từ bất kỳ → So sánh IPA từ app với Cambridge Dictionary
- [ ] **Edge case — Proper nouns:** Nhập văn bản có tên riêng (London, Einstein) → Kiểm tra không bị đưa vào keywords
- [ ] **Edge case — API miss:** Mock Dictionary API trả về 404 → Kiểm tra Gemini fallback hoạt động

---

### 📊 Kết quả kỳ vọng sau Phase 8

| Tiêu chí | Trước (Phase 5) | Sau (Phase 8) |
|---|---|---|
| **Số từ extract** | 5–10 | 5–15 (tăng 50%) |
| **Idiom coverage** | ❌ Thường bị bỏ sót | ✅ Được nhận diện và giải thích riêng |
| **IPA accuracy** | ~80% (Gemini estimate) | ~98% (Dictionary API + fallback) |
| **Code duplication** | 2 file node giống nhau | 1 shared helper, 2 thin wrappers |
| **API calls** | 1 Gemini call | 1 Gemini (identifier) + N Dict API (parallel) + M Gemini (enricher, chỉ cho idiom/fallback) |
| **Latency** | ~2s | ~3–4s (chạy parallel với TTS nên không block UX) |

---

## 📋 Backlog (Phase 9+)

- [ ] **Repeat Mode** — Lặp lại 1 câu N lần trước khi chuyển tiếp (configurable).
- [ ] **Speed Control** — UI slider điều chỉnh tốc độ TTS (0.7x → 1.2x).
- [ ] **Recording & Playback** — Ghi âm giọng user khi đọc theo, phát lại để so sánh với AI.
- [ ] **Progress Tracking** — Lưu lịch sử câu đã hoàn thành, hiển thị streak học tập.
- [ ] **Export to Anki** — Export từ vựng sang Anki flashcard format.
- [ ] **Pronunciation Scoring** — AI so sánh giọng đọc của user với AI, cho điểm phát âm.

---

## 🔧 Verification Plan (Chung)

### Automated Build Check
```bash
npx tsc --noEmit
# Expected: exit code 0, no TypeScript errors
```

### Manual Verification Flow

1. **Text Shadowing Happy Path:** Chạy `pnpm dev` → Tạo bài → Nhập đoạn văn → Submit → Player → Play → Kiểm tra IPA + Countdown

2. **YouTube Shadowing:** Dán link ngắn (< 15 phút) → Tạo bài trực tiếp. Dán link dài (> 15 phút) → SegmentPreviewDialog → SSE log → History

3. **Article Scraping:** Tab "Nhập từ Link" → Nhập URL → Kiểm tra Title/Thumbnail/Text tự điền

4. **Vocabulary Step:** Player → Màn hình vocab → Accordion Word Family/Collocations → "Bắt đầu luyện tập"

5. **Mobile UX:** DevTools iPhone SE → Controls sticky ở đáy màn hình

---

*Made by Anh Tu - Share to be share*
