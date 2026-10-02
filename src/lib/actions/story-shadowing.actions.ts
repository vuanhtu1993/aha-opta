"use server";

/**
 * @file story-shadowing.actions.ts
 * @description Server Actions for Story Shadowing module.
 * Handles cache revalidation for the hub and story lists.
 *
 * Mapped Spec: aha-mind-agents-api-contract v2.0.0
 * Made by Anh Tu - Share to be share
 */

import { revalidatePath, updateTag } from "next/cache";

/**
 * Revalidates the Story Shadowing Hub route and stories tag on the server.
 */
export async function revalidateStoryShadowing(): Promise<void> {
  try {
    revalidatePath("/apps/story-shadowing");
    updateTag("story-shadowing-stories");
  } catch (error) {
    console.error("[revalidateStoryShadowing] Error revalidating path/tag:", error);
  }
}
