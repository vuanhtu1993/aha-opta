"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, BookOpen, GraduationCap, Settings } from "lucide-react";
import useSWR from "swr";
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

const fetcher = (url: string) => fetch(url).then((res) => res.json());

export function MobileTabBar() {
  const pathname = usePathname();

  // Fetch due count for Vocab tab badge
  const { data: dueData } = useSWR("/api/vocab/due-count", fetcher, {
    revalidateOnFocus: false,
    revalidateOnReconnect: false,
    dedupingInterval: 60000,
  });

  const dueCount = dueData?.dueCount ?? 0;

  // Ẩn tab bar ở các trang tạo/chi tiết/player/quiz review để nhường toàn bộ không gian
  const isHidden =
    pathname.startsWith("/apps/story-shadowing/player") ||
    pathname.startsWith("/apps/story-shadowing/create") ||
    pathname.startsWith("/vocab/review");
  if (isHidden) return null;

  return (
    <nav
      aria-label="Bottom Navigation"
      className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-[480px] z-50 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-t border-slate-200 dark:border-slate-800 px-4 pt-2 pb-[max(0.5rem,calc(env(safe-area-inset-bottom,0px)+0.25rem))] shadow-lg"
    >
      <div className="flex items-center justify-around">
        {TABS.map((tab) => {
          const isActive = tab.exactMatch
            ? pathname === tab.href
            : pathname.startsWith(tab.href);
          const Icon = tab.icon;
          const isVocabTab = tab.href === "/vocab";

          return (
            <Link
              key={tab.href}
              href={tab.href}
              className={cn(
                "relative flex flex-col items-center justify-center py-1 px-3 rounded-xl transition-all duration-200 gap-1",
                isActive
                  ? "text-amber-500 font-bold dark:text-amber-400"
                  : "text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200"
              )}
            >
              <div
                className={cn(
                  "relative p-1 rounded-lg transition-transform",
                  isActive ? "scale-110 bg-amber-50 dark:bg-amber-950/40" : ""
                )}
              >
                <Icon
                  className={cn(
                    "w-6 h-6",
                    isActive ? "stroke-[2.5]" : "stroke-[1.75]"
                  )}
                />

                {/* Badge indicator on Vocab tab */}
                {isVocabTab && dueCount > 0 && (
                  <span className="absolute -top-1 -right-1.5 flex items-center justify-center min-w-[16px] h-4 px-1 rounded-full bg-rose-500 text-white text-[9px] font-extrabold shadow-xs">
                    {dueCount > 99 ? "99+" : dueCount}
                  </span>
                )}
              </div>
              <span className="text-[11px] leading-none tracking-tight">
                {tab.label}
              </span>
            </Link>
          );
        })}
      </div>

      {/* Footer copyright */}
      <div className="pt-1.5 text-center text-[10px] tracking-wider text-slate-400 dark:text-slate-500 font-medium select-none">
        Made by Anh Tu - Share to be share
      </div>
    </nav>
  );
}
