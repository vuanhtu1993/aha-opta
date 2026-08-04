import Link from "next/link";
import { Video, BookOpen } from "lucide-react";
import type { StoryHistory } from "@/lib/story-shadowing/story-shadowing.service";

interface StoryCardProps {
  story: StoryHistory;
}

/**
 * UI Component for rendering a single story card
 */
export function StoryCard({ story }: StoryCardProps) {
  const levelBadge =
    story.level === "easy"
      ? "bg-emerald-50 text-emerald-600 border-emerald-200"
      : story.level === "hard"
      ? "bg-rose-50 text-rose-600 border-rose-200"
      : "bg-amber-50 text-amber-700 border-amber-200";

  const estimatedMinutes = Math.max(
    1,
    Math.ceil((story.originalText?.split(/\s+/).length || 0) / 20)
  );

  return (
    <Link
      href={`/apps/story-shadowing/player/${story._id}`}
      className="flex gap-3 bg-white dark:bg-slate-800/90 border border-slate-200/80 dark:border-slate-700 rounded-2xl p-3 shadow-2xs hover:border-amber-400 transition-all group overflow-hidden"
    >
      <div className="w-20 h-20 rounded-xl bg-slate-100 dark:bg-slate-700 relative shrink-0 overflow-hidden">
        {story.thumbnail ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={story.thumbnail}
            alt={story.title}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full bg-amber-50 dark:bg-amber-950 flex items-center justify-center text-amber-500">
            {story.sourceType === "youtube" ? (
              <Video className="w-6 h-6" />
            ) : (
              <BookOpen className="w-6 h-6" />
            )}
          </div>
        )}
      </div>

      <div className="flex-1 min-w-0 flex flex-col justify-between py-0.5">
        <div>
          <div className="flex items-center gap-1.5 mb-1">
            {story.level && (
              <span
                className={`text-[9px] font-extrabold uppercase px-1.5 py-0.2 rounded border ${levelBadge}`}
              >
                {story.level}
              </span>
            )}
            <span className="text-[10px] text-slate-400">
              {new Date(story.createdAt).toLocaleDateString("vi-VN")}
            </span>
          </div>
          <h3 className="font-bold text-xs text-slate-900 dark:text-white line-clamp-1 group-hover:text-amber-500 transition-colors">
            {story.title}
          </h3>
          <p className="text-[11px] text-slate-500 dark:text-slate-400 line-clamp-1 mt-0.5">
            {story.originalText}
          </p>
        </div>

        <div className="flex items-center justify-between text-[10px] text-slate-400 font-medium mt-1">
          <span>⏱️ ~{estimatedMinutes} phút</span>
          <span className="text-amber-500 font-bold group-hover:translate-x-0.5 transition-transform">
            Luyện →
          </span>
        </div>
      </div>
    </Link>
  );
}
