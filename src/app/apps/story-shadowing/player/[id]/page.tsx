"use client";
import { useEffect, useState, use } from "react";
import { useRouter } from "next/navigation";
import { ShadowingPlayer } from "@/components/story-shadowing/shadowing-player";
import type { Sentence } from "@/lib/schemas/story-shadowing.schema";

export default function PlayerPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter();
  const { id } = use(params);
  const [sentences, setSentences] = useState<Sentence[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch(`/api/story-shadowing/${id}`)
      .then((res) => {
        if (!res.ok) throw new Error("Không tìm thấy bài luyện tập");
        return res.json();
      })
      .then((data) => {
        setSentences(data.sentences);
      })
      .catch((err) => {
        setError(err.message);
      })
      .finally(() => {
        setLoading(false);
      });
  }, [id]);

  if (loading) {
    return <div className="text-center py-20 text-slate-500">Đang tải bài đọc...</div>;
  }

  if (error || !sentences.length) {
    return (
      <div className="text-center py-20 space-y-4">
        <p className="text-red-500">{error || "Dữ liệu trống"}</p>
        <button
          onClick={() => router.push("/apps/story-shadowing")}
          className="text-indigo-600 underline"
        >
          Quay lại trang chủ
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6 py-8">
      <div className="flex items-center gap-4">
        <button
          onClick={() => router.push("/apps/story-shadowing")}
          className="text-sm text-slate-400 hover:text-slate-700 transition-colors"
        >
          ← Danh sách bài
        </button>
        <h1 className="text-xl font-bold text-slate-800">Luyện Shadowing</h1>
      </div>

      <ShadowingPlayer sentences={sentences} />
    </div>
  );
}
