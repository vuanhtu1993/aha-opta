import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { runStorybookPipeline } from "@/lib/agents/story-shadowing-agent/graph";

// Validate input với Zod
const RequestSchema = z.object({
  text: z.string()
    .min(10, "Văn bản quá ngắn (tối thiểu 10 ký tự)")
    .max(2000, "Văn bản quá dài (tối đa 2000 ký tự)"),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { text } = RequestSchema.parse(body);

    // Chạy LangGraph pipeline (blocking ~5-10s do TTS)
    const sentences = await runStorybookPipeline(text);

    return NextResponse.json({ sentences, totalCount: sentences.length });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json(
        { error: err.issues[0].message },
        { status: 400 }
      );
    }
    console.error("[API/story-shadowing/process]", err);
    return NextResponse.json(
      { error: "Đã có lỗi xảy ra. Vui lòng thử lại." },
      { status: 500 }
    );
  }
}
