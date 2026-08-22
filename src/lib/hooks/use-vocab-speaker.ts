"use client";

import { useEffect, useCallback } from "react";
import { VocabSpeaker } from "@/lib/services/vocab-speaker";

export function useVocabSpeaker() {
  useEffect(() => {
    // Pre-load English voices on component mount
    VocabSpeaker.getInstance().init();
  }, []);

  const speak = useCallback((word: string, audioUrl?: string) => {
    return VocabSpeaker.getInstance().speak(word, audioUrl);
  }, []);

  const cancel = useCallback(() => {
    VocabSpeaker.getInstance().cancel();
  }, []);

  return { speak, cancel };
}
