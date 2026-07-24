import { GeminiKeywordListSchema } from "@/lib/schemas/story-shadowing.schema";
import { StorybookStateType } from "../state";
import { RunnableConfig } from "@langchain/core/runnables";
import { geminiService } from "@/lib/utils/gemini";

const SYSTEM_PROMPT = `You are an expert Linguistics teacher.
Extract 5 to 10 most important core vocabulary words from the given text.
Choose ONLY words that are difficult or essential for understanding the main context (B2 to C2 level).

Rules:
1. Explain the meaning of the main word in SIMPLE English (B1 level max).
2. Classify difficulty level as "medium" or "hard".
3. Provide "ipa": International Phonetic Alphabet (broad transcription) for the main word.
4. Provide "wordFamily": an array of STRICTLY 1 to 3 common derived words. Do not exceed 3 items! Each item is an object with "word" (e.g., "shadow"), "partOfSpeech" (e.g., "v", "n", "adj"), "ipa" (broad transcription, e.g. "/ˈʃæd.oʊ/"), and "explanation" (a short explanation in simple English).
5. Provide "collocations": an array of STRICTLY 1 to 3 common collocations. Do not exceed 3 items! Each item is an object with "collocation" and "explanation" (a short explanation in simple English).
6. Return ONLY a valid JSON object matching the requested schema. Ensure arrays do not repeat infinitely.

Example JSON:
{
  "keywords": [
    {
      "word": "shadowing",
      "ipa": "/ˈʃæd.oʊ.ɪŋ/",
      "explanation": "A practice technique where you repeat speech immediately after hearing it.",
      "level": "hard",
      "wordFamily": [
        {"word": "shadow", "partOfSpeech": "v", "ipa": "/ˈʃæd.oʊ/", "explanation": "follow someone closely, to learn a job by staying right next to an experienced worker"}
      ],
      "collocations": [
        {"collocation": "shadowing technique", "explanation": "practice repeating speech immediately after hearing it"}
      ]
    }
  ]
}`;

export async function keywordExtractorNode(state: StorybookStateType): Promise<Partial<StorybookStateType>> {
  try {
    const parsed = await geminiService.invokeStructured(GeminiKeywordListSchema, [
      { role: "system", content: SYSTEM_PROMPT },
      { role: "user", content: state.rawText },
    ]);

    return {
      keywords: parsed.keywords
    };
  } catch (err) {
    console.error("[KeywordExtractor] Error:", err);
    return { error: "Không thể trích xuất từ vựng. Vui lòng thử lại." };
  }
}
