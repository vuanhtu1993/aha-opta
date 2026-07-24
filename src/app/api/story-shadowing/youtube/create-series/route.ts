export const maxDuration = 300;
import { NextRequest } from "next/server";
import { z } from "zod";
import { connectDB } from "@/lib/db/mongoose";
import Storybook from "@/lib/db/models/Storybook";
import { youtubeSentenceConsolidatorNode } from "@/lib/agents/story-shadowing-agent/nodes/youtube-sentence-consolidator.node";
import { youtubeKeywordExtractorNode } from "@/lib/agents/story-shadowing-agent/nodes/youtube-keyword-extractor.node";

const SegmentInputSchema = z.object({
  title: z.string(),
  startMs: z.number(),
  endMs: z.number(),
  blockStart: z.number(),
  blockEnd: z.number(),
});

const RequestSchema = z.object({
  youtubeUrl: z.string().url(),
  videoId: z.string(),
  videoTitle: z.string(),
  selectedSegments: z.array(SegmentInputSchema).min(1, "Vui lòng chọn ít nhất 1 phần"),
  rawTranscript: z.array(
    z.object({
      text: z.string(),
      start: z.number(),
      duration: z.number(),
    })
  ),
  voice: z.string().default("en-US-Journey-F"),
});

export async function POST(request: NextRequest) {
  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    async start(controller) {
      const sendLog = (msg: string) => {
        controller.enqueue(encoder.encode(`data: ${JSON.stringify({ message: msg })}\n\n`));
      };

      try {
        const body = await request.json();
        const parsed = RequestSchema.parse(body);

        await connectDB();

        const seriesId = crypto.randomUUID();
        const totalParts = parsed.selectedSegments.length;
        const createdStoryIds: string[] = [];

        sendLog(`🚀 Bắt đầu tạo series [${parsed.videoTitle}] với ${totalParts} phần...`);

        // Xử lý từng segment tuần tự để kiểm soát Rate Limit
        for (let idx = 0; idx < parsed.selectedSegments.length; idx++) {
          const seg = parsed.selectedSegments[idx];
          const partNum = idx + 1;

          sendLog(`[Phần ${partNum}/${totalParts}] 🧩 Đang phân tích: ${seg.title}...`);

          // Slice transcript cho riêng segment này
          const slicedTranscript = parsed.rawTranscript.slice(seg.blockStart, seg.blockEnd + 1);

          // Call consolidator node for this slice
          const consolidatorResult = await youtubeSentenceConsolidatorNode({
            youtubeUrl: parsed.youtubeUrl,
            rawTranscript: slicedTranscript,
          } as any);

          if (consolidatorResult.error || !consolidatorResult.sentences) {
            sendLog(`⚠️ Lỗi khi xử lý Phần ${partNum}: ${consolidatorResult.error || "Không có câu nào"}. Bỏ qua phần này.`);
            continue;
          }

          sendLog(`[Phần ${partNum}/${totalParts}] 🔑 Đang trích xuất từ vựng cốt lõi...`);

          // Call keyword extractor node
          const keywordResult = await youtubeKeywordExtractorNode({
            sentences: consolidatorResult.sentences,
          } as any);

          // Tạo full text đại diện
          const originalText = consolidatorResult.sentences.map((s) => s.text).join(" ");

          const newStory = await Storybook.create({
            title: `${parsed.videoTitle} - ${seg.title}`,
            thumbnail: `https://img.youtube.com/vi/${parsed.videoId}/hqdefault.jpg`,
            originalText,
            sentences: consolidatorResult.sentences,
            keywords: keywordResult.keywords || [],
            level: consolidatorResult.level || "medium",
            voice: parsed.voice,
            speakingRate: 1.0,
            sourceType: "youtube",
            youtubeVideoId: parsed.videoId,
            // Phase 7 series fields
            seriesId,
            partIndex: idx,
            partTitle: seg.title,
            totalParts,
          });

          createdStoryIds.push(newStory._id.toString());
          sendLog(`[Phần ${partNum}/${totalParts}] ✅ Hoàn tất tạo bài!`);
        }

        sendLog(`🎉 Đã tạo thành công Series (${createdStoryIds.length}/${totalParts} bài). Đang chuyển hướng...`);
        controller.enqueue(
          encoder.encode(
            `data: ${JSON.stringify({ result: { done: true, seriesId, firstStoryId: createdStoryIds[0] } })}\n\n`
          )
        );
      } catch (err: any) {
        sendLog(`❌ Lỗi: ${err.message || "Lỗi tạo series"}`);
      } finally {
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    },
  });
}
