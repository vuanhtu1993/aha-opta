import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { youtubeTranscriptFetcherNode } from "@/lib/agents/story-shadowing-agent/nodes/youtube-transcript-fetcher.node";
import { youtubeSegmentSuggesterNode } from "@/lib/agents/story-shadowing-agent/nodes/youtube-segment-suggester.node";

const RequestSchema = z.object({
  youtubeUrl: z.string().url("URL không hợp lệ"),
});

const SPLIT_THRESHOLD_BLOCKS = 200; // ~15 phút video (khoảng 200 block phụ đề)

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { youtubeUrl } = RequestSchema.parse(body);

    // Phase 1: Fetch raw transcript & metadata
    const fetchResult = await youtubeTranscriptFetcherNode({ youtubeUrl } as any);

    if (fetchResult.error || !fetchResult.rawTranscript) {
      return NextResponse.json(
        { error: fetchResult.error || "Không thể tải phụ đề video." },
        { status: 400 }
      );
    }

    const totalBlocks = fetchResult.rawTranscript.length;

    // Nếu video ngắn (< 200 blocks), không cần split
    if (totalBlocks <= SPLIT_THRESHOLD_BLOCKS) {
      return NextResponse.json({
        needsSplitting: false,
        videoId: fetchResult.youtubeVideoId,
        title: fetchResult.title,
      });
    }

    // Nếu video dài (>= 200 blocks), gọi AI gợi ý phân đoạn
    const segments = await youtubeSegmentSuggesterNode(fetchResult.rawTranscript);

    return NextResponse.json({
      needsSplitting: true,
      videoId: fetchResult.youtubeVideoId,
      title: fetchResult.title,
      totalBlocks,
      segments,
      rawTranscript: fetchResult.rawTranscript, // Trả lại để frontend truyền tiếp khi user confirm
    });
  } catch (err: any) {
    console.error("[API suggest-segments]", err);
    return NextResponse.json(
      { error: err.message || "Lỗi xử lý phân đoạn video." },
      { status: 500 }
    );
  }
}
