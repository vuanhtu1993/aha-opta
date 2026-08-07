import { NextRequest, NextResponse } from "next/server";
import {
  getReviewSessionQuestions,
  type QuizQuestion,
  type QuizOption,
} from "@/lib/srs/review-session.service";

export type { QuizQuestion, QuizOption };

export const dynamic = "force-dynamic";
export const revalidate = 0;

/**
 * GET /api/vocab/review-session
 * Generates a Quiz Session batch (up to `limit` cards) with 4 English choices per card.
 * Reuses the shared getReviewSessionQuestions service.
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const limitParam = parseInt(searchParams.get("limit") || "15", 10);
    const limit = Math.min(Math.max(1, limitParam), 30);
    const practiceAll = searchParams.get("practice_all") === "true";

    const sessionData = await getReviewSessionQuestions({
      limit,
      practiceAll,
    });

    return NextResponse.json(sessionData);
  } catch (err: any) {
    console.error("[API/vocab/review-session GET]", err);
    return NextResponse.json(
      { error: "Đã có lỗi xảy ra khi chuẩn bị phiên trắc nghiệm từ vựng." },
      { status: 500 }
    );
  }
}
