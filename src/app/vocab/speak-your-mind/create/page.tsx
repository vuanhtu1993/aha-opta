import React from "react";
import { CreateSpeakingQuizClient } from "./CreateSpeakingQuizClient";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function CreateSpeakingQuizPage({
  searchParams,
}: {
  searchParams: Promise<{ storybookId?: string }>;
}) {
  const { storybookId } = await searchParams;

  return (
    <div className="p-4 pt-2 max-w-xl mx-auto pb-24">
      <CreateSpeakingQuizClient initialStorybookId={storybookId} />
    </div>
  );
}
