import { NextRequest, NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
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
    console.error("[API/story-shadowing/[id] GET]", err);
    return NextResponse.json(
      { error: "Đã có lỗi xảy ra khi tải bài luyện tập." },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    await connectDB();

    const deletedStory = await Storybook.findByIdAndDelete(id);

    if (!deletedStory) {
      return NextResponse.json(
        { error: "Không tìm thấy bài luyện tập để xóa." },
        { status: 404 }
      );
    }

    // Invalidate static cache để danh sách cập nhật ngay lập tức
    revalidatePath("/apps/story-shadowing");

    return NextResponse.json({ success: true, message: "Đã xóa bài luyện tập thành công." });
  } catch (err) {
    console.error("[API/story-shadowing/[id] DELETE]", err);
    return NextResponse.json(
      { error: "Đã có lỗi xảy ra khi xóa bài luyện tập." },
      { status: 500 }
    );
  }
}

