import { ChatGoogleGenerativeAI } from "@langchain/google-genai";
import { GeminiSentenceListSchema } from "@/lib/schemas/story-shadowing.schema";
import { StorybookStateType } from "../state";

const model = new ChatGoogleGenerativeAI({
  model: "gemini-2.5-flash",
  apiKey: process.env.GEMINI_API_KEY!,
  // Yêu cầu output JSON thuần túy — tránh hallucination format
  generationConfig: {
    responseMimeType: "application/json",
  },
});

const SYSTEM_PROMPT = `You are a language learning assistant.
Split the given English text into individual sentences for shadowing practice.
Rules:
- Each sentence must be complete and independent
- Max 20 words per sentence. If a sentence is longer, split it at a natural pause (comma, conjunction).
- Keep the original wording exactly — do NOT paraphrase
- Return ONLY valid JSON in this exact format:
{"sentences": [{"id": 0, "text": "First sentence."}, {"id": 1, "text": "Second sentence."}]}`;

export async function sentenceSplitterNode(state: StorybookStateType): Promise<Partial<StorybookStateType>> {
  try {
    const response = await model.invoke([
      { role: "system", content: SYSTEM_PROMPT },
      { role: "user", content: state.rawText },
    ]);

    // Parse và validate với Zod — throw nếu format sai
    const parsed = GeminiSentenceListSchema.parse(
      JSON.parse(response.content as string)
    );

    return { rawSentences: parsed.sentences };
  } catch (err) {
    console.error("[SentenceSplitter] Error:", err);
    return { error: "Không thể chia câu. Vui lòng thử lại." };
  }
}
