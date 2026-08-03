"use client";

import { useEffect, useState } from "react";

export function GreetingSection() {
  const [greeting, setGreeting] = useState("Chào bạn");
  const [emoji, setEmoji] = useState("👋");

  useEffect(() => {
    const hour = new Date().getHours();
    if (hour >= 5 && hour < 12) {
      setGreeting("Chào buổi sáng");
      setEmoji("☀️");
    } else if (hour >= 12 && hour < 18) {
      setGreeting("Chào buổi chiều");
      setEmoji("🌤️");
    } else {
      setGreeting("Chào buổi tối");
      setEmoji("🌙");
    }
  }, []);

  return (
    <div className="space-y-1">
      <div className="flex items-center gap-2 text-2xl font-black text-slate-900 dark:text-white tracking-tight">
        <span>{greeting}, Anh Tú!</span>
        <span>{emoji}</span>
      </div>
      <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
        Hôm nay bạn muốn luyện phát âm hay khám phá tiện ích gì?
      </p>
    </div>
  );
}
