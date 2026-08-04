import { Suspense } from "react";
import { getReviewSessionQuestions } from "@/lib/srs/review-session.service";
import { QuizPlayer } from "@/components/vocab/review/QuizPlayer";
import { QuizSkeleton } from "@/components/vocab/review/QuizSkeleton";

export interface VocabReviewPageProps {
  searchParams: Promise<{
    practice_all?: string;
  }>;
}

/**
 * Async Loader Component: Connects to MongoDB and generates 15 quiz questions with distractors.
 * Wrapped in a Suspense boundary to enable Instant Streaming (0ms TTFB).
 */
async function ReviewSessionLoader({ practiceAll }: { practiceAll: boolean }) {
  const sessionData = await getReviewSessionQuestions({
    limit: 15,
    practiceAll,
  });

  return <QuizPlayer initialQuestions={sessionData.questions} />;
}

/**
 * Server Component Page: Renders immediate Suspense fallback (QuizSkeleton)
 * while the async ReviewSessionLoader fetches data and streams in.
 */
export default async function VocabReviewPage({ searchParams }: VocabReviewPageProps) {
  const params = await searchParams;
  const practiceAll = params?.practice_all === "true";

  return (
    <Suspense fallback={<QuizSkeleton />}>
      <ReviewSessionLoader practiceAll={practiceAll} />
    </Suspense>
  );
}
