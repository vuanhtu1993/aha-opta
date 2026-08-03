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

  // Ẩn tab bar ở các trang chi tiết/player để nhường không gian cho thanh điều khiển
  const isHidden = pathname.startsWith("/apps/story-shadowing/player");
  if (isHidden) return null;

  return (
    <nav
      aria-label="Bottom Navigation"
      className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-[480px] z-50 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-t border-slate-200 dark:border-slate-800 px-4 py-2 pb-safe shadow-lg"
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
