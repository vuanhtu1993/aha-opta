"use client";
import { useState, useRef, useCallback, useEffect } from "react";
import type { Sentence } from "@/lib/schemas/story-shadowing.schema";

type PlayerState = "IDLE" | "AI_SPEAKING" | "USER_SHADOWING" | "PAUSED" | "DONE";

// Hàm tạo khoảng lặng (Silence) chuẩn WAV để giữ cho Audio Element luôn chạy (Hack for iOS/Safari)
function createSilentWavBlob(durationMs: number): Blob {
  const sampleRate = 44100;
  const numChannels = 1;
  const bitsPerSample = 16;
  const blockAlign = (numChannels * bitsPerSample) / 8;
  const byteRate = sampleRate * blockAlign;
  // Make sure dataSize is even
  let dataSize = Math.floor((durationMs / 1000) * byteRate);
  if (dataSize % 2 !== 0) dataSize++;
  
  const buffer = new ArrayBuffer(44 + dataSize);
  const view = new DataView(buffer);

  const writeString = (offset: number, str: string) => {
    for (let i = 0; i < str.length; i++) {
      view.setUint8(offset + i, str.charCodeAt(i));
    }
  };

  writeString(0, 'RIFF');
  view.setUint32(4, 36 + dataSize, true);
  writeString(8, 'WAVE');
  writeString(12, 'fmt ');
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true);
  view.setUint16(22, numChannels, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, byteRate, true);
  view.setUint16(32, blockAlign, true);
  view.setUint16(34, bitsPerSample, true);
  writeString(36, 'data');
  view.setUint32(40, dataSize, true);

  return new Blob([buffer], { type: 'audio/wav' });
}

export function useShadowingPlayer(sentences: Sentence[]) {
  const [playerState, setPlayerState] = useState<PlayerState>("IDLE");
  const [currentIndex, setCurrentIndex] = useState(0);
  const [countdown, setCountdown] = useState(0); // ms còn lại để đọc theo

  // Sử dụng HTML5 Audio để tránh lỗi Silent Switch trên iOS (chuông tắt thì Web Audio API bị tắt)
  const audioRef = useRef<HTMLAudioElement | null>(null);
  
  // Các URL Blob cần được giải phóng
  const currentBlobUrlRef = useRef<string | null>(null);
  const silentBlobUrlRef = useRef<string | null>(null);
  
  const countdownIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const clearTimers = useCallback(() => {
    if (countdownIntervalRef.current) clearInterval(countdownIntervalRef.current);
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.onended = null;
      audioRef.current.onerror = null;
    }
  }, []);

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
      // Bật thuộc tính này để tương thích tốt hơn trên Mobile
      audioRef.current.playsInline = true;
    }
    const audio = audioRef.current;

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

    if (currentBlobUrlRef.current) URL.revokeObjectURL(currentBlobUrlRef.current);
    if (silentBlobUrlRef.current) URL.revokeObjectURL(silentBlobUrlRef.current);
    currentBlobUrlRef.current = blobUrl;

    audio.src = blobUrl;
    audio.load();

    audio.onended = () => {
      // BẮT ĐẦU GIAI ĐOẠN SHADOWING (Phát khoảng lặng)
      const duration = isNaN(audio.duration) ? 3 : audio.duration;
      const userTime = (duration * 1000) + 1500; // duration + 1.5s
      
      setPlayerState("USER_SHADOWING");
      setCountdown(Math.round(userTime));

      // Bắt đầu đếm ngược UI
      const startTime = Date.now();
      if (countdownIntervalRef.current) clearInterval(countdownIntervalRef.current);
      countdownIntervalRef.current = setInterval(() => {
        const remaining = Math.max(0, userTime - (Date.now() - startTime));
        setCountdown(Math.round(remaining));
        if (remaining <= 0) {
          clearInterval(countdownIntervalRef.current!);
        }
      }, 100);

      // Thay vì dùng setTimeout (Bị iOS block), ta tạo 1 file WAV khoảng lặng và phát ngay lập tức
      const silentBlob = createSilentWavBlob(userTime);
      const silentUrl = URL.createObjectURL(silentBlob);
      silentBlobUrlRef.current = silentUrl;
      
      audio.src = silentUrl;
      audio.load();
      
      // Định nghĩa lại onended cho đoạn khoảng lặng
      audio.onended = () => {
        // Khi khoảng lặng kết thúc, phát câu tiếp theo ngay trong chuỗi sự kiện onended
        playSentence(index + 1);
      };

      // Play khoảng lặng (Được iOS cho phép vì đang nằm trong event onended)
      audio.play().catch(e => console.warn("Silence autoplay prevented:", e));
    };

    audio.onerror = () => {
      console.error("[Player] Audio load error");
      setPlayerState("IDLE");
    };

    // Play câu tiếng anh
    audio.play().catch(e => {
      console.warn("[Player] Autoplay prevented:", e);
    });
  }, [sentences]);

  const play = useCallback(() => {
    if (!audioRef.current) {
      audioRef.current = new Audio();
      audioRef.current.playsInline = true;
    }
    
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

  useEffect(() => {
    return () => {
      clearTimers();
      if (currentBlobUrlRef.current) URL.revokeObjectURL(currentBlobUrlRef.current);
      if (silentBlobUrlRef.current) URL.revokeObjectURL(silentBlobUrlRef.current);
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
