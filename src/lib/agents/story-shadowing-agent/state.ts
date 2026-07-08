import { Annotation } from "@langchain/langgraph";

// "Bộ nhớ" của Agent — truyền qua lại giữa các Node
export const StorybookAgentState = Annotation.Root({
  // === INPUT ===
  rawText: Annotation<string>(),       // Văn bản thô do người dùng nhập

  // === Node 1 Output: SentenceSplitter ===
  rawSentences: Annotation<Array<{ id: number; text: string }>>({
    reducer: (_, y) => y,              // Overwrite toàn bộ mảng (không concat)
  }),

  // === Node 2 Output: TtsGenerator ===
  // Mảng câu đã kèm audio base64
  sentences: Annotation<Array<{ id: number; text: string; audioBase64: string }>>({
    reducer: (_, y) => y,
  }),

  // === Metadata ===
  error: Annotation<string | null>(),  // Lỗi nếu có
});

export type StorybookStateType = typeof StorybookAgentState.State;
