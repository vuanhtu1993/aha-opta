import React from "react";
import Link from "next/link";
import { Flame, ArrowRight, CheckCircle2 } from "lucide-react";
import { connectDB } from "@/lib/db/mongoose";
import VocabCard from "@/lib/db/models/VocabCard";

/**
 * VocabStatsBar - Async Server Component
 * Truy vấn trực tiếp Mongoose trên Server và stream về client thông qua React Suspense.
 */
export default async function VocabStatsBar() {
  await connectDB();

  const now = new Date();

  const [dueCount, totalCount, newCount, masteredCount] = await Promise.all([
    VocabCard.countDocuments({ "fsrs.due": { $lte: now } }),
    VocabCard.countDocuments({}),
    VocabCard.countDocuments({ "fsrs.state": 0 }),
    VocabCard.countDocuments({ "fsrs.stability": { $gte: 30 } }),
  ]);

  const learningCount = Math.max(0, totalCount - newCount - masteredCount);

  return (
    <div className="space-y-4">
      {/* 4 Stats Cards */}
      <div className="grid grid-cols-4 gap-2">
        <div className="bg-white dark:bg-slate-800 p-2.5 rounded-2xl border border-slate-200/80 dark:border-slate-700 text-center shadow-2xs">
          <div className="text-[10px] font-bold text-slate-400">Tổng từ</div>
          <div className="text-base font-black text-slate-900 dark:text-white mt-0.5">
            {totalCount}
          </div>
        </div>
        <div className="bg-white dark:bg-slate-800 p-2.5 rounded-2xl border border-slate-200/80 dark:border-slate-700 text-center shadow-2xs">
          <div className="text-[10px] font-bold text-rose-500">Cần ôn</div>
          <div className="text-base font-black text-rose-600 dark:text-rose-400 mt-0.5">
            {dueCount}
          </div>
        </div>
        <div className="bg-white dark:bg-slate-800 p-2.5 rounded-2xl border border-slate-200/80 dark:border-slate-700 text-center shadow-2xs">
          <div className="text-[10px] font-bold text-blue-500">Đang học</div>
          <div className="text-base font-black text-blue-600 dark:text-blue-400 mt-0.5">
            {learningCount}
          </div>
        </div>
        <div className="bg-white dark:bg-slate-800 p-2.5 rounded-2xl border border-slate-200/80 dark:border-slate-700 text-center shadow-2xs">
          <div className="text-[10px] font-bold text-emerald-500">Nhớ lâu</div>
          <div className="text-base font-black text-emerald-600 dark:text-emerald-400 mt-0.5">
            {masteredCount}
          </div>
        </div>
      </div>

      {/* Due Banner / Practice All CTA */}
      {dueCount > 0 ? (
        <div className="rounded-3xl bg-gradient-to-r from-amber-500 to-orange-500 p-4 text-white shadow-md flex items-center justify-between gap-3">
          <div className="space-y-0.5 min-w-0">
            <div className="flex items-center gap-1.5 text-xs font-black text-white">
              <Flame className="w-4 h-4 fill-white" />
              <span>{dueCount} từ vựng cần ôn tập ngay</span>
            </div>
            <p className="text-[11px] text-amber-100 line-clamp-1">
              Bài trắc nghiệm 4 lựa chọn 100% tiếng Anh chuẩn FSRS.
            </p>
          </div>
          <Link
            href="/vocab/review"
            className="shrink-0 px-3.5 py-2 bg-white hover:bg-amber-50 text-slate-900 font-extrabold text-xs rounded-xl shadow-xs transition-all active:scale-95 flex items-center gap-1"
          >
            <span>Bắt đầu</span>
            <ArrowRight className="w-3.5 h-3.5 stroke-[2.5]" />
          </Link>
        </div>
      ) : totalCount > 0 ? (
        <div className="rounded-2xl bg-slate-100 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 p-3.5 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2 min-w-0">
            <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
            <span className="text-xs text-slate-700 dark:text-slate-300 font-medium">
              Không có từ nào bị trễ hạn hôm nay.
            </span>
          </div>
          <Link
            href="/vocab/review?practice_all=true"
            className="shrink-0 text-xs font-bold text-amber-600 dark:text-amber-400 hover:underline flex items-center gap-1"
          >
            <span>Luyện tự do</span>
            <ArrowRight className="w-3 h-3" />
          </Link>
        </div>
      ) : null}
    </div>
  );
}
