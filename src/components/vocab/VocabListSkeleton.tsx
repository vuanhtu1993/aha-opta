import React from "react";

/**
 * VocabListSkeleton - Static Fallback Shell cho danh sách thẻ từ vựng
 */
export default function VocabListSkeleton() {
  return (
    <div className="space-y-3 animate-pulse">
      {[1, 2, 3, 4].map((i) => (
        <div
          key={i}
          className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200/80 dark:border-slate-700 p-3.5 shadow-2xs space-y-2"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="h-4 w-24 bg-slate-200 dark:bg-slate-700 rounded-md" />
              <div className="h-3 w-16 bg-slate-100 dark:bg-slate-750 rounded-md" />
            </div>
            <div className="h-4 w-18 bg-slate-200 dark:bg-slate-700 rounded-full" />
          </div>
          <div className="h-3 w-3/4 bg-slate-100 dark:bg-slate-750 rounded-md" />
        </div>
      ))}
    </div>
  );
}
