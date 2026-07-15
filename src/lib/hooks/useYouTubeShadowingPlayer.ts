import { useState, useEffect, useRef, useCallback } from "react";
import type { YouTubePlayer } from "react-youtube";
import type { Sentence } from "@/lib/schemas/story-shadowing.schema";

export type PlayerState = "WAITING" | "PLAYING_AUDIO" | "USER_SHADOWING" | "EVALUATING";

export function useYouTubeShadowingPlayer(sentences: Sentence[], ytPlayer: YouTubePlayer | null) {
  const currentSentenceIndexRef = useRef(0);
  const [currentSentenceIndex, setCurrentSentenceIndexState] = useState(0);

  const setCurrentSentenceIndex = useCallback((index: number) => {
    currentSentenceIndexRef.current = index;
    setCurrentSentenceIndexState(index);
  }, []);

  const [playerState, setPlayerState] = useState<PlayerState>("WAITING");
  const [countdownMs, setCountdownMs] = useState(0);

  const requestRef = useRef<number | undefined>(undefined);
  const isPlayingRef = useRef(false);

  // Stop polling current time
  const stopPolling = useCallback(() => {
    if (requestRef.current) {
      cancelAnimationFrame(requestRef.current);
      requestRef.current = undefined;
    }
  }, []);

  // Poll video time to stop precisely at endMs
  const pollTime = useCallback(() => {
    if (!ytPlayer || !isPlayingRef.current) return;
    const sentence = sentences[currentSentenceIndexRef.current];
    if (!sentence || !sentence.endMs) return;

    const currentTimeMs = ytPlayer.getCurrentTime() * 1000;
    if (currentTimeMs >= sentence.endMs) {
      // Đã chạy tới cuối câu -> Dừng video!
      ytPlayer.pauseVideo();
      isPlayingRef.current = false;
      stopPolling();
      
      // Chuyển sang Shadowing
      setPlayerState("USER_SHADOWING");
      const durationMs = sentence.endMs - (sentence.startMs || 0);
      setCountdownMs(durationMs > 2000 ? durationMs : 2000); // Tối thiểu 2 giây để shadowing
    } else {
      requestRef.current = requestAnimationFrame(pollTime);
    }
  }, [ytPlayer, sentences, stopPolling]);

  // Handle Play Action
  const playSentence = useCallback((index: number) => {
    if (!ytPlayer) return;
    const sentence = sentences[index];
    if (!sentence || sentence.startMs === undefined) return;

    setCurrentSentenceIndex(index);
    setPlayerState("PLAYING_AUDIO");
    isPlayingRef.current = true;

    // Seek to start of the sentence
    ytPlayer.seekTo(sentence.startMs / 1000, true);
    ytPlayer.playVideo();

    stopPolling();
    requestRef.current = requestAnimationFrame(pollTime);
  }, [ytPlayer, sentences, pollTime, stopPolling, setCurrentSentenceIndex]);

  // Handle Pause manually
  const pause = useCallback(() => {
    if (!ytPlayer) return;
    ytPlayer.pauseVideo();
    isPlayingRef.current = false;
    stopPolling();
    setPlayerState("WAITING");
  }, [ytPlayer, stopPolling]);

  // Countdown logic for Shadowing phase
  useEffect(() => {
    if (playerState !== "USER_SHADOWING") return;

    if (countdownMs <= 0) {
      setPlayerState("EVALUATING");
      // Sau 500ms Evaluating (giả lập), tự động nhảy câu tiếp theo
      setTimeout(() => {
        if (currentSentenceIndex < sentences.length - 1) {
          playSentence(currentSentenceIndex + 1);
        } else {
          setPlayerState("WAITING");
        }
      }, 500);
      return;
    }

    const timer = setInterval(() => {
      setCountdownMs((prev) => prev - 100);
    }, 100);

    return () => clearInterval(timer);
  }, [playerState, countdownMs, currentSentenceIndex, sentences.length, playSentence]);

  // Cleanup
  useEffect(() => {
    return () => stopPolling();
  }, [stopPolling]);

  return {
    currentSentenceIndex,
    playerState,
    countdownMs,
    playSentence,
    pause,
  };
}
