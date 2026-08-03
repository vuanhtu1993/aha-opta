# Mobile PWA UX Redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Chuyển đổi toàn bộ trải nghiệm AHA-MIND sang mô hình Unified App Shell Mobile-First PWA với Bottom Tab Bar 4 tabs (Home, Story, Vocab, Profile), Smart Dashboard, Mobile-optimized History, Local Settings, và Web App Manifest.

**Architecture:** Sử dụng mô hình Unified App Shell (`max-w-[480px]` căn giữa trên màn hình desktop, full-width trên mobile) với Bottom Tab Bar cố định ở bottom layout. State settings lưu trữ qua `localStorage` với custom hook `useSettings`, tích hợp Next.js Web App Manifest (`manifest.ts`) và Service Worker cơ bản để hỗ trợ cài đặt PWA standalone.

**Tech Stack:** Next.js 16 (App Router), React 19, TailwindCSS v4, Lucide React, Framer Motion, Shadcn UI, Mongoose.

---

## File Structure Map

```
src/
├── app/
│   ├── layout.tsx                              # [MODIFY] Thêm AppShell, MobileTabBar, PWARegister, Metadata PWA
│   ├── page.tsx                                # [MODIFY] Chuyển đổi thành Mobile Smart Dashboard
│   ├── manifest.ts                             # [NEW] Next.js Web App Manifest
│   ├── globals.css                             # [MODIFY] Thêm CSS utilities cho Safe Area & Desktop Shell
│   ├── profile/
│   │   └── page.tsx                            # [NEW] Profile & Settings page
│   ├── vocab/
│   │   └── page.tsx                            # [NEW] Vocab placeholder page
│   └── apps/
│       └── story-shadowing/
│           └── page.tsx                        # [MODIFY] Giao diện History danh sách 1 cột chuẩn mobile
│
├── components/
│   ├── mobile-shell/
│   │   ├── app-shell.tsx                       # [NEW] Khung App Shell (max-w 480px, safe padding)
│   │   ├── mobile-tab-bar.tsx                  # [NEW] Thanh Bottom Tab Bar (4 tabs)
│   │   ├── mobile-header.tsx                   # [NEW] Header nhỏ gọn cho mobile với nút Back & Theme
│   │   └── pwa-register.tsx                    # [NEW] Component đăng ký Service Worker
│   ├── dashboard/
│   │   ├── greeting-section.tsx                # [NEW] Lời chào theo thời gian
│   │   ├── continue-learning.tsx               # [NEW] Card tiếp tục bài học gần nhất
│   │   ├── app-shortcuts.tsx                   # [NEW] Danh sách lưới micro-apps
│   │   └── recent-stories.tsx                  # [NEW] Danh sách cuộn ngang bài luyện tập gần đây
│   └── settings/
│       ├── settings-group.tsx                  # [NEW] Nhóm các mục cài đặt
│       ├── toggle-setting.tsx                  # [NEW] Cài đặt dạng bật/tắt
│       └── select-setting.tsx                  # [NEW] Cài đặt dạng lựa chọn
│
├── lib/
│   └── hooks/
│       └── use-settings.ts                     # [NEW] Hook quản lý cài đặt với localStorage
│
└── public/
    └── sw.js                                   # [NEW] Service worker cache static assets
```

---

### Task 1: CSS Safe Area & App Shell Foundation

**Files:**
- Modify: `src/app/globals.css`
- Create: `src/components/mobile-shell/app-shell.tsx`
- Create: `src/components/mobile-shell/mobile-tab-bar.tsx`
- Create: `src/components/mobile-shell/mobile-header.tsx`

- [ ] **Step 1: Cập nhật `src/app/globals.css` với CSS utility cho Safe Area & Desktop Frame Background**

```css
/* Thêm vào cuối src/app/globals.css */

@layer utilities {
  .pb-safe {
    padding-bottom: env(safe-area-inset-bottom, 16px);
  }
  .pt-safe {
    padding-top: env(safe-area-inset-top, 0px);
  }
  .app-shell-shadow {
    box-shadow: 0 0 50px -12px rgba(0, 0, 0, 0.12);
  }
}
```

- [ ] **Step 2: Tạo component `src/components/mobile-shell/app-shell.tsx`**

```tsx
import React from "react";

interface AppShellProps {
  children: React.ReactNode;
}

export function AppShell({ children }: AppShellProps) {
  return (
    <div className="min-h-screen w-full bg-slate-200/60 dark:bg-slate-950 flex justify-center selection:bg-amber-400 selection:text-slate-900">
      <div className="w-full max-w-[480px] min-h-screen bg-slate-50 dark:bg-slate-900 border-x border-slate-200/80 dark:border-slate-800 flex flex-col relative app-shell-shadow">
        <main className="flex-1 pb-20 overflow-x-hidden">
          {children}
        </main>
      </div>
    </div>
  );
}
```

- [ ] **Step 3: Tạo component `src/components/mobile-shell/mobile-tab-bar.tsx`**

