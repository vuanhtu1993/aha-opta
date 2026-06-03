"use client";

import { useState, useEffect, useRef } from "react";

export function useSleepTimer(onTimeout: () => void) {
  // Thời gian còn lại tính bằng giây
  const [timeLeft, setTimeLeft] = useState<number | null>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Start hẹn giờ (nhận vào số phút)
  const startTimer = (minutes: number) => {
    if (timerRef.current) clearInterval(timerRef.current);
    
    setTimeLeft(minutes * 60);
    
    timerRef.current = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev === null) return null;
        if (prev <= 1) {
          clearInterval(timerRef.current!);
          timerRef.current = null;
          onTimeout(); // Gọi hàm tắt nhạc truyền từ ngoài vào
          return null;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const cancelTimer = () => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    setTimeLeft(null);
  };

  // Cleanup khi unmount
  useEffect(() => {
    return () => cancelTimer();
  }, []);

  // Format hiển thị kiểu MM:SS
  const formattedTime = timeLeft !== null 
    ? `${Math.floor(timeLeft / 60).toString().padStart(2, '0')}:${(timeLeft % 60).toString().padStart(2, '0')}`
    : null;

  return {
    timeLeft,
    formattedTime,
    startTimer,
    cancelTimer
  };
}
