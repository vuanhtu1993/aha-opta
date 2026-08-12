import { Suspense } from "react";
import { getStoryList } from "@/lib/story-shadowing/story-shadowing.service";
import { StorybookHeader } from "@/components/story-shadowing/StorybookHeader";
import { StoryListContainer } from "@/components/story-shadowing/StoryListContainer";
import { StoryListSkeleton } from "@/components/story-shadowing/StoryListSkeleton";

/**
 * Async Loader Component: Connects directly to MongoDB on Server and fetches 50 stories.
 * Wrapped in Suspense to enable Streaming SSR (0ms initial TTFB).
 */
export const revalidate = 3600 // invalidate every hour

async function StoryListLoader() {
  const stories = await getStoryList(50);
  return <StoryListContainer initialStories={stories} />;
}

/**
 * Server Component: Story Shadowing Main Page
 * Implements Component Composition: Static Shell Header + Dynamic Streaming Story List
 */
export default async function StorybookPage() {
  return (
    <div className="p-4 space-y-4 pb-20">
      {/* 1. Static Shell Header (0ms Fast First Paint) */}
      <StorybookHeader />

      {/* 2. Dynamic Hole: Streamed Stories List */}
      <Suspense fallback={<StoryListSkeleton />}>
        <StoryListLoader />
      </Suspense>
    </div>
  );
}
