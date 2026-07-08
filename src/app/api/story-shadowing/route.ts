import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db/mongoose";
import Storybook from "@/lib/db/models/Storybook";

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    await connectDB();

    // Lấy 20 bài mới nhất, chỉ lấy các trường cần thiết để hiển thị list
    const stories = await Storybook.find({}, { title: 1, originalText: 1, createdAt: 1 })
      .sort({ createdAt: -1 })
      .limit(20)
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