```tsx
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, BookOpen, GraduationCap, Settings } from "lucide-react";
import { cn } from "@/lib/utils";

interface TabItem {
  label: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  exactMatch?: boolean;
}

const TABS: TabItem[] = [
  {
    label: "Home",
    href: "/",
    icon: Home,
    exactMatch: true,
  },
  {
    label: "Story",
    href: "/apps/story-shadowing",
    icon: BookOpen,
    exactMatch: false,
  },
  {
    label: "Vocab",
    href: "/vocab",
    icon: GraduationCap,
    exactMatch: false,
  },
  {
    label: "Profile",
    href: "/profile",
    icon: Settings,
    exactMatch: false,
  },
];

export function MobileTabBar() {
  const pathname = usePathname();

  return (
    <nav
      aria-label="Bottom Navigation"
      className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-[480px] z-50 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-t border-slate-200 dark:border-slate-800 px-4 py-2 pb-safe"
    >
      <div className="flex items-center justify-around">
        {TABS.map((tab) => {
          const isActive = tab.exactMatch
            ? pathname === tab.href
            : pathname.startsWith(tab.href);
          const Icon = tab.icon;

          return (
            <Link
              key={tab.href}
              href={tab.href}
              className={cn(
                "flex flex-col items-center justify-center py-1 px-3 rounded-xl transition-all duration-200 gap-1",
                isActive
                  ? "text-amber-500 font-bold dark:text-amber-400"
                  : "text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200"
              )}
            >
              <div
                className={cn(
                  "p-1 rounded-lg transition-transform",
                  isActive ? "scale-110 bg-amber-50 dark:bg-amber-950/40" : ""
                )}
              >
                <Icon className={cn("w-5 h-5", isActive ? "stroke-[2.5]" : "stroke-[1.75]")} />
              </div>
              <span className="text-[11px] leading-none tracking-tight">{tab.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
```

- [ ] **Step 4: Tạo component `src/components/mobile-shell/mobile-header.tsx`**

```tsx
"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { ChevronLeft } from "lucide-react";

export function MobileHeader() {
  const pathname = usePathname();
  const router = useRouter();

  const isRootPage = pathname === "/" || pathname === "/apps/story-shadowing" || pathname === "/vocab" || pathname === "/profile";

  return (
    <header className="sticky top-0 z-40 w-full bg-white/85 dark:bg-slate-900/85 backdrop-blur-md border-b border-slate-200/80 dark:border-slate-800 px-4 h-14 flex items-center justify-between">
      <div className="flex items-center gap-2">
        {!isRootPage && (
          <button
            onClick={() => router.back()}
            className="p-1.5 -ml-1.5 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800 transition-colors"
            title="Quay lại"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
        )}
        <Link href="/" className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center text-white font-black text-sm shadow-sm">
            A
          </div>
          <span className="font-extrabold text-slate-900 dark:text-white tracking-tight text-base">
            AHA<span className="text-amber-500">·MIND</span>
          </span>
        </Link>
      </div>

      <div className="flex items-center gap-2">
        <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800">
          v1.0
        </span>
      </div>
    </header>
  );
}
```

- [ ] **Step 5: Cập nhật `src/app/layout.tsx` sử dụng `AppShell`, `MobileHeader`, và `MobileTabBar`**

```tsx
import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { AppShell } from "@/components/mobile-shell/app-shell";
import { MobileHeader } from "@/components/mobile-shell/mobile-header";
import { MobileTabBar } from "@/components/mobile-shell/mobile-tab-bar";
import { AgentProgressToast } from "@/components/story-shadowing/agent-progress-toast";

const inter = Inter({ subsets: ["latin"] });

export const viewport: Viewport = {
  themeColor: "#FFBA49",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export const metadata: Metadata = {
  metadataBase: new URL("https://aha-mind.vercel.app"),
  title: "Aha-Mind | AI Story Shadowing & Micro-Apps",
  description: "Ứng dụng AI thông minh hỗ trợ học tiếng Anh bằng phương pháp Shadowing và các tiện ích vi mô.",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "AHA-MIND",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="vi" suppressHydrationWarning>
      <body className={`${inter.className} min-h-screen bg-slate-200 dark:bg-slate-950`}>
        <AppShell>
          <MobileHeader />
          {children}
          <MobileTabBar />
        </AppShell>
        <AgentProgressToast />
      </body>
    </html>
  );
}
```

- [ ] **Step 6: Kiểm tra chạy dev server và xác nhận giao diện render không lỗi**

Run: `pnpm build` hoặc kiểm tra terminal Next.js dev server để xác nhận layout hoạt động trơn tru.

---

### Task 2: Settings Hook & Profile Page

**Files:**
- Create: `src/lib/hooks/use-settings.ts`
- Create: `src/components/settings/settings-group.tsx`
- Create: `src/components/settings/toggle-setting.tsx`
- Create: `src/components/settings/select-setting.tsx`
- Create: `src/app/profile/page.tsx`

- [ ] **Step 1: Tạo hook `src/lib/hooks/use-settings.ts` để lưu trữ cài đặt trong `localStorage`**

```typescript
"use client";

import { useState, useEffect } from "react";

export interface AppSettings {
  darkMode: boolean;
  language: "vi" | "en";
  defaultVoice: string;
  repeatTimeoutSeconds: number;
  autoAdvance: boolean;
}

const DEFAULT_SETTINGS: AppSettings = {
  darkMode: false,
  language: "vi",
  defaultVoice: "en-US-Standard-C",
  repeatTimeoutSeconds: 5,
  autoAdvance: true,
};

const STORAGE_KEY = "aha_app_settings_v1";

export function useSettings() {
  const [settings, setSettings] = useState<AppSettings>(DEFAULT_SETTINGS);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        setSettings({ ...DEFAULT_SETTINGS, ...JSON.parse(stored) });
      }
    } catch (e) {
      console.error("Failed to read settings from localStorage", e);
    } finally {
      setIsLoaded(true);
    }
  }, []);

  const updateSetting = <K extends keyof AppSettings>(key: K, value: AppSettings[K]) => {
    setSettings((prev) => {
      const next = { ...prev, [key]: value };
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      } catch (e) {
        console.error("Failed to save settings", e);
      }

      // Xử lý toggle class dark mode trên document element
      if (key === "darkMode") {
        if (value) {
          document.documentElement.classList.add("dark");
        } else {
          document.documentElement.classList.remove("dark");
        }
      }

      return next;
    });
  };

  return {
    settings,
    isLoaded,
    updateSetting,
  };
}
```

