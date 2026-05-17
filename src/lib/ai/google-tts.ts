const GOOGLE_TTS_URL = "https://texttospeech.googleapis.com/v1/text:synthesize";

export function isGoogleTtsConfigured(): boolean {
  const key = process.env.GOOGLE_TTS_API_KEY;
  return !!(key && key !== "your_google_tts_api_key");
}

// Karakter per voice — pitch & rate disesuaikan agar terdengar seperti karakter anak animasi
const CHARACTER_CONFIG = {
  bimo: {
    // Panda laki-laki: suara ringan, lambat, lucu
    voice: "id-ID-Neural2-B",
    pitch: +5.0,   // semitones lebih tinggi → lebih ringan/muda
    rate: "82%",   // sedikit lebih lambat → lucu dan gemas
  },
  kiko: {
    // Rubah perempuan: cerdas, ceria, sedikit lebih cepat
    voice: "id-ID-Neural2-C",
    pitch: +4.0,
    rate: "90%",
  },
  narrator: {
    // Pencerita: netral, jelas, ritme lambat agar mudah dipahami
    voice: "id-ID-Neural2-B",
    pitch: +1.0,
    rate: "88%",
  },
} as const;

export type TtsCharacter = keyof typeof CHARACTER_CONFIG;

function escapeXml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;")
    // Hapus teks dalam kurung seperti (penasaran) agar tidak dibaca
    .replace(/\([^)]*\)/g, "");
}

export async function generateVoiceBufferGoogle(
  text: string,
  character: TtsCharacter = "narrator",
): Promise<Buffer> {
  const cfg = CHARACTER_CONFIG[character];

  const pitch = cfg.pitch >= 0 ? `+${cfg.pitch}st` : `${cfg.pitch}st`;
  const ssml = `<speak><prosody pitch="${pitch}" rate="${cfg.rate}">${escapeXml(text)}</prosody></speak>`;

  const res = await fetch(
    `${GOOGLE_TTS_URL}?key=${process.env.GOOGLE_TTS_API_KEY!}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        input: { ssml },
        voice: { languageCode: "id-ID", name: cfg.voice },
        audioConfig: { audioEncoding: "MP3", sampleRateHertz: 44100 },
      }),
    },
  );

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Google TTS error: ${res.status} — ${err}`);
  }

  const data = await res.json() as { audioContent: string };
  return Buffer.from(data.audioContent, "base64");
}
