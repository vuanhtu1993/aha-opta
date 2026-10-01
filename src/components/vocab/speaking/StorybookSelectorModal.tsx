"use client";

/**
 * @file StorybookSelectorModal.tsx
 * @description Modal trực quan chọn bài học Storybook từ API thay thế việc nhập ObjectId thủ công
 *
 * Mapped Spec: FR-VOCAB-07 | US-VOCAB-04 | AC-VOCAB-12
 * Made by Anh Tu - Share to be share
 */

import React, { useState } from "react";
import useSWR from "swr";
import { Search, X, BookOpen, Video, FileText, Check, Loader2 } from "lucide-react";
import type { StoryHistory } from "@/lib/story-shadowing/story-shadowing.service";

interface StorybookSelectorModalProps {
  isOpen: boolean;
  selectedId?: string;
  onSelect: (story: StoryHistory) => void;
  onClose: () => void;
}

const fetcher = (url: string) => fetch(url).then((res) => res.json());

export function StorybookSelectorModal({
  isOpen,
  selectedId,
  onSelect,
  onClose,
}: StorybookSelectorModalProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [levelFilter, setLevelFilter] = useState<string>("all");

  const { data: stories, isLoading, error } = useSWR<StoryHistory[]>(
    isOpen ? "/api/story-shadowing" : null,
    fetcher,
    { revalidateOnFocus: false, dedupingInterval: 10000 }
  );

  if (!isOpen) return null;

  const filteredStories = (stories || []).filter((story) => {
    const matchesSearch = story.title.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesLevel = levelFilter === "all" || story.level === levelFilter;
    return matchesSearch && matchesLevel;
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl w-full max-w-lg shadow-xl overflow-hidden flex flex-col max-h-[85vh]">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/80 flex items-center justify-center text-amber-600 dark:text-amber-400">
              <BookOpen className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-black text-slate-900 dark:text-white">
                Chọn Bài Học Storybook
              </h3>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                AI sẽ trích xuất ngữ cảnh và từ vựng từ bài này để tạo thử thách tranh biện
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Search & Filter */}
        <div className="p-3 border-b border-slate-100 dark:border-slate-800 space-y-2 bg-slate-50/50 dark:bg-slate-900/50">
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Tìm theo tiêu đề bài học..."
              className="w-full pl-9 pr-3 py-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-hidden focus:border-amber-500"
            />
          </div>
          <div className="flex gap-1.5 overflow-x-auto text-[11px] font-bold">
            {["all", "easy", "medium", "hard"].map((lvl) => (
              <button
                key={lvl}
                type="button"
                onClick={() => setLevelFilter(lvl)}
                className={`px-2.5 py-1 rounded-lg capitalize transition-colors cursor-pointer ${
                  levelFilter === lvl
                    ? "bg-amber-500 text-slate-950 font-black shadow-xs"
                    : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
                }`}
              >
                {lvl === "all" ? "Tất cả" : lvl}
              </button>
            ))}
          </div>
        </div>

        {/* Story List */}
        <div className="flex-1 overflow-y-auto p-3 space-y-2">
          {isLoading && (
            <div className="py-12 flex flex-col items-center justify-center gap-2 text-slate-400">
              <Loader2 className="w-6 h-6 animate-spin text-amber-500" />
              <span className="text-xs">Đang tải danh sách bài học...</span>
            </div>
          )}

          {error && (
            <div className="p-4 text-center text-xs text-rose-500">
              Không thể tải danh sách bài học. Vui lòng thử lại sau.
            </div>
          )}

          {!isLoading && !error && filteredStories.length === 0 && (
            <div className="py-12 text-center text-xs text-slate-400">
              Không tìm thấy bài học nào phù hợp.
            </div>
          )}

          {!isLoading &&
            filteredStories.map((story) => {
              const isSelected = selectedId === story._id;
              return (
                <div
                  key={story._id}
                  onClick={() => {
                    onSelect(story);
                    onClose();
                  }}
                  className={`flex items-center gap-3 p-2.5 rounded-xl border transition-all cursor-pointer ${
                    isSelected
                      ? "bg-amber-50/80 dark:bg-amber-950/30 border-amber-300 dark:border-amber-700/80 shadow-xs"
                      : "bg-white dark:bg-slate-800/60 border-slate-200/80 dark:border-slate-800 hover:border-amber-300 dark:hover:border-amber-800"
                  }`}
                >
                  {/* Thumbnail / Source Type Icon */}
                  <div className="w-14 h-11 rounded-lg overflow-hidden bg-slate-100 dark:bg-slate-800 flex items-center justify-center shrink-0 border border-slate-200/60 dark:border-slate-700/60">
                    {story.thumbnail ? (
                      <img
                        src={story.thumbnail}
                        alt={story.title}
                        className="w-full h-full object-cover"
                      />
                    ) : story.sourceType === "youtube" ? (
                      <Video className="w-5 h-5 text-red-500" />
                    ) : (
                      <FileText className="w-5 h-5 text-slate-400" />
                    )}
                  </div>

                  {/* Title & Metadata */}
                  <div className="flex-1 min-w-0">
                    <h4 className="text-xs font-bold text-slate-900 dark:text-white truncate">
                      {story.title}
                    </h4>
                    <div className="flex items-center gap-2 mt-1">
                      {story.level && (
                        <span className="px-1.5 py-0.5 rounded-sm bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 text-[10px] font-bold uppercase">
                          {story.level}
                        </span>
                      )}
                      {story.partTitle && (
                        <span className="text-[10px] text-slate-400 truncate">
                          {story.partTitle}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Selection Mark */}
                  {isSelected && (
                    <div className="w-6 h-6 rounded-full bg-amber-500 text-slate-950 flex items-center justify-center shrink-0 shadow-xs">
                      <Check className="w-3.5 h-3.5 stroke-[3]" />
                    </div>
                  )}
                </div>
              );
            })}
        </div>

        {/* Footer info */}
        <div className="p-3 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 flex justify-between items-center text-[11px] text-slate-400">
          <span>{filteredStories.length} bài học có sẵn</span>
          <button
            type="button"
            onClick={onClose}
            className="px-3 py-1 bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 rounded-lg font-bold transition-colors cursor-pointer"
          >
            Đóng
          </button>
        </div>
      </div>
    </div>
  );
}
