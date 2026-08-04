"use client";

import React, { useState, useEffect, useTransition } from "react";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { Search, ArrowUpDown } from "lucide-react";

/**
 * VocabSearchFilter - Client Component Island
 * Đồng bộ trạng thái tìm kiếm, lọc Level và Sắp xếp trực tiếp lên URL SearchParams.
 */
export default function VocabSearchFilter() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  const currentSearch = searchParams.get("search") || "";
  const currentLevel = searchParams.get("level") || "all";
  const currentSort = searchParams.get("sort") || "due_asc";

  const [searchTerm, setSearchTerm] = useState(currentSearch);

  // Cập nhật URL khi người dùng thay đổi giá trị
  const updateQuery = (key: string, value: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (value && value !== "all" && value.trim() !== "") {
      params.set(key, value.trim());
    } else {
      params.delete(key);
    }

    startTransition(() => {
      router.replace(`${pathname}?${params.toString()}`, { scroll: false });
    });
  };

  // Debounce tìm kiếm sau 300ms
  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchTerm !== currentSearch) {
        updateQuery("search", searchTerm);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [searchTerm]);

  return (
    <div className="space-y-2.5">
      {/* Search Input Box */}
      <div className="relative">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="Tìm kiếm từ vựng hoặc định nghĩa..."
          className="w-full pl-9.5 pr-4 py-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl text-xs text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-all"
        />
        {isPending && (
          <div className="absolute right-3.5 top-1/2 -translate-y-1/2 w-3 h-3 border-2 border-amber-500 border-t-transparent rounded-full animate-spin" />
        )}
      </div>

      {/* Filter and Sort Toolbar */}
      <div className="flex items-center justify-between gap-2 overflow-x-auto no-scrollbar py-0.5">
        {/* Level Filter Chips */}
        <div className="flex items-center gap-1.5 shrink-0">
          {["all", "A1", "A2", "B1", "B2", "C1", "C2"].map((lvl) => {
            const isActive = currentLevel === lvl;
            return (
              <button
                key={lvl}
                onClick={() => updateQuery("level", lvl)}
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
            value={currentSort}
            onChange={(e) => updateQuery("sort", e.target.value)}
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
