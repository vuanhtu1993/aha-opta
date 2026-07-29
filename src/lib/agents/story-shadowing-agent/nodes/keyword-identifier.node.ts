import { IdentifiedKeywordListSchema } from "@/lib/schemas/story-shadowing.schema";
import { StorybookStateType } from "../state";
import { geminiService } from "@/lib/utils/gemini";

const SYSTEM_PROMPT = `You are a professional lexicographer and curriculum designer for English learners.
Your task is to identify challenging vocabulary from the provided text for a B1-B2 learner to study.
Do NOT provide explanations or IPA — just identify the items and their context.

Rules:
1. Extract between 5 to 15 items depending on the text length and difficulty.
2. Items can be single words, idioms, or phrasal verbs.
3. Categorize them into "word", "idiom", or "phrasal_verb".
4. Provide the EXACT sentence (context) where the item appears in the text.
5. Level: Assign a CEFR level to the item ("A1", "A2", "B1", "B2", "C1", or "C2"). B2/C1/C2 are preferred for challenging words.
6. Ignore common A1-A2 words (like 'hello', 'because', 'beautiful') and proper nouns (names of people, places).

Output valid JSON matching the schema.`;

/**
 * Shared logic to extract keywords from a raw text.
 * @param rawText The text to extract keywords from.
 * @returns Array of identified keyword items.
 */
export async function identifyKeywords(rawText: string) {
  try {
    const parsed = await geminiService.invokeStructured(IdentifiedKeywordListSchema, [
      { role: "system", content: SYSTEM_PROMPT },
      { role: "user", content: rawText },
    ]);

    return parsed.items;
  } catch (err) {
    console.error("[KeywordIdentifier] Error:", err);
    return [];
  }
}

/**
 * Graph node wrapper cho Text pipeline.
 */
export async function keywordIdentifierNode(state: StorybookStateType): Promise<Partial<StorybookStateType>> {
  const items = await identifyKeywords(state.rawText);
  return { identifiedKeywords: items };
}

import { YouTubeShadowingStateType } from "../youtube-state";

/**
 * Graph node wrapper cho YouTube pipeline.
 */
export async function youtubeKeywordIdentifierNode(state: YouTubeShadowingStateType): Promise<Partial<YouTubeShadowingStateType>> {
  // Reconstruct raw text from transcript since rawSentences is not available yet (parallel execution)
  const rawText = state.rawTranscript?.map(t => t.text).join(" ") || "";

  if (!rawText) {
    console.warn("[KeywordIdentifier] No text available to identify keywords.");
    return { identifiedKeywords: [] };
  }

  const items = await identifyKeywords(rawText);
  return { identifiedKeywords: items };
}
