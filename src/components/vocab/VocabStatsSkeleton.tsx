import React from "react";

/**
 * VocabStatsSkeleton - Static Fallback Shell cho StatsBar
 * Được pre-render tĩnh để làm khung giữ chỗ khi dữ liệu DB đang được stream về.
 */
export default function VocabStatsSkeleton() {
  return (
    <div className="space-y-4 animate-pulse">
      {/* 4 Stats Cards Skeleton */}
      <div className="grid grid-cols-4 gap-2">
        {[
          { label: "Tổng từ" },
          { label: "Cần ôn" },
          { label: "Đang học" },
          { label: "Nhớ lâu" },
        ].map((item, idx) => (
          <div
            key={idx}
            className="bg-white dark:bg-slate-800 p-2.5 rounded-2xl border border-slate-200/80 dark:border-slate-700 text-center shadow-2xs"
          >
            <div className="text-[10px] font-bold text-slate-400">{item.label}</div>
            <div className="h-5 w-8 bg-slate-200 dark:bg-slate-700 rounded-md mx-auto mt-1" />
          </div>
        ))}
      </div>

      {/* Due Banner Skeleton */}
      <div className="h-18 bg-slate-200/70 dark:bg-slate-800 rounded-3xl" />
    </div>
  );
}
