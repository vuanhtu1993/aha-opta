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
    const concurrency = 4;
    const results = [];

    // Hàm gọi API có retry
    const fetchWithRetry = async (text: string, id: string, retries = 3, delay = 1000): Promise<any> => {
      try {
        const response = await fetch(url, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            input: { text },
            voice: { languageCode: "en-US", name: "en-US-Neural2-F" }, // Chuyển sang Neural2 (Nhanh hơn, quota cao hơn Journey)
            audioConfig: { audioEncoding: "MP3" },
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

    // Chia nhỏ thành từng chunk
    for (let i = 0; i < state.rawSentences.length; i += concurrency) {
      const chunk = state.rawSentences.slice(i, i + concurrency);
      const chunkResults = await Promise.all(
        chunk.map(s => fetchWithRetry(s.text, s.id))
      );
      
      results.push(...chunkResults);
      
      // Nghỉ 500ms giữa các chunk để tránh Google API Rate Limit
      if (i + concurrency < state.rawSentences.length) {
        await new Promise(resolve => setTimeout(resolve, 500));
      }
    }

    return { sentences: results };
  } catch (err) {
    console.error("[TtsGenerator] Error:", err);
    return { error: "Lỗi trong quá trình tổng hợp âm thanh bằng Google Cloud TTS." };
  }
}
