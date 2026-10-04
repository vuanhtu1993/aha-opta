"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { useAgentFetch } from "@/lib/hooks/useAgentFetch";
import { useStoryShadowingJob } from "@/hooks/useStoryShadowingJob";
import { useYoutubeSegments } from "@/hooks/useYoutubeSegments";
import { StoryShadowingProgress } from "@/components/story-shadowing/StoryShadowingProgress";
import { revalidateStoryShadowing } from "@/lib/actions/story-shadowing.actions";
import { SegmentPreviewDialog } from "@/components/story-shadowing/segment-preview-dialog";
import type { SuggestedSegment } from "@/lib/agents/story-shadowing-agent/nodes/youtube-segment-suggester.node";
import {
  Globe,
  FileText,
  Clipboard,
  Sparkles,
  Loader2,
  Mic,
  AlertCircle,
  Play,
  CheckCircle2,
} from "lucide-react";

function YoutubeIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
    </svg>
  );
}

interface VoiceOption {
  id: string;
  name: string;
  gender: "Nữ" | "Nam";
  type: "Journey" | "Neural2" | "Standard";
  desc: string;
}

const VOICE_OPTIONS: VoiceOption[] = [
  {
    id: "en-US-Journey-F",
    name: "Journey Female",
    gender: "Nữ",
    type: "Journey",
    desc: "Tự nhiên & Biểu cảm (Khuyên dùng)",
  },
  {
    id: "en-US-Journey-D",
    name: "Journey Male",
    gender: "Nam",
    type: "Journey",
    desc: "Tự nhiên & Biểu cảm (Khuyên dùng)",
  },
  {
    id: "en-US-Neural2-H",
    name: "Neural2 Female",
    gender: "Nữ",
    type: "Neural2",
    desc: "Giọng đọc ấm áp, truyền cảm",
  },
  {
    id: "en-US-Neural2-J",
    name: "Neural2 Male",
    gender: "Nam",
    type: "Neural2",
    desc: "Giọng đọc trầm ấm, lưu loát",
  },
  {
    id: "en-US-Standard-C",
    name: "Standard Female",
    gender: "Nữ",
    type: "Standard",
    desc: "Giọng chuẩn Mỹ phổ thông",
  },
  {
    id: "en-US-Standard-D",
    name: "Standard Male",
    gender: "Nam",
    type: "Standard",
    desc: "Giọng chuẩn Mỹ phổ thông",
  },
];

