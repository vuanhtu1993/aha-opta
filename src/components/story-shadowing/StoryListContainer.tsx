"use client";

import { useState, useMemo } from "react";
import { Search } from "lucide-react";
import type { StoryHistory } from "@/lib/story-shadowing/story-shadowing.service";
import { StoryCard } from "./StoryCard";
import { StorySeriesCard } from "./StorySeriesCard";

interface StoryListContainerProps {
  initialStories: StoryHistory[];
}

type GroupedItem =
  | { type: "single"; story: StoryHistory }
  | { type: "series"; seriesId: string; title: string; stories: StoryHistory[] };

/**
 * Client Island: Manages Search, Filter Tabs, and Instant In-Memory Filter (0ms delay)
 * Seeded with `initialStories` directly from the Server Component.
 */
export function StoryListContainer({ initialStories }: StoryListContainerProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [filterType, setFilterType] = useState<"all" | "text" | "youtube" | "series">("all");

  // Group stories by seriesId in memory
  const groupedItems = useMemo(() => {
    const items: GroupedItem[] = [];
    const seriesMap: Record<string, StoryHistory[]> = {};

    initialStories.forEach((story) => {
      if (story.seriesId) {
        if (!seriesMap[story.seriesId]) {
          seriesMap[story.seriesId] = [];
        }
        seriesMap[story.seriesId].push(story);
      }
    });

    const processedSeriesIds = new Set<string>();

    initialStories.forEach((story) => {
      if (!story.seriesId) {
        items.push({ type: "single", story });
      } else if (!processedSeriesIds.has(story.seriesId)) {
        processedSeriesIds.add(story.seriesId);
        const stories = seriesMap[story.seriesId].sort(
          (a, b) => (a.partIndex ?? 0) - (b.partIndex ?? 0)
        );
        const seriesTitle =
          stories[0]?.title.split(" - Part")[0].split(" - Phần")[0] ||
          stories[0]?.title ||
          "Series Video";

        items.push({
          type: "series",
          seriesId: story.seriesId,
          title: seriesTitle,
          stories,
        });
      }
    });

    return items;
  }, [initialStories]);

  // Filter grouped items based on search query and tab filter
  const filteredItems = useMemo(() => {
    return groupedItems.filter((item) => {
      const title = item.type === "single" ? item.story.title : item.title;
      const matchesSearch = title.toLowerCase().includes(searchQuery.toLowerCase());

      if (!matchesSearch) return false;

      if (filterType === "all") return true;
      if (filterType === "series") return item.type === "series";
      if (filterType === "youtube") {
        return (
          (item.type === "single" && item.story.sourceType === "youtube") ||
          item.type === "series"
        );
      }
      if (filterType === "text") {
        return item.type === "single" && item.story.sourceType === "text";
      }
      return true;
    });
  }, [groupedItems, searchQuery, filterType]);

  return (
    <div className="space-y-4">
      {/* Search Bar */}
      <div className="relative">
        <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
        <input
          type="text"
          placeholder="Tìm bài học theo tiêu đề..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full pl-10 pr-4 py-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl text-xs text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-400 shadow-2xs transition-all"
        />
      </div>

      {/* Filter Tabs */}
      <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar">
        {(
          [
            { id: "all", label: "Tất cả" },
            { id: "text", label: "Văn bản" },
            { id: "youtube", label: "YouTube" },
            { id: "series", label: "Series" },
          ] as const
        ).map((tab) => (
          <button
            key={tab.id}
            onClick={() => setFilterType(tab.id)}
            className={`px-3 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition-colors cursor-pointer ${
              filterType === tab.id
                ? "bg-slate-900 text-white dark:bg-amber-400 dark:text-slate-900 shadow-xs"
                : "bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:border-amber-300"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* List Content */}
      {filteredItems.length === 0 ? (
        <div className="text-center text-slate-500 py-16 bg-white dark:bg-slate-800 rounded-3xl border border-dashed border-slate-200 dark:border-slate-700 p-6 space-y-2">
          <p className="text-sm font-bold text-slate-800 dark:text-slate-200">
            Không tìm thấy bài luyện tập nào
          </p>
          <p className="text-xs text-slate-400">
            Bấm nút Tạo mới bên trên để tạo bài học đầu tiên hoặc thử tìm từ khóa khác.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredItems.map((item) => {
            if (item.type === "single") {
              return <StoryCard key={item.story._id} story={item.story} />;
            }
            return (
              <StorySeriesCard
                key={item.seriesId}
                seriesId={item.seriesId}
                title={item.title}
                stories={item.stories}
              />
            );
          })}
        </div>
      )}
    </div>
  );
}
