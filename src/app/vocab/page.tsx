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
        <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
          Hệ thống sẽ tự động tổng hợp toàn bộ từ vựng, collocation và word family bạn đã học từ các bài Shadowing thành bộ thẻ Flashcard thông minh.
        </p>
      </div>

      <div className="pt-4">
        <Link
          href="/apps/story-shadowing"
          className="inline-flex items-center gap-2 px-6 py-3 bg-[#FFBA49] hover:bg-[#e6a640] text-slate-900 font-bold text-xs rounded-2xl transition-colors shadow-sm"
        >
          Luyện tập Story Shadowing <ArrowRight className="w-4 h-4" />
        </Link>
      </div>

      <div className="text-xs text-slate-400 dark:text-slate-500 pt-8 font-medium">
        Made by Anh Tu - Share to be share
      </div>
    </div>
  );
}
