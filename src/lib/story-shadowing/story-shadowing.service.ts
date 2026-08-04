import { connectDB } from "@/lib/db/mongoose";
import Storybook from "@/lib/db/models/Storybook";

export interface StoryHistory {
  _id: string;
  title: string;
  originalText: string;
  createdAt: string;
  thumbnail?: string;
  level?: "easy" | "medium" | "hard";
  sourceType?: "text" | "youtube";
  youtubeVideoId?: string;
  seriesId?: string;
  partIndex?: number;
  partTitle?: string;
  totalParts?: number;
}

/**
 * Service function to retrieve the list of stories directly on the server.
 * Connects to MongoDB singleton and returns serializable data.
 */
export async function getStoryList(limit: number = 50): Promise<StoryHistory[]> {
  await connectDB();

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
    .limit(limit)
    .lean();

  return stories.map((s: any) => ({
    _id: s._id.toString(),
    title: s.title,
    originalText: s.originalText || "",
    createdAt: s.createdAt ? new Date(s.createdAt).toISOString() : new Date().toISOString(),
    thumbnail: s.thumbnail || "",
    level: s.level,
    sourceType: s.sourceType || "text",
    youtubeVideoId: s.youtubeVideoId,
    seriesId: s.seriesId,
    partIndex: s.partIndex,
    partTitle: s.partTitle,
    totalParts: s.totalParts,
  }));
}
