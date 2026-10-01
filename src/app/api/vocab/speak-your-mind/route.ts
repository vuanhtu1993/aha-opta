/**
 * @file route.ts
 * @description API endpoint trả về câu hỏi luyện nói PREP (Speak Your Mind)
 *
 * Mapped Spec: FR-VOCAB-06 | US-VOCAB-03
 * Made by Anh Tu - Share to be share
 */

import { NextRequest, NextResponse } from "next/server";
import { getSpeakingQuestionById, getSpeakingQuestions } from "@/lib/srs/speaking-quiz.service";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");
    const listAll = searchParams.get("all") === "true";

    if (listAll) {
      const questions = await getSpeakingQuestions();
      return NextResponse.json(
        { questions, total: questions.length },
        {
          headers: {
            "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate",
          },
        }
      );
    }

    const question = await getSpeakingQuestionById(id || undefined);
    return NextResponse.json(question, {
      headers: {
        "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate",
      },
    });
  } catch (error) {
    console.error("[API/speak-your-mind GET] Error:", error);
    return NextResponse.json(
      { error: "Failed to load PREP speaking question" },
      { status: 500 }
    );
  }
}
