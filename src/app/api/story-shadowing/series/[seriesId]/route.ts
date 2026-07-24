import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db/mongoose";
import Storybook from "@/lib/db/models/Storybook";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ seriesId: string }> }
) {
  try {
    const { seriesId } = await params;
    await connectDB();

    const parts = await Storybook.find({ seriesId })
      .select("title partIndex partTitle totalParts level createdAt")
      .sort({ partIndex: 1 })
      .lean();

    return NextResponse.json(parts);
  } catch (err) {
    console.error("[API/story-shadowing/series GET]", err);
    return NextResponse.json({ error: "Lỗi truy vấn series" }, { status: 500 });
  }
}
