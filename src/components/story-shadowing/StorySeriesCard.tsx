"use client";

import { useState } from "react";
import Link from "next/link";
import { Play, ChevronDown, ChevronUp, Layers } from "lucide-react";
import type { StoryHistory } from "@/lib/story-shadowing/story-shadowing.service";

interface StorySeriesCardProps {
  seriesId: string;
  title: string;
  stories: StoryHistory[];
  defaultExpanded?: boolean;
}

/**
 * UI Component for rendering a group of stories belonging to a Series with Expand/Collapse Accordion.
 */
export function StorySeriesCard({
  seriesId,
  title,
  stories,
  defaultExpanded = false,
}: StorySeriesCardProps) {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded);
  const firstStory = stories[0];

  return (
    <div className="bg-white dark:bg-slate-800/90 border border-slate-200/80 dark:border-slate-700 rounded-2xl p-3 shadow-2xs transition-all overflow-hidden space-y-3">
      <div className="flex gap-3">
        <div className="w-20 h-20 rounded-xl bg-slate-100 dark:bg-slate-700 relative shrink-0 overflow-hidden">
          {firstStory?.thumbnail ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={firstStory.thumbnail}
              alt={title}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full bg-indigo-50 dark:bg-indigo-950 flex items-center justify-center text-indigo-500">
              <Layers className="w-6 h-6" />
            </div>
          )}
        </div>

        <div className="flex-1 min-w-0 flex flex-col justify-between py-0.5">
          <div>
            <div className="inline-flex items-center gap-1 px-1.5 py-0.2 rounded bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 text-[9px] font-bold border border-indigo-200 dark:border-indigo-800 mb-1">
              📚 Series • {stories.length} phần
            </div>
            <h3 className="font-bold text-xs text-slate-900 dark:text-white line-clamp-1">
              {title}
            </h3>
          </div>

          <div className="flex items-center gap-2 mt-2">
            {firstStory && (
              <Link
                href={`/apps/story-shadowing/player/${firstStory._id}`}
                className="inline-flex items-center gap-1 px-2.5 py-1 bg-amber-400 hover:bg-amber-500 text-slate-900 font-bold text-[10px] rounded-lg shadow-2xs transition-colors"
              >
                <Play className="w-2.5 h-2.5 fill-slate-900" /> Phần 1
              </Link>
            )}
            <button
              onClick={() => setIsExpanded((prev) => !prev)}
              className="inline-flex items-center gap-1 px-2.5 py-1 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 text-slate-700 dark:text-slate-200 text-[10px] font-semibold rounded-lg transition-colors cursor-pointer"
            >
              {isExpanded ? (
                <>
                  Thu gọn <ChevronUp className="w-3 h-3" />
                </>
              ) : (
                <>
                  {stories.length} phần <ChevronDown className="w-3 h-3" />
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {isExpanded && (
        <div className="pt-2 border-t border-slate-100 dark:border-slate-700 space-y-1.5 animate-in fade-in duration-200">
          {stories.map((st, idx) => (
            <Link
              key={st._id}
              href={`/apps/story-shadowing/player/${st._id}`}
              className="p-2 rounded-xl bg-slate-50 dark:bg-slate-750 hover:bg-amber-50 dark:hover:bg-slate-700 flex items-center justify-between text-xs transition-colors group"
            >
              <span className="font-semibold text-slate-700 dark:text-slate-300 group-hover:text-amber-600 line-clamp-1">
                Phần {idx + 1}: {st.partTitle || st.title}
              </span>
              <Play className="w-3 h-3 text-slate-400 group-hover:text-amber-500 shrink-0 ml-2" />
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