- [ ] **Step 2: Tạo components UI settings trong `src/components/settings/`**

Tạo `src/components/settings/settings-group.tsx`:
```tsx
import React from "react";

interface SettingsGroupProps {
  title: string;
  children: React.ReactNode;
}

export function SettingsGroup({ title, children }: SettingsGroupProps) {
  return (
    <div className="space-y-2">
      <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 px-1">
        {title}
      </h3>
      <div className="bg-white dark:bg-slate-800/80 rounded-2xl border border-slate-200/80 dark:border-slate-700/60 divide-y divide-slate-100 dark:divide-slate-700/50 overflow-hidden shadow-xs">
        {children}
      </div>
    </div>
  );
}
```

Tạo `src/components/settings/toggle-setting.tsx`:
```tsx
import React from "react";

interface ToggleSettingProps {
  icon: React.ReactNode;
  label: string;
  description?: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
}

export function ToggleSetting({ icon, label, description, checked, onChange }: ToggleSettingProps) {
  return (
    <label className="flex items-center justify-between p-4 cursor-pointer hover:bg-slate-50/60 dark:hover:bg-slate-700/30 transition-colors">
      <div className="flex items-center gap-3 pr-4">
        <div className="text-slate-600 dark:text-slate-300 text-lg">{icon}</div>
        <div>
          <div className="text-sm font-semibold text-slate-800 dark:text-slate-100">{label}</div>
          {description && <div className="text-xs text-slate-400 dark:text-slate-400">{description}</div>}
        </div>
      </div>
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="w-5 h-5 rounded accent-amber-500 cursor-pointer"
      />
    </label>
  );
}
```

Tạo `src/components/settings/select-setting.tsx`:
```tsx
import React from "react";
import { ChevronRight } from "lucide-react";

interface SelectSettingProps {
  icon: React.ReactNode;
  label: string;
  value: string;
  onClick?: () => void;
}

export function SelectSetting({ icon, label, value, onClick }: SelectSettingProps) {
  return (
    <div
      onClick={onClick}
      className="flex items-center justify-between p-4 hover:bg-slate-50/60 dark:hover:bg-slate-700/30 cursor-pointer transition-colors"
    >
      <div className="flex items-center gap-3">
        <div className="text-slate-600 dark:text-slate-300 text-lg">{icon}</div>
        <div className="text-sm font-semibold text-slate-800 dark:text-slate-100">{label}</div>
      </div>
      <div className="flex items-center gap-1.5 text-xs font-medium text-slate-400">
        <span>{value}</span>
        <ChevronRight className="w-4 h-4 text-slate-400" />
      </div>
    </div>
  );
}
```

- [ ] **Step 3: Tạo trang `src/app/profile/page.tsx`**

```tsx
"use client";

import { useSettings } from "@/lib/hooks/use-settings";
import { SettingsGroup } from "@/components/settings/settings-group";
import { ToggleSetting } from "@/components/settings/toggle-setting";
import { SelectSetting } from "@/components/settings/select-setting";
import { Moon, Globe, Volume2, Timer, RotateCcw, Info, MessageSquare, BookOpen } from "lucide-react";

export default function ProfilePage() {
  const { settings, isLoaded, updateSetting } = useSettings();

  if (!isLoaded) return null;

  return (
    <div className="p-4 space-y-6">
      {/* Header Profile */}
      <div className="bg-gradient-to-br from-amber-400 to-amber-500 rounded-3xl p-5 text-slate-900 shadow-sm flex items-center gap-4">
        <div className="w-14 h-14 rounded-2xl bg-white/30 backdrop-blur-md flex items-center justify-center text-2xl font-black shadow-inner">
          👤
        </div>
        <div>
          <h2 className="text-lg font-extrabold">Anh Tú</h2>
          <p className="text-xs font-medium text-slate-800/80">Luyện tập thông minh cùng AI</p>
        </div>
      </div>

      {/* Group: Giao diện */}
      <SettingsGroup title="Giao diện">
        <ToggleSetting
          icon={<Moon className="w-5 h-5 text-indigo-500" />}
          label="Chế độ tối"
          description="Tiết kiệm pin và dịu mắt vào ban đêm"
          checked={settings.darkMode}
          onChange={(val) => updateSetting("darkMode", val)}
        />
        <SelectSetting
          icon={<Globe className="w-5 h-5 text-emerald-500" />}
          label="Ngôn ngữ"
          value={settings.language === "vi" ? "Tiếng Việt" : "English"}
        />
      </SettingsGroup>

      {/* Group: Shadowing */}
      <SettingsGroup title="Shadowing">
        <SelectSetting
          icon={<Volume2 className="w-5 h-5 text-amber-500" />}
          label="Giọng đọc mặc định"
          value={settings.defaultVoice}
        />
        <SelectSetting
          icon={<Timer className="w-5 h-5 text-rose-500" />}
          label="Thời gian lặp lại"
          value={`${settings.repeatTimeoutSeconds} giây`}
        />
        <ToggleSetting
          icon={<RotateCcw className="w-5 h-5 text-blue-500" />}
          label="Tự động chuyển câu"
          description="Tự động nhảy sang câu tiếp theo sau khi hết giờ"
          checked={settings.autoAdvance}
          onChange={(val) => updateSetting("autoAdvance", val)}
        />
      </SettingsGroup>

      {/* Group: Thông tin */}
      <SettingsGroup title="Thông tin">
        <SelectSetting
          icon={<Info className="w-5 h-5 text-slate-500" />}
          label="Phiên bản"
          value="v1.0.0 (PWA)"
        />
        <SelectSetting
          icon={<BookOpen className="w-5 h-5 text-slate-500" />}
          label="Hướng dẫn sử dụng"
          value="Xem chi tiết"
        />
        <SelectSetting
          icon={<MessageSquare className="w-5 h-5 text-slate-500" />}
          label="Góp ý & Phản hồi"
          value="Gửi tin nhắn"
        />
      </SettingsGroup>

      {/* Footer copyright */}
      <div className="pt-4 pb-2 text-center text-xs text-slate-400 dark:text-slate-500 font-medium">
        Made by Anh Tu - Share to be share
      </div>
    </div>
  );
}
```

