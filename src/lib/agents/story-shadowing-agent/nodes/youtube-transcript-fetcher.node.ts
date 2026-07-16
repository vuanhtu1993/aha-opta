import { YoutubeTranscript } from "youtube-transcript";
import { YouTubeShadowingStateType } from "../youtube-state";

export async function youtubeTranscriptFetcherNode(
  state: YouTubeShadowingStateType
): Promise<Partial<YouTubeShadowingStateType>> {
  try {
    const url = state.youtubeUrl;

    // Validate YouTube URL and extract ID (basic regex)
    const videoIdMatch = url.match(/(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=))([^&]{11})/);
    if (!videoIdMatch) {
      return { error: "Link YouTube không hợp lệ." };
    }
    const videoId = videoIdMatch[1];

    // Lấy tiêu đề video qua oEmbed API của YouTube (public, ko cần key)
    let title = "YouTube Video";
    try {
      const oembedRes = await fetch(`https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v=${videoId}&format=json`);
      if (oembedRes.ok) {
        const oembedData = await oembedRes.json();
        if (oembedData.title) title = oembedData.title;
      }
    } catch (e) {
      // Bỏ qua nếu lỗi lấy tiêu đề
    }

    // --- Monkey Patch YoutubeTranscript để luôn ưu tiên phụ đề thủ công (Manual) thay vì ASR ---
    if (!(YoutubeTranscript as any).__patchedForManualSubtitles) {
      const originalFetchTranscriptFromTracks = (YoutubeTranscript as any).fetchTranscriptFromTracks;
      (YoutubeTranscript as any).fetchTranscriptFromTracks = async function (captionTracks: any[], vId: string, config: any) {
        let tracks = captionTracks;
        if (config?.lang) {
          tracks = captionTracks.filter((t: any) => t.languageCode === config.lang);
        }

        if (tracks.length > 0) {
          // Chỉ lấy track tiếng Anh (en) và thủ công (không phải asr)
          let bestTrack = tracks.find((t: any) => t.languageCode.startsWith('en') && t.kind !== 'asr');
          
          if (!bestTrack) {
            // Ném lỗi để API trả về báo cho người dùng
            throw new Error("BAD_TRANSCRIPT");
          }
          // Gọi lại hàm gốc nhưng chỉ với 1 track xịn nhất
          return originalFetchTranscriptFromTracks.call(this, [bestTrack], vId, config);
        }
        return originalFetchTranscriptFromTracks.call(this, captionTracks, vId, config);
      };
      (YoutubeTranscript as any).__patchedForManualSubtitles = true;
    }

    // Lấy transcript
    const transcript = await YoutubeTranscript.fetchTranscript(videoId);
    if (!transcript || transcript.length === 0) {
      return { error: "Video này không có phụ đề (CC). Vui lòng chọn video khác." };
    }

    return {
      youtubeVideoId: videoId,
      title: title,
      rawTranscript: transcript.map((t) => ({
        text: t.text,
        start: t.offset,
        duration: t.duration,
      })),
    };
  } catch (err: any) {
    console.error("[YouTubeTranscriptFetcher] Error:", err);
    if (err.message === "BAD_TRANSCRIPT") {
      return { error: "Video này không có phụ đề tiếng Anh thủ công (Manual CC). Phụ đề tự động (Auto-generated) thường sai lệch thời gian rất lớn. Vui lòng chọn video khác!" };
    }
    return { error: "Không thể lấy phụ đề video. Video có thể không cung cấp phụ đề hoặc bị giới hạn quốc gia." };
  }
}
