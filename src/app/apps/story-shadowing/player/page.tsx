"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ShadowingPlayer } from "@/components/story-shadowing/shadowing-player";
import { SentenceSchema } from "@/lib/schemas/story-shadowing.schema";
import { z } from "zod";

export default function PlayerPage() {
  const router = useRouter();
  const [sentences, setSentences] = useState<z.infer<typeof SentenceSchema>[]>([]);

  useEffect(() => {
    const stored = sessionStorage.getItem("story_shadowing_sentences");
    if (!stored) {
      router.replace("/apps/story-shadowing");
      return;
    }
    try {
      setSentences(JSON.parse(stored));
    } catch {
      router.replace("/apps/story-shadowing");
    }
  }, [router]);

  if (!sentences.length) return null;

  return (
    <div className="max-w-2xl mx-auto space-y-6 py-8">
      <div className="flex items-center gap-4">
        <button
          onClick={() => router.push("/apps/story-shadowing")}
          className="text-sm text-slate-400 hover:text-slate-700 transition-colors"
        >
          ← Bài mới
        </button>
        <h1 className="text-xl font-bold text-slate-800">Luyện Shadowing</h1>
      </div>

      <ShadowingPlayer sentences={sentences} />
    </div>
  );
}
