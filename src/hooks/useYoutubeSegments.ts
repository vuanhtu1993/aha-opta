"use client";

/**
 * @file useYoutubeSegments.ts
 * @description Custom Hook đóng gói toàn bộ luồng tương tác với nguồn YouTube:
 * - Tự động tra cứu preview video (title, thumbnail qua noembed)
 * - Gửi yêu cầu phân tích phụ đề & đề xuất phân đoạn video dài (qua Supadata Backend)
 * - Quản lý trạng thái Bottom Sheet phân đoạn
 * - Cung cấp hành động Bypass trực tiếp sang Agent Queue khi cần thiết
 * 
 * Made by Anh Tu - Share to be share
 */

import { useState, useEffect, useCallback } from "react";
import type { SuggestedSegment } from "@/lib/agents/story-shadowing-agent/nodes/youtube-segment-suggester.node";
import type { SupadataTranscriptBlock } from "@/lib/services/supadata.service";

export interface YoutubePreviewData {
  title: string;
  thumbnail: string;
}

export function useYoutubeSegments() {
  const [youtubeUrl, setYoutubeUrl] = useState("");
  const [preview, setPreview] = useState<YoutubePreviewData | null>(null);
  const [isFetchingPreview, setIsFetchingPreview] = useState(false);

  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Trạng thái Dialog phân đoạn video
  const [showSegmentDialog, setShowSegmentDialog] = useState(false);
  const [videoTitle, setVideoTitle] = useState("");
  const [videoId, setVideoId] = useState("");
  const [suggestedSegments, setSuggestedSegments] = useState<SuggestedSegment[]>([]);
  const [rawTranscript, setRawTranscript] = useState<SupadataTranscriptBlock[]>([]);

  // Tự động lấy Preview khi URL thay đổi (Debounced 400ms)
  useEffect(() => {
    if (!youtubeUrl) {
      setPreview(null);
      return;
    }

    const isYoutube = /(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=|shorts\/))/.test(youtubeUrl);
    if (!isYoutube) {
      setPreview(null);
      return;
    }

    let isMounted = true;
    setIsFetchingPreview(true);

    const timeout = setTimeout(async () => {
      try {
        const res = await fetch(`https://noembed.com/embed?dataType=json&url=${encodeURIComponent(youtubeUrl)}`);
        const data = await res.json();
        if (isMounted && data.title && data.thumbnail_url) {
          setPreview({
            title: data.title,
            thumbnail: data.thumbnail_url,
          });
        }
      } catch (err) {
        console.warn("Failed to fetch youtube preview", err);
      } finally {
        if (isMounted) setIsFetchingPreview(false);
      }
    }, 400);

    return () => {
      isMounted = false;
      clearTimeout(timeout);
    };
  }, [youtubeUrl]);

  /**
   * Gọi API phân tích phụ đề và kiểm tra phân đoạn video
   */
  const analyzeVideo = useCallback(
    async (
      onShortVideo: (cleanUrl: string) => Promise<void>
    ): Promise<void> => {
      if (!youtubeUrl.trim()) return;

      setIsAnalyzing(true);
      setError(null);

      try {
        const res = await fetch("/api/story-shadowing/youtube/suggest-segments", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ youtubeUrl: youtubeUrl.trim() }),
        });

        const data = await res.json();
        if (!res.ok) {
          throw new Error(data.error || "Lỗi khi phân tích video YouTube");
        }

        if (data.needsSplitting) {
          // Video dài >= 15 phút -> Mở Bottom Sheet phân đoạn
          setVideoTitle(data.title);
          setVideoId(data.videoId);
          setSuggestedSegments(data.segments);
          setRawTranscript(data.rawTranscript);
          setShowSegmentDialog(true);
        } else {
          // Video ngắn -> Thực thi callback tạo bài học trực tiếp
          await onShortVideo(youtubeUrl.trim());
        }
      } catch (err: any) {
        setError(err?.message || "Lỗi khi phân tích video YouTube");
      } finally {
        setIsAnalyzing(false);
      }
    },
    [youtubeUrl]
  );

  /**
   * Reset toàn bộ trạng thái lỗi và dialog
   */
  const reset = useCallback(() => {
    setError(null);
    setShowSegmentDialog(false);
    setSuggestedSegments([]);
    setRawTranscript([]);
  }, []);

  return {
    youtubeUrl,
    setYoutubeUrl,
    preview,
    isFetchingPreview,
    isAnalyzing,
    error,
    setError,
    showSegmentDialog,
    setShowSegmentDialog,
    videoTitle,
    videoId,
    suggestedSegments,
    rawTranscript,
    analyzeVideo,
    reset,
  };
}
