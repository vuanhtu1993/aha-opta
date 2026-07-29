import { Annotation } from "@langchain/langgraph";
import type { Keyword } from "@/lib/schemas/story-shadowing.schema";

export const YouTubeShadowingAgentState = Annotation.Root({
  // === INPUT ===
  youtubeUrl: Annotation<string>(),

  // === Node 1 Output: Transcript Fetcher ===
  rawTranscript: Annotation<Array<{ text: string; start: number; duration: number }>>({
    reducer: (_, y) => y,
  }),
  youtubeVideoId: Annotation<string>({
    reducer: (_, y) => y,
  }),
  title: Annotation<string>({
    reducer: (_, y) => y,
  }),

  // === Node 2 Output: Sentence Consolidator (Gemini) ===
  rawSentences: Annotation<Array<{ id: number; text: string; startMs: number; endMs: number }>>({
    reducer: (_, y) => y,
  }),
  level: Annotation<"easy" | "medium" | "hard">({
    reducer: (_, y) => y,
  }),

  // === Node 3 Output: Keyword Extractor ===
  identifiedKeywords: Annotation<Array<{
    word: string;
    type: "word" | "idiom" | "phrasal_verb";
    context: string;
    level: "A1" | "A2" | "B1" | "B2" | "C1" | "C2";
  }>>({
    reducer: (_, y) => y,
  }),
  
  keywords: Annotation<Keyword[]>({
    reducer: (_, y) => y,
  }),

  // === Node 4 Output: IPA Annotator (Merge) ===
  sentences: Annotation<Array<{ id: number; text: string; startMs: number; endMs: number; words?: { word: string; ipa: string }[] }>>({
    reducer: (_, y) => y,
  }),

  // === Metadata ===
  error: Annotation<string | null>(),
});

export type YouTubeShadowingStateType = typeof YouTubeShadowingAgentState.State;
