import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db/mongoose";
import VocabCard from "@/lib/db/models/VocabCard";

function escapeRegex(str: string) {
  return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/**
 * GET /api/vocab/check?words=epiphany,resilient,...
 * POST /api/vocab/check with body { words: string[] }
 * Returns array of words that are already saved in SRS (in lowercase)
 */
export async function GET(request: NextRequest) {
  try {
    await connectDB();

    const { searchParams } = new URL(request.url);
    const wordsParam = searchParams.get("words") || "";
    
    if (!wordsParam.trim()) {
      return NextResponse.json({ savedWords: [] });
    }

    const words = wordsParam
      .split(",")
      .map((w) => w.trim())
      .filter(Boolean);

    if (words.length === 0) {
      return NextResponse.json({ savedWords: [] });
    }

    // Query matching words case-insensitively
    const regexList = words.map((w) => new RegExp(`^${escapeRegex(w)}$`, "i"));
    const foundCards = await VocabCard.find(
      { word: { $in: regexList } },
      { word: 1 }
    ).lean();

    const savedWords = foundCards.map((c) => c.word.toLowerCase());

    return NextResponse.json({ savedWords });
  } catch (err: any) {
    console.error("[API/vocab/check GET]", err);
    return NextResponse.json(
      { error: "Đã có lỗi xảy ra khi kiểm tra từ vựng đã lưu." },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    await connectDB();

    const body = await request.json();
    const words: string[] = Array.isArray(body.words) ? body.words : [];

    if (words.length === 0) {
      return NextResponse.json({ savedWords: [] });
    }

    const regexList = words
      .map((w) => typeof w === "string" ? w.trim() : "")
      .filter(Boolean)
      .map((w) => new RegExp(`^${escapeRegex(w)}$`, "i"));

    const foundCards = await VocabCard.find(
      { word: { $in: regexList } },
      { word: 1 }
    ).lean();

    const savedWords = foundCards.map((c) => c.word.toLowerCase());

    return NextResponse.json({ savedWords });
  } catch (err: any) {
    console.error("[API/vocab/check POST]", err);
    return NextResponse.json(
      { error: "Đã có lỗi xảy ra khi kiểm tra từ vựng đã lưu." },
      { status: 500 }
    );
  }
}
