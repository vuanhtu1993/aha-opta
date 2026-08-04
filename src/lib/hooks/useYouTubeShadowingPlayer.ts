import { useState, useEffect, useRef, useCallback } from "react";
import type { YouTubePlayer } from "react-youtube";
import type { Sentence } from "@/lib/schemas/story-shadowing.schema";

export type PlayerState = "WAITING" | "PLAYING_AUDIO" | "USER_SHADOWING" | "EVALUATING";

export function useYouTubeShadowingPlayer(
  sentences: Sentence[],
  ytPlayer: YouTubePlayer | null
) {
  const currentSentenceIndexRef = useRef(0);
  const [currentSentenceIndex, setCurrentSentenceIndexState] = useState(0);

  const setCurrentSentenceIndex = useCallback((index: number) => {
    currentSentenceIndexRef.current = index;
    setCurrentSentenceIndexState(index);
  }, []);

  const [playerState, setPlayerState] = useState<PlayerState>("WAITING");
  const playerStateRef = useRef<PlayerState>("WAITING");
  playerStateRef.current = playerState;

  const [countdownMs, setCountdownMs] = useState(0);

  const requestRef = useRef<number | undefined>(undefined);
  const isPlayingRef = useRef(false);
  const hasSeekedRef = useRef(false);
  const seekTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const evalTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const countdownIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Clear all pending timers, intervals, and animation frames
  const clearAllTimers = useCallback(() => {
    if (requestRef.current !== undefined) {
      cancelAnimationFrame(requestRef.current);
      requestRef.current = undefined;
    }
    if (seekTimeoutRef.current) {
      clearTimeout(seekTimeoutRef.current);
      seekTimeoutRef.current = null;
    }
    if (evalTimeoutRef.current) {
      clearTimeout(evalTimeoutRef.current);
      evalTimeoutRef.current = null;
    }
    if (countdownIntervalRef.current) {
      clearInterval(countdownIntervalRef.current);
      countdownIntervalRef.current = null;
    }
  }, []);

  // Poll video time to stop precisely at endMs
  const pollTime = useCallback(() => {
    if (!ytPlayer || !isPlayingRef.current) return;
    const sentence = sentences[currentSentenceIndexRef.current];
    if (!sentence || sentence.endMs === undefined) return;

    try {
      const currentTimeSec = ytPlayer.getCurrentTime?.() ?? 0;
      const currentTimeMs = currentTimeSec * 1000;
      const startMs = sentence.startMs || 0;

      // Chờ Player thực sự Seek tới gần vị trí startMs (sai số dưới 1.5s) trước khi bắt đầu đo endMs
      if (!hasSeekedRef.current) {
        if (Math.abs(currentTimeMs - startMs) < 1500) {
          hasSeekedRef.current = true;
          if (seekTimeoutRef.current) {
            clearTimeout(seekTimeoutRef.current);
            seekTimeoutRef.current = null;
          }
        } else {
          // Vẫn đang tua, tiếp tục poll
          requestRef.current = requestAnimationFrame(pollTime);
          return;
        }
      }

      if (currentTimeMs >= sentence.endMs) {
        // Đã chạy tới cuối câu -> Dừng video!
        try {
          ytPlayer.pauseVideo?.();
        } catch (e) {
          console.warn("[useYouTubeShadowingPlayer] pauseVideo error:", e);
        }
        isPlayingRef.current = false;
        if (requestRef.current !== undefined) {
          cancelAnimationFrame(requestRef.current);
          requestRef.current = undefined;
        }

        // Chuyển sang giai đoạn Shadowing
        setPlayerState("USER_SHADOWING");
        const durationMs = sentence.endMs - startMs;
        const userTime = Math.max(durationMs + 1000, 2500); // Tối thiểu 2.5s để shadowing
        setCountdownMs(userTime);

        // Đếm ngược bằng timestamp chính xác
        const startTime = Date.now();
        if (countdownIntervalRef.current) clearInterval(countdownIntervalRef.current);
        countdownIntervalRef.current = setInterval(() => {
          const elapsed = Date.now() - startTime;
          const remaining = Math.max(0, userTime - elapsed);
          setCountdownMs(remaining);

          if (remaining <= 0) {
            if (countdownIntervalRef.current) clearInterval(countdownIntervalRef.current);
            countdownIntervalRef.current = null;

            // Chỉ chuyển sang EVALUATING nếu người dùng không bấm dừng/lùi câu
            if (playerStateRef.current === "USER_SHADOWING") {
              setPlayerState("EVALUATING");
              evalTimeoutRef.current = setTimeout(() => {
                const nextIndex = currentSentenceIndexRef.current + 1;
                if (nextIndex < sentences.length) {
                  playSentence(nextIndex);
                } else {
                  setPlayerState("WAITING");
                }
              }, 500);
            }
          }
        }, 100);
      } else {
        requestRef.current = requestAnimationFrame(pollTime);
      }
    } catch (err) {
      console.warn("[useYouTubeShadowingPlayer] pollTime error:", err);
      requestRef.current = requestAnimationFrame(pollTime);
    }
  }, [ytPlayer, sentences]);

  // Handle Play Action
  const playSentence = useCallback(
    (index: number) => {
      if (!ytPlayer) return;
      const sentence = sentences[index];
      if (!sentence || sentence.startMs === undefined) return;

      // 1. Dọn dẹp sạch toàn bộ timers đang chạy (State Guard)
      clearAllTimers();

      // 2. Cập nhật state
      setCurrentSentenceIndex(index);
      setPlayerState("PLAYING_AUDIO");
      isPlayingRef.current = true;
      hasSeekedRef.current = false;

      // 3. Thực hiện Seek và Play
      const startSec = sentence.startMs / 1000;
      try {
        ytPlayer.seekTo?.(startSec, true);
        ytPlayer.playVideo?.();
      } catch (err) {
        console.warn("[useYouTubeShadowingPlayer] playVideo error:", err);
      }

      // 4. Seek Timeout Fallback (2.5s) tránh trường hợp Safari hoặc mạng lag làm kẹt vòng lặp
      seekTimeoutRef.current = setTimeout(() => {
        if (!hasSeekedRef.current) {
          hasSeekedRef.current = true;
          try {
            ytPlayer.playVideo?.();
          } catch (e) {}
        }
      }, 2500);

      // 5. Bắt đầu poll thời gian
      requestRef.current = requestAnimationFrame(pollTime);
    },
    [ytPlayer, sentences, clearAllTimers, pollTime, setCurrentSentenceIndex]
  );

  // Handle Pause manually
  const pause = useCallback(() => {
    clearAllTimers();
    isPlayingRef.current = false;
    if (ytPlayer) {
      try {
        ytPlayer.pauseVideo?.();
      } catch (e) {
        console.warn("[useYouTubeShadowingPlayer] pause error:", e);
      }
    }
    setPlayerState("WAITING");
  }, [ytPlayer, clearAllTimers]);

  // Cleanup
  useEffect(() => {
    return () => {
      clearAllTimers();
      isPlayingRef.current = false;
    };
  }, [clearAllTimers]);

  return {
    currentSentenceIndex,
    playerState,
    countdownMs,
    playSentence,
    pause,
  };
}

