import { ChatGoogleGenerativeAI } from "@langchain/google-genai";
import { GeminiSentenceListSchema } from "@/lib/schemas/story-shadowing.schema";
import { StorybookStateType } from "../state";

const model = new ChatGoogleGenerativeAI({
  model: "gemini-2.5-flash",
  apiKey: process.env.GOOGLE_API_KEY!,
});

const structuredLlm = model.withStructuredOutput(GeminiSentenceListSchema);

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
    const parsed = await structuredLlm.invoke([
      { role: "system", content: SYSTEM_PROMPT },
      { role: "user", content: state.rawText },
    ]);

    return { rawSentences: parsed.sentences };
  } catch (err) {
    console.error("[SentenceSplitter] Error:", err);
    return { error: "Không thể chia câu. Vui lòng thử lại." };
  }
}
