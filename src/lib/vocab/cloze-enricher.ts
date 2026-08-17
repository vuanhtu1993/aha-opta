import { z } from "zod";
import { geminiService } from "@/lib/utils/gemini";
import { connectDB } from "@/lib/db/mongoose";
import VocabCard from "@/lib/db/models/VocabCard";

export const GeminiBatchClozeSchema = z.object({
  results: z.array(
    z.object({
      word: z.string().describe("Exact word from the prompt"),
      sentences: z.array(
        z.object({
          sentence: z.string().describe("Sentence with the word replaced by ___"),
          answer: z.string().describe("The exact target word"),
        })
      ),
    })
  ),
});

export interface BatchWordItem {
  id: string;
  word: string;
  explanation: string;
  level?: string;
}

export async function generateBatchExampleSentences(
  items: BatchWordItem[]
): Promise<Map<string, Array<{ sentence: string; answer: string }>>> {
  const resultMap = new Map<string, Array<{ sentence: string; answer: string }>>();
  if (!items || items.length === 0) return resultMap;

  const itemsFormatted = items
    .map(
      (item, idx) =>
        `[${idx + 1}] Word: "${item.word}" (${item.level || "B1"})\n    Definition: "${item.explanation}"`
    )
    .join("\n");

  const prompt = `You are an English vocabulary teacher. Generate fill-in-the-blank sentences for the following list of vocabulary items.

${itemsFormatted}

Requirements for EACH item:
1. Generate exactly 3 fill-in-the-blank sentences per word.
2. The target word must appear replaced with "___" (three underscores).
3. Sentences must be natural, native-speaker quality, reflecting real professional, IT, academic, or daily conversation context.
4. Set "word" to the exact input word and "answer" to the exact input word.

Return valid JSON with the specified schema.`;

  try {
    const response = await geminiService.invokeStructured(
      GeminiBatchClozeSchema,
      [{ role: "user", content: prompt }]
    );

    if (response && response.results) {
      for (const res of response.results) {
        if (res.word && res.sentences) {
          resultMap.set(res.word.toLowerCase(), res.sentences);
        }
      }
    }
  } catch (err) {
    console.error("[ClozeEnricher] Batch generation error:", err);
  }

  return resultMap;
}

export async function generateExampleSentences(
  word: string,
  explanation: string,
  level: string = "B1"
): Promise<Array<{ sentence: string; answer: string }>> {
  const map = await generateBatchExampleSentences([{ id: "1", word, explanation, level }]);
  return map.get(word.toLowerCase()) || [];
}

export async function generateAndSaveExampleSentences(
  cardId: string,
  word: string,
  explanation: string,
  level: string = "B1"
): Promise<void> {
  const sentences = await generateExampleSentences(word, explanation, level);
  if (!sentences || sentences.length === 0) return;

  await connectDB();
  await VocabCard.findByIdAndUpdate(cardId, {
    $set: { exampleSentences: sentences },
  });
}
