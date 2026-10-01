import React from "react";
import { getSpeakingQuestionById } from "@/lib/srs/speaking-quiz.service";
import { SpeakYourMindPlayer } from "@/components/vocab/speaking/SpeakYourMindPlayer";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function SpeakYourMindPage({
  searchParams,
}: {
  searchParams: Promise<{ id?: string }>;
}) {
  const { id } = await searchParams;
  const question = await getSpeakingQuestionById(id);

  return (
    <div className="p-4 pt-2">
      <SpeakYourMindPlayer question={question} />
    </div>
  );
}