export default function CreatePlayerPage() {
  const [inputType, setInputType] = useState<"youtube" | "url" | "manual">("youtube");
  const [urlInput, setUrlInput] = useState("");
  const [scraping, setScraping] = useState(false);

  const [title, setTitle] = useState("");
  const [thumbnail, setThumbnail] = useState("");
  const [text, setText] = useState("");
  const [voice, setVoice] = useState("en-US-Journey-F");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // YouTube source state & operations managed via useYoutubeSegments hook
  const {
    youtubeUrl,
    setYoutubeUrl,
    preview: youtubePreview,
    isFetchingPreview: fetchingPreview,
    isAnalyzing: analyzingVideo,
    error: youtubeError,
    setError: setYoutubeError,
    showSegmentDialog,
    setShowSegmentDialog,
    videoTitle,
    videoId,
    suggestedSegments,
    rawTranscript,
    analyzeVideo,
  } = useYoutubeSegments();

  const router = useRouter();
  const { fetchSSE } = useAgentFetch();

  const [activePipeline, setActivePipeline] = useState<"text" | "youtube">("youtube");
  const {
    status: jobStatus,
    progress: jobProgress,
    stageName: jobStageName,
    stageMessage: jobStageMessage,
    error: jobError,
    startJob,
    reset: resetJob,
  } = useStoryShadowingJob();

  const isJobBusy = loading || analyzingVideo || (jobStatus !== "idle" && jobStatus !== "completed" && jobStatus !== "error");
  const activeError = error || youtubeError;

  // Quick Paste Helper
  const handlePasteClipboard = async (setter: (val: string) => void) => {
    try {
      const clipText = await navigator.clipboard.readText();
      if (clipText) {
        setter(clipText.trim());
      }
    } catch (err) {
      console.warn("Clipboard read not supported or permission denied", err);
    }
  };

  const handleScrape = async () => {
    if (!urlInput) return;
    setScraping(true);
    setError(null);
    try {
      const res = await fetch(`/api/story-shadowing/scrape?url=${encodeURIComponent(urlInput)}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Lỗi khi phân tích link bài viết");

      setTitle(data.title || "");
      setThumbnail(data.thumbnail || "");
      setText(data.text || "");

      // Chuyển sang tab manual để user review
      setInputType("manual");
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setScraping(false);
    }
  };

  const handleYoutubeSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!youtubeUrl) return;

    setError(null);
    setYoutubeError(null);
    setActivePipeline("youtube");

    await analyzeVideo(async (cleanUrl) => {
      const story = await startJob({
        pipeline: "youtube",
        youtubeUrl: cleanUrl,
        forceRegenerate: false,
      });

      await revalidateStoryShadowing();

      if (story && story._id) {
        router.push(`/apps/story-shadowing/player/${story._id}`);
      }
    });
  };

  const handleDirectAgentSubmit = async () => {
    if (!youtubeUrl) return;
    setError(null);
    setYoutubeError(null);
    setLoading(true);
    setActivePipeline("youtube");
    try {
      const story = await startJob({
        pipeline: "youtube",
        youtubeUrl: youtubeUrl.trim(),
        forceRegenerate: false,
      });

      await revalidateStoryShadowing();

      if (story && story._id) {
        router.push(`/apps/story-shadowing/player/${story._id}`);
      }
    } catch (err: any) {
      setError(err?.message || "Lỗi khi xử lý video YouTube qua Agent");
    } finally {
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

      await revalidateStoryShadowing();

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

  const handleManualSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!text || text.trim().length < 10) {
      setError("Văn bản phải có tối thiểu 10 ký tự.");
      return;
    }
    setError(null);
    setActivePipeline("text");

    try {
      const story = await startJob({
        pipeline: "text",
        text: text.trim(),
        voice,
      });

      await revalidateStoryShadowing();

      if (story && story._id) {
        router.push(`/apps/story-shadowing/player/${story._id}`);
      }
    } catch (err: any) {
      setError(err?.message || "Lỗi khi tạo bài học văn bản");
    }
  };

  return (
    <div className="px-4 pt-3 pb-24 space-y-4">
      {/* Title & Badge */}
      <div className="space-y-1">
        <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-amber-500/15 text-amber-700 dark:text-amber-400 text-xs font-bold">
          <Sparkles className="w-3.5 h-3.5" /> Tạo bài học thông minh
        </div>
        <h1 className="text-xl font-black text-slate-900 dark:text-white tracking-tight">
          Luyện nói Shadowing
        </h1>
        <p className="text-xs text-slate-500 dark:text-slate-400">
          Chuyển đổi Video YouTube, Bài báo hoặc Văn bản thành bài luyện phản xạ
        </p>
      </div>

      {/* Segmented Control Tabs */}
      <div className="p-1 bg-slate-200/80 dark:bg-slate-800 rounded-2xl flex relative">
        <button
          type="button"
          onClick={() => setInputType("youtube")}
          className={`flex-1 relative py-2.5 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all z-10 ${
            inputType === "youtube"
              ? "text-rose-600 dark:text-rose-400 shadow-xs"
              : "text-slate-600 dark:text-slate-400 hover:text-slate-900"
          }`}
        >
          {inputType === "youtube" && (
            <motion.div
              layoutId="createTabIndicator"
              className="absolute inset-0 bg-white dark:bg-slate-700 rounded-xl shadow-xs"
              transition={{ type: "spring", stiffness: 450, damping: 35 }}
            />
          )}
          <span className="relative z-10 flex items-center gap-1.5">
            <YoutubeIcon className="w-4 h-4 text-rose-500" /> YouTube
          </span>
        </button>

        <button
          type="button"
          onClick={() => setInputType("url")}
          className={`flex-1 relative py-2.5 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all z-10 ${
            inputType === "url"
              ? "text-blue-600 dark:text-blue-400 shadow-xs"
              : "text-slate-600 dark:text-slate-400 hover:text-slate-900"
          }`}
        >
          {inputType === "url" && (
            <motion.div
              layoutId="createTabIndicator"
              className="absolute inset-0 bg-white dark:bg-slate-700 rounded-xl shadow-xs"
              transition={{ type: "spring", stiffness: 450, damping: 35 }}
            />
          )}
          <span className="relative z-10 flex items-center gap-1.5">
            <Globe className="w-4 h-4 text-blue-500" /> Article URL
          </span>
        </button>

        <button
          type="button"
          onClick={() => setInputType("manual")}
          className={`flex-1 relative py-2.5 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all z-10 ${
            inputType === "manual"
              ? "text-amber-600 dark:text-amber-400 shadow-xs"
              : "text-slate-600 dark:text-slate-400 hover:text-slate-900"
          }`}
        >
          {inputType === "manual" && (
            <motion.div
              layoutId="createTabIndicator"
              className="absolute inset-0 bg-white dark:bg-slate-700 rounded-xl shadow-xs"
              transition={{ type: "spring", stiffness: 450, damping: 35 }}
            />
          )}
          <span className="relative z-10 flex items-center gap-1.5">
            <FileText className="w-4 h-4 text-amber-500" /> Nhập Text
          </span>
        </button>
      </div>

      {/* Error Alert Message */}
      <AnimatePresence>
        {activeError && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            className="p-3 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 rounded-2xl flex items-start gap-2.5 text-xs text-rose-700 dark:text-rose-300"
          >
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-500" />
            <div className="flex-1 space-y-2">
              <div>{activeError}</div>
              {inputType === "youtube" && youtubeUrl && (
                <div>
                  <button
                    type="button"
                    onClick={handleDirectAgentSubmit}
                    disabled={isJobBusy}
                    className="inline-flex items-center gap-1.5 px-2.5 py-1 text-[11px] font-semibold bg-rose-100 hover:bg-rose-200 dark:bg-rose-900/60 dark:hover:bg-rose-900 text-rose-800 dark:text-rose-200 rounded-lg transition-colors cursor-pointer"
                  >
                    <Sparkles className="w-3 h-3 text-amber-500" />
                    Thử tạo trực tiếp qua Agent Queue (Bỏ qua phân đoạn)
                  </button>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 1. YouTube Form */}
      {inputType === "youtube" && (
        <motion.div
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-4"
        >
          <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-slate-800 dark:text-slate-200">
                Đường dẫn Video YouTube
              </label>
              <button
                type="button"
                onClick={() => handlePasteClipboard(setYoutubeUrl)}
                className="inline-flex items-center gap-1 text-[11px] font-semibold text-amber-600 dark:text-amber-400 hover:underline"
              >
                <Clipboard className="w-3 h-3" /> Dán link
              </button>
            </div>

            <div className="relative">
              <input
                type="url"
                value={youtubeUrl}
                onChange={(e) => setYoutubeUrl(e.target.value)}
                placeholder="https://www.youtube.com/watch?v=..."
                className="w-full px-3.5 py-3 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-rose-500 text-slate-900 dark:text-slate-100 placeholder:text-slate-400"
              />
            </div>

            <p className="text-[11px] text-slate-500 dark:text-slate-400">
              💡 Lưu ý: Video cần có phụ đề tiếng Anh (CC) để AI tạo kịch bản luyện nói.
            </p>
          </div>

          {/* YouTube Video Preview Card */}
          {fetchingPreview && (
            <div className="p-4 bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl flex items-center justify-center gap-2 text-xs text-slate-500">
              <Loader2 className="w-4 h-4 animate-spin text-rose-500" /> Đang tải thông tin video...
            </div>
          )}

          {youtubePreview && !fetchingPreview && (
            <motion.div
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              className="p-3.5 bg-white dark:bg-slate-900 border border-rose-200 dark:border-rose-900/50 rounded-2xl shadow-xs flex items-center gap-3.5"
            >
              <div className="relative w-24 h-16 rounded-xl overflow-hidden shrink-0 bg-slate-100 shadow-2xs">
                <img
                  src={youtubePreview.thumbnail}
                  alt="YouTube Preview"
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-black/20 flex items-center justify-center">
                  <Play className="w-5 h-5 text-white fill-white opacity-80" />
                </div>
              </div>
              <div className="min-w-0 flex-1">
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-900">
                  YouTube
                </span>
                <p className="font-bold text-xs text-slate-800 dark:text-slate-100 line-clamp-2 mt-1">
                  {youtubePreview.title}
                </p>
              </div>
            </motion.div>
          )}

          <div className="p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-start gap-2.5">
            <Sparkles className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
            <p className="text-[11px] leading-relaxed text-slate-600 dark:text-slate-300">
              Hệ thống tự động phát hiện các video dài trên 15 phút và gợi ý phân đoạn thành chuỗi bài học nhỏ giúp bạn dễ dàng luyện tập hàng ngày.
            </p>
          </div>

          {/* Primary Submit Button */}
          <button
            type="button"
            disabled={isJobBusy || !youtubeUrl}
            onClick={() => handleYoutubeSubmit()}
            className="w-full py-3.5 px-4 bg-rose-600 hover:bg-rose-700 disabled:opacity-40 disabled:cursor-not-allowed text-white font-bold text-sm rounded-xl shadow-md shadow-rose-600/20 active:scale-98 transition-all flex items-center justify-center gap-2"
          >
            {analyzingVideo ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" /> Đang phân tích phụ đề & độ dài video...
              </>
            ) : isJobBusy ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" /> Đang xử lý...
              </>
            ) : (
              <>
                <YoutubeIcon className="w-4 h-4" /> Phân tích Video YouTube ➔
              </>
            )}
          </button>
        </motion.div>
      )}

      {/* 2. Article URL Form */}
      {inputType === "url" && (
        <motion.div
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-4"
        >
          <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-slate-800 dark:text-slate-200">
                Đường dẫn bài viết (Article URL)
              </label>
              <button
                type="button"
                onClick={() => handlePasteClipboard(setUrlInput)}
                className="inline-flex items-center gap-1 text-[11px] font-semibold text-blue-600 dark:text-blue-400 hover:underline"
              >
                <Clipboard className="w-3 h-3" /> Dán link
              </button>
            </div>

            <input
              type="url"
              value={urlInput}
              onChange={(e) => setUrlInput(e.target.value)}
              placeholder="https://example.com/english-article..."
              className="w-full px-3.5 py-3 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-900 dark:text-slate-100 placeholder:text-slate-400"
            />

            <p className="text-[11px] text-slate-500 dark:text-slate-400">
              Bóc tách tự động Tiêu đề, Hình ảnh đại diện và Nội dung bài viết tiếng Anh chuẩn xác.
            </p>
          </div>

          {/* Primary Scrape Button */}
          <button
            type="button"
            disabled={scraping || !urlInput}
            onClick={handleScrape}
            className="w-full py-3.5 px-4 bg-blue-600 hover:bg-blue-700 disabled:opacity-40 disabled:cursor-not-allowed text-white font-bold text-sm rounded-xl shadow-md shadow-blue-600/20 active:scale-98 transition-all flex items-center justify-center gap-2"
          >
            {scraping ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" /> Đang bóc tách bài viết...
              </>
            ) : (
              <>
                <Globe className="w-4 h-4" /> Phân tích Link Bài Viết ➔
              </>
            )}
          </button>
        </motion.div>
      )}

      {/* 3. Manual Text Form */}
      {inputType === "manual" && (
        <motion.div
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-4"
        >
          {/* Main Text Area */}
          <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-2.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-slate-800 dark:text-slate-200">
                Đoạn văn tiếng Anh <span className="text-rose-500">*</span>
              </label>
              <button
                type="button"
                onClick={() => handlePasteClipboard(setText)}
                className="inline-flex items-center gap-1 text-[11px] font-semibold text-amber-600 dark:text-amber-400 hover:underline"
              >
                <Clipboard className="w-3 h-3" /> Dán văn bản
              </button>
            </div>

            <textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="Dán đoạn văn bản tiếng Anh cần luyện nói vào đây... (10–10000 ký tự)"
              className="w-full h-36 p-3 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl resize-none focus:outline-none focus:ring-2 focus:ring-amber-500 text-slate-900 dark:text-slate-100 placeholder:text-slate-400"
              maxLength={10000}
            />

            <div className="flex justify-end text-[10px] font-medium text-slate-400">
              <span>{text.length} / 10000 ký tự</span>
            </div>
          </div>

          {/* Voice Selection Cards */}
          <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                <Mic className="w-3.5 h-3.5 text-amber-500" /> Chọn Giọng đọc AI (Voice)
              </label>
            </div>

            <div className="grid grid-cols-1 gap-2">
              {VOICE_OPTIONS.map((v) => {
                const isSelected = voice === v.id;
                return (
                  <button
                    key={v.id}
                    type="button"
                    onClick={() => setVoice(v.id)}
                    className={`flex items-center justify-between p-2.5 rounded-xl border text-left transition-all ${
                      isSelected
                        ? "bg-amber-50/80 dark:bg-amber-950/40 border-amber-500/80 text-amber-950 dark:text-amber-200 ring-1 ring-amber-500/30"
                        : "bg-slate-50 dark:bg-slate-800/60 border-slate-200 dark:border-slate-700/80 text-slate-700 dark:text-slate-300 hover:border-slate-300"
                    }`}
                  >
                    <div className="min-w-0 pr-2">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-slate-900 dark:text-slate-100">
                          {v.name}
                        </span>
                        <span className="text-[10px] px-1.5 py-0.2 rounded-md bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 font-semibold">
                          {v.gender}
                        </span>
                        {v.type === "Journey" && (
                          <span className="text-[10px] px-1.5 py-0.2 rounded-md bg-amber-500 text-slate-950 font-bold">
                            Tự nhiên
                          </span>
                        )}
                      </div>
                      <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5 truncate">
                        {v.desc}
                      </p>
                    </div>

                    <div
                      className={`w-5 h-5 rounded-full flex items-center justify-center shrink-0 ${
                        isSelected
                          ? "bg-amber-500 text-slate-950"
                          : "border border-slate-300 dark:border-slate-600"
                      }`}
                    >
                      {isSelected && <CheckCircle2 className="w-3.5 h-3.5 stroke-[3]" />}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Optional Meta fields (Title & Thumbnail) */}
          <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-3">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                Tiêu đề bài học (Tùy chọn)
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Ví dụ: Daily English Practice #1"
                className="w-full px-3 py-2.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500 text-slate-900 dark:text-slate-100"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                Ảnh bìa / Thumbnail URL (Tùy chọn)
              </label>
              <input
                type="url"
                value={thumbnail}
                onChange={(e) => setThumbnail(e.target.value)}
                placeholder="https://example.com/image.jpg"
                className="w-full px-3 py-2.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500 text-slate-900 dark:text-slate-100"
              />
            </div>
          </div>

          {/* Primary Create Button */}
          <button
            type="button"
            disabled={isJobBusy || text.length < 10}
            onClick={() => handleManualSubmit()}
            className="w-full py-3.5 px-4 bg-[#FFBA49] hover:bg-[#e6a640] disabled:opacity-40 disabled:cursor-not-allowed text-slate-950 font-bold text-sm rounded-xl shadow-md shadow-amber-500/20 active:scale-98 transition-all flex items-center justify-center gap-2"
          >
            {isJobBusy ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" /> Đang tạo bài học...
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4" /> Tạo bài luyện tập ➔
              </>
            )}
          </button>
        </motion.div>
      )}

      {/* Segment Dialog for long YouTube videos (Mobile Bottom Sheet) */}
      <SegmentPreviewDialog
        open={showSegmentDialog}
        videoTitle={videoTitle}
        segments={suggestedSegments}
        onConfirm={handleConfirmSeries}
        onCancel={() => setShowSegmentDialog(false)}
      />

      {/* Real-time Stepper Progress Modal for Story Shadowing Agent */}
      <StoryShadowingProgress
        status={jobStatus}
        progress={jobProgress}
        stageName={jobStageName}
        stageMessage={jobStageMessage}
        pipeline={activePipeline}
        error={jobError}
        onRetry={() => {
          resetJob();
          if (activePipeline === "youtube") {
            handleYoutubeSubmit();
          } else {
            handleManualSubmit();
          }
        }}
        onCancel={() => {
          resetJob();
        }}
      />
    </div>
  );
}
