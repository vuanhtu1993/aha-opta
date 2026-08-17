import * as dotenv from "dotenv";
import path from "path";

// Load environment variables BEFORE importing services that initialize Gemini
dotenv.config({ path: path.resolve(process.cwd(), ".env.local") });
dotenv.config({ path: path.resolve(process.cwd(), ".env") });

import mongoose from "mongoose";
import { connectDB } from "../src/lib/db/mongoose";
import VocabCard from "../src/lib/db/models/VocabCard";

async function main() {
  console.log("🚀 Starting Vocab Example Sentences Backfill Script...");
  await connectDB();

  // Dynamically import cloze-enricher after env variables are loaded
  const { generateExampleSentences } = await import("../src/lib/vocab/cloze-enricher");

  // Find cards missing exampleSentences or empty array
  const targetCards = await VocabCard.find({
    $or: [
      { exampleSentences: { $exists: false } },
      { exampleSentences: { $size: 0 } },
    ],
  });

  console.log(`Found ${targetCards.length} vocab cards needing example sentences.`);

  let count = 0;
  for (const card of targetCards) {
    count++;
    console.log(`[${count}/${targetCards.length}] Processing word: "${card.word}"...`);

    const sentences = await generateExampleSentences(
      card.word,
      card.explanation,
      card.level || "B1"
    );

    if (sentences.length > 0) {
      await VocabCard.findByIdAndUpdate(card._id, {
        $set: { exampleSentences: sentences },
      });
      console.log(`  └─ Success: Generated ${sentences.length} sentences.`);
    } else {
      console.log(`  └─ Skipped/Failed to generate sentences.`);
    }

    // Rate-limiting delay to avoid hitting Gemini quota
    await new Promise((r) => setTimeout(r, 200));
  }

  console.log("✅ Backfill completed successfully!");
  await mongoose.disconnect();
  process.exit(0);
}

main().catch((err) => {
  console.error("❌ Fatal Error in backfill script:", err);
  process.exit(1);
});
