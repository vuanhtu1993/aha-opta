"use client";
import { useState, useRef, useCallback, useEffect } from "react";
import type { Sentence } from "@/lib/schemas/story-shadowing.schema";

type PlayerState = "IDLE" | "AI_SPEAKING" | "USER_SHADOWING" | "PAUSED" | "DONE";

export function useShadowingPlayer(sentences: Sentence[]) {
  const [playerState, setPlayerState] = useState<PlayerState>("IDLE");
  const [currentIndex, setCurrentIndex] = useState(0);
  const [countdown, setCountdown] = useState(0); // ms còn lại để đọc theo

  // Refs để tránh stale closure trong setTimeout
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const shadowTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const countdownIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Cleanup helper — dùng mọi lúc cần dừng
  const clearTimers = useCallback(() => {
    if (shadowTimeoutRef.current) clearTimeout(shadowTimeoutRef.current);
    if (countdownIntervalRef.current) clearInterval(countdownIntervalRef.current);
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.src = ""; // Giải phóng memory
    }
  }, []);

  // Phát 1 câu theo index
  const playSentence = useCallback((index: number) => {
    if (index >= sentences.length) {
      setPlayerState("DONE");
      return;
    }

    const sentence = sentences[index];
    if (!sentence.audioBase64) return;

    setCurrentIndex(index);
    setPlayerState("AI_SPEAKING");

    // Tạo Audio object từ base64
    const audio = new Audio(`data:audio/wav;base64,${sentence.audioBase64}`);
    audioRef.current = audio;

    // Chờ metadata load để lấy chính xác duration
    audio.addEventListener("loadedmetadata", () => {
      audio.play();
    });

    audio.addEventListener("ended", () => {
      // Audio kết thúc → chuyển sang trạng thái USER_SHADOWING
      const userTime = (audio.duration * 1000) + 1500; // audio duration + 1.5s buffer
      setPlayerState("USER_SHADOWING");
      setCountdown(Math.round(userTime));

      // Đếm ngược countdown
      const startTime = Date.now();
      countdownIntervalRef.current = setInterval(() => {
        const remaining = Math.max(0, userTime - (Date.now() - startTime));
        setCountdown(Math.round(remaining));
        if (remaining <= 0) {
          clearInterval(countdownIntervalRef.current!);
        }
      }, 100);

      // Sau thời gian đó → tự động phát câu tiếp
      shadowTimeoutRef.current = setTimeout(() => {
        playSentence(index + 1);
      }, userTime);
    });

    audio.addEventListener("error", () => {
      console.error("[Player] Audio load error");
      setPlayerState("IDLE");
    });
  }, [sentences]);

  const play = useCallback(() => {
    if (playerState === "PAUSED") {
      playSentence(currentIndex);
    } else {
      playSentence(0);
    }
  }, [playerState, currentIndex, playSentence]);

  const pause = useCallback(() => {
    clearTimers();
    setPlayerState("PAUSED");
  }, [clearTimers]);

  const goToNext = useCallback(() => {
    clearTimers();
    playSentence(currentIndex + 1);
  }, [clearTimers, currentIndex, playSentence]);

  const goToPrev = useCallback(() => {
    clearTimers();
    playSentence(Math.max(0, currentIndex - 1));
  }, [clearTimers, currentIndex, playSentence]);

  // CRITICAL: Cleanup khi component unmount — tránh memory leak
  useEffect(() => {
    return () => {
      clearTimers();
    };
  }, [clearTimers]);

  return {
    playerState,
    currentIndex,
    countdown,
    play,
    pause,
    goToNext,
    goToPrev,
    isPlaying: playerState === "AI_SPEAKING" || playerState === "USER_SHADOWING",
  };
}
