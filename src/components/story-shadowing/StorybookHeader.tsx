import Link from "next/link";
import { Plus } from "lucide-react";

interface StorybookHeaderProps {
  storyCount?: number;
}

/**
 * Server Component: Static Shell Header for Story Shadowing
 * Renders instantly (0ms TTFB) with Title and "+ Tạo mới" action button.
 */
export function StorybookHeader({ storyCount }: StorybookHeaderProps) {
  return (
    <div className="flex items-center justify-between pt-1">
      <div>
        <h1 className="text-xl font-black text-slate-900 dark:text-white tracking-tight">
          Story Shadowing
        </h1>
        <p className="text-xs text-slate-500 dark:text-slate-400">
          {storyCount !== undefined ? `${storyCount} bài luyện tập đã lưu` : "Luyện nói & phản xạ tiếng Anh"}
        </p>
      </div>

      <Link
        href="/apps/story-shadowing/create"
        className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-[#FFBA49] hover:bg-[#e6a640] text-slate-900 font-bold text-xs rounded-xl shadow-xs transition-colors active:scale-98"
      >
        <Plus className="w-4 h-4" /> Tạo mới
      </Link>
    </div>
  );
}
