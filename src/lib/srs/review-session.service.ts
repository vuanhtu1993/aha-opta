import { connectDB } from "@/lib/db/mongoose";
import VocabCard from "@/lib/db/models/VocabCard";
import Storybook from "@/lib/db/models/Storybook";
import { getRandomDefaultDistractors } from "@/lib/srs/distractor-bank";

export interface QuizOption {
  id: string; // "A" | "B" | "C" | "D"
  text: string;
  isCorrect: boolean;
}

export interface QuizQuestion {
  cardId: string;
  word: string;
  ipa?: string;
  level: string;
  wordFamily?: any[];
  collocations?: any[];
  sourceStorybookTitle?: string;
  explanation: string;
  options: QuizOption[];
  exampleSentences?: Array<{ sentence: string; answer: string }>;
  quizMode: "mcq" | "cloze";
  fsrsState: {
    due: string;
    reps: number;
    stability: number;
  };
}

export interface ReviewSessionData {
  questions: QuizQuestion[];
  totalDue: number;
  sessionLimit: number;
  totalSaved: number;
}

/**
 * Service function to generate a batch of Quiz Questions on the Server.
 * Enriched via Multi-Tier Distractor Architecture:
 * 1. Personal VocabCard definitions
 * 2. Global Storybook keywords definitions (Incidental Learning Pool)
 * 3. Default CEFR Distractor Bank fallback
 */
export async function getReviewSessionQuestions(options: {
  limit?: number;
  practiceAll?: boolean;
} = {}): Promise<ReviewSessionData> {
  await connectDB();

  const limit = Math.min(Math.max(1, options.limit || 15), 30);
  const practiceAll = options.practiceAll === true;
  const now = new Date();

  // Query due cards
  let query: Record<string, any> = { "fsrs.due": { $lte: now } };
  if (practiceAll) {
    // If user wants to practice all words, ignore due date
    query = {};
  }

  // Parallel Database Queries: Fetch due cards + all personal cards + all storybooks keywords
  const [targetCards, totalCount, allPersonalCards, allStorybooks] = await Promise.all([
    VocabCard.find(query)
      .sort({ "fsrs.due": 1 })
      .limit(limit)
      .lean(),
    VocabCard.countDocuments({}),
    VocabCard.find({}, { explanation: 1, word: 1 }).lean(),
    Storybook.find({}, { "keywords.explanation": 1, "keywords.word": 1 }).lean(),
  ]);

  if (targetCards.length === 0 && !practiceAll) {
    return {
      questions: [],
      totalDue: 0,
      sessionLimit: limit,
      totalSaved: totalCount,
    };
  }

  // 1. Collect explanations from personal saved cards
  const personalExplanations = allPersonalCards
    .map((c: any) => c.explanation?.trim())
    .filter((exp: string | undefined): exp is string => Boolean(exp));

  // 2. Collect explanations from ALL Storybook keywords across the entire system (Global Pool)
  const storybookExplanations = allStorybooks
    .flatMap((sb: any) => sb.keywords?.map((k: any) => k.explanation?.trim()) || [])
    .filter((exp: string | undefined): exp is string => Boolean(exp));

  // 3. Merge and deduplicate explanations into a unified Global Distractor Pool
  const uniquePoolMap = new Map<string, string>(); // lowercase key -> original text
  for (const exp of [...personalExplanations, ...storybookExplanations]) {
    const key = exp.toLowerCase();
    if (!uniquePoolMap.has(key)) {
      uniquePoolMap.set(key, exp);
    }
  }
  const globalExplanations = Array.from(uniquePoolMap.values());

  const questions: QuizQuestion[] = targetCards.map((card: any) => {
    const targetExplanation = (card.explanation || "").trim();
    const targetKey = targetExplanation.toLowerCase();

    // Filter out the correct explanation from the pool
    const candidateDistractors = globalExplanations.filter(
      (exp) => exp.toLowerCase() !== targetKey
    );

    // Shuffle candidate distractors
    const shuffledDistractors = [...candidateDistractors].sort(
      () => Math.random() - 0.5
    );

    let selectedDistractors = shuffledDistractors.slice(0, 3);

    // If we still have fewer than 3 distractors, fill remaining slots from the Default CEFR Bank
    if (selectedDistractors.length < 3) {
      const needed = 3 - selectedDistractors.length;
      const fallbackDistractors = getRandomDefaultDistractors(
        targetExplanation,
        needed
      );
      selectedDistractors = [...selectedDistractors, ...fallbackDistractors];
    }

    // Combine 1 correct + 3 distractors
    const rawOptions = [
      { text: targetExplanation, isCorrect: true },
      ...selectedDistractors.map((text) => ({ text, isCorrect: false })),
    ];

    // Shuffle options and assign IDs (A, B, C, D)
    const optionLetters = ["A", "B", "C", "D"];
    const shuffledOptions: QuizOption[] = [...rawOptions]
      .sort(() => Math.random() - 0.5)
      .map((opt, idx) => ({
        id: optionLetters[idx] || `${idx + 1}`,
        text: opt.text,
        isCorrect: opt.isCorrect,
      }));

    const stability = card.fsrs?.stability ?? 0;
    const exampleSentences = card.exampleSentences || [];
    const CLOZE_THRESHOLD_STABILITY = 3;
    const quizMode: "mcq" | "cloze" =
      stability >= CLOZE_THRESHOLD_STABILITY && exampleSentences.length > 0
        ? "cloze"
        : "mcq";

    return {
      cardId: card._id.toString(),
      word: card.word,
      ipa: card.ipa || "",
      level: card.level || "A1",
      wordFamily: card.wordFamily || [],
      collocations: card.collocations || [],
      sourceStorybookTitle: card.sourceStorybookTitle || "",
      explanation: card.explanation || "",
      options: shuffledOptions,
      exampleSentences: exampleSentences,
      quizMode: quizMode,
      fsrsState: {
        due: card.fsrs?.due ? new Date(card.fsrs.due).toISOString() : new Date().toISOString(),
        reps: card.fsrs?.reps ?? 0,
        stability: card.fsrs?.stability ?? 0,
      },
    };
  });

  return {
    questions,
    totalDue: targetCards.length,
    sessionLimit: limit,
    totalSaved: totalCount,
  };
}
