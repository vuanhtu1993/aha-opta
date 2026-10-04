# Supadata YouTube Transcript & Custom Hook Refactor Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Loại bỏ hoàn toàn thư viện `youtube-transcript`, chuyển đổi 100% sang Supadata API qua một service chuyên biệt (`SupadataService`), xây dựng custom hook `useYoutubeSegments` để quản lý toàn bộ luồng tương tác YouTube phía Client, và tái cấu trúc trang `CreatePlayerPage`.

**Architecture:** Áp dụng mô hình kiến trúc phân tầng (Layered Architecture): tách tầng tích hợp dữ liệu Supadata (`src/lib/services/supadata.service.ts`), tầng điều phối LangGraph Node (`youtube-transcript-fetcher.node.ts`), tầng quản lý trạng thái giao diện qua Custom Hook (`src/hooks/useYoutubeSegments.ts`), và tầng hiển thị Component thuần túy (`src/app/apps/story-shadowing/create/page.tsx`).

**Tech Stack:** Next.js 16 (App Router), TypeScript, Supadata REST API, React Custom Hooks, Zod, TailwindCSS.

---

### File Structure Map

```
src/
├── lib/
│   ├── services/
│   │   └── supadata.service.ts          # [NEW] Service chuyên biệt gọi Supadata API & oEmbed
│   └── agents/story-shadowing-agent/
│       └── nodes/
│           └── youtube-transcript-fetcher.node.ts # [MODIFY] Tinh giản, gọi SupadataService, xóa bỏ youtube-transcript
├── hooks/
│   └── useYoutubeSegments.ts            # [NEW] Custom Hook quản lý preview, suggest segments & dialog state
├── app/
│   ├── api/story-shadowing/youtube/suggest-segments/
│   │   └── route.ts                     # [VERIFY] Tiếp tục hoạt động qua node đã refactor
│   └── apps/story-shadowing/create/
│       └── page.tsx                     # [MODIFY] Thay thế logic nội tuyến bằng useYoutubeSegments
package.json                             # [MODIFY] Gỡ bỏ package youtube-transcript
```

---

### Task 1: Xây dựng Module `SupadataService` Chuyên Biệt

**Files:**
- Create: `src/lib/services/supadata.service.ts`
- Test: `scripts/test-supadata-service.ts`

- [ ] **Step 1: Định nghĩa Interface và hàm helper trích xuất videoId & oEmbed**

Tạo `src/lib/services/supadata.service.ts` với đầy đủ định nghĩa TypeScript:

```typescript
/**
 * @file supadata.service.ts
 * @description Service chuyên trách giao tiếp với Supadata API để lấy phụ đề YouTube
 * và trích xuất thông tin video qua oEmbed.
 * 
 * Made by Anh Tu - Share to be share
 */

export interface SupadataTranscriptBlock {
  text: string;
  start: number;     // Mốc bắt đầu tính theo mili-giây (ms)
  duration: number;  // Thời lượng tính theo mili-giây (ms)
  lang?: string;
}

export interface YoutubeVideoMetadata {
  videoId: string;
  title: string;
  rawTranscript: SupadataTranscriptBlock[];
}

export class SupadataService {
  private static readonly SUPADATA_BASE_URL = "https://api.supadata.ai/v1/youtube/transcript";
  private static readonly OEMBED_URL = "https://www.youtube.com/oembed";

  /**
   * Trích xuất YouTube Video ID từ nhiều định dạng URL khác nhau
   */
  public static extractVideoId(url: string): string | null {
    if (!url) return null;
    const cleanUrl = url.trim();
    if (cleanUrl.length === 11 && !cleanUrl.includes("/") && !cleanUrl.includes("?")) {
      return cleanUrl;
    }
    const match = cleanUrl.match(
      /(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=|shorts\/))([^&?/\s]{11})/i
    );
    return match ? match[1] : null;
  }

  /**
   * Lấy tiêu đề video qua YouTube oEmbed API (Public, không cần API Key)
   */
  public static async fetchVideoTitle(videoId: string): Promise<string> {
    try {
      const res = await fetch(`${this.OEMBED_URL}?url=https://www.youtube.com/watch?v=${videoId}&format=json`);
      if (res.ok) {
        const data = await res.json();
        if (data.title) return data.title;
      }
    } catch {
      // Ignore network errors on title
    }
    return "YouTube Video";
  }

  /**
   * Lấy phụ đề video tiếng Anh từ Supadata API
   */
  public static async fetchTranscript(videoId: string, apiKey?: string): Promise<SupadataTranscriptBlock[]> {
    const key = apiKey || process.env.SUPADATA_API_KEY;
    if (!key) {
      throw new Error("MISSING_SUPADATA_KEY: Chưa cấu hình biến môi trường SUPADATA_API_KEY.");
    }

    const url = `${this.SUPADATA_BASE_URL}?videoId=${encodeURIComponent(videoId)}&lang=en`;
    const res = await fetch(url, {
      headers: {
        "x-api-key": key,
      },
    });

    if (res.status === 404) {
      throw new Error("NO_TRANSCRIPT: Video này không có phụ đề (Closed Captions).");
    }

    if (res.status === 401 || res.status === 403) {
      throw new Error("INVALID_KEY: SUPADATA_API_KEY không hợp lệ hoặc đã hết hạn.");
    }

    if (!res.ok) {
      const errorText = await res.text().catch(() => "");
      throw new Error(`SUPADATA_ERROR_${res.status}: Lỗi máy chủ Supadata (${errorText})`);
    }

    const data = await res.json();
    const content = data?.content;

    if (!Array.isArray(content) || content.length === 0) {
      throw new Error("NO_TRANSCRIPT: Video này không có phụ đề (Closed Captions).");
    }

    // Ưu tiên các đoạn phụ đề tiếng Anh
    const enContent = content.filter((s: any) => !s.lang || s.lang.startsWith("en"));
    const finalContent = enContent.length > 0 ? enContent : content;

    return finalContent.map((item: any) => ({
      text: item.text,
      start: Math.round(item.offset),
      duration: Math.round(item.duration),
      lang: item.lang,
    }));
  }

  /**
   * Lấy đầy đủ thông tin Metadata và Transcript cho 1 URL YouTube
   */
  public static async fetchVideoInfo(url: string, apiKey?: string): Promise<YoutubeVideoMetadata> {
    const videoId = this.extractVideoId(url);
    if (!videoId) {
      throw new Error("INVALID_URL: Đường dẫn video YouTube không hợp lệ.");
    }

    const [title, rawTranscript] = await Promise.all([
      this.fetchVideoTitle(videoId),
      this.fetchTranscript(videoId, apiKey),
    ]);

    return {
      videoId,
      title,
      rawTranscript,
    };
  }
}
```

- [ ] **Step 2: Viết script kiểm thử đơn vị cho `SupadataService`**

Tạo `scripts/test-supadata-service.ts`:
```typescript
import { SupadataService } from "../src/lib/services/supadata.service";

