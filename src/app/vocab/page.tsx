import React, { Suspense } from "react";
import VocabHeader from "@/components/vocab/VocabHeader";
import VocabStatsBar from "@/components/vocab/VocabStatsBar";
import VocabStatsSkeleton from "@/components/vocab/VocabStatsSkeleton";
import VocabCardSection from "@/components/vocab/VocabCardSection";
import VocabListSkeleton from "@/components/vocab/VocabListSkeleton";
import { getInitialVocabCards } from "@/lib/vocab/vocab.service";

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

      {/* 3. Dynamic Hole: Vocabulary Interactive Section (State-based Search & API Fetching) */}
      <Suspense fallback={<VocabListSkeleton />}>
        <VocabCardDataLoader />
      </Suspense>
    </div>
  );
}
