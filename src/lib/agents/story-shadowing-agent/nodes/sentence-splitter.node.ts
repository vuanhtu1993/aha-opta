import { GeminiSentenceListSchema } from "@/lib/schemas/story-shadowing.schema";
import { StorybookStateType } from "../state";
import { RunnableConfig } from "@langchain/core/runnables";
import { geminiService } from "@/lib/utils/gemini";

const SYSTEM_PROMPT = `You are a language learning assistant and phonetics expert.
Split the given English text into individual sentences for shadowing practice.
You must also evaluate difficulty AND provide IPA transcription for every word.
Rules:
- Each sentence must be complete and independent
- Max 20 words per sentence. If a sentence is longer, split it at a natural pause (comma, conjunction).
- Keep the original wording exactly — do NOT paraphrase
- For each word in every sentence, provide the IPA pronunciation. Use standard broad transcription (e.g., /həˈləʊ/, /ˈbɪ.zɪnəs/).
- Include punctuation marks as part of the last word that precedes them (e.g., "Hello" not "Hello,").
- Difficulty levels:
  - "easy": Short sentences, common A1-A2 vocabulary.
  - "medium": Average sentences, B1-B2 vocabulary.
  - "hard": Complex sentences, academic C1-C2 vocabulary or complex structures.
- Return ONLY valid JSON in this exact format:
{"level": "easy", "sentences": [{"id": 0, "text": "Hello world.", "words": [{"word": "Hello", "ipa": "/həˈləʊ/"}, {"word": "world", "ipa": "/wɜːld/"}]}]}`;

export async function sentenceSplitterNode(state: StorybookStateType): Promise<Partial<StorybookStateType>> {
  try {
    const parsed = await geminiService.invokeStructured(GeminiSentenceListSchema, [
      { role: "system", content: SYSTEM_PROMPT },
      { role: "user", content: state.rawText },
    ]);
    
    return { 
      level: parsed.level,
      rawSentences: parsed.sentences  // Đã bao gồm words[] với IPA
    };
  } catch (err) {
    console.error("[SentenceSplitter] Error:", err);
    return { error: "Không thể chia câu. Vui lòng thử lại." };
  }
}