async function runTest() {
  console.log("Testing extractVideoId...");
  const id1 = SupadataService.extractVideoId("https://www.youtube.com/watch?v=dQw4w9WgXcQ");
  const id2 = SupadataService.extractVideoId("https://youtu.be/dQw4w9WgXcQ");
  console.log("IDs:", id1, id2);
  if (id1 !== "dQw4w9WgXcQ" || id2 !== "dQw4w9WgXcQ") {
    throw new Error("extractVideoId failed");
  }

  console.log("Testing fetchVideoInfo with Supadata...");
  process.env.SUPADATA_API_KEY = "sd_5ed1fee99bf2b4d9996e6ecd921838f5";
  const info = await SupadataService.fetchVideoInfo("https://www.youtube.com/watch?v=dQw4w9WgXcQ");
  console.log("Title:", info.title);
  console.log("VideoId:", info.videoId);
  console.log("Transcript Blocks:", info.rawTranscript.length);
  if (info.rawTranscript.length === 0) {
    throw new Error("rawTranscript is empty");
  }
  console.log("✅ SupadataService test PASSED!");
}

runTest().catch((e) => {
  console.error("❌ Test FAILED:", e);
  process.exit(1);
});
```

- [ ] **Step 3: Chạy script kiểm thử**

Run: `npx -y tsx scripts/test-supadata-service.ts`  
Expected: `✅ SupadataService test PASSED!`

- [ ] **Step 4: Dọn dẹp script test và commit Task 1**

```bash
rm scripts/test-supadata-service.ts
git add src/lib/services/supadata.service.ts
git commit -m "feat(story-shadowing): implement dedicated SupadataService"
```

---

### Task 2: Tái Cấu Trúc `youtubeTranscriptFetcherNode` & Gỡ Bỏ `youtube-transcript`

**Files:**
- Modify: `src/lib/agents/story-shadowing-agent/nodes/youtube-transcript-fetcher.node.ts`
- Modify: `package.json`

- [ ] **Step 1: Tinh giản `youtubeTranscriptFetcherNode` sử dụng `SupadataService`**

Viết lại toàn bộ [youtube-transcript-fetcher.node.ts](file:///Users/anhtus/Documents/Development/NextJS/aha-tools/src/lib/agents/story-shadowing-agent/nodes/youtube-transcript-fetcher.node.ts) không còn bất kỳ import nào của `youtube-transcript`:

```typescript
/**
 * @file youtube-transcript-fetcher.node.ts
 * @description LangGraph Node lấy phụ đề và thông tin video YouTube thông qua SupadataService.
 * Không phụ thuộc vào thư viện cào HTML thô (tránh lỗi IP Datacenter trên Vercel).
 * 
 * Made by Anh Tu - Share to be share
 */

