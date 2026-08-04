/**
 * Shimmer Loading Skeleton for Story Shadowing List
 * Prevents layout shift (CLS = 0) and renders instantly during Streaming Suspense.
 */
export function StoryListSkeleton() {
  return (
    <div className="space-y-4 animate-pulse">
      {/* Search Bar Skeleton */}
      <div className="w-full h-10 bg-slate-200 dark:bg-slate-800 rounded-2xl" />

      {/* Filter Tabs Skeleton */}
      <div className="flex gap-2 overflow-x-auto pb-1">
        {[1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className="w-16 h-7 rounded-full bg-slate-200 dark:bg-slate-800 shrink-0"
          />
        ))}
      </div>

      {/* Cards List Skeleton */}
      <div className="space-y-3">
        {[1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className="flex gap-3 bg-white dark:bg-slate-800/90 border border-slate-200/80 dark:border-slate-700 rounded-2xl p-3 shadow-2xs"
          >
            {/* Thumbnail Shimmer */}
            <div className="w-20 h-20 rounded-xl bg-slate-200 dark:bg-slate-700 shrink-0" />

            {/* Content Shimmer */}
            <div className="flex-1 min-w-0 flex flex-col justify-between py-1 space-y-2">
              <div className="space-y-1.5">
                <div className="w-16 h-3 bg-slate-200 dark:bg-slate-700 rounded" />
                <div className="w-3/4 h-4 bg-slate-200 dark:bg-slate-700 rounded" />
                <div className="w-full h-3 bg-slate-100 dark:bg-slate-750 rounded" />
              </div>
              <div className="flex justify-between">
                <div className="w-14 h-2.5 bg-slate-100 dark:bg-slate-750 rounded" />
                <div className="w-10 h-2.5 bg-amber-100 dark:bg-amber-950/40 rounded" />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
