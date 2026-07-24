import { z } from "zod";
import { YouTubeShadowingStateType } from "../youtube-state";
import { KeywordSchema } from "@/lib/schemas/story-shadowing.schema";
import { geminiService } from "@/lib/utils/gemini";

const GeminiKeywordListSchema = z.object({
  keywords: z.array(KeywordSchema),
});

const SYSTEM_PROMPT = `You are an expert Linguistics teacher.
Extract 3 to 5 most important core vocabulary words from the given text.
Choose ONLY words that are difficult or essential for understanding the main context (B2 to C2 level).

Rules:
1. Explain the meaning in SIMPLE English (B1 level max).
2. Classify difficulty level as "medium" or "hard".
3. Provide wordFamily: an array of 2-3 common derived words (e.g., if word is "act", wordFamily can be ["action (n)", "actively (adv)", "active (adj)"]).
4. Provide collocations: an array of 2-3 common collocations or phrases using the word in context (e.g., ["take action", "immediate action"]).
5. Return ONLY a valid JSON object matching the requested schema.`;

export const youtubeKeywordExtractorNode = async (state: YouTubeShadowingStateType) => {
  if (state.error || (!state.rawTranscript && !state.sentences)) return {};

  try {
    let rawText = "";
    
    if (state.sentences && state.sentences.length > 0) {
      // Reconstruct rawText from sentences
      rawText = state.sentences.map(s => s.text).join(" ");
    } else if (state.rawTranscript && state.rawTranscript.length > 0) {
      // Reconstruct rawText from transcript blocks
      const transcriptSubset = state.rawTranscript.slice(0, 80);
      rawText = transcriptSubset.map(t => t.text).join(" ");
    } else {
      return {};
    }

    // Giới hạn độ dài để tránh tốn quá nhiều token
    rawText = rawText.slice(0, 5000);

    const parsed = await geminiService.invokeStructured(GeminiKeywordListSchema, [
      { role: "system", content: SYSTEM_PROMPT },
      { role: "user", content: rawText },
    ], { name: "keyword_extraction" });

    return { keywords: parsed.keywords };
  } catch (err) {
    console.error("[YouTube KeywordExtractor] Error:", err);
    return { error: "Không thể trích xuất từ vựng. Vui lòng thử lại." };
  }
}
