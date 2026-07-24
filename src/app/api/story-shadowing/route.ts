import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db/mongoose";
import Storybook from "@/lib/db/models/Storybook";

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    await connectDB();

    // Lấy 50 bài mới nhất, bao gồm các trường series để hiển thị group
    const stories = await Storybook.find(
      {},
      {
        title: 1,
        thumbnail: 1,
        originalText: 1,
        createdAt: 1,
        level: 1,
        sourceType: 1,
        youtubeVideoId: 1,
        seriesId: 1,
        partIndex: 1,
        partTitle: 1,
        totalParts: 1,
      }
    )
      .sort({ createdAt: -1 })
      .limit(50)
      .lean();

    return NextResponse.json(stories);
  } catch (err) {
    console.error("[API/story-shadowing GET list]", err);
    return NextResponse.json(
      { error: "Đã có lỗi xảy ra khi tải danh sách bài luyện tập." },
      { status: 500 }
    );
  }
}
