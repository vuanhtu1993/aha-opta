import mongoose from "mongoose";
import dotenv from "dotenv";
import Storybook from "./src/lib/db/models/Storybook";

dotenv.config({ path: ".env.local" });

async function run() {
  await mongoose.connect(process.env.MONGODB_URI as string);
  
  // Try creating a dummy record with words
  const dummy = new Storybook({
    title: "Test IPA",
    originalText: "Hello world",
    level: "easy",
    voice: "en-US-Journey-F",
    speakingRate: 1.0,
    sentences: [
      {
        id: 0,
        text: "Hello world",
        audioBase64: "dummy",
        words: [
          { word: "Hello", ipa: "/həˈləʊ/" }
        ]
      }
    ]
  });
  
  await dummy.save();
  const saved = await Storybook.findById(dummy._id).lean();
  console.log("Saved words:", JSON.stringify(saved.sentences[0].words));
  
  await Storybook.findByIdAndDelete(dummy._id);
  mongoose.disconnect();
}
run().catch(console.error);
