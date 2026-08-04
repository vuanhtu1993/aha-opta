import { connectDB } from "@/lib/db/mongoose";
import VocabCard from "@/lib/db/models/VocabCard";
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
 * Direct Database access via mongoose singleton.
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

  const [targetCards, totalCount] = await Promise.all([
    VocabCard.find(query)
      .sort({ "fsrs.due": 1 })
      .limit(limit)
      .lean(),
    VocabCard.countDocuments({}),
  ]);

  if (targetCards.length === 0 && !practiceAll) {
    return {
      questions: [],
      totalDue: 0,
      sessionLimit: limit,
      totalSaved: totalCount,
    };
  }

  // Get all explanations from the database to use as dynamic distractors
  const allCards = await VocabCard.find({}, { explanation: 1, word: 1 }).lean();
  const allExplanations = allCards.map((c: any) => c.explanation);

  const questions: QuizQuestion[] = targetCards.map((card: any) => {
    const targetExplanation = (card.explanation || "").trim();

    // Collect distractors from user's other cards
    const otherUserExplanations = allExplanations.filter(
      (exp) => exp && exp.toLowerCase().trim() !== targetExplanation.toLowerCase()
    );

    // Shuffle other user explanations
    const shuffledUserDistractors = [...otherUserExplanations].sort(
      () => Math.random() - 0.5
    );

    let selectedDistractors = shuffledUserDistractors.slice(0, 3);

    // If we don't have 3 distractors from user's cards, fill from default bank
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
