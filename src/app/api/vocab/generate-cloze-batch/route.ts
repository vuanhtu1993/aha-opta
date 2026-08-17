import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db/mongoose";
import VocabCard from "@/lib/db/models/VocabCard";
import { generateBatchExampleSentences, BatchWordItem } from "@/lib/vocab/cloze-enricher";

export const dynamic = "force-dynamic";
export const revalidate = 0;

/**
 * GET /api/vocab/generate-cloze-batch
 * Returns pending count of cards without exampleSentences
 */
export async function GET() {
  try {
    await connectDB();
    const pendingCount = await VocabCard.countDocuments({
      $or: [
        { exampleSentences: { $exists: false } },
        { exampleSentences: { $size: 0 } },
      ],
    });

    return NextResponse.json({ pendingCount });
  } catch (err: any) {
    console.error("[API/generate-cloze-batch GET]", err);
    return NextResponse.json(
      { error: "Lỗi khi lấy số lượng từ thiếu Cloze" },
      { status: 500 }
    );
  }
}

/**
 * POST /api/vocab/generate-cloze-batch
 * Batch process cards missing exampleSentences (Chunk size: 15 words)
 */
export async function POST(request: NextRequest) {
  try {
    await connectDB();
    let body: any = {};
    try {
      body = await request.json();
    } catch {
      // Empty body allowed
    }

    const limit = Math.min(Math.max(1, body.limit || 45), 100);

    let query: Record<string, any> = {
      $or: [
        { exampleSentences: { $exists: false } },
        { exampleSentences: { $size: 0 } },
      ],
    };

    if (body.cardIds && Array.isArray(body.cardIds) && body.cardIds.length > 0) {
      query = { _id: { $in: body.cardIds } };
    }

    const targetCards = await VocabCard.find(query).limit(limit).lean();

    if (targetCards.length === 0) {
      return NextResponse.json({
        success: true,
        message: "Tất cả từ vựng đã có câu ví dụ Cloze!",
        processedCount: 0,
        updatedCount: 0,
      });
    }

    // Chunk size: 15 words per Gemini call
    const CHUNK_SIZE = 15;
    let updatedCount = 0;

    for (let i = 0; i < targetCards.length; i += CHUNK_SIZE) {
      const chunk = targetCards.slice(i, i + CHUNK_SIZE);
      const batchItems: BatchWordItem[] = chunk.map((c: any) => ({
        id: c._id.toString(),
        word: c.word,
        explanation: c.explanation,
        level: c.level || "B1",
      }));

      const resultMap = await generateBatchExampleSentences(batchItems);

      // Bulk update DB for this chunk
      for (const card of chunk) {
        const sentences = resultMap.get(card.word.toLowerCase());
        if (sentences && sentences.length > 0) {
          await VocabCard.findByIdAndUpdate(card._id, {
            $set: { exampleSentences: sentences },
          });
          updatedCount++;
        }
      }
    }

    return NextResponse.json({
      success: true,
      message: `Đã hoàn tất sinh câu Cloze cho ${updatedCount}/${targetCards.length} từ vựng!`,
      processedCount: targetCards.length,
      updatedCount,
    });
  } catch (err: any) {
    console.error("[API/generate-cloze-batch POST]", err);
    return NextResponse.json(
      { error: "Có lỗi xảy ra khi tạo câu hỏi Cloze theo batch." },
      { status: 500 }
    );
  }
}
