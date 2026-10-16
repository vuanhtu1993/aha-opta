"use client";

import React from "react";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

interface AppShellProps {
  children: React.ReactNode;
}

export function AppShell({ children }: AppShellProps) {
  const pathname = usePathname();
  const isFullScreen =
    pathname.startsWith("/apps/fun-feed") ||
    pathname.startsWith("/apps/story-shadowing/player");

  return (
    <div className="min-h-screen w-full bg-slate-200/60 dark:bg-slate-950 flex justify-center selection:bg-amber-400 selection:text-slate-900">
      <div className="w-full max-w-[480px] min-h-screen bg-slate-50 dark:bg-slate-900 border-x border-slate-200/80 dark:border-slate-800 flex flex-col relative app-shell-shadow">
        <main className={cn("flex-1 overflow-x-hidden", isFullScreen ? "pb-0" : "pb-24")}>
          {children}
        </main>
      </div>
    </div>
  );
}
