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
