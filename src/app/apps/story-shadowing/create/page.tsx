"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAgentFetch } from "@/lib/hooks/useAgentFetch";
import { SegmentPreviewDialog } from "@/components/story-shadowing/segment-preview-dialog";
import type { SuggestedSegment } from "@/lib/agents/story-shadowing-agent/nodes/youtube-segment-suggester.node";

export default function CreatePlayerPage() {
  const [inputType, setInputType] = useState<"manual" | "url" | "youtube">("youtube");
  const [urlInput, setUrlInput] = useState("");
  const [youtubeUrl, setYoutubeUrl] = useState("");
  const [scraping, setScraping] = useState(false);

  const [title, setTitle] = useState("");
  const [thumbnail, setThumbnail] = useState("");
  const [text, setText] = useState("");
  const [voice, setVoice] = useState("en-US-Journey-F");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Phase 7 Segment Dialog States
  const [showSegmentDialog, setShowSegmentDialog] = useState(false);
  const [videoTitle, setVideoTitle] = useState("");
  const [videoId, setVideoId] = useState("");
  const [suggestedSegments, setSuggestedSegments] = useState<SuggestedSegment[]>([]);
  const [rawTranscript, setRawTranscript] = useState<any[]>([]);

  const router = useRouter();
  const { fetchSSE } = useAgentFetch();

  const handleScrape = async () => {
    if (!urlInput) return;
    setScraping(true);
    setError(null);
    try {
      const res = await fetch(`/api/story-shadowing/scrape?url=${encodeURIComponent(urlInput)}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Lỗi khi phân tích link");

      setTitle(data.title || "");
      setThumbnail(data.thumbnail || "");
      setText(data.text || "");

      // Chuyển về tab manual để user review
      setInputType("manual");
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setScraping(false);
    }
  };

  const handleYoutubeSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!youtubeUrl) return;
    setLoading(true);
    setError(null);

    try {
      // 1. Phân tích xem video có cần chia nhỏ không
      const res = await fetch("/api/story-shadowing/youtube/suggest-segments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ youtubeUrl }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Lỗi khi phân tích video YouTube");

      if (data.needsSplitting) {
        // Video dài >= 15 phút → Mở dialog gợi ý phân đoạn
        setVideoTitle(data.title);
        setVideoId(data.videoId);
        setSuggestedSegments(data.segments);
        setRawTranscript(data.rawTranscript);
        setShowSegmentDialog(true);
        setLoading(false);
      } else {
        // Video ngắn → Chạy flow 1 bài đơn lẻ như cũ
        const result = await fetchSSE<{ id: string }>("/api/story-shadowing/youtube", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ youtubeUrl }),
        });
        router.push(`/apps/story-shadowing/player/${result.id}`);
      }
    } catch (err) {
      setError((err as Error).message);
      setLoading(false);
    }
  };

  const handleConfirmSeries = async (selectedSegments: SuggestedSegment[]) => {
    setShowSegmentDialog(false);
    setLoading(true);
    setError(null);

    try {
      const result = await fetchSSE<{ done: boolean; seriesId: string; firstStoryId: string }>(
        "/api/story-shadowing/youtube/create-series",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            youtubeUrl,
            videoId,
            videoTitle,
            selectedSegments,
            rawTranscript,
            voice,
          }),
        }
      );

      if (result.firstStoryId) {
        router.push(`/apps/story-shadowing/player/${result.firstStoryId}`);
      } else {
        router.push("/apps/story-shadowing");
      }
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const data = await fetchSSE<{ id: string }>("/api/story-shadowing/process", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text, title, thumbnail, voice }),
      });

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
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-5 h-5">
            <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5 3 12m0 0 7.5-7.5M3 12h18" />
          </svg>
        </Link>
        <h1 className="text-2xl font-bold text-slate-900">Creating story</h1>
      </div>

      {/* Tabs */}
      <div className="flex p-1 bg-slate-100 rounded-xl">
        <button
          onClick={() => setInputType("manual")}
          className={`flex-1 py-2.5 text-sm font-medium rounded-lg transition-colors ${inputType === "manual" ? "bg-white text-slate-900 shadow-sm" : "text-slate-500 hover:text-slate-700"
            }`}
        >
          Nhập Text
        </button>
        <button
          onClick={() => setInputType("url")}
          className={`flex-1 py-2.5 text-sm font-medium rounded-lg transition-colors ${inputType === "url" ? "bg-white text-slate-900 shadow-sm" : "text-slate-500 hover:text-slate-700"
            }`}
        >
          Nhập Article URL
        </button>
        <button
          onClick={() => setInputType("youtube")}
          className={`flex-1 py-2.5 text-sm font-medium rounded-lg transition-colors ${inputType === "youtube" ? "bg-[#FF0000] text-white shadow-sm" : "text-slate-500 hover:text-slate-700"
            }`}
        >
          Nhập YouTube
        </button>
      </div>

      {inputType === "url" && (
        <div className="space-y-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
          <div className="space-y-2">
            <label className="block text-sm font-medium text-slate-700">Đường dẫn bài viết (URL)</label>
            <div className="flex gap-2">
              <input
                type="url"
                value={urlInput}
                onChange={(e) => setUrlInput(e.target.value)}
                placeholder="https://example.com/article..."
                className="flex-1 px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#FFBA49] text-slate-700"
                onKeyDown={(e) => e.key === 'Enter' && handleScrape()}
              />
              <button
                onClick={handleScrape}
                disabled={!urlInput || scraping}
                className="px-6 py-3 bg-slate-900 text-white font-medium rounded-xl hover:bg-slate-800 disabled:opacity-50 transition-colors whitespace-nowrap"
              >
                {scraping ? "Đang xử lý..." : "Phân tích"}
              </button>
            </div>
            <p className="text-xs text-slate-500">Hệ thống sẽ tự động bóc tách Tiêu đề, Hình ảnh và Nội dung bài viết từ link bạn cung cấp.</p>
          </div>

          {error && (
            <p className="text-red-600 text-sm bg-red-50 px-4 py-2 rounded-lg">{error}</p>
          )}
        </div>
      )}

      {inputType === "youtube" && (
        <div className="space-y-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
          <form onSubmit={handleYoutubeSubmit} className="space-y-6">
            <div className="space-y-2">
              <label className="block text-sm font-medium text-slate-700">Đường dẫn video YouTube</label>
              <input
                type="url"
                value={youtubeUrl}
                onChange={(e) => setYoutubeUrl(e.target.value)}
                placeholder="https://www.youtube.com/watch?v=..."
                className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#FF0000] text-slate-700"
                required
              />
              <p className="text-xs text-slate-500">Video phải có tính năng hiển thị phụ đề (CC) tiếng Anh.</p>
            </div>

            {error && (
              <p className="text-red-600 text-sm bg-red-50 px-4 py-2 rounded-lg">{error}</p>
            )}

            <button
              type="submit"
              disabled={loading || !youtubeUrl}
              className="w-full py-4 px-6 bg-[#FF0000] text-white font-bold rounded-xl hover:bg-[#cc0000] disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-lg"
            >
              {loading ? "Đang xử lý Video ..." : "Phân tích Video"}
            </button>
          </form>
        </div>
      )}

      {inputType === "manual" && (
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
            <label className="block text-sm font-medium text-slate-700">Giọng đọc (Voice)</label>
            <select
              value={voice}
              onChange={(e) => setVoice(e.target.value)}
              className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#FFBA49] text-slate-700 bg-white"
            >
              <optgroup label="Giọng Cao Cấp (Journey)">
                <option value="en-US-Journey-F">Nữ - Tự nhiên & Biểu cảm (Journey F)</option>
                <option value="en-US-Journey-D">Nam - Tự nhiên & Biểu cảm (Journey D)</option>
              </optgroup>
              <optgroup label="Giọng Truyền Thống (Standard)">
                <option value="en-US-Standard-C">Nữ - Tiêu chuẩn (Standard C)</option>
                <option value="en-US-Standard-D">Nam - Tiêu chuẩn (Standard D)</option>
              </optgroup>
              <optgroup label="Giọng Neural (Chất lượng cao)">
                <option value="en-US-Neural2-H">Nữ - Ấm áp (Neural2 H)</option>
                <option value="en-US-Neural2-J">Nam - Trầm ấm (Neural2 J)</option>
              </optgroup>
            </select>
          </div>

          <div className="space-y-2">
            <label className="block text-sm font-medium text-slate-700">Đoạn văn tiếng Anh <span className="text-red-500">*</span></label>
            <textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="Dán đoạn văn tiếng Anh vào đây... (10–10000 ký tự)"
              className="w-full h-48 p-4 border border-slate-200 rounded-xl resize-none focus:outline-none focus:ring-2 focus:ring-[#FFBA49] text-slate-700"
              maxLength={10000}
              required
            />
            <div className="flex justify-between text-xs text-slate-400">
              <span>{text.length} / 10000 ký tự</span>
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
            {loading ? "Đang xử lý ..." : "Tạo bài luyện tập"}
          </button>
        </form>
      )}

      {/* Segment Dialog for long YouTube videos */}
      <SegmentPreviewDialog
        open={showSegmentDialog}
        videoTitle={videoTitle}
        segments={suggestedSegments}
        onConfirm={handleConfirmSeries}
        onCancel={() => setShowSegmentDialog(false)}
      />
    </div>
  );
}
