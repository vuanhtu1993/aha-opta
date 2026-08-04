"use client";

import React from "react";
import { Search, ArrowUpDown, Loader2 } from "lucide-react";

interface VocabSearchFilterProps {
  searchTerm: string;
  onSearchChange: (val: string) => void;
  selectedLevel: string;
  onLevelChange: (lvl: string) => void;
  selectedSort: string;
  onSortChange: (sort: string) => void;
  isFetching?: boolean;
}

/**
 * VocabSearchFilter - Controlled Client Component
 * Nhận trạng thái tìm kiếm, lọc level, sort từ VocabCardSection và phản hồi qua callback.
 */
export default function VocabSearchFilter({
  searchTerm,
  onSearchChange,
  selectedLevel,
  onLevelChange,
  selectedSort,
  onSortChange,
  isFetching = false,
}: VocabSearchFilterProps) {
  const levels = ["all", "A1", "A2", "B1", "B2", "C1", "C2"];

  return (
    <div className="space-y-2.5">
      {/* Search Input Box */}
      <div className="relative">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder="Tìm kiếm từ vựng hoặc định nghĩa..."
          className="w-full pl-9.5 pr-10 py-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl text-xs text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-all"
        />
        {isFetching && (
          <div className="absolute right-3.5 top-1/2 -translate-y-1/2 text-amber-500">
            <Loader2 className="w-3.5 h-3.5 animate-spin" />
          </div>
        )}
      </div>

      {/* Filter and Sort Toolbar */}
      <div className="flex items-center justify-between gap-2 overflow-x-auto no-scrollbar py-0.5">
        {/* Level Filter Chips */}
        <div className="flex items-center gap-1.5 shrink-0">
          {levels.map((lvl) => {
            const isActive = selectedLevel === lvl;
            return (
              <button
                key={lvl}
                type="button"
                onClick={() => onLevelChange(lvl)}
                className={`px-2.5 py-1 rounded-xl text-[10px] font-bold transition-all ${
                  isActive
                    ? "bg-slate-900 dark:bg-white text-white dark:text-slate-900 shadow-2xs"
                    : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700"
                }`}
              >
                {lvl === "all" ? "Tất cả" : lvl}
              </button>
            );
          })}
        </div>

        {/* Sort Selector */}
        <div className="shrink-0 flex items-center gap-1">
          <ArrowUpDown className="w-3 h-3 text-slate-400" />
          <select
            value={selectedSort}
            onChange={(e) => onSortChange(e.target.value)}
            className="bg-transparent text-[11px] font-bold text-slate-600 dark:text-slate-400 focus:outline-none cursor-pointer"
          >
            <option value="due_asc">Lịch ôn gần nhất</option>
            <option value="newest">Mới thêm</option>
            <option value="alpha">A - Z</option>
            <option value="stability_desc">Độ bền trí nhớ</option>
          </select>
        </div>
      </div>
    </div>
  );
}
