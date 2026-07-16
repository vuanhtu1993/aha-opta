import { GeminiKeywordListSchema } from "@/lib/schemas/story-shadowing.schema";
import { StorybookStateType } from "../state";
import { RunnableConfig } from "@langchain/core/runnables";
import { geminiService } from "@/lib/utils/gemini";

const SYSTEM_PROMPT = `You are an expert Linguistics teacher.
Extract 3 to 5 most important core vocabulary words from the given text.
Choose ONLY words that are difficult or essential for understanding the main context (B2 to C2 level).

Rules:
1. Explain the meaning in SIMPLE English (B1 level max).
2. Classify difficulty level as "medium" or "hard".
3. Provide wordFamily: an array of 2-3 common derived words (e.g., if word is "act", wordFamily can be ["action (n)", "actively (adv)", "active (adj)"]).
4. Provide collocations: an array of 2-3 common collocations or phrases using the word in context (e.g., ["take action", "immediate action"]).
5. Return ONLY a valid JSON object matching the requested schema.

Example JSON:
{
  "keywords": [
    {
      "word": "shadowing",
      "explanation": "A practice technique where you repeat speech immediately after hearing it.",
      "level": "hard",
      "wordFamily": ["shadow (v)", "shadowy (adj)"],
      "collocations": ["shadowing technique", "practice shadowing"]
    }
  ]
}`;

export async function keywordExtractorNode(state: StorybookStateType, config?: RunnableConfig): Promise<Partial<StorybookStateType>> {
  const log = config?.configurable?.logCallback || console.log;

  try {
    log(`[Keyword Extractor] Bắt đầu trích xuất từ vựng...`);

    const parsed = await geminiService.invokeStructured(GeminiKeywordListSchema, [
      { role: "system", content: SYSTEM_PROMPT },
      { role: "user", content: state.rawText },
    ]);
    
    log(`[Keyword Extractor] ✅ Đã trích xuất được ${parsed.keywords.length} từ vựng cốt lõi.`);

    return { 
      keywords: parsed.keywords
    };
  } catch (err) {
    console.error("[KeywordExtractor] Error:", err);
    log("[Keyword Extractor] Lỗi: Không thể trích xuất từ vựng.");
    return { error: "Không thể trích xuất từ vựng. Vui lòng thử lại." };
  }
}
