import { z } from "zod";

export const exampleSentenceSchema = z.object({
  sentence: z.string(),
  answer: z.string(),
});

export const saveVocabCardSchema = z.object({
  word: z.string().min(1, "Word is required"),
  ipa: z.string().optional(),
  explanation: z.string().min(1, "Explanation is required"),
  level: z.enum(["A1", "A2", "B1", "B2", "C1", "C2"]).default("B1"),
  audioUrl: z.string().optional(),
  exampleSentences: z.array(exampleSentenceSchema).optional(),
  wordFamily: z
    .array(
      z.object({
        word: z.string(),
        partOfSpeech: z.string().optional(),
        ipa: z.string().optional(),
        explanation: z.string(),
      })
    )
    .optional(),
  collocations: z
    .array(
      z.object({
        collocation: z.string(),
        explanation: z.string(),
      })
    )
    .optional(),
  sourceStorybookId: z.string().optional(),
  sourceStorybookTitle: z.string().optional(),
});

export const submitQuizReviewSchema = z.object({
  cardId: z.string().min(1, "Card ID is required"),
  isCorrect: z.boolean(),
  responseTimeMs: z.number().nonnegative(),
});

export type SaveVocabCardInput = z.infer<typeof saveVocabCardSchema>;
export type SubmitQuizReviewInput = z.infer<typeof submitQuizReviewSchema>;
