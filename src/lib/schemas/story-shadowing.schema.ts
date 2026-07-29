import { z } from "zod";

// Schema cho 1 từ kèm phiên âm IPA
export const WordSchema = z.object({
  word: z.string(),   // Từ gốc (giữ nguyên cách viết trong câu)
  ipa: z.string(),    // Phiên âm IPA, ví dụ: /ˈbəʊtnəs/
});

export type Word = z.infer<typeof WordSchema>;

// Schema cho từ vựng khó được trích xuất
export const KeywordSchema = z.object({
  word: z.string(),
  ipa: z.string().optional(),
  explanation: z.string(),
  level: z.enum(["A1", "A2", "B1", "B2", "C1", "C2"]),
  wordFamily: z.array(z.object({
    word: z.string(),
    partOfSpeech: z.string().optional(),
    ipa: z.string().optional(),
    explanation: z.string()
  })).optional(),
  collocations: z.array(z.object({
    collocation: z.string(),
    explanation: z.string()
  })).optional(),
});

export type Keyword = z.infer<typeof KeywordSchema>;

// Schema cho 1 câu đã được xử lý (có text + audio + IPA)
export const SentenceSchema = z.object({
  id: z.number(),           // Thứ tự câu (0-indexed)
  text: z.string(),         // Nội dung câu
  audioBase64: z.string().optional(), // Base64 audio (MP3), gán sau khi TTS xong
  words: z.array(WordSchema).optional(), // Mảng từ kèm IPA, gọn từ Gemini
  startMs: z.number().optional(),     // Dành cho YouTube
  endMs: z.number().optional(),       // Dành cho YouTube
});

export type Sentence = z.infer<typeof SentenceSchema>;

// Schema response từ API /api/story-shadowing/process
export const ProcessResponseSchema = z.object({
  sentences: z.array(SentenceSchema),
  keywords: z.array(KeywordSchema).optional(),
  totalCount: z.number(),
  id: z.string(),
  sourceType: z.enum(["text", "youtube"]).optional(),
  youtubeVideoId: z.string().optional(),
});

export type ProcessResponse = z.infer<typeof ProcessResponseSchema>;

// Schema request vào API /api/story-shadowing/tts
export const TtsRequestSchema = z.object({
  text: z.string().max(500, "Câu quá dài"),
  languageCode: z.string().default("en-US"),
});

// Schema trả về từ Gemini khi chia câu (raw, chưa có audio)
export const GeminiSentenceListSchema = z.object({
  level: z.enum(["easy", "medium", "hard"]),
  sentences: z.array(z.object({
    id: z.number(),
    text: z.string(),
    // Mảng từ kèm phiên âm IPA — Gemini tự động generate
    words: z.array(WordSchema),
  })),
});

// Schema trả về từ Gemini khi xác định từ khó (Step 1)
export const IdentifiedKeywordListSchema = z.object({
  items: z.array(z.object({
    word: z.string(),           // Từ hoặc cụm từ (idiom giữ nguyên cả cụm)
    type: z.enum(["word", "idiom", "phrasal_verb"]),
    context: z.string(),        // Câu chứa từ này để giúp giải thích đúng nghĩa
    level: z.enum(["A1", "A2", "B1", "B2", "C1", "C2"]),
  }))
});

export type IdentifiedKeywordItem = z.infer<typeof IdentifiedKeywordListSchema>["items"][0];

// Schema trả về từ Gemini khi enrich idiom/phrasal verb (Step 2b)
export const GeminiKeywordEnrichSchema = z.object({
  explanation: z.string(),
  wordFamily: z.array(z.object({
    word: z.string(),
    partOfSpeech: z.string().optional(),
    ipa: z.string().optional(),
    explanation: z.string()
  })).optional(),
  collocations: z.array(z.object({
    collocation: z.string(),
    explanation: z.string()
  })).optional(),
});

// Schema trả về từ Gemini khi enrich nhiều items cùng lúc
export const GeminiBatchKeywordEnrichSchema = z.object({
  items: z.array(z.object({
    word: z.string(), // Để match lại với original item
    explanation: z.string(),
    wordFamily: z.array(z.object({
      word: z.string(),
      partOfSpeech: z.string().optional(),
      ipa: z.string().optional(),
      explanation: z.string()
    })).optional(),
    collocations: z.array(z.object({
      collocation: z.string(),
      explanation: z.string()
    })).optional(),
  }))
});
