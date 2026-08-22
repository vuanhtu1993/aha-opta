import { NextRequest, NextResponse } from "next/server";

/**
 * GET /api/vocab/audio?word=...
 * Server-side audio lookup to bypass browser CORS / AdBlocker blocks when fetching Free Dictionary API.
 * Uses Next.js fetch cache (revalidate 24h).
 */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const word = searchParams.get("word");

  if (!word) {
    return NextResponse.json({ error: "Missing word parameter" }, { status: 400 });
  }

  try {
    const res = await fetch(
      `https://api.dictionaryapi.dev/api/v2/entries/en/${encodeURIComponent(word.trim())}`,
      {
        headers: {
          "User-Agent": "AhaTools-Vocab/1.0",
        },
        next: { revalidate: 86400 }, // Cache 24h server-side
      }
    );

    if (res.ok) {
      const data = await res.json();
      const phonetics = data[0]?.phonetics || [];
      const foundPhonetic = phonetics.find(
        (p: any) => p.audio && p.audio.trim().length > 0
      );

      if (foundPhonetic?.audio) {
        return NextResponse.json({ audioUrl: foundPhonetic.audio });
      }
    }
  } catch (err) {
    console.error("[API/vocab/audio]", err);
  }

  return NextResponse.json({ audioUrl: null });
}
