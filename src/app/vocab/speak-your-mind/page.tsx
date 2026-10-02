import React from "react";
import { getSpeakingQuestions } from "@/lib/srs/speaking-quiz.service";
import { SpeakYourMindHub } from "@/components/vocab/speaking/SpeakYourMindHub";

/**
 * @file page.tsx
 * @description Static Pre-rendered Page with On-Demand Revalidation for Speak Your Mind Hub.
 * Uses On-Demand ISR: fully cached and instantly served from CDN/Server cache,
 * regenerated only when new questions are added via revalidateSpeakingHub().
 *
 * Mapped Spec: FR-VOCAB-06 | FR-VOCAB-07 | US-VOCAB-03
 * Made by Anh Tu - Share to be share
 */

export default async function SpeakYourMindPage() {
  const questions = await getSpeakingQuestions();

  return (
    <div className="p-4 pt-2">
      <SpeakYourMindHub questions={questions} />
    </div>
  );
}
