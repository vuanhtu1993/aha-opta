import { NextRequest, NextResponse } from "next/server";
import { getStoryList } from "@/lib/story-shadowing/story-shadowing.service";

/**
 * GET /api/story-shadowing
 * Reuses the shared getStoryList service function.
 */
export async function GET(request: NextRequest) {
  try {
    const stories = await getStoryList(50);
    return NextResponse.json(stories);
  } catch (err) {
    console.error("[API/story-shadowing GET list]", err);
    return NextResponse.json(
      { error: "Đã có lỗi xảy ra khi tải danh sách bài luyện tập." },
      { status: 500 }
    );
  }
}
