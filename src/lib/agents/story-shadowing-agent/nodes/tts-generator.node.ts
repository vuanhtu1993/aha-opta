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
    const concurrency = 3;
    const results = [];

    // Chia nhỏ thành từng chunk (3 câu/lần) để tránh lỗi 429 RESOURCE_EXHAUSTED
    for (let i = 0; i < state.rawSentences.length; i += concurrency) {
      const chunk = state.rawSentences.slice(i, i + concurrency);
      const chunkResults = await Promise.all(
        chunk.map(async (s) => {
          const response = await fetch(url, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              input: { text: s.text },
              voice: { languageCode: "en-US", name: "en-US-Journey-F" }, 
              audioConfig: { audioEncoding: "MP3" },
            }),
          });

          if (!response.ok) {
            const errorBody = await response.text();
            console.error("[TTS API ERROR]", response.status, errorBody);
            throw new Error(`Google Cloud TTS API error: ${response.status} - Chi tiết: ${errorBody}`);
          }

          const data = await response.json();
          return {
            id: s.id,
            text: s.text,
            audioBase64: data.audioContent,
          };
        })
      );
      
      results.push(...chunkResults);
      
      // Nghỉ 1 giây giữa các chunk để tránh Google API Rate Limit
      if (i + concurrency < state.rawSentences.length) {
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }

    return { sentences: results };
  } catch (err) {
    console.error("[TtsGenerator] Error:", err);
    return { error: "Lỗi trong quá trình tổng hợp âm thanh bằng Google Cloud TTS." };
  }
}
