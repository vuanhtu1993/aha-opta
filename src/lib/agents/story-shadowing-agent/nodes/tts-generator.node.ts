import { StorybookStateType } from "../state";

const TTS_URL = `https://texttospeech.googleapis.com/v1/text:synthesize?key=${process.env.GOOGLE_TTS_API_KEY}`;

async function synthesize(text: string): Promise<string> {
  const response = await fetch(TTS_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      input: { text },
      voice: {
        languageCode: "en-US",
        name: "en-US-Standard-D", // Standard = rẻ hơn WaveNet 4x
        ssmlGender: "MALE",
      },
      audioConfig: {
        audioEncoding: "MP3",
        speakingRate: 0.9,   // Đọc chậm hơn 10% — dễ shadow hơn
        pitch: 0,
      },
    }),
  });

  if (!response.ok) {
    throw new Error(`TTS API error: ${response.status}`);
  }

  const data = await response.json();
  // API trả về { audioContent: "base64string" }
  return data.audioContent as string;
}

export async function ttsGeneratorNode(state: StorybookStateType): Promise<Partial<StorybookStateType>> {
  if (state.error || !state.rawSentences?.length) {
    return {}; // Dừng nếu Node trước gặp lỗi
  }

  try {
    // Gọi TTS song song cho tất cả câu để giảm latency
    const results = await Promise.all(
      state.rawSentences.map(async (s) => ({
        id: s.id,
        text: s.text,
        audioBase64: await synthesize(s.text),
      }))
    );

    return { sentences: results };
  } catch (err) {
    console.error("[TtsGenerator] Error:", err);
    return { error: "Không thể tổng hợp âm thanh. Kiểm tra TTS API key." };
  }
}
