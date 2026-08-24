"use client";

import { useState, useEffect } from "react";

interface VisualViewportState {
  height: number;
  offsetTop: number;
}

/**
 * useVisualViewport — Track chiều cao và vị trí Visual Viewport thực tế.
 *
 * WHY: iOS Safari có behavior đặc biệt khi bàn phím ảo mở:
 *  - Layout Viewport KHÔNG co lại (nên 100vh vẫn là toàn màn hình)
 *  - Visual Viewport co lại (phần thực sự nhìn thấy được)
 *  - iOS tự động scroll page để focused input hiện ra trong visual viewport
 *  - Kết quả: nếu dùng min-h-screen/100vh, content bị đẩy lên trên, mất header
 *
 * SOLUTION: Dùng window.visualViewport.height + offsetTop để biết chính xác
 * vùng nhìn thấy được. Component dùng position:fixed với top=offsetTop,
 * height=visualViewport.height sẽ luôn nằm đúng vị trí màn hình,
 * không bị ảnh hưởng bởi keyboard.
 *
 * TRADE-OFF:
 *  + Hoạt động chính xác trên iOS Safari 13+
 *  + Keyboard sẽ overlay lên content thay vì resize/push layout
 *  - Cần JavaScript (không phải pure CSS)
 *  - Có thể có 1 frame delay khi keyboard animation đang chạy
 */
export function useVisualViewport() {
  const [viewport, setViewport] = useState<VisualViewportState | null>(null);

  useEffect(() => {
    const getState = (): VisualViewportState => {
      if (window.visualViewport) {
        return {
          height: window.visualViewport.height,
          offsetTop: window.visualViewport.offsetTop,
        };
      }
      return { height: window.innerHeight, offsetTop: 0 };
    };

    // Đọc giá trị ban đầu ngay khi mount (client-side)
    setViewport(getState());

    if (!window.visualViewport) return;

    // "resize" fires khi keyboard xuất hiện/ẩn trên iOS
    // "scroll" fires khi iOS tự scroll page để reveal focused input
    const handler = () => setViewport(getState());

    window.visualViewport.addEventListener("resize", handler);
    window.visualViewport.addEventListener("scroll", handler);

    return () => {
      window.visualViewport!.removeEventListener("resize", handler);
      window.visualViewport!.removeEventListener("scroll", handler);
    };
  }, []);

  return viewport;
}
