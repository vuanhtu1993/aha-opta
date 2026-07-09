import { z } from "zod";

// Schema cho 1 từ kèm phiên âm IPA
export const WordSchema = z.object({
  word: z.string(),   // Từ gốc (giữ nguyên cách viết trong câu)
  ipa: z.string(),    // Phiên âm IPA, ví dụ: /ˈbəʊtnəs/
});

export type Word = z.infer<typeof WordSchema>;

// Schema cho 1 câu đã được xử lý (có text + audio + IPA)
export const SentenceSchema = z.object({
  id: z.number(),           // Thứ tự câu (0-indexed)
  text: z.string(),         // Nội dung câu
  audioBase64: z.string().optional(), // Base64 audio (MP3), gán sau khi TTS xong
  words: z.array(WordSchema).optional(), // Mảng từ kèm IPA, gọn từ Gemini
});

export type Sentence = z.infer<typeof SentenceSchema>;

// Schema response từ API /api/story-shadowing/process
export const ProcessResponseSchema = z.object({
  sentences: z.array(SentenceSchema),
  totalCount: z.number(),
  id: z.string(),
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
