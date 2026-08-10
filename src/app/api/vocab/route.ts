import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db/mongoose";
import VocabCard from "@/lib/db/models/VocabCard";
import { saveVocabCardSchema } from "@/lib/schemas/vocab.schema";
import { createInitialFSRSState } from "@/lib/srs/fsrs-engine";

export const dynamic = "force-dynamic";
export const revalidate = 0;

/**
 * GET /api/vocab
 * Lists all saved vocabulary cards with search, level filtering, and sorting
 */
export async function GET(request: NextRequest) {
  try {
    await connectDB();

    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search") || "";
    const level = searchParams.get("level") || "";
    const sort = searchParams.get("sort") || "due_asc";

    const filter: Record<string, any> = {};

    if (search.trim()) {
      filter.$or = [
        { word: { $regex: search.trim(), $options: "i" } },
        { explanation: { $regex: search.trim(), $options: "i" } },
      ];
    }

    if (level && level !== "all") {
      filter.level = level;
    }

    let sortObj: Record<string, any> = { "fsrs.due": 1 };
    if (sort === "newest") {
      sortObj = { createdAt: -1 };
    } else if (sort === "alpha") {
      sortObj = { word: 1 };
    } else if (sort === "stability_desc") {
      sortObj = { "fsrs.stability": -1 };
    }

    const cards = await VocabCard.find(filter).sort(sortObj).lean();

    return NextResponse.json({
      cards,
      total: cards.length,
    });
  } catch (err: any) {
    console.error("[API/vocab GET]", err);
    return NextResponse.json(
      { error: "Đã có lỗi xảy ra khi lấy danh sách từ vựng." },
      { status: 500 }
    );
  }
}

/**
 * POST /api/vocab
 * Saves a word into SRS collection (with duplicate check)
 */
export async function POST(request: NextRequest) {
  try {
    await connectDB();

    const body = await request.json();
    const validated = saveVocabCardSchema.safeParse(body);

    if (!validated.success) {
      return NextResponse.json(
        { error: "Dữ liệu không hợp lệ", details: validated.error.format() },
        { status: 400 }
      );
    }

    const data = validated.data;
    const cleanWord = data.word.trim();

    // Duplicate check (case-insensitive)
    const existing = await VocabCard.findOne({
      word: { $regex: `^${cleanWord}$`, $options: "i" },
    });

    if (existing) {
      return NextResponse.json({
        success: true,
        created: false,
        message: "Từ vựng này đã có trong kho SRS của bạn.",
        card: existing,
      });
    }

    const initialFSRS = createInitialFSRSState(new Date());

    const newCard = await VocabCard.create({
      word: cleanWord,
      ipa: data.ipa,
      explanation: data.explanation,
      level: data.level,
      audioUrl: data.audioUrl,
      wordFamily: data.wordFamily,
      collocations: data.collocations,
      sourceStorybookId: data.sourceStorybookId,
      sourceStorybookTitle: data.sourceStorybookTitle,
      fsrs: initialFSRS,
    });

    return NextResponse.json(
      {
        success: true,
        created: true,
        message: "Đã lưu từ vựng vào SRS thành công!",
        card: newCard,
      },
      { status: 201 }
    );
  } catch (err: any) {
    console.error("[API/vocab POST]", err);
    return NextResponse.json(
      { error: "Đã có lỗi xảy ra khi lưu từ vựng." },
      { status: 500 }
    );
  }
}
