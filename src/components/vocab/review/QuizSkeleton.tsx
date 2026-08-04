export function QuizSkeleton() {
  return (
    <div className="min-h-screen flex flex-col justify-between p-4 max-w-[480px] mx-auto pb-10 animate-pulse">
      {/* Top Header Bar Skeleton */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="w-8 h-8 rounded-full bg-slate-200 dark:bg-slate-800" />
          <div className="w-24 h-6 rounded-full bg-amber-100 dark:bg-amber-950/40" />
          <div className="w-12 h-4 rounded bg-slate-200 dark:bg-slate-800" />
        </div>

        {/* Progress Bar Skeleton */}
        <div className="w-full h-1.5 bg-slate-200 dark:bg-slate-800 rounded-full" />
      </div>

      {/* Main Question Card Area Skeleton */}
      <div className="space-y-5 my-auto py-4">
        {/* Word Prompt Box Skeleton */}
        <div className="bg-white dark:bg-slate-800 rounded-3xl p-6 border border-slate-200/80 dark:border-slate-700 shadow-sm flex flex-col items-center space-y-3">
          <div className="w-40 h-8 rounded-xl bg-slate-200 dark:bg-slate-700" />
          <div className="w-24 h-4 rounded-md bg-slate-100 dark:bg-slate-750" />
          <div className="w-12 h-5 rounded-md bg-amber-50 dark:bg-amber-950/40" />
        </div>

        {/* 4 English Answer Choices Skeletons */}
        <div className="space-y-2.5">
          {[1, 2, 3, 4].map((i) => (
            <div
              key={i}
              className="w-full p-4 rounded-2xl border border-slate-200/80 dark:border-slate-700 bg-white dark:bg-slate-800 flex items-center gap-3 shadow-2xs"
            >
              <div className="w-5 h-5 rounded-full bg-slate-200 dark:bg-slate-700 shrink-0" />
              <div className="flex-1 space-y-1.5">
                <div className="w-3/4 h-3.5 rounded bg-slate-200 dark:bg-slate-700" />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Bottom Button Skeleton */}
      <div className="pt-4">
        <div className="w-full h-14 bg-slate-200 dark:bg-slate-800 rounded-2xl" />
      </div>
    </div>
  );
}
