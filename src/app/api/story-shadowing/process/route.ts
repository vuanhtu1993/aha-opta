import { NextRequest } from "next/server";
import { z } from "zod";
import { runStorybookPipeline } from "@/lib/agents/story-shadowing-agent/graph";
import { connectDB } from "@/lib/db/mongoose";
import Storybook from "@/lib/db/models/Storybook";
import { withAgentSSE } from "@/lib/utils/sse-wrapper";

// Validate input với Zod
const RequestSchema = z.object({
  text: z.string()
    .min(10, "Văn bản quá ngắn (tối thiểu 10 ký tự)")
    .max(10000, "Văn bản quá dài (tối đa 10000 ký tự)"),
  title: z.string().optional(),
  thumbnail: z.string().url("URL ảnh không hợp lệ").optional().or(z.literal("")),
  voice: z.string().default("en-US-Journey-F"),
});

export const POST = withAgentSSE(async (request: NextRequest, log) => {
  try {
    const body = await request.json();
    const { text, title, thumbnail, voice } = RequestSchema.parse(body);

    log(`[API Process] Nhận yêu cầu tạo bài mới...`);
    log(`[API Process] Đang bắt đầu LangGraph Pipeline...`);
    // Chạy LangGraph pipeline (blocking ~5-10s do TTS)
    const { sentences, level, speakingRate } = await runStorybookPipeline(text, voice, log);

    // Lưu vào database
    log(`[API Process] Đang lưu vào cơ sở dữ liệu...`);
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

    log(`[API Process] ✅ Đã lưu thành công vào Database (ID: ${newStory._id})`);

    return {
      id: newStory._id,
      totalCount: sentences.length
    };
  } catch (err) {
    if (err instanceof z.ZodError) {
      throw new Error(err.issues[0].message);
    }
    console.error("[API/story-shadowing/process]", err);
    throw new Error("Đã có lỗi xảy ra. Vui lòng thử lại.");
  }
});
