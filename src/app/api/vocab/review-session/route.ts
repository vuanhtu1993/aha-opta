import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db/mongoose";
import VocabCard, { IVocabCard } from "@/lib/db/models/VocabCard";
import { getRandomDefaultDistractors } from "@/lib/srs/distractor-bank";

interface QuizOption {
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
    due: Date;
    reps: number;
    stability: number;
  };
}

/**
 * GET /api/vocab/review-session
 * Generates a Quiz Session batch (up to `limit` cards) with 4 English choices per card
 */
export async function GET(request: NextRequest) {
  try {
    await connectDB();

    const { searchParams } = new URL(request.url);
    const limitParam = parseInt(searchParams.get("limit") || "15", 10);
    const limit = Math.min(Math.max(1, limitParam), 30);
    const practiceAll = searchParams.get("practice_all") === "true";

    const now = new Date();

    // Query due cards
    let query: Record<string, any> = { "fsrs.due": { $lte: now } };
    if (practiceAll) {
      // If user wants to practice even if not due, query all sorted by due date
      query = {};
    }

    let targetCards = await VocabCard.find(query)
      .sort({ "fsrs.due": 1 })
      .limit(limit)
      .lean();

    // If no due cards and not practiceAll, check if there are any cards at all
    if (targetCards.length === 0 && !practiceAll) {
      const totalCount = await VocabCard.countDocuments({});
      return NextResponse.json({
        questions: [],
        totalDue: 0,
        totalSaved: totalCount,
        message: "Bạn đã hoàn thành tất cả từ vựng cần ôn tập hôm nay! 🎉",
      });
    }

    // Get all explanations from the database to use as dynamic distractors
    const allCards = await VocabCard.find({}, { explanation: 1, word: 1 }).lean();
    const allExplanations = allCards.map((c) => c.explanation);

    const questions: QuizQuestion[] = targetCards.map((card: any) => {
      const targetExplanation = card.explanation.trim();

      // Collect distractors from user's other cards
      const otherUserExplanations = allExplanations.filter(
        (exp) => exp.toLowerCase().trim() !== targetExplanation.toLowerCase()
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
        ipa: card.ipa,
        level: card.level,
        wordFamily: card.wordFamily,
        collocations: card.collocations,
        sourceStorybookTitle: card.sourceStorybookTitle,
        explanation: card.explanation,
        options: shuffledOptions,
        fsrsState: {
          due: card.fsrs.due,
          reps: card.fsrs.reps,
          stability: card.fsrs.stability,
        },
      };
    });

    return NextResponse.json({
      questions,
      totalDue: targetCards.length,
      sessionLimit: limit,
    });
  } catch (err: any) {
    console.error("[API/vocab/review-session GET]", err);
    return NextResponse.json(
      { error: "Đã có lỗi xảy ra khi chuẩn bị phiên trắc nghiệm từ vựng." },
      { status: 500 }
    );
  }
}
