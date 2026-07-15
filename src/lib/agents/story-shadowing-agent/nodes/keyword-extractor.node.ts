import { ChatGoogleGenerativeAI } from "@langchain/google-genai";
import { GeminiKeywordListSchema } from "@/lib/schemas/story-shadowing.schema";
import { StorybookStateType } from "../state";
import { RunnableConfig } from "@langchain/core/runnables";

const model = new ChatGoogleGenerativeAI({
  model: "gemini-2.5-flash",
  apiKey: process.env.GOOGLE_API_KEY!,
  maxRetries: 3, // Tích hợp sẵn retry để đối phó rate limit
});

const structuredLlm = model.withStructuredOutput(GeminiKeywordListSchema);

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

// Hàm sleep để tránh rate limit khi chạy song song
const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export async function keywordExtractorNode(state: StorybookStateType, config?: RunnableConfig): Promise<Partial<StorybookStateType>> {
  const log = config?.configurable?.logCallback || console.log;

  try {
    log(`[Keyword Extractor] Bắt đầu trích xuất từ vựng...`);
    
    // Đợi 1 giây trước khi gọi Gemini để tránh hit rate limit cùng lúc với Sentence Splitter
    await sleep(1000);

    const parsed = await structuredLlm.invoke([
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
