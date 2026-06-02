"use client";

import { useEffect, useRef, useState } from "react";

/**
 * Custom Hook: Sinh ra tiếng ồn trắng (White Noise / Brown Noise) bằng toán học.
 * 
 * Sư phạm (Why we do this?):
 * Thay vì tải các file MP3/WAV nặng nề làm tốn băng thông và chậm ứng dụng, 
 * chúng ta sử dụng Web Audio API tích hợp sẵn trong trình duyệt để "tính toán" ra âm thanh.
 * 
 * Trade-offs:
 * - Ưu điểm: Tốc độ load cực nhanh, không tốn băng thông, có thể phát vô hạn không bị lặp (loop gap).
 * - Nhược điểm: Cần một chút CPU để tính toán, khó tái tạo chính xác 100% tiếng mưa thật hay suối chảy (chỉ giả lập được).
 */
export function useNoiseGenerator() {
  const [isPlaying, setIsPlaying] = useState(false);
  const [volume, setVolume] = useState(50); // 0 - 100
  const [noiseType, setNoiseType] = useState<"white" | "brown">("brown");

  // Sử dụng useRef để lưu trữ các node âm thanh (không làm re-render component khi thay đổi)
  const audioContextRef = useRef<AudioContext | null>(null);
  const noiseSourceRef = useRef<AudioBufferSourceNode | null>(null);
  const gainNodeRef = useRef<GainNode | null>(null);
  const filterNodeRef = useRef<BiquadFilterNode | null>(null);

  // Khởi tạo Audio Context
  const initAudio = () => {
    if (!audioContextRef.current) {
      audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
      
      // Node điều khiển âm lượng
      gainNodeRef.current = audioContextRef.current.createGain();
      gainNodeRef.current.connect(audioContextRef.current.destination);
      gainNodeRef.current.gain.value = volume / 100;

      // Node bộ lọc (dùng để biến white noise thành brown noise)
      filterNodeRef.current = audioContextRef.current.createBiquadFilter();
      filterNodeRef.current.connect(gainNodeRef.current);
    }
  };

  // Hàm sinh buffer cho tiếng ồn
  const createNoiseBuffer = () => {
    if (!audioContextRef.current) return null;
    
    const bufferSize = audioContextRef.current.sampleRate * 2; // 2 seconds buffer
    const buffer = audioContextRef.current.createBuffer(1, bufferSize, audioContextRef.current.sampleRate);
    const output = buffer.getChannelData(0);

    for (let i = 0; i < bufferSize; i++) {
      // Math.random() trả về từ 0 đến 1 -> ta chuyển thành -1 đến 1 (sóng âm thanh)
      output[i] = Math.random() * 2 - 1;
    }
    return buffer;
  };

  const play = () => {
    if (!audioContextRef.current) initAudio();
    if (audioContextRef.current?.state === "suspended") {
      audioContextRef.current.resume();
    }

    // Nếu đang chạy rồi thì thôi
    if (noiseSourceRef.current) return;

    const ctx = audioContextRef.current!;
    const buffer = createNoiseBuffer();
    
    noiseSourceRef.current = ctx.createBufferSource();
    noiseSourceRef.current.buffer = buffer;
    noiseSourceRef.current.loop = true; // Phát lặp vô hạn

    // Cấu hình bộ lọc dựa trên loại noise
    if (filterNodeRef.current) {
      if (noiseType === "brown") {
        filterNodeRef.current.type = "lowpass";
        filterNodeRef.current.frequency.value = 400; // Cắt tần số cao, tạo tiếng ù ù giống quạt/mưa
      } else {
        filterNodeRef.current.type = "allpass"; // Không lọc, giữ nguyên White Noise
      }
      noiseSourceRef.current.connect(filterNodeRef.current);
    } else {
      noiseSourceRef.current.connect(gainNodeRef.current!);
    }

    noiseSourceRef.current.start();
    setIsPlaying(true);
  };

  const stop = () => {
    if (noiseSourceRef.current) {
      noiseSourceRef.current.stop();
      noiseSourceRef.current.disconnect();
      noiseSourceRef.current = null;
    }
    setIsPlaying(false);
  };

  const toggle = () => {
    isPlaying ? stop() : play();
  };

  // Cập nhật âm lượng khi state volume thay đổi
  useEffect(() => {
    if (gainNodeRef.current) {
      // Sử dụng setTargetAtTime để chuyển âm lượng mượt mà, không bị "lạch cạch" (click/pop sound)
      gainNodeRef.current.gain.setTargetAtTime(volume / 100, audioContextRef.current!.currentTime, 0.015);
    }
  }, [volume]);

  // Cập nhật bộ lọc khi đổi loại tiếng ồn
  useEffect(() => {
    if (filterNodeRef.current && isPlaying) {
      if (noiseType === "brown") {
        filterNodeRef.current.type = "lowpass";
        filterNodeRef.current.frequency.value = 400;
      } else {
        filterNodeRef.current.type = "allpass";
      }
    }
  }, [noiseType, isPlaying]);

  // Cleanup khi unmount
  useEffect(() => {
    return () => {
      stop();
      if (audioContextRef.current) {
        audioContextRef.current.close();
      }
    };
  }, []);

  return { isPlaying, toggle, volume, setVolume, noiseType, setNoiseType };
}
