import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { runStorybookPipeline } from "@/lib/agents/story-shadowing-agent/graph";
import { connectDB } from "@/lib/db/mongoose";
import Storybook from "@/lib/db/models/Storybook";

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

    // Lưu vào database
    await connectDB();
    
    // Tự động tạo title từ 6 từ đầu tiên
    const words = text.split(/\s+/).filter(w => w.length > 0);
    const title = words.slice(0, 6).join(" ") + (words.length > 6 ? "..." : "");

    const newStory = await Storybook.create({
      title,
      originalText: text,
      sentences: sentences,
    });

    return NextResponse.json({ 
      id: newStory._id,
      totalCount: sentences.length 
    });
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
