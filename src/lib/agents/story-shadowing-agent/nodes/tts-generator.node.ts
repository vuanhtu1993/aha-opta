import { StorybookStateType } from "../state";

const TTS_MODEL = process.env.GEMINI_TTS_MODEL || "gemini-2.5-flash-preview-tts";
const GEMINI_API_URL = `https://generativelanguage.googleapis.com/v1beta/models/${TTS_MODEL}:generateContent?key=${process.env.GOOGLE_API_KEY}`;

function pcmToWavBase64(pcmBase64: string): string {
  const pcmBuffer = Buffer.from(pcmBase64, 'base64');
  const numChannels = 1;
  const sampleRate = 24000;

  const wavHeader = Buffer.alloc(44);
  wavHeader.write('RIFF', 0);
  wavHeader.writeUInt32LE(36 + pcmBuffer.length, 4);
  wavHeader.write('WAVE', 8);
  wavHeader.write('fmt ', 12);
  wavHeader.writeUInt32LE(16, 16); // Subchunk1Size
  wavHeader.writeUInt16LE(1, 20); // AudioFormat (PCM)
  wavHeader.writeUInt16LE(numChannels, 22);
  wavHeader.writeUInt32LE(sampleRate, 24);
  wavHeader.writeUInt32LE(sampleRate * 2, 28); // ByteRate
  wavHeader.writeUInt16LE(2, 32); // BlockAlign
  wavHeader.writeUInt16LE(16, 34); // BitsPerSample
  wavHeader.write('data', 36);
  wavHeader.writeUInt32LE(pcmBuffer.length, 40);

  const wavBuffer = Buffer.concat([wavHeader, pcmBuffer]);
  return wavBuffer.toString('base64');
}

async function synthesizeWithGemini(text: string): Promise<string> {
  const response = await fetch(GEMINI_API_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      // Hướng dẫn Gemini đọc diễn cảm như giáo viên tiếng Anh
      contents: [{ parts: [{ text: `Read this with clear pronunciation: ${text}` }] }],
      generationConfig: {
        responseModalities: ["AUDIO"]
      }
    }),
  });

  if (!response.ok) {
    throw new Error(`Gemini TTS API error: ${response.status}`);
  }

  const data = await response.json();
  if (data.error) {
    throw new Error(data.error.message);
  }

  const pcmBase64 = data.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
  if (!pcmBase64) {
    throw new Error("No audio data returned from Gemini");
  }

  // Gemini trả về PCM 24kHz. Trình duyệt cần WAV header để play qua thẻ <audio>.
  return pcmToWavBase64(pcmBase64);
}

export async function ttsGeneratorNode(state: StorybookStateType): Promise<Partial<StorybookStateType>> {
  if (state.error || !state.rawSentences?.length) {
    return {};
  }

  try {
    const results = await Promise.all(
      state.rawSentences.map(async (s) => ({
        id: s.id,
        text: s.text,
        audioBase64: await synthesizeWithGemini(s.text),
      }))
    );

    return { sentences: results };
  } catch (err) {
    console.error("[TtsGenerator] Error:", err);
    return { error: "Không thể tổng hợp âm thanh bằng Gemini TTS. Kiểm tra lại kết nối hoặc API Key." };
  }
}
