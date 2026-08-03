import {
  fsrs,
  generatorParameters,
  Rating,
  Grade,
  State,
  createEmptyCard,
  Card as FSRSCard,
  RecordLogItem,
} from "ts-fsrs";

/**
 * FSRS Scheduler Instance with optimal parameters for foreign language vocabulary
 * - enable_short_term: false -> Day-based Spaced Repetition (Daily Quiz model)
 * - request_retention: 0.9 -> 90% retrieval probability
 */
export const srsScheduler = fsrs(
  generatorParameters({
    request_retention: 0.9, // Target 90% retrieval probability
    maximum_interval: 365, // Max interval 1 year
    enable_fuzz: true, // Prevent review bunching
    enable_short_term: false, // Day-based Spaced Repetition (Next review is tomorrow or +N days)
  })
);

export { Rating, State };
export type { FSRSCard, RecordLogItem, Grade };

/**
 * Interface representing the FSRS state stored in MongoDB
 */
export interface IFSRSCardState {
  due: Date;
  stability: number;
  difficulty: number;
  elapsed_days: number;
  scheduled_days: number;
  reps: number;
  lapses: number;
  state: State;
  last_review?: Date;
  learning_steps?: number;
}

/**
 * Creates initial FSRS state for newly saved vocabulary
 */
export function createInitialFSRSState(now: Date = new Date()): IFSRSCardState {
  const empty = createEmptyCard(now);
  return {
    due: empty.due,
    stability: empty.stability,
    difficulty: empty.difficulty,
    elapsed_days: empty.elapsed_days,
    scheduled_days: empty.scheduled_days,
    reps: empty.reps,
    lapses: empty.lapses,
    state: empty.state,
    last_review: empty.last_review,
    learning_steps: (empty as any).learning_steps,
  };
}

/**
 * Maps Quiz result and retrieval latency (response time) to FSRS Grade (Rating)
 *
 * Rules:
 * - Incorrect -> Rating.Again (1)
 * - Correct & responseTime > 10s (hesitation) -> Rating.Hard (2)
 * - Correct & responseTime 3s-10s (normal) -> Rating.Good (3)
 * - Correct & responseTime < 3s (instant recall) -> Rating.Easy (4)
 */
export function calculateFSRSRating(
  isCorrect: boolean,
  responseTimeMs: number
): Grade {
  if (!isCorrect) {
    return Rating.Again;
  }

  if (responseTimeMs < 3000) {
    return Rating.Easy;
  } else if (responseTimeMs <= 10000) {
    return Rating.Good;
  } else {
    return Rating.Hard;
  }
}

/**
 * Schedules the next review using FSRS algorithm
 */
export function scheduleNextReview(
  currentState: IFSRSCardState,
  rating: Grade,
  reviewDate: Date = new Date()
) {
  // Convert DB state back into FSRSCard format
  const empty = createEmptyCard(new Date(currentState.due));
  const card: FSRSCard = {
    ...empty,
    due: new Date(currentState.due),
    stability: currentState.stability,
    difficulty: currentState.difficulty,
    elapsed_days: currentState.elapsed_days,
    scheduled_days: currentState.scheduled_days,
    reps: currentState.reps,
    lapses: currentState.lapses,
    state: currentState.state,
    last_review: currentState.last_review
      ? new Date(currentState.last_review)
      : undefined,
  };

  if (currentState.learning_steps !== undefined) {
    (card as any).learning_steps = currentState.learning_steps;
  }

  // ts-fsrs next calculates updated card + review log
  const result = srsScheduler.next(card, reviewDate, rating);

  const updatedState: IFSRSCardState = {
    due: result.card.due,
    stability: result.card.stability,
    difficulty: result.card.difficulty,
    elapsed_days: result.card.elapsed_days,
    scheduled_days: result.card.scheduled_days,
    reps: result.card.reps,
    lapses: result.card.lapses,
    state: result.card.state,
    last_review: result.card.last_review,
    learning_steps: (result.card as any).learning_steps,
  };

  return {
    updatedState,
    log: result.log,
    rating,
  };
}
