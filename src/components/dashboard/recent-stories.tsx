"use client";

import Link from "next/link";
import { Flame } from "lucide-react";

interface StorybookItem {
  _id: string;
  title: string;
  thumbnail?: string;
  createdAt: string;
}

interface RecentStoriesProps {
  stories: StorybookItem[];
}

export function RecentStories({ stories }: RecentStoriesProps) {
  if (!stories || stories.length === 0) return null;

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between px-1">
        <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
          <Flame className="w-3.5 h-3.5 text-amber-500" /> Bài học gần đây
        </span>
        <Link
          href="/apps/story-shadowing"
          className="text-xs font-semibold text-amber-600 dark:text-amber-400 hover:underline"
        >
          Xem tất cả →
        </Link>
      </div>

      <div className="flex gap-3 overflow-x-auto pb-2 pt-1 scrollbar-none -mx-4 px-4">
        {stories.map((story) => (
          <Link
            key={story._id}
            href={`/apps/story-shadowing/player/${story._id}`}
            className="w-36 shrink-0 bg-white dark:bg-slate-800 rounded-2xl border border-slate-200/80 dark:border-slate-700 overflow-hidden shadow-2xs hover:border-amber-400 transition-all group"
          >
            <div className="w-full h-24 bg-slate-100 dark:bg-slate-700 relative">
              {story.thumbnail ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={story.thumbnail} alt={story.title} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full bg-amber-50 dark:bg-amber-950/40 flex items-center justify-center text-xl">
                  📖
                </div>
              )}
            </div>
            <div className="p-2.5">
              <h5 className="font-bold text-xs text-slate-800 dark:text-slate-100 line-clamp-1 group-hover:text-amber-500 transition-colors">
                {story.title}
              </h5>
              <p className="text-[10px] text-slate-400 mt-0.5">
                {new Date(story.createdAt).toLocaleDateString("vi-VN")}
              </p>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
