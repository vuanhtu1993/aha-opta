import { StorybookStateType } from "../state";

export async function ttsGeneratorNode(state: StorybookStateType): Promise<Partial<StorybookStateType>> {
  if (state.error || !state.rawSentences?.length) {
    return {};
  }

  const apiKey = process.env.GOOGLE_CLOUD_TTS_KEY;
  if (!apiKey) {
    return { error: "Thiếu biến môi trường GOOGLE_CLOUD_TTS_KEY." };
  }

  const url = `https://texttospeech.googleapis.com/v1/text:synthesize?key=${apiKey}`;

  try {
    const speakingRate = 1.0;

    let ttsModel = "en-US-Journey-F"; // Default Female
    if (state.voice === "MALE") ttsModel = "en-US-Journey-D";
    // Allow overriding from env if they pass an exact model name instead of just MALE/FEMALE
    if (state.voice && state.voice.startsWith("en-")) {
      ttsModel = state.voice;
    }

    // Hàm gọi API có retry
    const fetchWithRetry = async (text: string, id: number, retries = 3, delay = 1000): Promise<any> => {
      try {
        const response = await fetch(url, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
            input: { text },
            voice: { languageCode: "en-US", name: ttsModel },
            audioConfig: { audioEncoding: "MP3", speakingRate },
          }),
        });

        if (!response.ok) {
          if (response.status === 429 && retries > 0) {
            console.warn(`[TTS] 429 Rate Limit. Retrying in ${delay}ms...`);
            await new Promise(r => setTimeout(r, delay));
            return fetchWithRetry(text, id, retries - 1, delay * 2);
          }
          const errorBody = await response.text();
          throw new Error(`Google Cloud TTS API error: ${response.status} - Chi tiết: ${errorBody}`);
        }

        const data = await response.json();
        return {
          id,
          text,
          audioBase64: data.audioContent,
        };
      } catch (error) {
        if (retries > 0) {
          await new Promise(r => setTimeout(r, delay));
          return fetchWithRetry(text, id, retries - 1, delay * 2);
        }
        throw error;
      }
    };

    // Lấy config Rate Limit từ biến môi trường (Mặc định 30 requests/phút cho Journey voice)
    const rpmLimit = parseInt(process.env.GOOGLE_TTS_RATE_LIMIT_RPM || "30", 10);
    // Tính toán thời gian cần nghỉ giữa mỗi request (Ví dụ: 30 RPM => 2000ms/request)
    const delayBetweenRequests = Math.ceil((60 * 1000) / rpmLimit);

    const results = [];

    console.log(`[TTS Generator] Bắt đầu tổng hợp âm thanh cho ${state.rawSentences.length} câu (Model: ${ttsModel}, Tốc độ: ${speakingRate}x)...`);
    // Chạy tuần tự từng request để đảm bảo tuyệt đối không vượt quá Rate Limit Burst
    for (let i = 0; i < state.rawSentences.length; i++) {
      const s = state.rawSentences[i];
      console.log(`[TTS Generator] Đang xử lý câu ${i + 1}/${state.rawSentences.length}...`);
      const result = await fetchWithRetry(s.text, s.id);
      // Truyền words[] (IPA) từ Gemini vào output của TTS generator
      results.push({ ...result, words: s.words });
      
      // Nghỉ một khoảng thời gian tính toán được trước khi gửi request tiếp theo
      if (i < state.rawSentences.length - 1) {
        await new Promise(resolve => setTimeout(resolve, delayBetweenRequests));
      }
    }

    console.log(`[TTS Generator] ✅ Hoàn thành tổng hợp âm thanh!`);
    return { sentences: results, speakingRate };
  } catch (err) {
    console.error("[TtsGenerator] Error:", err);
    return { error: "Lỗi trong quá trình tổng hợp âm thanh bằng Google Cloud TTS." };
  }
}
