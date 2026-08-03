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
