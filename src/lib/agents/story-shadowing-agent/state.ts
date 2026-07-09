import { Annotation } from "@langchain/langgraph";

// "Bộ nhớ" của Agent — truyền qua lại giữa các Node
export const StorybookAgentState = Annotation.Root({
  // === INPUT ===
  rawText: Annotation<string>(),       // Văn bản thô do người dùng nhập
  voice: Annotation<string>(),         // Giọng đọc do người dùng chọn

  // === Node 1 Output: SentenceSplitter ===
  level: Annotation<"easy" | "medium" | "hard">(), // Độ khó do AI đánh giá
  rawSentences: Annotation<Array<{ id: number; text: string }>>({
    reducer: (_, y) => y,              // Overwrite toàn bộ mảng (không concat)
  }),

  // === Node 2 Output: TtsGenerator ===
  speakingRate: Annotation<number>(),  // Tốc độ đọc tương ứng

  // Mảng câu đã kèm audio base64
  sentences: Annotation<Array<{ id: number; text: string; audioBase64: string }>>({
    reducer: (_, y) => y,
  }),

  // === Metadata ===
  error: Annotation<string | null>(),  // Lỗi nếu có
});

export type StorybookStateType = typeof StorybookAgentState.State;
