"use server";

/**
 * @file speaking-quiz.actions.ts
 * @description Server Actions for Speak Your Mind (PREP Speaking).
 * Handles server-driven cache revalidation for the hub.
 *
 * Mapped Spec: FR-VOCAB-06 | FR-VOCAB-07 | US-VOCAB-03 | US-VOCAB-04
 * Made by Anh Tu - Share to be share
 */

import { revalidatePath } from "next/cache";

/**
 * Revalidates the Speak Your Mind Hub route on the server.
 * Purges static / server cache and ensures the new question appears immediately.
 */
export async function revalidateSpeakingHub(): Promise<void> {
  try {
    revalidatePath("/vocab/speak-your-mind");
  } catch (error) {
    console.error("[revalidateSpeakingHub] Error revalidating path:", error);
  }
}
