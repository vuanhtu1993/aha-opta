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
   * Trích xuất YouTube Video ID từ nhiều định dạng URL khác nhau (watch, share, embed, shorts)
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
