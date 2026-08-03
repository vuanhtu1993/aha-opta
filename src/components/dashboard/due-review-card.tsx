"use client";

import Link from "next/link";
import useSWR from "swr";
import { Sparkles, ArrowRight, CheckCircle2, GraduationCap } from "lucide-react";

const fetcher = (url: string) => fetch(url).then((res) => res.json());

export function DueReviewCard() {
  const { data, isLoading } = useSWR("/api/vocab/due-count", fetcher, {
    revalidateOnFocus: true,
  });

  if (isLoading || !data) return null;

  const { dueCount, totalCount } = data;

  if (dueCount > 0) {
    return (
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-amber-500 via-amber-600 to-orange-500 p-4 text-white shadow-lg shadow-amber-500/20">
        {/* Background glow decoration */}
        <div className="absolute -right-6 -bottom-6 w-28 h-28 rounded-full bg-white/10 blur-xl pointer-events-none" />

        <div className="relative z-10 flex items-center justify-between gap-3">
          <div className="space-y-1 min-w-0">
            <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-white/20 text-white text-[10px] font-extrabold backdrop-blur-xs">
              <Sparkles className="w-3 h-3" /> FSRS Spaced Repetition
            </div>
            <h3 className="text-sm font-extrabold text-white leading-snug">
              Bạn có {dueCount} từ vựng cần ôn hôm nay
            </h3>
            <p className="text-[11px] text-amber-100 line-clamp-1">
              Kích hoạt trí nhớ dài hạn bằng bài trắc nghiệm 100% tiếng Anh.
            </p>
          </div>

          <Link
            href="/vocab/review"
            className="shrink-0 inline-flex items-center gap-1.5 px-3.5 py-2.5 bg-white hover:bg-amber-50 text-slate-900 font-extrabold text-xs rounded-2xl shadow-sm transition-all active:scale-95"
          >
            <span>Ôn ngay</span>
            <ArrowRight className="w-3.5 h-3.5 stroke-[2.5]" />
          </Link>
        </div>
      </div>
    );
  }

  if (totalCount > 0) {
    return (
      <div className="rounded-2xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200/80 dark:border-emerald-900/60 p-3.5 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-8 h-8 rounded-xl bg-emerald-100 dark:bg-emerald-900/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
            <CheckCircle2 className="w-4 h-4" />
          </div>
          <div className="min-w-0">
            <div className="text-xs font-bold text-slate-800 dark:text-slate-200">
              Đã hoàn thành mục tiêu ôn tập!
            </div>
            <div className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
              Tất cả {totalCount} từ vựng đang ở chu kỳ ghi nhớ tốt.
            </div>
          </div>
        </div>

        <Link
          href="/vocab"
          className="shrink-0 text-xs font-bold text-emerald-600 dark:text-emerald-400 hover:underline flex items-center gap-1"
        >
          <GraduationCap className="w-3.5 h-3.5" />
          <span>Kho từ</span>
        </Link>
      </div>
    );
  }

  return null;
}
