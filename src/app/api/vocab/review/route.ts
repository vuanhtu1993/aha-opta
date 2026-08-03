import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db/mongoose";
import VocabCard from "@/lib/db/models/VocabCard";
import VocabReviewLog from "@/lib/db/models/VocabReviewLog";
import { submitQuizReviewSchema } from "@/lib/schemas/vocab.schema";
import { calculateFSRSRating, scheduleNextReview } from "@/lib/srs/fsrs-engine";

export const dynamic = "force-dynamic";

/**
 * POST /api/vocab/review
 * Processes quiz submission for a card, updates FSRS state and writes review log
 */
export async function POST(request: NextRequest) {
  try {
    await connectDB();

    const body = await request.json();
    const validated = submitQuizReviewSchema.safeParse(body);

    if (!validated.success) {
      return NextResponse.json(
        { error: "Dữ liệu kết quả không hợp lệ", details: validated.error.format() },
        { status: 400 }
      );
    }

    const { cardId, isCorrect, responseTimeMs } = validated.data;

    const card = await VocabCard.findById(cardId);
    if (!card) {
      return NextResponse.json(
        { error: "Không tìm thấy thẻ từ vựng tương ứng." },
        { status: 404 }
      );
    }

    const rating = calculateFSRSRating(isCorrect, responseTimeMs);
    const now = new Date();

    // Convert document to plain object to safely access previous FSRS state
    const cardObj = card.toObject();
    const prevFsrs = cardObj.fsrs;
    const prevState = {
      state: prevFsrs?.state ?? 0,
      due: prevFsrs?.due ? new Date(prevFsrs.due) : new Date(),
      stability: prevFsrs?.stability ?? 0,
      difficulty: prevFsrs?.difficulty ?? 0,
      elapsed_days: prevFsrs?.elapsed_days ?? 0,
      scheduled_days: prevFsrs?.scheduled_days ?? 0,
      reps: prevFsrs?.reps ?? 0,
      lapses: prevFsrs?.lapses ?? 0,
      learning_steps: prevFsrs?.learning_steps,
    };

    const { updatedState } = scheduleNextReview(prevState as any, rating, now);

    // Update card in DB
    card.fsrs = updatedState;
    await card.save();

    // Create review log
    await VocabReviewLog.create({
      vocabCardId: card._id,
      word: card.word,
      rating,
      state: prevState.state,
      due: prevState.due,
      stability: prevState.stability,
      difficulty: prevState.difficulty,
      elapsed_days: prevState.elapsed_days,
      scheduled_days: prevState.scheduled_days,
      responseTimeMs,
      isCorrect,
      reviewedAt: now,
    });

    return NextResponse.json({
      success: true,
      cardId: card._id.toString(),
      word: card.word,
      isCorrect,
      rating,
      nextDue: updatedState.due,
      stability: updatedState.stability,
      difficulty: updatedState.difficulty,
      reps: updatedState.reps,
      lapses: updatedState.lapses,
    });
  } catch (err: any) {
    console.error("[API/vocab/review POST]", err);
    return NextResponse.json(
      { error: "Đã có lỗi xảy ra khi ghi nhận kết quả ôn tập." },
      { status: 500 }
    );
  }
}