---

### Task 3: Vocab Placeholder Tab

**Files:**
- Create: `src/app/vocab/page.tsx`

- [ ] **Step 1: Tạo trang `src/app/vocab/page.tsx`**

```tsx
import Link from "next/link";
import { GraduationCap, Sparkles, ArrowRight } from "lucide-react";

export default function VocabPage() {
  return (
    <div className="p-6 flex flex-col items-center justify-center min-h-[70vh] text-center space-y-6">
      <div className="w-20 h-20 rounded-3xl bg-amber-100 dark:bg-amber-950/60 text-amber-500 flex items-center justify-center text-4xl shadow-inner animate-bounce">
        <GraduationCap className="w-10 h-10" />
      </div>

      <div className="space-y-2 max-w-sm">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 text-xs font-bold border border-amber-200 dark:border-amber-800">
          <Sparkles className="w-3.5 h-3.5" /> Sắp ra mắt ở Phase tiếp theo
        </div>
        <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white">
          Kho từ vựng & Flashcards
        </h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
          Hệ thống sẽ tự động tổng hợp toàn bộ từ vựng, collocation và word family bạn đã học từ các bài Shadowing thành bộ thẻ Flashcard thông minh.
        </p>
      </div>

      <div className="pt-4">
        <Link
          href="/apps/story-shadowing"
          className="inline-flex items-center gap-2 px-6 py-3 bg-[#FFBA49] text-slate-900 font-bold text-sm rounded-2xl hover:bg-[#e6a640] transition-colors shadow-sm"
        >
          Luyện tập Story Shadowing <ArrowRight className="w-4 h-4" />
        </Link>
      </div>

      <div className="text-xs text-slate-400 pt-8">
        Made by Anh Tu - Share to be share
      </div>
    </div>
  );
}
```

---

### Task 4: Smart Mobile Dashboard (Home Tab)

**Files:**
- Create: `src/components/dashboard/greeting-section.tsx`
- Create: `src/components/dashboard/continue-learning.tsx`
- Create: `src/components/dashboard/app-shortcuts.tsx`
- Create: `src/components/dashboard/recent-stories.tsx`
- Modify: `src/app/page.tsx`

- [ ] **Step 1: Tạo `src/components/dashboard/greeting-section.tsx`**

```tsx
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
```

- [ ] **Step 2: Tạo `src/components/dashboard/continue-learning.tsx`**

```tsx
"use client";

import Link from "next/link";
import { Play, Sparkles, BookOpen } from "lucide-react";

interface StorybookItem {
  _id: string;
  title: string;
  level?: "easy" | "medium" | "hard";
  originalText: string;
  thumbnail?: string;
  sourceType?: string;
}

interface ContinueLearningProps {
  latestStory?: StorybookItem | null;
}

export function ContinueLearning({ latestStory }: ContinueLearningProps) {
  if (!latestStory) {
    return (
      <div className="bg-gradient-to-br from-amber-50 to-orange-50 dark:from-slate-800 dark:to-slate-850 p-5 rounded-3xl border border-amber-200/60 dark:border-slate-700/60 space-y-3">
        <div className="flex items-center gap-2 text-amber-700 dark:text-amber-400 font-bold text-xs">
          <Sparkles className="w-4 h-4" /> Bắt đầu hành trình
        </div>
        <h3 className="font-extrabold text-base text-slate-900 dark:text-white">
          Chưa có bài luyện tập nào
        </h3>
        <p className="text-xs text-slate-600 dark:text-slate-400">
          Hãy tạo bài học đầu tiên từ văn bản hoặc video YouTube yêu thích!
        </p>
        <Link
          href="/apps/story-shadowing/create"
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-amber-400 hover:bg-amber-500 text-slate-900 font-bold text-xs rounded-xl shadow-xs transition-colors"
        >
          + Tạo bài luyện tập
        </Link>
      </div>
    );
  }

  const levelColor =
    latestStory.level === "easy"
      ? "bg-emerald-100 text-emerald-700 border-emerald-200"
      : latestStory.level === "hard"
      ? "bg-rose-100 text-rose-700 border-rose-200"
      : "bg-amber-100 text-amber-800 border-amber-200";

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between px-1">
        <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
          <BookOpen className="w-3.5 h-3.5 text-amber-500" /> Tiếp tục bài gần nhất
        </span>
        <Link
          href="/apps/story-shadowing"
          className="text-xs font-semibold text-amber-600 dark:text-amber-400 hover:underline"
        >
          Xem tất cả →
        </Link>
      </div>

      <Link
        href={`/apps/story-shadowing/player/${latestStory._id}`}
        className="block bg-white dark:bg-slate-800/90 rounded-3xl p-4 border border-slate-200/80 dark:border-slate-700 shadow-xs hover:border-amber-400 transition-all group overflow-hidden"
      >
        <div className="flex gap-4">
          <div className="w-20 h-20 rounded-2xl bg-slate-100 dark:bg-slate-700 shrink-0 overflow-hidden relative">
            {latestStory.thumbnail ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={latestStory.thumbnail} alt={latestStory.title} className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full bg-amber-100 dark:bg-amber-950 flex items-center justify-center text-amber-500 font-bold text-xl">
                📖
              </div>
            )}
          </div>

          <div className="flex-1 min-w-0 flex flex-col justify-between">
            <div>
              <div className="flex items-center gap-2 mb-1">
                {latestStory.level && (
                  <span className={`text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full border ${levelColor}`}>
                    {latestStory.level}
                  </span>
                )}
                <span className="text-[10px] text-slate-400 font-medium">
                  {latestStory.sourceType === "youtube" ? "YouTube Video" : "Text Shadowing"}
                </span>
              </div>
              <h4 className="font-bold text-sm text-slate-900 dark:text-white line-clamp-1 group-hover:text-amber-500 transition-colors">
                {latestStory.title}
              </h4>
              <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-1 mt-0.5">
                {latestStory.originalText}
              </p>
            </div>

            <div className="flex items-center justify-end mt-2">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-amber-400 group-hover:bg-amber-500 text-slate-900 font-bold text-xs rounded-xl shadow-xs transition-colors">
                <Play className="w-3 h-3 fill-slate-900" /> Luyện tập
              </span>
            </div>
          </div>
        </div>
      </Link>
    </div>
  );
}
```

