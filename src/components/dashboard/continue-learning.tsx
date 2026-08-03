"use client";

import Link from "next/link";
import { Play, Sparkles, BookOpen } from "lucide-react";

interface StorybookItem {
  _id: string;
  title: string;
  level?: "easy" | "medium" | "hard";
  originalText: string;
  thumbnail?: string;
  sourceType?: string;
}

interface ContinueLearningProps {
  latestStory?: StorybookItem | null;
}

export function ContinueLearning({ latestStory }: ContinueLearningProps) {
  if (!latestStory) {
    return (
      <div className="bg-gradient-to-br from-amber-50 to-orange-50 dark:from-slate-800 dark:to-slate-850 p-5 rounded-3xl border border-amber-200/60 dark:border-slate-700/60 space-y-3">
        <div className="flex items-center gap-2 text-amber-700 dark:text-amber-400 font-bold text-xs">
          <Sparkles className="w-4 h-4" /> Bắt đầu hành trình
        </div>
        <h3 className="font-extrabold text-base text-slate-900 dark:text-white">
          Chưa có bài luyện tập nào
        </h3>
        <p className="text-xs text-slate-600 dark:text-slate-400">
          Hãy tạo bài học đầu tiên từ văn bản hoặc video YouTube yêu thích!
        </p>
        <Link
          href="/apps/story-shadowing/create"
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-amber-400 hover:bg-amber-500 text-slate-900 font-bold text-xs rounded-xl shadow-xs transition-colors"
        >
          + Tạo bài luyện tập
        </Link>
      </div>
    );
  }

  const levelColor =
    latestStory.level === "easy"
      ? "bg-emerald-100 text-emerald-700 border-emerald-200"
      : latestStory.level === "hard"
      ? "bg-rose-100 text-rose-700 border-rose-200"
      : "bg-amber-100 text-amber-800 border-amber-200";

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between px-1">
        <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
          <BookOpen className="w-3.5 h-3.5 text-amber-500" /> Tiếp tục bài gần nhất
        </span>
        <Link
          href="/apps/story-shadowing"
          className="text-xs font-semibold text-amber-600 dark:text-amber-400 hover:underline"
        >
          Xem tất cả →
        </Link>
      </div>

      <Link
        href={`/apps/story-shadowing/player/${latestStory._id}`}
        className="block bg-white dark:bg-slate-800/90 rounded-3xl p-4 border border-slate-200/80 dark:border-slate-700 shadow-xs hover:border-amber-400 transition-all group overflow-hidden"
      >
        <div className="flex gap-4">
          <div className="w-20 h-20 rounded-2xl bg-slate-100 dark:bg-slate-700 shrink-0 overflow-hidden relative">
            {latestStory.thumbnail ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={latestStory.thumbnail} alt={latestStory.title} className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full bg-amber-100 dark:bg-amber-950 flex items-center justify-center text-amber-500 font-bold text-xl">
                📖
              </div>
            )}
          </div>

          <div className="flex-1 min-w-0 flex flex-col justify-between">
            <div>
              <div className="flex items-center gap-2 mb-1">
                {latestStory.level && (
                  <span className={`text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full border ${levelColor}`}>
                    {latestStory.level}
                  </span>
                )}
                <span className="text-[10px] text-slate-400 font-medium">
                  {latestStory.sourceType === "youtube" ? "YouTube Video" : "Text Shadowing"}
                </span>
              </div>
              <h4 className="font-bold text-sm text-slate-900 dark:text-white line-clamp-1 group-hover:text-amber-500 transition-colors">
                {latestStory.title}
              </h4>
              <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-1 mt-0.5">
                {latestStory.originalText}
              </p>
            </div>

            <div className="flex items-center justify-end mt-2">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-amber-400 group-hover:bg-amber-500 text-slate-900 font-bold text-xs rounded-xl shadow-xs transition-colors">
                <Play className="w-3 h-3 fill-slate-900" /> Luyện tập
              </span>
            </div>
          </div>
        </div>
      </Link>
    </div>
  );
}
