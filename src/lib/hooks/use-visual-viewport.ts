"use client";

import { useState, useEffect } from "react";

interface VisualViewportState {
  height: number;
  offsetTop: number;
  isKeyboardOpen: boolean;
}

/**
 * useVisualViewport — Track chiều cao, vị trí và trạng thái bàn phím Visual Viewport.
 *
 * WHY:
 * 1. iOS Safari thu nhỏ Visual Viewport khi bàn phím xuất hiện nhưng không đổi Layout Viewport.
 * 2. iOS Safari cố gắng cuộn layout window khi focus input, gây trôi layout fixed (window.scrollY > 0).
 *
 * SOLUTION:
 * - Trả về height và offsetTop thực tế của visualViewport.
 * - Đặt window.scrollTo(0,0) trong handler để chống trôi layout body trên iOS.
 * - Thêm isKeyboardOpen boolean để components chủ động cuộn nội dung vừa vặn màn hình.
 */
export function useVisualViewport() {
  const [viewport, setViewport] = useState<VisualViewportState | null>(null);

  useEffect(() => {
    const getState = (): VisualViewportState => {
      if (window.visualViewport) {
        const isKeyboardOpen = window.visualViewport.height < window.innerHeight - 150;
        return {
          height: window.visualViewport.height,
          offsetTop: window.visualViewport.offsetTop,
          isKeyboardOpen,
        };
      }
      return {
        height: window.innerHeight,
        offsetTop: 0,
        isKeyboardOpen: false,
      };
    };

    setViewport(getState());

    if (!window.visualViewport) return;

    const handler = () => {
      // Triệt tiêu việc iOS Safari tự động cuộn window làm trôi container fixed
      if (window.scrollY > 0) {
        window.scrollTo(0, 0);
      }
      setViewport(getState());
    };

    window.visualViewport.addEventListener("resize", handler);
    window.visualViewport.addEventListener("scroll", handler);

    return () => {
      window.visualViewport!.removeEventListener("resize", handler);
      window.visualViewport!.removeEventListener("scroll", handler);
    };
  }, []);

  return viewport;
}
