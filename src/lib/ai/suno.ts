const SUNO_API_BASE = "https://studio-api.suno.ai/api";

export function isSunoConfigured(): boolean {
  const key = process.env.SUNO_API_KEY;
  return !!(key && key !== "your_suno_api_key" && key.length > 10);
}

export function buildMusicPrompt(
  title: string,
  theme: string | null,
  moralLesson: string | null,
): string {
  const tags = [
    "children's animation soundtrack",
    "upbeat and cheerful",
    "orchestral with playful melody",
    "suitable for ages 3-8",
    theme ?? null,
  ]
    .filter(Boolean)
    .join(", ");

  const description = [
    `Background music for children's animation episode: "${title}"`,
    theme ? `Theme: ${theme}` : null,
    moralLesson ? `Mood: warm and encouraging` : null,
  ]
    .filter(Boolean)
    .join(". ");

  return JSON.stringify({ tags, description });
}

export async function generateMusic(
  title: string,
  theme: string | null,
  moralLesson: string | null,
): Promise<string> {
  if (!isSunoConfigured()) {
    throw new Error("Suno API belum dikonfigurasi");
  }

  const promptData = JSON.parse(buildMusicPrompt(title, theme, moralLesson)) as {
    tags: string;
    description: string;
  };

  const createRes = await fetch(`${SUNO_API_BASE}/generate/v2/`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${process.env.SUNO_API_KEY}`,
    },
    body: JSON.stringify({
      prompt: promptData.description,
      tags: promptData.tags,
      mv: "chirp-v3-5",
      title,
      make_instrumental: true,
    }),
  });

  if (!createRes.ok) {
    const err = await createRes.text();
    throw new Error(`Suno API error: ${createRes.status} — ${err}`);
  }

  const createData = await createRes.json();
  // Suno returns array of clips
  const clipId: string | undefined = createData.clips?.[0]?.id;
  if (!clipId) throw new Error("Suno tidak mengembalikan clip ID");

  // Poll sampai selesai (maks 60 detik)
  for (let i = 0; i < 12; i++) {
    await new Promise((r) => setTimeout(r, 5000));

    const pollRes = await fetch(`${SUNO_API_BASE}/feed/?ids=${clipId}`, {
      headers: { Authorization: `Bearer ${process.env.SUNO_API_KEY}` },
    });

    if (!pollRes.ok) continue;

    const pollData = await pollRes.json();
    const clip = Array.isArray(pollData) ? pollData[0] : pollData;

    if (clip?.status === "complete" && clip?.audio_url) {
      return clip.audio_url as string;
    }

    if (clip?.status === "error") {
      throw new Error("Suno gagal menggenerate musik");
    }
  }

  throw new Error("Timeout menunggu Suno AI (60 detik)");
}
