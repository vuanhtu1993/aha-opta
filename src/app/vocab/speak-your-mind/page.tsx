import React from "react";
import { getSpeakingQuestions } from "@/lib/srs/speaking-quiz.service";
import { SpeakYourMindHub } from "@/components/vocab/speaking/SpeakYourMindHub";

/**
 * @file page.tsx
 * @description Dynamic Server Rendered Page for Speak Your Mind Hub.
 * Always fetches the freshest speaking challenge list from the backend on request,
 * eliminating stale data issues without relying on complex cache invalidation.
 *
 * Mapped Spec: FR-VOCAB-06 | FR-VOCAB-07 | US-VOCAB-03
 * Made by Anh Tu - Share to be share
 */

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function SpeakYourMindPage() {
  const questions = await getSpeakingQuestions();

  return (
    <div className="p-4 pt-2">
      <SpeakYourMindHub questions={questions} />
    </div>
  );
}
