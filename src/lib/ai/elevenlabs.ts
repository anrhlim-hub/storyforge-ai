import { ElevenLabsClient } from "elevenlabs";

export const elevenlabs = new ElevenLabsClient({
  apiKey: process.env.ELEVENLABS_API_KEY!,
});

// Voice ID bisa diubah via env var — ganti dengan suara Indonesia dari ElevenLabs Voice Library
const VOICE_IDS = {
  bimo:     process.env.ELEVENLABS_VOICE_BIMO  ?? "TX3LPaxmHKxFdv7VOQHJ",
  kiko:     process.env.ELEVENLABS_VOICE_KIKO  ?? "cgSgspJ2msm6clMCkdW9",
  narrator: process.env.ELEVENLABS_VOICE_NARR  ?? "JBFqnCBsd6RMkjVDRZzb",
};

// Settings per karakter — disesuaikan dengan kepribadian masing-masing
const VOICE_SETTINGS = {
  bimo: {
    // Anak laki-laki 7 tahun: ceria, pemberani, energik
    stability: 0.35,
    similarity_boost: 0.80,
    style: 0.70,
    use_speaker_boost: true,
  },
  kiko: {
    // Anak perempuan 7 tahun: cerdas, kreatif, playful
    stability: 0.40,
    similarity_boost: 0.82,
    style: 0.65,
    use_speaker_boost: true,
  },
  narrator: {
    // Pencerita: hangat, jelas, ritme lambat agar mudah dipahami anak
    stability: 0.72,
    similarity_boost: 0.75,
    style: 0.25,
    use_speaker_boost: true,
  },
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
    voice_settings: VOICE_SETTINGS[character],
  });

  const chunks: Buffer[] = [];
  for await (const chunk of stream) {
    chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
  }
  return Buffer.concat(chunks);
}
