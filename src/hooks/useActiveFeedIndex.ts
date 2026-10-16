/**
 * @file useActiveFeedIndex.ts
 * @description Hook theo dõi Card nào đang chiếm lĩnh khung nhìn (>60% diện tích)
 * phục vụ cơ chế Virtual Sliding Window cho TikTok-style Feed
 * 
 * Made by Anh Tu - Share to be share
 */

"use client";

import { useState, useEffect, RefObject } from "react";

interface UseActiveFeedIndexOptions {
  containerRef: RefObject<HTMLDivElement | null>;
  itemSelector?: string;
  threshold?: number;
}

export function useActiveFeedIndex({
  containerRef,
  itemSelector = "[data-feed-index]",
  threshold = 0.6,
}: UseActiveFeedIndexOptions) {
  const [activeIndex, setActiveIndex] = useState<number>(0);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const rawIndex = entry.target.getAttribute("data-feed-index");
            if (rawIndex !== null) {
              const index = parseInt(rawIndex, 10);
              if (!isNaN(index)) {
                setActiveIndex(index);
              }
            }
          }
        });
      },
      {
        root: container,
        threshold,
      }
    );

    const observeCards = () => {
      const cards = container.querySelectorAll<HTMLElement>(itemSelector);
      cards.forEach((card) => observer.observe(card));
    };

    observeCards();

    // Theo dõi DOM thay đổi khi Infinite Scroll tải thêm cards mới
    const mutationObserver = new MutationObserver(() => {
      observeCards();
    });

    mutationObserver.observe(container, { childList: true, subtree: false });

    return () => {
      observer.disconnect();
      mutationObserver.disconnect();
    };
  }, [containerRef, itemSelector, threshold]);

  return { activeIndex };
}
