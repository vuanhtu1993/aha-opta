import React, { Suspense } from "react";
import VocabHeader from "@/components/vocab/VocabHeader";
import VocabStatsBar from "@/components/vocab/VocabStatsBar";
import VocabStatsSkeleton from "@/components/vocab/VocabStatsSkeleton";
import VocabSearchFilter from "@/components/vocab/VocabSearchFilter";
import VocabCardList from "@/components/vocab/VocabCardList";
import VocabListSkeleton from "@/components/vocab/VocabListSkeleton";


interface VocabPageProps {
  searchParams: Promise<{
    search?: string;
    level?: string;
    sort?: string;
  }>;
}

export default async function VocabPage({ searchParams }: VocabPageProps) {
  const params = await searchParams;
  const search = params.search || "";
  const level = params.level || "all";
  const sort = params.sort || "due_asc";

  return (
    <div className="p-4 space-y-5 pb-28">
      {/* 1. Static Header Shell (0ms Fast First Paint) */}
      <VocabHeader />

      {/* 2. Dynamic Hole: SRS Statistics & Due Banner */}
      <Suspense fallback={<VocabStatsSkeleton />}>
        <VocabStatsBar />
      </Suspense>

      {/* 3. Client Island: Interactive Search & Level Filters */}
      <Suspense fallback={null}>
        <VocabSearchFilter />
      </Suspense>

      {/* 4. Dynamic Hole: Personal Vocabulary Cards List */}
      <Suspense
        key={`${search}-${level}-${sort}`}
        fallback={<VocabListSkeleton />}
      >
        <VocabCardList search={search} level={level} sort={sort} />
      </Suspense>
    </div>
  );
}
