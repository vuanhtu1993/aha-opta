"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Search, Plus, Play, ChevronDown, ChevronUp, Video, BookOpen, Layers } from "lucide-react";

type StoryHistory = {
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
};

export default function StorybookPage() {
  const [history, setHistory] = useState<StoryHistory[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterType, setFilterType] = useState<"all" | "text" | "youtube" | "series">("all");
  const [expandedSeries, setExpandedSeries] = useState<Record<string, boolean>>({});

  useEffect(() => {
    fetch("/api/story-shadowing")
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data)) {
          setHistory(data);
        }
      })
      .catch((err) => console.error("Failed to load history", err))
      .finally(() => setLoading(false));
  }, []);

  const toggleSeriesExpand = (seriesId: string) => {
    setExpandedSeries((prev) => ({ ...prev, [seriesId]: !prev[seriesId] }));
  };

  // Group stories by seriesId
  const groupedItems: Array<
    | { type: "single"; story: StoryHistory }
    | { type: "series"; seriesId: string; title: string; stories: StoryHistory[] }
  > = [];
  const seriesMap: Record<string, StoryHistory[]> = {};

  history.forEach((story) => {
    if (story.seriesId) {
      if (!seriesMap[story.seriesId]) {
        seriesMap[story.seriesId] = [];
      }
      seriesMap[story.seriesId].push(story);
    }
  });

  const processedSeriesIds = new Set<string>();

  history.forEach((story) => {
    if (!story.seriesId) {
      groupedItems.push({ type: "single", story });
    } else if (!processedSeriesIds.has(story.seriesId)) {
      processedSeriesIds.add(story.seriesId);
      const stories = seriesMap[story.seriesId].sort(
        (a, b) => (a.partIndex ?? 0) - (b.partIndex ?? 0)
      );
      const seriesTitle =
        stories[0]?.title.split(" - Part")[0].split(" - Phần")[0] ||
        stories[0]?.title ||
        "Series Video";
      groupedItems.push({
        type: "series",
        seriesId: story.seriesId,
        title: seriesTitle,
        stories,
      });
    }
  });

  // Filter items based on search and type filter
  const filteredItems = groupedItems.filter((item) => {
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

  return (
    <div className="p-4 space-y-4">
      {/* Header with Title + CTA Button */}
      <div className="flex items-center justify-between pt-1">
        <div>
          <h1 className="text-xl font-black text-slate-900 dark:text-white tracking-tight">
            Story Shadowing
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            {history.length} bài luyện tập đã lưu
          </p>
        </div>

        <Link
          href="/apps/story-shadowing/create"
          className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-[#FFBA49] hover:bg-[#e6a640] text-slate-900 font-bold text-xs rounded-xl shadow-xs transition-colors"
        >
          <Plus className="w-4 h-4" /> Tạo mới
        </Link>
      </div>

      {/* Search Bar */}
      <div className="relative">
        <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
        <input
          type="text"
          placeholder="Tìm bài học theo tiêu đề..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full pl-10 pr-4 py-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl text-xs text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-400 shadow-2xs"
        />
      </div>

      {/* Filter Chips */}
      <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
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
            className={`px-3 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition-colors ${
              filterType === tab.id
                ? "bg-slate-900 text-white dark:bg-amber-400 dark:text-slate-900"
                : "bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* List content */}
      {loading ? (
        <div className="text-center text-slate-400 py-16 text-xs">Đang tải danh sách...</div>
      ) : filteredItems.length === 0 ? (
        <div className="text-center text-slate-500 py-16 bg-white dark:bg-slate-800 rounded-3xl border border-dashed border-slate-200 dark:border-slate-700 p-6 space-y-2">
          <p className="text-sm font-bold text-slate-800 dark:text-slate-200">Không tìm thấy bài luyện tập nào</p>
          <p className="text-xs text-slate-400">Bấm nút Tạo mới bên trên để tạo bài học đầu tiên.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredItems.map((item) => {
            if (item.type === "single") {
              const story = item.story;
              const levelBadge =
                story.level === "easy"
                  ? "bg-emerald-50 text-emerald-600 border-emerald-200"
                  : story.level === "hard"
                  ? "bg-rose-50 text-rose-600 border-rose-200"
                  : "bg-amber-50 text-amber-700 border-amber-200";

              return (
                <Link
                  key={story._id}
                  href={`/apps/story-shadowing/player/${story._id}`}
                  className="flex gap-3 bg-white dark:bg-slate-800/90 border border-slate-200/80 dark:border-slate-700 rounded-2xl p-3 shadow-2xs hover:border-amber-400 transition-all group overflow-hidden"
                >
                  <div className="w-20 h-20 rounded-xl bg-slate-100 dark:bg-slate-700 relative shrink-0 overflow-hidden">
                    {story.thumbnail ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={story.thumbnail} alt={story.title} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full bg-amber-50 dark:bg-amber-950 flex items-center justify-center text-amber-500">
                        {story.sourceType === "youtube" ? <Video className="w-6 h-6" /> : <BookOpen className="w-6 h-6" />}
                      </div>
                    )}
                  </div>

                  <div className="flex-1 min-w-0 flex flex-col justify-between py-0.5">
                    <div>
                      <div className="flex items-center gap-1.5 mb-1">
                        {story.level && (
                          <span className={`text-[9px] font-extrabold uppercase px-1.5 py-0.2 rounded border ${levelBadge}`}>
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
                      <span>⏱️ ~{Math.max(1, Math.ceil((story.originalText?.split(/\s+/).length || 0) / 20))} phút</span>
                      <span className="text-amber-500 font-bold group-hover:translate-x-0.5 transition-transform">
                        Luyện →
                      </span>
                    </div>
                  </div>
                </Link>
              );
            }

            // Series Item
            const isExpanded = expandedSeries[item.seriesId];
            const firstStory = item.stories[0];

            return (
              <div
                key={item.seriesId}
                className="bg-white dark:bg-slate-800/90 border border-slate-200/80 dark:border-slate-700 rounded-2xl p-3 shadow-2xs transition-all overflow-hidden space-y-3"
              >
                <div className="flex gap-3">
                  <div className="w-20 h-20 rounded-xl bg-slate-100 dark:bg-slate-700 relative shrink-0 overflow-hidden">
                    {firstStory.thumbnail ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={firstStory.thumbnail} alt={item.title} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full bg-indigo-50 dark:bg-indigo-950 flex items-center justify-center text-indigo-500">
                        <Layers className="w-6 h-6" />
                      </div>
                    )}
                  </div>

                  <div className="flex-1 min-w-0 flex flex-col justify-between py-0.5">
                    <div>
                      <div className="inline-flex items-center gap-1 px-1.5 py-0.2 rounded bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 text-[9px] font-bold border border-indigo-200 dark:border-indigo-800 mb-1">
                        📚 Series • {item.stories.length} phần
                      </div>
                      <h3 className="font-bold text-xs text-slate-900 dark:text-white line-clamp-1">
                        {item.title}
                      </h3>
                    </div>

                    <div className="flex items-center gap-2 mt-2">
                      <Link
                        href={`/apps/story-shadowing/player/${firstStory._id}`}
                        className="inline-flex items-center gap-1 px-2.5 py-1 bg-amber-400 hover:bg-amber-500 text-slate-900 font-bold text-[10px] rounded-lg shadow-2xs transition-colors"
                      >
                        <Play className="w-2.5 h-2.5 fill-slate-900" /> Phần 1
                      </Link>
                      <button
                        onClick={() => toggleSeriesExpand(item.seriesId)}
                        className="inline-flex items-center gap-1 px-2.5 py-1 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 text-slate-700 dark:text-slate-200 text-[10px] font-semibold rounded-lg transition-colors"
                      >
                        {isExpanded ? (
                          <>Thu gọn <ChevronUp className="w-3 h-3" /></>
                        ) : (
                          <>{item.stories.length} phần <ChevronDown className="w-3 h-3" /></>
                        )}
                      </button>
                    </div>
                  </div>
                </div>

                {isExpanded && (
                  <div className="pt-2 border-t border-slate-100 dark:border-slate-700 space-y-1.5">
                    {item.stories.map((st, idx) => (
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
          })}
        </div>
      )}

      {/* Footer copyright */}
      <div className="pt-2 text-center text-xs text-slate-400 dark:text-slate-500 font-medium">
        Made by Anh Tu - Share to be share
      </div>
    </div>
  );
}
