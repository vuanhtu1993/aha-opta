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

    if (err.message?.startsWith("INVALID_URL")) {
      return { error: "Đường dẫn video YouTube không hợp lệ. Vui lòng kiểm tra lại!" };
    }

    if (err.message?.startsWith("NO_TRANSCRIPT")) {
      return {
        error:
          "Video này không có phụ đề (Closed Captions). Vui lòng chọn video khác có phụ đề tiếng Anh!",
      };
    }

    if (err.message?.startsWith("MISSING_SUPADATA_KEY")) {
      return {
        error:
          "Chưa cấu hình biến môi trường SUPADATA_API_KEY trên máy chủ. Vui lòng cấu hình trên Vercel để lấy phụ đề.",
      };
    }

    if (err.message?.startsWith("INVALID_KEY")) {
      return {
        error:
          "SUPADATA_API_KEY không hợp lệ hoặc đã hết hạn. Vui lòng kiểm tra lại cấu hình API key.",
      };
    }

    return {
      error:
        err.message ||
        "Không thể lấy phụ đề video. Video có thể không cung cấp phụ đề tiếng Anh hoặc bị giới hạn bản quyền.",
    };
  }
}
