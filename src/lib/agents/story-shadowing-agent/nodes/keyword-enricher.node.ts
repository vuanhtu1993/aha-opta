import { 
  Keyword, 
  IdentifiedKeywordItem,
  GeminiBatchKeywordEnrichSchema
} from "@/lib/schemas/story-shadowing.schema";
import { StorybookStateType } from "../state";
import { geminiService } from "@/lib/utils/gemini";
import { batchLookup } from "@/lib/services/dictionary-api.service";

/**
 * Prompt để Gemini giải thích danh sách từ/idiom dựa vào context.
 */
function getBatchEnrichmentPrompt(items: IdentifiedKeywordItem[]) {
  const itemsListStr = items.map((item, i) => `
[Item ${i + 1}]
- Word/Phrase: "${item.word}"
- Type: ${item.type}
- Context: "${item.context}"`).join("\n");

  return `You are an English teacher explaining vocabulary to a B1-B2 learner.
The student encountered the following items in a reading text:
${itemsListStr}

For EACH item, provide:
1. "word": the exact Word/Phrase from the input to match them.
2. "explanation": A clear, simple explanation (in Vietnamese if helpful, or simple English) of what this item means EXACTLY IN THIS CONTEXT. Include a short example of usage if it's an idiom/phrasal verb.
3. "wordFamily": 1-3 related words (e.g. noun form, adjective form).
4. "collocations": 1-3 common collocations for this item.

Keep explanations concise and pedagogical. Output an array of items matching the schema.`;
}

/**
 * Nhận danh sách identified keywords và enrich chúng (Batch processing)
 */
export async function enrichKeywords(items: IdentifiedKeywordItem[]): Promise<Keyword[]> {
  if (!items || items.length === 0) return [];

  // 1. Lọc ra các từ đơn (type = "word") để tra IPA qua Dictionary API
  const wordItems = items.filter(item => item.type === "word");
  const wordsToLookup = wordItems.map(item => item.word);
  
  // 2. Chạy Dictionary API và Gemini song song
  const [dictResults, geminiParsed] = await Promise.all([
    wordsToLookup.length > 0 ? batchLookup(wordsToLookup) : Promise.resolve([]),
    geminiService.invokeStructured(GeminiBatchKeywordEnrichSchema, [
      { role: "user", content: getBatchEnrichmentPrompt(items) }
    ]).catch(err => {
      console.error("[KeywordEnricher] Batch Gemini Error:", err);
      return { items: [] };
    })
  ]);

  // Tạo map IPA từ kết quả Dictionary API
  const ipaMap = new Map<string, string>();
  wordItems.forEach((item, index) => {
    const res = dictResults[index];
    if (res && res.ipa) {
      ipaMap.set(item.word.toLowerCase(), res.ipa);
    }
  });

  // 3. Ghép kết quả
  const enrichedKeywords: Keyword[] = [];
  
  for (const item of items) {
    // Tìm kết quả giải nghĩa của Gemini cho item này
    const geminiData = geminiParsed.items.find((g: any) => g.word.toLowerCase() === item.word.toLowerCase());
    
    if (geminiData) {
      enrichedKeywords.push({
        word: item.word,
        ipa: ipaMap.get(item.word.toLowerCase()), // Sẽ có giá trị nếu API tìm thấy
        level: item.level,
        explanation: geminiData.explanation,
        wordFamily: geminiData.wordFamily,
        collocations: geminiData.collocations,
      });
    }
  }

  return enrichedKeywords;
}

/**
 * Graph node wrapper cho Text pipeline
 */
export async function keywordEnricherNode(state: StorybookStateType): Promise<Partial<StorybookStateType>> {
  if (!state.identifiedKeywords || state.identifiedKeywords.length === 0) {
    return { keywords: [] };
  }
  
  const keywords = await enrichKeywords(state.identifiedKeywords);
  return { keywords };
}

import { YouTubeShadowingStateType } from "../youtube-state";

/**
 * Graph node wrapper cho YouTube pipeline
 */
export async function youtubeKeywordEnricherNode(state: YouTubeShadowingStateType): Promise<Partial<YouTubeShadowingStateType>> {
  if (!state.identifiedKeywords || state.identifiedKeywords.length === 0) {
    return { keywords: [] };
  }
  
  const keywords = await enrichKeywords(state.identifiedKeywords);
  return { keywords };
}
