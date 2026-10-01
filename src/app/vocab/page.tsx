import React, { Suspense } from "react";
import VocabHeader from "@/components/vocab/VocabHeader";
import VocabStatsBar from "@/components/vocab/VocabStatsBar";
import VocabStatsSkeleton from "@/components/vocab/VocabStatsSkeleton";
import VocabClozeBatchBanner from "@/components/vocab/VocabClozeBatchBanner";
import VocabCardSection from "@/components/vocab/VocabCardSection";
import VocabListSkeleton from "@/components/vocab/VocabListSkeleton";
import { getInitialVocabCards } from "@/lib/vocab/vocab.service";

import Link from "next/link";
import { Mic, ArrowRight } from "lucide-react";

export const dynamic = "force-dynamic";
export const revalidate = 0;

/**
 * VocabCardDataLoader - Server Component
 * Nạp sẵn 50 thẻ từ vựng ban đầu để gieo mầm (Seed) vào Client Island VocabCardSection.
 */
async function VocabCardDataLoader() {
  const { cards, totalCount } = await getInitialVocabCards(50);
  return <VocabCardSection initialCards={cards} totalCount={totalCount} />;
}

export default function VocabPage() {
  return (
    <div className="p-4 space-y-5 pb-28">
      {/* 1. Static Header Shell (0ms Fast First Paint) */}
      <VocabHeader />

      {/* 2. Dynamic Hole: SRS Statistics & Due Banner */}
      <Suspense fallback={<VocabStatsSkeleton />}>
        <VocabStatsBar />
      </Suspense>

      {/* 3. Interactive Batch Cloze AI Banner */}
      <VocabClozeBatchBanner />

      {/* 3.5 Speak Your Mind (PREP Speaking Quiz) CTA Banner */}
      <div className="bg-gradient-to-r from-amber-500/10 via-orange-500/10 to-rose-500/10 border border-amber-200/80 dark:border-amber-800/80 rounded-2xl p-4 flex items-center justify-between gap-3 shadow-2xs">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="p-2.5 rounded-xl bg-amber-500 text-slate-950 shrink-0 font-black shadow-xs">
            <Mic className="w-4 h-4" />
          </div>
          <div>
            <h4 className="text-xs font-black text-slate-900 dark:text-white flex items-center gap-1.5">
              <span>Speak Your Mind</span>
              <span className="px-2 py-0.5 rounded-full bg-amber-100 dark:bg-amber-900/60 text-amber-800 dark:text-amber-300 text-[10px] font-bold">
                PREP
              </span>
            </h4>
            <p className="text-[11px] text-slate-600 dark:text-slate-400 mt-0.5 line-clamp-1">
              Structured opinion speaking practice.
            </p>
          </div>
        </div>
        <Link
          href="/vocab/speak-your-mind"
          className="shrink-0 px-3.5 py-2 bg-amber-500 hover:bg-amber-600 text-slate-950 font-black text-xs rounded-xl shadow-xs transition-all active:scale-95 cursor-pointer flex items-center gap-1"
        >
          <span>Practice</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      </div>

      {/* 4. Dynamic Hole: Vocabulary Interactive Section (State-based Search & API Fetching) */}
      <Suspense fallback={<VocabListSkeleton />}>
        <VocabCardDataLoader />
      </Suspense>
    </div>
  );
}