- [ ] **Step 3: Tạo `src/components/dashboard/app-shortcuts.tsx`**

```tsx
import Link from "next/link";
import { Sparkles } from "lucide-react";

interface AppItem {
  id: string;
  name: string;
  desc: string;
  icon: string;
  href: string;
  status?: string;
  gradient: string;
  disabled?: boolean;
}

const APPS: AppItem[] = [
  {
    id: "story-shadowing",
    name: "Story Shadowing",
    desc: "Luyện phát âm AI",
    icon: "📖",
    href: "/apps/story-shadowing",
    gradient: "from-amber-50 to-orange-50 dark:from-amber-950/30 dark:to-orange-950/20 border-amber-200 dark:border-amber-900",
  },
  {
    id: "white-noise",
    name: "White Noise",
    desc: "Âm thanh ru bé ngủ",
    icon: "🎵",
    href: "/apps/white-noise",
    gradient: "from-purple-50 to-pink-50 dark:from-purple-950/30 dark:to-pink-950/20 border-purple-200 dark:border-purple-900",
  },
  {
    id: "opta",
    name: "AHA-Opta",
    desc: "Dự đoán World Cup",
    icon: "⚽",
    href: "/apps/opta",
    gradient: "from-emerald-50 to-teal-50 dark:from-emerald-950/30 dark:to-teal-950/20 border-emerald-200 dark:border-emerald-900",
  },
  {
    id: "news",
    name: "Tin tức AI",
    desc: "Tổng hợp buổi sáng",
    icon: "📰",
    href: "#",
    status: "Sắp có",
    disabled: true,
    gradient: "from-slate-50 to-slate-100 dark:from-slate-800/40 dark:to-slate-800/20 border-slate-200 dark:border-slate-800",
  },
];

export function AppShortcuts() {
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between px-1">
        <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
          <Sparkles className="w-3.5 h-3.5 text-amber-500" /> Hệ sinh thái tiện ích
        </span>
      </div>

      <div className="grid grid-cols-2 gap-3">
        {APPS.map((app) => {
          if (app.disabled) {
            return (
              <div
                key={app.id}
                className={`p-3.5 rounded-2xl border bg-gradient-to-br ${app.gradient} opacity-60 cursor-not-allowed flex flex-col justify-between min-h-[96px]`}
              >
                <div className="flex items-start justify-between">
                  <span className="text-2xl">{app.icon}</span>
                  {app.status && (
                    <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300">
                      {app.status}
                    </span>
                  )}
                </div>
                <div>
                  <div className="font-bold text-xs text-slate-700 dark:text-slate-300">{app.name}</div>
                  <div className="text-[10px] text-slate-500 dark:text-slate-400">{app.desc}</div>
                </div>
              </div>
            );
          }

          return (
            <Link
              key={app.id}
              href={app.href}
              className={`p-3.5 rounded-2xl border bg-gradient-to-br ${app.gradient} hover:scale-[1.02] active:scale-95 transition-all shadow-2xs flex flex-col justify-between min-h-[96px] group`}
            >
              <div className="flex items-start justify-between">
                <span className="text-2xl">{app.icon}</span>
                <span className="text-xs text-slate-400 group-hover:text-amber-500 font-bold transition-colors">
                  →
                </span>
              </div>
              <div>
                <div className="font-bold text-xs text-slate-900 dark:text-white group-hover:text-amber-600 transition-colors">
                  {app.name}
                </div>
                <div className="text-[10px] text-slate-500 dark:text-slate-400">{app.desc}</div>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
```

- [ ] **Step 4: Tạo `src/components/dashboard/recent-stories.tsx`**

