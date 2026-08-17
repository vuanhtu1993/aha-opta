import * as dotenv from "dotenv";
import path from "path";

dotenv.config({ path: path.resolve(process.cwd(), ".env.local") });
dotenv.config({ path: path.resolve(process.cwd(), ".env") });

import mongoose from "mongoose";
import { connectDB } from "../src/lib/db/mongoose";
import VocabCard from "../src/lib/db/models/VocabCard";

async function main() {
  console.log("🚀 Starting Batch Vocab Example Sentences Backfill Script...");
  await connectDB();

  const { generateBatchExampleSentences } = await import(
    "../src/lib/vocab/cloze-enricher"
  );

  const targetCards = await VocabCard.find({
    $or: [
      { exampleSentences: { $exists: false } },
      { exampleSentences: { $size: 0 } },
    ],
  }).lean();

  console.log(`Found ${targetCards.length} vocab cards needing example sentences.`);
  if (targetCards.length === 0) {
    console.log("✅ All cards already have example sentences!");
    await mongoose.disconnect();
    process.exit(0);
  }

  const BATCH_SIZE = 15;
  let successCount = 0;
  const totalBatches = Math.ceil(targetCards.length / BATCH_SIZE);

  for (let b = 0; b < totalBatches; b++) {
    const chunk = targetCards.slice(b * BATCH_SIZE, (b + 1) * BATCH_SIZE);
    console.log(
      `\n📦 Processing Batch [${b + 1}/${totalBatches}] (${chunk.length} words: ${chunk.map((c: any) => c.word).join(", ")})...`
    );

    const items = chunk.map((c: any) => ({
      id: c._id.toString(),
      word: c.word,
      explanation: c.explanation,
      level: c.level || "B1",
    }));

    const resultMap = await generateBatchExampleSentences(items);

    for (const card of chunk) {
      const sentences = resultMap.get(card.word.toLowerCase());
      if (sentences && sentences.length > 0) {
        await VocabCard.findByIdAndUpdate(card._id, {
          $set: { exampleSentences: sentences },
        });
        successCount++;
        console.log(`  └─ ✅ "${card.word}": ${sentences.length} sentences generated.`);
      } else {
        console.log(`  └─ ⚠️ "${card.word}": Failed to match sentences in batch response.`);
      }
    }

    // Small delay between batches to respect rate limits safely
    await new Promise((r) => setTimeout(r, 500));
  }

  console.log(`\n🎉 Backfill completed! Enriched ${successCount}/${targetCards.length} cards.`);
  await mongoose.disconnect();
  process.exit(0);
}

main().catch((err) => {
  console.error("❌ Fatal Error in backfill script:", err);
  process.exit(1);
});
