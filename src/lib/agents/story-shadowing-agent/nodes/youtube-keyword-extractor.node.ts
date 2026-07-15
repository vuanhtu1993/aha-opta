import { ChatGoogleGenerativeAI } from "@langchain/google-genai";
import { z } from "zod";
import { YouTubeShadowingStateType } from "../youtube-state";
import { KeywordSchema } from "@/lib/schemas/story-shadowing.schema";

const model = new ChatGoogleGenerativeAI({
  model: "gemini-2.5-flash",
  apiKey: process.env.GEMINI_API_KEY!,
});

const GeminiKeywordListSchema = z.object({
  keywords: z.array(KeywordSchema),
});

const structuredLlm = model.withStructuredOutput(GeminiKeywordListSchema, { name: "keyword_extraction" });

const SYSTEM_PROMPT = `You are an expert Linguistics teacher.
Extract 3 to 5 most important core vocabulary words from the given text.
Choose ONLY words that are difficult or essential for understanding the main context (B2 to C2 level).

Rules:
1. Explain the meaning in SIMPLE English (B1 level max).
2. Classify difficulty level as "medium" or "hard".
3. Provide wordFamily: an array of 2-3 common derived words (e.g., if word is "act", wordFamily can be ["action (n)", "actively (adv)", "active (adj)"]).
4. Provide collocations: an array of 2-3 common collocations or phrases using the word in context (e.g., ["take action", "immediate action"]).
5. Return ONLY a valid JSON object matching the requested schema.`;

// Hàm sleep để tránh rate limit khi chạy song song
const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export const youtubeKeywordExtractorNode = async (state: YouTubeShadowingStateType) => {
  if (state.error || !state.rawTranscript) return {};

  try {
    const MAX_RETRIES = 3;
    let attempt = 0;
    
    // Reconstruct rawText from transcript blocks
    const transcriptSubset = state.rawTranscript.slice(0, 80);
    const rawText = transcriptSubset.map(t => t.text).join(" ");

    while (attempt < MAX_RETRIES) {
      try {
        await sleep(1000); 
        const parsed = await structuredLlm.invoke([
          { role: "system", content: SYSTEM_PROMPT },
          { role: "user", content: rawText },
        ]);
        return { keywords: parsed.keywords };
      } catch (e: any) {
        if (e?.message?.includes("429")) {
          attempt++;
          console.log(`[YouTube KeywordExtractor] Rate limit 429, retrying... (${attempt}/${MAX_RETRIES})`);
          await sleep(2000 * attempt);
        } else {
          throw e;
        }
      }
    }
    throw new Error("Quá giới hạn thử lại do Rate Limit");
  } catch (err) {
    console.error("[YouTube KeywordExtractor] Error:", err);
    return { error: "Không thể trích xuất từ vựng. Vui lòng thử lại." };
  }
}