```tsx
"use client";

import Link from "next/link";
import { Flame } from "lucide-react";

interface StorybookItem {
  _id: string;
  title: string;
  thumbnail?: string;
  createdAt: string;
}

interface RecentStoriesProps {
  stories: StorybookItem[];
}

export function RecentStories({ stories }: RecentStoriesProps) {
  if (!stories || stories.length === 0) return null;

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between px-1">
        <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
          <Flame className="w-3.5 h-3.5 text-amber-500" /> Bài học gần đây
        </span>
        <Link
          href="/apps/story-shadowing"
          className="text-xs font-semibold text-amber-600 dark:text-amber-400 hover:underline"
        >
          Xem tất cả →
        </Link>
      </div>

      <div className="flex gap-3 overflow-x-auto pb-2 pt-1 scrollbar-none -mx-4 px-4">
        {stories.map((story) => (
          <Link
            key={story._id}
            href={`/apps/story-shadowing/player/${story._id}`}
            className="w-36 shrink-0 bg-white dark:bg-slate-800 rounded-2xl border border-slate-200/80 dark:border-slate-700 overflow-hidden shadow-2xs hover:border-amber-400 transition-all group"
          >
            <div className="w-full h-24 bg-slate-100 dark:bg-slate-700 relative">
              {story.thumbnail ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={story.thumbnail} alt={story.title} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full bg-amber-50 dark:bg-amber-950/40 flex items-center justify-center text-xl">
                  📖
                </div>
              )}
            </div>
            <div className="p-2.5">
              <h5 className="font-bold text-xs text-slate-800 dark:text-slate-100 line-clamp-1 group-hover:text-amber-500 transition-colors">
                {story.title}
              </h5>
              <p className="text-[10px] text-slate-400 mt-0.5">
                {new Date(story.createdAt).toLocaleDateString("vi-VN")}
              </p>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
```

- [ ] **Step 5: Cập nhật `src/app/page.tsx` thành Dashboard thông minh**

```tsx
"use client";

import { useEffect, useState } from "react";
import { GreetingSection } from "@/components/dashboard/greeting-section";
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

      {/* 2. Tiếp tục bài gần nhất */}
      {!loading && <ContinueLearning latestStory={latestStory} />}

      {/* 3. Phím tắt tiện ích */}
      <AppShortcuts />

      {/* 4. Danh sách bài học gần đây (cuộn ngang) */}
      {!loading && <RecentStories stories={recentStories} />}

      {/* Footer copyright */}
      <div className="pt-2 text-center text-xs text-slate-400 dark:text-slate-500 font-medium">
        Made by Anh Tu - Share to be share
      </div>
    </div>
  );
}
```

---

### Task 5: Mobile-First History Layout for Story Shadowing

**Files:**
- Modify: `src/app/apps/story-shadowing/page.tsx`

- [ ] **Step 1: Cập nhật `src/app/apps/story-shadowing/page.tsx` thành layout 1 cột chuẩn mobile với Search bar và Filter chips**

