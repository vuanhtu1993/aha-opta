import React from "react";
import { getSpeakingQuestions } from "@/lib/srs/speaking-quiz.service";
import { SpeakYourMindHub } from "@/components/vocab/speaking/SpeakYourMindHub";

/**
 * @file page.tsx
 * @description Server-rendered Page for Speak Your Mind Hub.
 * Supports URL searchParams (?level=...) for level filtering without client state.
 *
 * Mapped Spec: FR-VOCAB-06 | FR-VOCAB-07 | US-VOCAB-03
 * Made by Anh Tu - Share to be share
 */

export const dynamic = "force-dynamic";

export default async function SpeakYourMindPage({
  searchParams,
}: {
  searchParams: Promise<{ level?: string }>;
}) {
  const { level = "all" } = await searchParams;
  const questions = await getSpeakingQuestions();

  return (
    <div className="p-4 pt-2">
      <SpeakYourMindHub questions={questions} currentLevel={level} />
    </div>
  );
}
