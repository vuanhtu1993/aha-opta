"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function CreatePlayerPage() {
  const [title, setTitle] = useState("");
  const [thumbnail, setThumbnail] = useState("");
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
        body: JSON.stringify({ text, title, thumbnail }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error ?? "Lỗi không xác định");
      }

      const data = await res.json();
      router.push(`/apps/story-shadowing/player/${data.id}`);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-8 py-12">
      <div className="flex items-center gap-4">
        <Link
          href="/apps/story-shadowing"
          className="text-sm text-slate-400 hover:text-slate-700 transition-colors"
        >
          ← Quay lại
        </Link>
        <h1 className="text-2xl font-bold text-slate-900">Tạo bài luyện tập mới</h1>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="space-y-2">
          <label className="block text-sm font-medium text-slate-700">Tiêu đề (Tùy chọn)</label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Ví dụ: Luyện đọc 10/10/2026"
            className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#FFBA49] text-slate-700"
          />
        </div>

        <div className="space-y-2">
          <label className="block text-sm font-medium text-slate-700">Ảnh bìa / Thumbnail URL (Tùy chọn)</label>
          <input
            type="url"
            value={thumbnail}
            onChange={(e) => setThumbnail(e.target.value)}
            placeholder="https://example.com/image.jpg"
            className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#FFBA49] text-slate-700"
          />
        </div>

        <div className="space-y-2">
          <label className="block text-sm font-medium text-slate-700">Đoạn văn tiếng Anh <span className="text-red-500">*</span></label>
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Dán đoạn văn tiếng Anh vào đây... (10–2000 ký tự)"
            className="w-full h-48 p-4 border border-slate-200 rounded-xl resize-none focus:outline-none focus:ring-2 focus:ring-[#FFBA49] text-slate-700"
            maxLength={2000}
            required
          />
          <div className="flex justify-between text-xs text-slate-400">
            <span>{text.length} / 2000 ký tự</span>
          </div>
        </div>

        {error && (
          <p className="text-red-600 text-sm bg-red-50 px-4 py-2 rounded-lg">{error}</p>
        )}

        <button
          type="submit"
          disabled={loading || text.length < 10}
          className="w-full py-4 px-6 bg-[#FFBA49] text-slate-900 font-bold rounded-xl hover:bg-[#e6a640] disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-lg"
        >
          {loading ? "Đang xử lý (5-15 giây)..." : "Tạo bài luyện tập"}
        </button>
      </form>
    </div>
  );
}