```tsx
"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Search, Plus, Play, ChevronDown, ChevronUp, Youtube, BookOpen, Layers } from "lucide-react";

type StoryHistory = {
  _id: string;
  title: string;
  originalText: string;
  createdAt: string;
  thumbnail?: string;
  level?: "easy" | "medium" | "hard";
  sourceType?: "text" | "youtube";
  youtubeVideoId?: string;
  seriesId?: string;
  partIndex?: number;
  partTitle?: string;
  totalParts?: number;
};

export default function StorybookPage() {
  const [history, setHistory] = useState<StoryHistory[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterType, setFilterType] = useState<"all" | "text" | "youtube" | "series">("all");
  const [expandedSeries, setExpandedSeries] = useState<Record<string, boolean>>({});

  useEffect(() => {
    fetch("/api/story-shadowing")
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data)) {
          setHistory(data);
        }
      })
      .catch((err) => console.error("Failed to load history", err))
      .finally(() => setLoading(false));
  }, []);

  const toggleSeriesExpand = (seriesId: string) => {
    setExpandedSeries((prev) => ({ ...prev, [seriesId]: !prev[seriesId] }));
  };

  // Group stories by seriesId
  const groupedItems: Array<
    | { type: "single"; story: StoryHistory }
    | { type: "series"; seriesId: string; title: string; stories: StoryHistory[] }
  > = [];
  const seriesMap: Record<string, StoryHistory[]> = {};

  history.forEach((story) => {
    if (story.seriesId) {
      if (!seriesMap[story.seriesId]) {
        seriesMap[story.seriesId] = [];
      }
      seriesMap[story.seriesId].push(story);
    }
  });

  const processedSeriesIds = new Set<string>();

  history.forEach((story) => {
    if (!story.seriesId) {
      groupedItems.push({ type: "single", story });
    } else if (!processedSeriesIds.has(story.seriesId)) {
      processedSeriesIds.add(story.seriesId);
      const stories = seriesMap[story.seriesId].sort(
        (a, b) => (a.partIndex ?? 0) - (b.partIndex ?? 0)
      );
      const seriesTitle =
        stories[0]?.title.split(" - Part")[0].split(" - Phần")[0] ||
        stories[0]?.title ||
        "Series Video";
      groupedItems.push({
        type: "series",
        seriesId: story.seriesId,
        title: seriesTitle,
        stories,
      });
    }
  });

  // Filter items based on search and type filter
  const filteredItems = groupedItems.filter((item) => {
    const title = item.type === "single" ? item.story.title : item.title;
    const matchesSearch = title.toLowerCase().includes(searchQuery.toLowerCase());

    if (!matchesSearch) return false;

    if (filterType === "all") return true;
    if (filterType === "series") return item.type === "series";
    if (filterType === "youtube") {
      return (
        (item.type === "single" && item.story.sourceType === "youtube") ||
        item.type === "series"
      );
    }
    if (filterType === "text") {
      return item.type === "single" && item.story.sourceType === "text";
    }
    return true;
  });

  return (
    <div className="p-4 space-y-4">
      {/* Header with Title + CTA Button */}
      <div className="flex items-center justify-between pt-1">
        <div>
          <h1 className="text-xl font-black text-slate-900 dark:text-white tracking-tight">
            Story Shadowing
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            {history.length} bài luyện tập đã lưu
          </p>
        </div>

        <Link
          href="/apps/story-shadowing/create"
          className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-[#FFBA49] hover:bg-[#e6a640] text-slate-900 font-bold text-xs rounded-xl shadow-xs transition-colors"
        >
          <Plus className="w-4 h-4" /> Tạo mới
        </Link>
      </div>

      {/* Search Bar */}
      <div className="relative">
        <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
        <input
          type="text"
          placeholder="Tìm bài học theo tiêu đề..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full pl-10 pr-4 py-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl text-xs text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-400 shadow-2xs"
        />
      </div>

      {/* Filter Chips */}
      <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
        {(
          [
            { id: "all", label: "Tất cả" },
            { id: "text", label: "Văn bản" },
            { id: "youtube", label: "YouTube" },
            { id: "series", label: "Series" },
          ] as const
        ).map((tab) => (
          <button
            key={tab.id}
            onClick={() => setFilterType(tab.id)}
            className={`px-3 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition-colors ${
              filterType === tab.id
                ? "bg-slate-900 text-white dark:bg-amber-400 dark:text-slate-900"
                : "bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* List content */}
      {loading ? (
        <div className="text-center text-slate-400 py-16 text-xs">Đang tải danh sách...</div>
      ) : filteredItems.length === 0 ? (
        <div className="text-center text-slate-500 py-16 bg-white dark:bg-slate-800 rounded-3xl border border-dashed border-slate-200 dark:border-slate-700 p-6 space-y-2">
          <p className="text-sm font-bold">Không tìm thấy bài luyện tập nào</p>
          <p className="text-xs text-slate-400">Bấm nút Tạo mới bên trên để tạo bài học đầu tiên.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredItems.map((item) => {
            if (item.type === "single") {
              const story = item.story;
              const levelBadge =
                story.level === "easy"
                  ? "bg-emerald-50 text-emerald-600 border-emerald-200"
                  : story.level === "hard"
                  ? "bg-rose-50 text-rose-600 border-rose-200"
                  : "bg-amber-50 text-amber-700 border-amber-200";

              return (
                <Link
                  key={story._id}
                  href={`/apps/story-shadowing/player/${story._id}`}
                  className="flex gap-3 bg-white dark:bg-slate-800/90 border border-slate-200/80 dark:border-slate-700 rounded-2xl p-3 shadow-2xs hover:border-amber-400 transition-all group overflow-hidden"
                >
                  <div className="w-20 h-20 rounded-xl bg-slate-100 dark:bg-slate-700 relative shrink-0 overflow-hidden">
                    {story.thumbnail ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={story.thumbnail} alt={story.title} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full bg-amber-50 dark:bg-amber-950 flex items-center justify-center text-amber-500">
                        {story.sourceType === "youtube" ? <Youtube className="w-6 h-6" /> : <BookOpen className="w-6 h-6" />}
                      </div>
                    )}
                  </div>

                  <div className="flex-1 min-w-0 flex flex-col justify-between py-0.5">
                    <div>
                      <div className="flex items-center gap-1.5 mb-1">
                        {story.level && (
                          <span className={`text-[9px] font-extrabold uppercase px-1.5 py-0.2 rounded border ${levelBadge}`}>
                            {story.level}
                          </span>
                        )}
                        <span className="text-[10px] text-slate-400">
                          {new Date(story.createdAt).toLocaleDateString("vi-VN")}
                        </span>
                      </div>
                      <h3 className="font-bold text-xs text-slate-900 dark:text-white line-clamp-1 group-hover:text-amber-500 transition-colors">
                        {story.title}
                      </h3>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 line-clamp-1 mt-0.5">
                        {story.originalText}
                      </p>
                    </div>

                    <div className="flex items-center justify-between text-[10px] text-slate-400 font-medium mt-1">
                      <span>⏱️ ~{Math.max(1, Math.ceil((story.originalText?.split(/\s+/).length || 0) / 20))} phút</span>
                      <span className="text-amber-500 font-bold group-hover:translate-x-0.5 transition-transform">
                        Luyện →
                      </span>
                    </div>
                  </div>
                </Link>
              );
            }

            // Series Item
            const isExpanded = expandedSeries[item.seriesId];
            const firstStory = item.stories[0];

            return (
              <div
                key={item.seriesId}
                className="bg-white dark:bg-slate-800/90 border border-slate-200/80 dark:border-slate-700 rounded-2xl p-3 shadow-2xs transition-all overflow-hidden space-y-3"
              >
                <div className="flex gap-3">
                  <div className="w-20 h-20 rounded-xl bg-slate-100 dark:bg-slate-700 relative shrink-0 overflow-hidden">
                    {firstStory.thumbnail ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={firstStory.thumbnail} alt={item.title} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full bg-indigo-50 dark:bg-indigo-950 flex items-center justify-center text-indigo-500">
                        <Layers className="w-6 h-6" />
                      </div>
                    )}
                  </div>

                  <div className="flex-1 min-w-0 flex flex-col justify-between py-0.5">
                    <div>
                      <div className="inline-flex items-center gap-1 px-1.5 py-0.2 rounded bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 text-[9px] font-bold border border-indigo-200 dark:border-indigo-800 mb-1">
                        📚 Series • {item.stories.length} phần
                      </div>
                      <h3 className="font-bold text-xs text-slate-900 dark:text-white line-clamp-1">
                        {item.title}
                      </h3>
                    </div>

                    <div className="flex items-center gap-2 mt-2">
                      <Link
                        href={`/apps/story-shadowing/player/${firstStory._id}`}
                        className="inline-flex items-center gap-1 px-2.5 py-1 bg-amber-400 hover:bg-amber-500 text-slate-900 font-bold text-[10px] rounded-lg shadow-2xs transition-colors"
                      >
                        <Play className="w-2.5 h-2.5 fill-slate-900" /> Phần 1
                      </Link>
                      <button
                        onClick={() => toggleSeriesExpand(item.seriesId)}
                        className="inline-flex items-center gap-1 px-2.5 py-1 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 text-slate-700 dark:text-slate-200 text-[10px] font-semibold rounded-lg transition-colors"
                      >
                        {isExpanded ? (
                          <>Thu gọn <ChevronUp className="w-3 h-3" /></>
                        ) : (
                          <>{item.stories.length} phần <ChevronDown className="w-3 h-3" /></>
                        )}
                      </button>
                    </div>
                  </div>
                </div>

                {isExpanded && (
                  <div className="pt-2 border-t border-slate-100 dark:border-slate-700 space-y-1.5">
                    {item.stories.map((st, idx) => (
                      <Link
                        key={st._id}
                        href={`/apps/story-shadowing/player/${st._id}`}
                        className="p-2 rounded-xl bg-slate-50 dark:bg-slate-750 hover:bg-amber-50 dark:hover:bg-slate-700 flex items-center justify-between text-xs transition-colors group"
                      >
                        <span className="font-semibold text-slate-700 dark:text-slate-300 group-hover:text-amber-600 line-clamp-1">
                          Phần {idx + 1}: {st.partTitle || st.title}
                        </span>
                        <Play className="w-3 h-3 text-slate-400 group-hover:text-amber-500 shrink-0 ml-2" />
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
```

---

### Task 6: PWA Manifest & Service Worker Setup

**Files:**
- Create: `src/app/manifest.ts`
- Create: `public/sw.js`
- Create: `src/components/mobile-shell/pwa-register.tsx`
- Modify: `src/app/layout.tsx`

- [ ] **Step 1: Tạo `src/app/manifest.ts`**

```typescript
import { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "AHA-MIND — AI Learning Tools",
    short_name: "AHA-MIND",
    description: "Ứng dụng AI thông minh hỗ trợ luyện phát âm tiếng Anh (Story Shadowing) và các tiện ích vi mô.",
    start_url: "/",
    display: "standalone",
    background_color: "#0f172a",
    theme_color: "#FFBA49",
    orientation: "portrait",
    icons: [
      {
        src: "/icon.svg",
        sizes: "any",
        type: "image/svg+xml",
      },
    ],
  };
}
```

- [ ] **Step 2: Tạo `public/sw.js`**

```javascript
// Service Worker cơ bản cho AHA-MIND PWA
const CACHE_NAME = "aha-mind-cache-v1";
const STATIC_ASSETS = [
  "/",
  "/favicon.ico",
  "/icon.svg",
  "/manifest.webmanifest",
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(STATIC_ASSETS);
    })
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME) {
            return caches.delete(key);
          }
        })
      );
    })
  );
  self.clients.claim();
});

