import dotenv from "dotenv";
dotenv.config();
async function test() {
  const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-tts:generateContent?key=${process.env.GOOGLE_API_KEY}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      contents: [{ parts: [{ text: "Please read this sentence: Hello world." }] }],
      generationConfig: {
        responseModalities: ["AUDIO"]
      }
    })
  });
  const data = await res.json();
  if (data.error) {
    console.log(JSON.stringify(data).substring(0, 500));
  } else {
    console.log(data.candidates?.[0]?.content?.parts?.[0]?.inlineData?.mimeType);
    console.log(data.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data?.substring(0, 50));
  }
}
test();
