"use client";

import { useEffect, useState } from "react";
import { GreetingSection } from "@/components/dashboard/greeting-section";
import { DueReviewCard } from "@/components/dashboard/due-review-card";
import { ContinueLearning } from "@/components/dashboard/continue-learning";
import { AppShortcuts } from "@/components/dashboard/app-shortcuts";
import { RecentStories } from "@/components/dashboard/recent-stories";

export default function Home() {
  const [stories, setStories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/story-shadowing")
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data)) {
          setStories(data);
        }
      })
      .catch((err) => console.error("Failed to fetch stories for dashboard", err))
      .finally(() => setLoading(false));
  }, []);

  const latestStory = stories.length > 0 ? stories[0] : null;
  const recentStories = stories.slice(0, 6);

  return (
    <div className="p-4 space-y-6">
      {/* 1. Lời chào */}
      <GreetingSection />

      {/* 2. Nhắc nhở ôn tập SRS nếu có từ đến hạn */}
      <DueReviewCard />

      {/* 3. Tiếp tục bài gần nhất */}
      {!loading && <ContinueLearning latestStory={latestStory} />}

      {/* 4. Phím tắt tiện ích */}
      <AppShortcuts />

      {/* 5. Danh sách bài học gần đây (cuộn ngang) */}
      {!loading && <RecentStories stories={recentStories} />}

      {/* Footer copyright */}
      <div className="pt-2 text-center text-xs text-slate-400 dark:text-slate-500 font-medium">
        Made by Anh Tu - Share to be share
      </div>
    </div>
  );
}