self.addEventListener("fetch", (event) => {
  // Chỉ cache static requests (GET), không cache API POST/SSE
  if (event.request.method !== "GET") return;

  const url = new URL(event.request.url);

  // Bỏ qua các API route
  if (url.pathname.startsWith("/api/")) return;

  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      if (cachedResponse) {
        return cachedResponse;
      }
      return fetch(event.request).catch(() => {
        // Fallback if offline
        return caches.match("/");
      });
    })
  );
});
```

- [ ] **Step 3: Tạo component `src/components/mobile-shell/pwa-register.tsx`**

```tsx
"use client";

import { useEffect } from "react";

export function PWARegister() {
  useEffect(() => {
    if (typeof window !== "undefined" && "serviceWorker" in navigator && process.env.NODE_ENV === "production") {
      navigator.serviceWorker
        .register("/sw.js")
        .then((reg) => console.log("Service Worker registered:", reg.scope))
        .catch((err) => console.error("Service Worker registration failed:", err));
    }
  }, []);

  return null;
}
```

- [ ] **Step 4: Tích hợp `PWARegister` vào `src/app/layout.tsx`**

Thêm `<PWARegister />` vào `src/app/layout.tsx`.

---

### Task 7: Build Verification & Final Polish

**Files:**
- Verify: Tất cả components và routes

- [ ] **Step 1: Chạy build để kiểm tra TypeScript và build tĩnh**

Run: `pnpm build`
Expected: Build thành công không có lỗi type hoặc missing imports.

- [ ] **Step 2: Kiểm tra test các routes chính**
- `/` -> Smart Dashboard
- `/apps/story-shadowing` -> 1-column History List
- `/vocab` -> Vocab placeholder
- `/profile` -> Settings page
- `/apps/story-shadowing/create` -> Tạo bài mới
- `/apps/story-shadowing/player/[id]` -> Player hoạt động kèm bottom tab bar

- [ ] **Step 3: Commit các thay đổi**

```bash
git add .
git commit -m "feat(pwa): implement mobile-first app shell, smart dashboard and pwa configuration"
```

---

*Made by Anh Tu - Share to be share*
