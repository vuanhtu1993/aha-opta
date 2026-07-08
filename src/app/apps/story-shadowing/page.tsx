"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

type StoryHistory = {
  _id: string;
  title: string;
  originalText: string;
  createdAt: string;
};

export default function StorybookPage() {
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [history, setHistory] = useState<StoryHistory[]>([]);
  const router = useRouter();

  // Load danh sách lịch sử khi mount
  useEffect(() => {
    fetch("/api/story-shadowing")
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) {
          setHistory(data);
        }
      })
      .catch(err => console.error("Failed to load history", err));
  }, []);

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

      const data = await res.json();
      // Chuyển hướng sang player với ID vừa lưu
      router.push(`/apps/story-shadowing/player/${data.id}`);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-12 py-12">
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-bold text-slate-900">📖 AI Storybook Shadowing</h1>
        <p className="text-slate-500">Nhập đoạn văn tiếng Anh, AI sẽ sinh Audio để bạn luyện đọc theo.</p>
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

      {history.length > 0 && (
        <div className="space-y-4 pt-8 border-t border-slate-200">
          <h2 className="text-xl font-semibold text-slate-800">📚 Các bài luyện tập gần đây</h2>
          <div className="grid gap-3">
            {history.map((story) => (
              <Link 
                key={story._id}
                href={`/apps/story-shadowing/player/${story._id}`}
                className="block p-4 bg-white border border-slate-100 shadow-sm rounded-xl hover:border-indigo-300 hover:shadow-md transition-all group"
              >
                <div className="flex justify-between items-start mb-2">
                  <h3 className="font-medium text-slate-900 group-hover:text-indigo-600 transition-colors">
                    {story.title}
                  </h3>
                  <span className="text-xs text-slate-400">
                    {new Date(story.createdAt).toLocaleDateString('vi-VN')}
                  </span>
                </div>
                <p className="text-sm text-slate-500 line-clamp-1">
                  {story.originalText}
                </p>
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
