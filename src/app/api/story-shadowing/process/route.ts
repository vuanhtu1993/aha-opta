import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { runStorybookPipeline } from "@/lib/agents/story-shadowing-agent/graph";
import { connectDB } from "@/lib/db/mongoose";
import Storybook from "@/lib/db/models/Storybook";

// Validate input với Zod
const RequestSchema = z.object({
  text: z.string()
    .min(10, "Văn bản quá ngắn (tối thiểu 10 ký tự)")
    .max(5000, "Văn bản quá dài (tối đa 5000 ký tự)"),
  title: z.string().optional(),
  thumbnail: z.string().url("URL ảnh không hợp lệ").optional().or(z.literal("")),
  voice: z.string().default("en-US-Journey-F"),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { text, title, thumbnail, voice } = RequestSchema.parse(body);

    // Chạy LangGraph pipeline (blocking ~5-10s do TTS)
    const { sentences, level, speakingRate } = await runStorybookPipeline(text, voice);

    // Lưu vào database
    await connectDB();

    // Tự động tạo title từ 6 từ đầu tiên nếu không có title
    let finalTitle = title?.trim();
    if (!finalTitle) {
      const words = text.split(/\s+/).filter(w => w.length > 0);
      finalTitle = words.slice(0, 6).join(" ") + (words.length > 6 ? "..." : "");
    }

    const newStory = await Storybook.create({
      title: finalTitle,
      thumbnail: thumbnail || undefined,
      originalText: text,
      sentences: sentences,
      level: level,
      voice: voice,
      speakingRate: speakingRate,
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
