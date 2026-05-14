import { ElevenLabsClient } from "elevenlabs";

export const elevenlabs = new ElevenLabsClient({
  apiKey: process.env.ELEVENLABS_API_KEY!,
});

// Voice ID dikonfigurasi via env
const VOICE_IDS = {
  bimo:     process.env.ELEVENLABS_VOICE_BIMO  ?? "TX3LPaxmHKxFdv7VOQHJ", // Liam — Energetic (cocok Panda ceria)
  kiko:     process.env.ELEVENLABS_VOICE_KIKO  ?? "cgSgspJ2msm6clMCkdW9", // Jessica — Playful, Bright, Warm (cocok Rubah)
  narrator: process.env.ELEVENLABS_VOICE_NARR  ?? "JBFqnCBsd6RMkjVDRZzb", // George — Warm Storyteller
};

export type VoiceCharacter = keyof typeof VOICE_IDS;

export async function generateVoiceBuffer(
  text: string,
  character: VoiceCharacter = "narrator",
): Promise<Buffer> {
  const stream = await elevenlabs.textToSpeech.convert(VOICE_IDS[character], {
    text,
    model_id: "eleven_multilingual_v2",
    output_format: "mp3_44100_128",
    voice_settings: { stability: 0.5, similarity_boost: 0.75 },
  });

  const chunks: Buffer[] = [];
  for await (const chunk of stream) {
    chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
  }
  return Buffer.concat(chunks);
}
