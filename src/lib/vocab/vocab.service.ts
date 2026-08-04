import { connectDB } from "@/lib/db/mongoose";
import VocabCard from "@/lib/db/models/VocabCard";
import { VocabCardData } from "@/components/vocab/VocabCardItem";

/**
 * Lấy danh sách thẻ từ vựng ban đầu để gieo mầm (Seed) vào Client Component.
 * Thứ tự mặc định: Thẻ đến hạn ôn gần nhất (fsrs.due: 1).
 */
export async function getInitialVocabCards(limit = 50): Promise<{ cards: VocabCardData[]; totalCount: number }> {
  await connectDB();

  const [rawCards, totalCount] = await Promise.all([
    VocabCard.find({}).sort({ "fsrs.due": 1 }).limit(limit).lean(),
    VocabCard.countDocuments({}),
  ]);

  const cards: VocabCardData[] = rawCards.map((c: any) => ({
    _id: c._id.toString(),
    word: c.word,
    ipa: c.ipa,
    explanation: c.explanation,
    level: c.level,
    wordFamily: c.wordFamily,
    collocations: c.collocations,
    sourceStorybookTitle: c.sourceStorybookTitle,
    fsrs: {
      due: c.fsrs?.due ? new Date(c.fsrs.due).toISOString() : undefined,
      stability: c.fsrs?.stability,
      reps: c.fsrs?.reps,
      state: c.fsrs?.state,
    },
  }));

  return { cards, totalCount };
}
