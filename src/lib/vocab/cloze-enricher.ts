import { z } from "zod";
import { geminiService } from "@/lib/utils/gemini";
import { connectDB } from "@/lib/db/mongoose";
import VocabCard from "@/lib/db/models/VocabCard";

export const GeminiExampleSentencesSchema = z.object({
  sentences: z.array(
    z.object({
      sentence: z.string().describe("Sentence with the word replaced by ___"),
      answer: z.string().describe("The exact target word"),
    })
  ),
});

export async function generateExampleSentences(
  word: string,
  explanation: string,
  level: string = "B1"
): Promise<Array<{ sentence: string; answer: string }>> {
  const prompt = `You are an English vocabulary teacher. Generate exactly 3 fill-in-the-blank sentences for the target word "${word}" (${level} level).

Word Definition: "${explanation}"

Requirements:
1. Each sentence must be natural, native-speaker quality.
2. The target word "${word}" must be replaced with "___" (three underscores).
3. The sentences should reflect real professional, IT, academic, or daily conversation context.
4. Keep the target word exact as "${word}" for the answer field.

Return valid JSON with the specified schema.`;

  try {
    const result = await geminiService.invokeStructured(
      GeminiExampleSentencesSchema,
      [{ role: "user", content: prompt }]
    );

    return result.sentences || [];
  } catch (err) {
    console.error(`[ClozeEnricher] Failed to generate sentences for "${word}":`, err);
    return [];
  }
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
