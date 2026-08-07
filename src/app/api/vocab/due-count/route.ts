import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db/mongoose";
import VocabCard from "@/lib/db/models/VocabCard";

export const dynamic = "force-dynamic";
export const revalidate = 0;

/**
 * GET /api/vocab/due-count
 * Returns statistics and number of cards due for review today
 */
export async function GET() {
  try {
    await connectDB();

    const now = new Date();

    const [dueCount, totalCount, newCount, masteredCount] = await Promise.all([
      VocabCard.countDocuments({ "fsrs.due": { $lte: now } }),
      VocabCard.countDocuments({}),
      VocabCard.countDocuments({ "fsrs.state": 0 }),
      VocabCard.countDocuments({ "fsrs.stability": { $gte: 30 } }),
    ]);

    const learningCount = Math.max(0, totalCount - newCount - masteredCount);

    return NextResponse.json({
      dueCount,
      totalCount,
      newCount,
      learningCount,
      masteredCount,
    });
  } catch (err: any) {
    console.error("[API/vocab/due-count GET]", err);
    return NextResponse.json(
      { error: "Đã có lỗi xảy ra khi lấy số lượng từ cần ôn." },
      { status: 500 }
    );
  }
}
