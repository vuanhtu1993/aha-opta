"use client";

import { useEffect, useRef, useState, useCallback } from "react";

export type AudioTrack = {
  id: string;
  url: string;
  name: string;
};

/**
 * Custom Hook: Quản lý Âm thanh (iOS Safari Optimized)
 * 
 * Sư phạm (Why we do this?):
 * - Vấn đề iOS: iOS Safari không cho phép chỉnh thuộc tính `volume` của thẻ <audio> (nó bắt buộc dùng âm lượng hệ thống).
 *   Do đó, nếu dùng 2 thẻ <audio>, ta KHÔNG THỂ vặn nhỏ tiếng Mưa để làm nền cho tiếng Nhạc.
 * - Giải pháp: 
 *   + Nhạc chính (Main): Dùng thẻ <audio> ẩn để ăn theo âm lượng hệ thống (phím cứng điện thoại).
 *   + Nhạc nền (Background): Dùng Web Audio API (AudioBuffer + GainNode) để có thể chỉnh âm lượng nhỏ/to tuỳ ý trên giao diện.
 */
export function useAudioManager() {
  const [isPlaying, setIsPlaying] = useState(false);
  const [bgVolume, setBgVolume] = useState(50); // 0 - 100
  const [activeMainTrack, setActiveMainTrack] = useState<string | null>('/assets/sounds/main/baby-sleep.mp3');
  const [activeBgTrack, setActiveBgTrack] = useState<string | null>('/assets/sounds/background/rain.mp3');
  
  // Audio Elements
  const mainAudioRef = useRef<HTMLAudioElement | null>(null);
  
  // Web Audio API Elements (for background)
  const audioCtxRef = useRef<AudioContext | null>(null);
  const bgGainNodeRef = useRef<GainNode | null>(null);
  const bgSourceNodeRef = useRef<AudioBufferSourceNode | null>(null);
  const bgBufferCache = useRef<Record<string, AudioBuffer>>({});
  
  // State quản lý việc load buffer
  const [isBgLoading, setIsBgLoading] = useState(false);

  // 1. Khởi tạo & Unlock AudioContext (Yêu cầu phải gọi trong sự kiện onClick của user)
  const initAudioContext = useCallback(() => {
    if (!audioCtxRef.current) {
      audioCtxRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
      
      // Tạo bộ điều khiển âm lượng nền
      bgGainNodeRef.current = audioCtxRef.current.createGain();
      bgGainNodeRef.current.connect(audioCtxRef.current.destination);
      bgGainNodeRef.current.gain.value = bgVolume / 100;
    }
    
    // Resume context nếu bị suspended (đặc tính của iOS)
    if (audioCtxRef.current.state === "suspended") {
      audioCtxRef.current.resume();
    }
  }, [bgVolume]);

  // 2. Tải file âm thanh nền (Fetch & Decode)
  const loadBackgroundBuffer = async (url: string) => {
    if (bgBufferCache.current[url]) return bgBufferCache.current[url];
    
    setIsBgLoading(true);
    try {
      const response = await fetch(url);
      const arrayBuffer = await response.arrayBuffer();
      const audioBuffer = await audioCtxRef.current!.decodeAudioData(arrayBuffer);
      bgBufferCache.current[url] = audioBuffer;
      return audioBuffer;
    } catch (error) {
      console.error("Error loading background audio:", error);
      return null;
    } finally {
      setIsBgLoading(false);
    }
  };

  // 3. Phát âm thanh nền
  const playBackground = async (url: string) => {
    if (!audioCtxRef.current) return;
    
    // Dừng âm thanh nền cũ nếu đang phát
    if (bgSourceNodeRef.current) {
      bgSourceNodeRef.current.stop();
      bgSourceNodeRef.current.disconnect();
    }

    const buffer = await loadBackgroundBuffer(url);
    if (!buffer) return;

    bgSourceNodeRef.current = audioCtxRef.current.createBufferSource();
    bgSourceNodeRef.current.buffer = buffer;
    bgSourceNodeRef.current.loop = true; // Phát lặp vô tận
    bgSourceNodeRef.current.connect(bgGainNodeRef.current!);
    bgSourceNodeRef.current.start();
  };

  // 4. Khởi tạo thẻ <audio> cho nhạc chính
  useEffect(() => {
    mainAudioRef.current = new Audio();
    mainAudioRef.current.loop = true;
    
    return () => {
      mainAudioRef.current?.pause();
      mainAudioRef.current = null;
    };
  }, []);

  // 5. Cập nhật source cho nhạc chính khi đổi track
  useEffect(() => {
    if (mainAudioRef.current && activeMainTrack) {
      mainAudioRef.current.src = activeMainTrack;
      if (isPlaying) {
        mainAudioRef.current.play().catch(e => console.log("Play interrupted", e));
      }
    }
  }, [activeMainTrack, isPlaying]);

  // Cập nhật âm lượng nhạc nền
  useEffect(() => {
    if (bgGainNodeRef.current) {
      const safeVolume = Number.isFinite(bgVolume) ? bgVolume / 100 : 0.5;
      bgGainNodeRef.current.gain.value = safeVolume;
    }
  }, [bgVolume]);

  // Hành động Play/Pause tổng
  const togglePlay = async () => {
    initAudioContext(); // Unlock iOS Audio
    
    if (isPlaying) {
      // Dừng tất cả
      mainAudioRef.current?.pause();
      if (audioCtxRef.current?.state === "running") {
        audioCtxRef.current.suspend(); // Tạm dừng Web Audio thay vì stop để có thể resume
      }
      setIsPlaying(false);
    } else {
      // Phát tất cả
      if (activeMainTrack) {
        mainAudioRef.current?.play().catch(e => console.error("Main play error:", e));
      }
      
      if (activeBgTrack) {
        // Nếu đã có source thì chỉ cần resume context
        if (bgSourceNodeRef.current) {
          audioCtxRef.current?.resume();
        } else {
          // Chưa có thì khởi tạo và phát
          await playBackground(activeBgTrack);
        }
      }
      setIsPlaying(true);
    }
  };

  // Đổi nhạc nền
  const changeBgTrack = async (url: string) => {
    setActiveBgTrack(url);
    if (isPlaying) {
      initAudioContext();
      await playBackground(url);
    } else {
      // Nếu đang pause mà đổi nhạc, xoá source cũ để khi bấm Play nó tạo source mới
      if (bgSourceNodeRef.current) {
        bgSourceNodeRef.current.stop();
        bgSourceNodeRef.current.disconnect();
        bgSourceNodeRef.current = null;
      }
    }
  };

  return {
    isPlaying,
    togglePlay,
    bgVolume,
    setBgVolume,
    activeMainTrack,
    setActiveMainTrack,
    activeBgTrack,
    changeBgTrack,
    isBgLoading
  };
}
