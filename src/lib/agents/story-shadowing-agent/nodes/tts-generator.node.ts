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
    const results = await Promise.all(
      state.rawSentences.map(async (s) => {
        const response = await fetch(url, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            input: { text: s.text },
            // Chọn giọng đọc tự nhiên (Journey) hoặc Neural2.
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

    return { sentences: results };
  } catch (err) {
    console.error("[TtsGenerator] Error:", err);
    return { error: "Lỗi trong quá trình tổng hợp âm thanh bằng Google Cloud TTS." };
  }
}