import { YouTubeShadowingStateType } from "../youtube-state";
import { SupadataService } from "@/lib/services/supadata.service";

export async function youtubeTranscriptFetcherNode(
  state: YouTubeShadowingStateType
): Promise<Partial<YouTubeShadowingStateType>> {
  try {
    const url = state.youtubeUrl;
    if (!url) {
      return { error: "Vui lòng cung cấp đường dẫn video YouTube." };
    }

    const { videoId, title, rawTranscript } = await SupadataService.fetchVideoInfo(url);

    return {
      youtubeVideoId: videoId,
      title,
      rawTranscript,
    };
  } catch (err: any) {
    console.error("[YouTubeTranscriptFetcherNode] Error:", err.message);

    if (err.message.startsWith("INVALID_URL")) {
      return { error: "Đường dẫn video YouTube không hợp lệ. Vui lòng kiểm tra lại!" };
    }

    if (err.message.startsWith("NO_TRANSCRIPT")) {
      return {
        error:
          "Video này không có phụ đề (Closed Captions). Vui lòng chọn video khác có phụ đề tiếng Anh!",
      };
    }

    if (err.message.startsWith("MISSING_SUPADATA_KEY")) {
      return {
        error:
          "Chưa cấu hình SUPADATA_API_KEY trên máy chủ. Vui lòng thêm biến môi trường trên Vercel.",
      };
    }

    return {
      error:
        err.message ||
        "Không thể lấy phụ đề video. Video có thể không cung cấp phụ đề tiếng Anh hoặc bị giới hạn bản quyền.",
    };
  }
}
```

- [ ] **Step 2: Gỡ bỏ thư viện `youtube-transcript` khỏi dự án**

Run: `npm uninstall youtube-transcript`  
Expected: `removed 1 package` (hoặc thành công cập nhật `package.json`).

- [ ] **Step 3: Kiểm tra Type check & build sau khi gỡ lib**

Run: `npx tsc --noEmit`  
Expected: 0 errors.

- [ ] **Step 4: Commit Task 2**

```bash
git add src/lib/agents/story-shadowing-agent/nodes/youtube-transcript-fetcher.node.ts package.json package-lock.json
git commit -m "refactor(story-shadowing): delegate transcript fetcher to SupadataService and remove youtube-transcript lib"
```

---

### Task 3: Xây Dựng Custom Hook `useYoutubeSegments`

**Files:**
- Create: `src/hooks/useYoutubeSegments.ts`

- [ ] **Step 1: Viết Custom Hook `useYoutubeSegments`**

Tạo file `src/hooks/useYoutubeSegments.ts`:

```typescript
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
```

- [ ] **Step 2: Kiểm tra biên dịch TypeScript**

Run: `npx tsc --noEmit`  
Expected: 0 errors.

- [ ] **Step 3: Commit Task 3**

```bash
git add src/hooks/useYoutubeSegments.ts
git commit -m "feat(story-shadowing): create useYoutubeSegments custom hook"
```

---

### Task 4: Tinh Giản Trang `CreatePlayerPage` với `useYoutubeSegments`

**Files:**
- Modify: `src/app/apps/story-shadowing/create/page.tsx`

- [ ] **Step 1: Tích hợp hook vào `CreatePlayerPage`**

Thay thế các `useState` rời rạc (`youtubeUrl`, `youtubePreview`, `showSegmentDialog`, `videoTitle`, `suggestedSegments`, v.v.) bằng hook `useYoutubeSegments()`.

Trong `page.tsx`:
```typescript
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
```

Cập nhật `handleYoutubeSubmit`:
```typescript
  const handleYoutubeSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!youtubeUrl) return;

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
```

- [ ] **Step 2: Kiểm tra biên dịch và build**

Run: `npx tsc --noEmit`  
Run: `npm run build`  
Expected: Build thành công (100% pass).

- [ ] **Step 3: Commit Task 4**

```bash
git add src/app/apps/story-shadowing/create/page.tsx
git commit -m "refactor(story-shadowing): integrate useYoutubeSegments hook in create page"
```

---

### Task 5: Kiểm Thử Toàn Diện & Đồng Bộ Quyết Định Kiến Trúc

**Files:**
- Verify: Toàn bộ luồng YouTube Pipeline & Text Pipeline

- [ ] **Step 1: Chạy toàn bộ build production**

Run: `npm run build`  
Expected: Tất cả static & dynamic routes build thành công.

- [ ] **Step 2: Đồng bộ hóa quyết định kiến trúc OpenLore**

Run: `npx openlore decisions --consolidate`  
Run: `npx openlore decisions --sync`

- [ ] **Step 3: Tổng kết tài liệu bàn giao**
