"use client";

import { useState, useEffect } from "react";

interface VisualViewportState {
  height: number;
  offsetTop: number;
}

/**
 * useVisualViewport — Track chiều cao và vị trí thực tế của Visual Viewport.
 *
 * WHY: iOS Safari có behavior đặc biệt khi bàn phím ảo mở:
 *  - Layout Viewport KHÔNG co lại (100vh vẫn = toàn màn hình)
 *  - Visual Viewport co lại theo phần màn hình còn lại
 *  - Kết quả: nội dung bị đẩy lên / bị che nếu dùng 100vh làm container
 *
 * SOLUTION: Đọc visualViewport.height và offsetTop để QuizPlayer tính
 * chính xác vị trí và kích thước của container position:fixed.
 *
 * NOTE: Không dùng window.scrollTo(0,0) ở đây vì:
 *  - Container đã dùng position:fixed → đã thoát khỏi document scroll flow
 *  - Forcing scroll gây re-layout và "giật" khi bàn phím animate
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

    // Đọc giá trị ngay khi mount (client-side hydration)
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
