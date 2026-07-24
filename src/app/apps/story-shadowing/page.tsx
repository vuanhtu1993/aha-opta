"use client";
import { useState, useEffect } from "react";
import Link from "next/link";

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
  const groupedItems: Array<{ type: "single"; story: StoryHistory } | { type: "series"; seriesId: string; title: string; stories: StoryHistory[] }> = [];
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
      const stories = seriesMap[story.seriesId].sort((a, b) => (a.partIndex ?? 0) - (b.partIndex ?? 0));
      // Standardize clean title for series
      const seriesTitle = stories[0]?.title.split(" - Part")[0].split(" - Phần")[0] || stories[0]?.title || "Series Video";
      groupedItems.push({
        type: "series",
        seriesId: story.seriesId,
        title: seriesTitle,
        stories,
      });
    }
  });

  return (
    <div className="max-w-5xl mx-auto space-y-10 py-12 px-4">
      <div className="flex flex-col sm:flex-row justify-between items-center gap-6">
        <div className="space-y-1 text-center sm:text-left">
          <h1 className="text-3xl font-bold text-slate-900">AI Storybook Shadowing</h1>
          <p className="text-slate-500 text-sm">Kho lưu trữ các bài luyện đọc tiếng Anh.</p>
        </div>
        <Link
          href="/apps/story-shadowing/create"
          className="px-6 py-3 bg-[#FFBA49] text-slate-800 font-bold rounded-xl hover:bg-[#e6a640] transition-colors shadow-sm"
        >
          + Tạo bài luyện tập
        </Link>
      </div>

      {loading ? (
        <div className="text-center text-slate-400 py-20">Đang tải danh sách...</div>
      ) : history.length === 0 ? (
        <div className="text-center text-slate-500 py-20 bg-slate-50 rounded-2xl border border-dashed border-slate-200">
          Chưa có bài luyện tập nào. Bấm tạo bài mới để bắt đầu.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {groupedItems.map((item) => {
            if (item.type === "single") {
              const story = item.story;
              return (
                <Link
                  key={story._id}
                  href={`/apps/story-shadowing/player/${story._id}`}
                  className="flex flex-col bg-white border border-slate-100 shadow-sm rounded-2xl hover:border-[#FFBA49] hover:shadow-md transition-all group overflow-hidden"
                >
                  <div className="w-full h-40 bg-slate-100 relative">
                    {story.thumbnail ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={story.thumbnail} alt={story.title} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full bg-[#FFBA49]/20 flex items-center justify-center text-[#FFBA49] opacity-50">
                        <svg className="w-12 h-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                        </svg>
                      </div>
                    )}
                  </div>
                  <div className="p-5 flex-1 flex flex-col justify-between">
                    <div>
                      <h3 className="font-semibold text-lg text-slate-900 group-hover:text-[#e6a640] transition-colors mb-2 line-clamp-1">
                        {story.title}
                      </h3>
                      <p className="text-sm text-slate-500 line-clamp-2 leading-relaxed">
                        {story.sourceType === "youtube" ? "Mô tả video: " : ""}
                        {story.originalText}
                      </p>
                    </div>
                    <div className="mt-4 flex items-center justify-between text-xs font-medium">
                      <div className="flex items-center gap-3 text-slate-400">
                        <span>{new Date(story.createdAt).toLocaleDateString("vi-VN")}</span>
                        <span className="flex items-center gap-1">
                          <span>⏱️</span>
                          ~{Math.max(1, Math.ceil((story.originalText?.split(/\s+/).length || 0) / 20))} phút
                        </span>
                      </div>
                      {story.sourceType === "youtube" && story.youtubeVideoId && (
                        <button
                          onClick={(e) => {
                            e.preventDefault();
                            window.open(`https://youtube.com/watch?v=${story.youtubeVideoId}`, "_blank");
                          }}
                          className="text-red-500 hover:text-red-600 transition-colors p-1"
                          title="Xem trên YouTube"
                        >
                          <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.5 12 3.5 12 3.5s-7.505 0-9.377.55a3.016 3.016 0 0 0-2.122 2.136C0 8.059 0 12 0 12s0 3.941.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.55 9.376.55 9.376.55s7.505 0 9.377-.55a3.016 3.016 0 0 0 2.122-2.136C24 15.941 24 12 24 12s0-3.941-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
                          </svg>
                        </button>
                      )}
                    </div>
                  </div>
                </Link>
              );
            }

            // Render Series Card
            const isExpanded = expandedSeries[item.seriesId];
            const firstStory = item.stories[0];

            return (
              <div
                key={item.seriesId}
                className="flex flex-col bg-white border border-slate-100 shadow-sm rounded-2xl overflow-hidden md:col-span-2 lg:col-span-3 transition-all hover:border-[#FFBA49] hover:shadow-md group"
              >
                {/* Top Section */}
                <div className="flex flex-col sm:flex-row">
                  {/* Thumbnail */}
                  <div className="w-full sm:w-72 h-48 sm:h-auto bg-slate-100 relative flex-shrink-0">
                    {firstStory.thumbnail ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={firstStory.thumbnail} alt={item.title} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full bg-[#FFBA49]/20 flex items-center justify-center text-[#FFBA49] opacity-50">
                        <svg className="w-12 h-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                        </svg>
                      </div>
                    )}
                  </div>

                  {/* Info & Actions */}
                  <div className="p-5 flex-1 flex flex-col justify-between">
                    <div>
                      <div className="inline-flex items-center gap-2 px-2.5 py-0.5 rounded-full bg-indigo-50 text-indigo-600 text-xs font-bold mb-3 border border-indigo-100">
                        📚 Series Video • {item.stories.length} phần
                      </div>
                      <h3 className="font-semibold text-xl text-slate-900 group-hover:text-[#e6a640] transition-colors mb-2 line-clamp-1">
                        {item.title}
                      </h3>
                      <p className="text-sm text-slate-500 line-clamp-2 leading-relaxed mb-4">
                        {firstStory.sourceType === "youtube" ? "Mô tả video: " : ""}
                        {firstStory.originalText}
                      </p>
                    </div>

                    <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-4">
                      {/* Meta info */}
                      <div className="flex items-center gap-4 text-xs font-medium text-slate-400">
                        <span>{new Date(firstStory.createdAt).toLocaleDateString("vi-VN")}</span>
                        <span className="flex items-center gap-1">
                          <span>⏱️</span>
                          ~{Math.max(1, Math.ceil(item.stories.reduce((acc, st) => acc + (st.originalText?.split(/\s+/).length || 0), 0) / 20))} phút tổng cộng
                        </span>
                        {firstStory.youtubeVideoId && (
                          <button
                            onClick={(e) => {
                              e.preventDefault();
                              window.open(`https://youtube.com/watch?v=${firstStory.youtubeVideoId}`, "_blank");
                            }}
                            className="text-red-500 hover:text-red-600 transition-colors p-1"
                            title="Xem trên YouTube"
                          >
                            <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                              <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.5 12 3.5 12 3.5s-7.505 0-9.377.55a3.016 3.016 0 0 0-2.122 2.136C0 8.059 0 12 0 12s0 3.941.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.55 9.376.55 9.376.55s7.505 0 9.377-.55a3.016 3.016 0 0 0 2.122-2.136C24 15.941 24 12 24 12s0-3.941-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
                            </svg>
                          </button>
                        )}
                      </div>

                      {/* Actions */}
                      <div className="flex items-center gap-3 shrink-0">
                        <Link
                          href={`/apps/story-shadowing/player/${firstStory._id}`}
                          className="px-4 py-2 bg-[#FFBA49] hover:bg-[#e6a640] text-slate-900 font-semibold text-sm rounded-xl transition-colors shadow-sm whitespace-nowrap"
                        >
                          ▶ Phát phần 1
                        </Link>
                        <button
                          onClick={() => toggleSeriesExpand(item.seriesId)}
                          className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-sm font-semibold rounded-xl transition-colors whitespace-nowrap"
                        >
                          {isExpanded ? "Ẩn danh sách ▲" : `Xem ${item.stories.length} phần ▼`}
                        </button>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Expanded List */}
                {isExpanded && (
                  <div className="p-5 bg-slate-50 border-t border-slate-100 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                    {item.stories.map((st, pIdx) => (
                      <Link
                        key={st._id}
                        href={`/apps/story-shadowing/player/${st._id}`}
                        className="p-4 rounded-xl bg-white hover:border-[#FFBA49] hover:shadow-sm border border-slate-200 transition-all flex items-center justify-between group"
                      >
                        <div className="space-y-1 min-w-0 pr-2">
                          <div className="text-xs font-bold text-indigo-500">
                            Phần {pIdx + 2}/{st.totalParts || item.stories.length}
                          </div>
                          <div className="text-sm font-medium text-slate-700 group-hover:text-slate-900 line-clamp-1">
                            {st.partTitle || st.title}
                          </div>
                        </div>
                        <span className="text-slate-300 group-hover:text-[#FFBA49] text-sm font-bold flex-shrink-0 transition-colors">
                          ▶
                        </span>
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
