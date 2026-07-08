"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import type { ProcessResponse } from "@/lib/schemas/story-shadowing.schema";

export default function StorybookPage() {
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/story-shadowing/process", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error ?? "Lỗi không xác định");
      }

      const data: ProcessResponse = await res.json();
      // Lưu vào sessionStorage để trang player đọc
      sessionStorage.setItem("story_shadowing_sentences", JSON.stringify(data.sentences));
      router.push("/apps/story-shadowing/player");
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-8 py-12">
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-bold text-slate-900">📖 AI Storybook Shadowing</h1>
        <p className="text-slate-500">Nhập đoạn văn tiếng Anh, AI sẽ đọc mẫu và bạn luyện đọc theo.</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Dán đoạn văn tiếng Anh vào đây... (10–2000 ký tự)"
          className="w-full h-48 p-4 border border-slate-200 rounded-xl resize-none focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-700"
          maxLength={2000}
        />
        <div className="flex justify-between text-xs text-slate-400">
          <span>{text.length} / 2000 ký tự</span>
        </div>

        {error && (
          <p className="text-red-600 text-sm bg-red-50 px-4 py-2 rounded-lg">{error}</p>
        )}

        <button
          type="submit"
          disabled={loading || text.length < 10}
          className="w-full py-3 px-6 bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {loading ? "⏳ Đang xử lý (5-15 giây)..." : "✨ Tạo bài luyện tập"}
        </button>
      </form>
    </div>
  );
}
