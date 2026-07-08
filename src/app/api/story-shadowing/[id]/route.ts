import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db/mongoose";
import Storybook from "@/lib/db/models/Storybook";

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    await connectDB();

    const story = await Storybook.findById(id).lean();

    if (!story) {
      return NextResponse.json(
        { error: "Không tìm thấy bài luyện tập." },
        { status: 404 }
      );
    }

    return NextResponse.json(story);
  } catch (err) {
    console.error("[API/story-shadowing/[id]]", err);
    return NextResponse.json(
      { error: "Đã có lỗi xảy ra khi tải bài luyện tập." },
      { status: 500 }
    );
  }
}
