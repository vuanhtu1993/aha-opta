"use server";

/**
 * @file speaking-quiz.actions.ts
 * @description Server Actions for Speak Your Mind (PREP Speaking).
 * (Deprecated: Route and service now use Dynamic Server Rendering with cache: 'no-store').
 *
 * Mapped Spec: FR-VOCAB-06 | FR-VOCAB-07 | US-VOCAB-03 | US-VOCAB-04
 * Made by Anh Tu - Share to be share
 */

/**
 * @deprecated Speak Your Mind Hub is now configured with Dynamic SSR (force-dynamic).
 * Explicit cache revalidation is no longer required.
 */
export async function revalidateSpeakingHub(): Promise<void> {
  // No-op: Trang Hub đã chuyển sang Dynamic SSR với cache: 'no-store', không cần invalidate thủ công
}
