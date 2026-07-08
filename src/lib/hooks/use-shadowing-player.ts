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
  const currentBlobUrlRef = useRef<string | null>(null);

  // Khởi tạo Audio 1 lần duy nhất để Safari cấp quyền Autoplay (bắt buộc)
  useEffect(() => {
    if (typeof window !== "undefined" && !audioRef.current) {
      audioRef.current = new Audio();
    }
  }, []);

  // Cleanup helper
  const clearTimers = useCallback(() => {
    if (shadowTimeoutRef.current) clearTimeout(shadowTimeoutRef.current);
    if (countdownIntervalRef.current) clearInterval(countdownIntervalRef.current);
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.onended = null;
      audioRef.current.onloadedmetadata = null;
      audioRef.current.onerror = null;
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

    if (!audioRef.current) {
      audioRef.current = new Audio();
    }
    const audio = audioRef.current;

    // Detect MIME type and create Blob URL
    let mimeType = "audio/mpeg";
    if (sentence.audioBase64.startsWith("UklGR")) {
      mimeType = "audio/wav";
    }

    const binary = atob(sentence.audioBase64);
    const array = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
      array[i] = binary.charCodeAt(i);
    }
    const blob = new Blob([array], { type: mimeType });
    const blobUrl = URL.createObjectURL(blob);

    // Giải phóng URL cũ để không bị memory leak
    if (currentBlobUrlRef.current) {
      URL.revokeObjectURL(currentBlobUrlRef.current);
    }
    currentBlobUrlRef.current = blobUrl;

    // Thay đổi src của cùng 1 thẻ Audio
    audio.src = blobUrl;
    audio.load();

    // Dùng callback property (on...) để ghi đè, tránh bị lặp sự kiện như addEventListener
    audio.onended = () => {
      // Lấy duration (phải đảm bảo audio.duration hợp lệ)
      const duration = isNaN(audio.duration) ? 3 : audio.duration;
      const userTime = (duration * 1000) + 1500; // audio duration + 1.5s buffer
      
      setPlayerState("USER_SHADOWING");
      setCountdown(Math.round(userTime));

      // Đếm ngược countdown
      const startTime = Date.now();
      if (countdownIntervalRef.current) clearInterval(countdownIntervalRef.current);
      countdownIntervalRef.current = setInterval(() => {
        const remaining = Math.max(0, userTime - (Date.now() - startTime));
        setCountdown(Math.round(remaining));
        if (remaining <= 0) {
          clearInterval(countdownIntervalRef.current!);
        }
      }, 100);

      // Tự động phát câu tiếp theo
      if (shadowTimeoutRef.current) clearTimeout(shadowTimeoutRef.current);
      shadowTimeoutRef.current = setTimeout(() => {
        playSentence(index + 1);
      }, userTime);
    };

    audio.onerror = () => {
      console.error("[Player] Audio load error");
      setPlayerState("IDLE");
    };

    // CRITICAL FIX FOR SAFARI: Gọi play() ngay lập tức, đồng bộ với luồng click của người dùng
    audio.play().catch(e => {
      console.warn("[Player] Safari/Browser Autoplay prevented:", e);
      // Nếu Safari chặn (do mạng chậm dẫn đến mất User Gesture), trạng thái vẫn an toàn.
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
      if (currentBlobUrlRef.current) {
        URL.revokeObjectURL(currentBlobUrlRef.current);
      }
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
