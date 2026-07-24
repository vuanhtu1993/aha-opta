import { NextRequest } from "next/server";
import { z } from "zod";
import { runYouTubeShadowingPipeline } from "@/lib/agents/story-shadowing-agent/youtube-graph";
import { connectDB } from "@/lib/db/mongoose";
import Storybook from "@/lib/db/models/Storybook";
import { withAgentSSE } from "@/lib/utils/sse-wrapper";

const RequestSchema = z.object({
  youtubeUrl: z.string().url("URL không hợp lệ"),
});

async function youtubeHandler(req: NextRequest, log: (msg: string) => void) {
  const body = await req.json();
  const { youtubeUrl } = RequestSchema.parse(body);

  log("[API] Bắt đầu lấy phụ đề và phân tích video YouTube...");
  
  // 1. Chạy LangGraph pipeline
  const result = await runYouTubeShadowingPipeline(youtubeUrl, log);

  log("[API] Phân tích hoàn tất, đang lưu vào Database...");

  // 2. Lưu vào database
  await connectDB();

  // Create document in MongoDB
  const newStory = await Storybook.create({
    title: result.title || "YouTube Shadowing",
    thumbnail: `https://img.youtube.com/vi/${result.youtubeVideoId}/maxresdefault.jpg`,
    originalText: youtubeUrl, // Save URL as originalText for reference
    sentences: result.sentences,
    keywords: result.keywords,
    level: result.level,
    voice: "youtube", // Special voice ID indicating real audio
    speakingRate: 1.0,
    sourceType: "youtube",
    youtubeVideoId: result.youtubeVideoId,
  });

  log(`[API] ✅ Hoàn tất! ID: ${newStory._id}`);

  return {
    id: newStory._id,
    totalCount: result.sentences.length,
  };
}

export const POST = withAgentSSE(youtubeHandler);
export const maxDuration = 300;
