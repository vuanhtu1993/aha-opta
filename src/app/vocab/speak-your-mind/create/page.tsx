import React, { Suspense } from "react";
import { CreateSpeakingQuizClient } from "./CreateSpeakingQuizClient";

/**
 * @file page.tsx
 * @description Dedicated page for generating new PREP speaking challenges.
 * Static Server-rendered page shell with Suspense boundary for searchParams.
 *
 * Mapped Spec: FR-VOCAB-07 | US-VOCAB-04 | AC-VOCAB-11
 * Made by Anh Tu - Share to be share
 */

async function CreateQuizIsland({
  searchParamsPromise,
}: {
  searchParamsPromise: Promise<{ storybookId?: string }>;
}) {
  const { storybookId } = await searchParamsPromise;
  return <CreateSpeakingQuizClient initialStorybookId={storybookId} />;
}

export default function CreateSpeakingQuizPage({
  searchParams,
}: {
  searchParams: Promise<{ storybookId?: string }>;
}) {
  return (
    <div className="p-4 pt-2 max-w-xl mx-auto pb-24">
      <Suspense
        fallback={
          <div className="h-64 flex items-center justify-center text-xs text-slate-400">
            Loading generator...
          </div>
        }
      >
        <CreateQuizIsland searchParamsPromise={searchParams} />
      </Suspense>
    </div>
  );
}
