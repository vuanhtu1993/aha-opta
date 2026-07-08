import dotenv from "dotenv";
dotenv.config();

async function test() {
  const apiKey = process.env.GOOGLE_CLOUD_TTS_KEY;
  if (!apiKey) {
    console.error("No GOOGLE_CLOUD_TTS_KEY found");
    return;
  }
  const url = `https://texttospeech.googleapis.com/v1/text:synthesize?key=${apiKey}`;
  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      input: { text: "hello" },
      voice: { languageCode: "en-US", name: "en-US-Journey-F" }, 
      audioConfig: { audioEncoding: "MP3" },
    }),
  });
  
  if (!response.ok) {
    console.log("Error status:", response.status);
    console.log("Error body:", await response.text());
  } else {
    console.log("Success!");
  }
}
test();
