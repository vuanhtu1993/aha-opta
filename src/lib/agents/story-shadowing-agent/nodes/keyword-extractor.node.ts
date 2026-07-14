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

const SYSTEM_PROMPT = `You are a professional English teacher.
Your task is to extract 5 to 10 key vocabulary words or phrases from the provided English text.
Focus on words that are essential for understanding the main context of the text, specifically those at a "medium" (B1-B2) or "hard" (C1-C2) difficulty level.
Rules:
- Select 5 to 10 words/phrases.
- For each word, provide a simple English explanation (B1 level) so the user can easily understand the context.
- Classify the word's level as either "medium" or "hard".
- Do NOT provide translation in other languages, only English.
- Return ONLY valid JSON matching the requested schema.`;

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
