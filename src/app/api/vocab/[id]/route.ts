import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db/mongoose";
import VocabCard from "@/lib/db/models/VocabCard";
import VocabReviewLog from "@/lib/db/models/VocabReviewLog";

/**
 * DELETE /api/vocab/[id]
 * Removes a vocabulary card and its review logs from SRS
 */
export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    await connectDB();
    const { id } = await context.params;

    const card = await VocabCard.findByIdAndDelete(id);
    if (!card) {
      return NextResponse.json(
        { error: "Không tìm thấy thẻ từ vựng cần xoá." },
        { status: 404 }
      );
    }

    // Clean up review logs for this card
    await VocabReviewLog.deleteMany({ vocabCardId: id });

    return NextResponse.json({
      success: true,
      message: `Đã xoá từ "${card.word}" khỏi danh mục SRS.`,
    });
  } catch (err: any) {
    console.error("[API/vocab/[id] DELETE]", err);
    return NextResponse.json(
      { error: "Đã có lỗi xảy ra khi xoá từ vựng." },
      { status: 500 }
    );
  }
}
