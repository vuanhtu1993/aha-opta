"use client";
import { useEffect, useState, use } from "react";
import { useRouter } from "next/navigation";
import { ShadowingPlayer } from "@/components/story-shadowing/shadowing-player";
import type { Sentence } from "@/lib/schemas/story-shadowing.schema";

export default function PlayerPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter();
  const { id } = use(params);
  const [sentences, setSentences] = useState<Sentence[]>([]);
  const [title, setTitle] = useState<string>("");
  const [level, setLevel] = useState<"easy" | "medium" | "hard" | null>(null);
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
        setTitle(data.title);
        setLevel(data.level);
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
      <ShadowingPlayer 
        sentences={sentences} 
        title={title}
        level={level}
        onBack={() => router.push("/apps/story-shadowing")}
      />
    </div>
  );
}
