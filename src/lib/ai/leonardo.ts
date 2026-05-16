const LEONARDO_API_BASE = "https://cloud.leonardo.ai/api/rest/v1";

// Phoenix model — best quality for illustration/animation style
const MODEL_ID = "de7d3faf-762f-48e0-b3b7-9d0ac3a3fcf3";

export function isLeonardoConfigured(): boolean {
  const key = process.env.LEONARDO_API_KEY;
  return !!(key && key !== "your_leonardo_api_key");
}

function headers() {
  return {
    "Content-Type": "application/json",
    Authorization: `Bearer ${process.env.LEONARDO_API_KEY!}`,
  };
}

export async function generateSceneImage(prompt: string): Promise<string> {
  const createRes = await fetch(`${LEONARDO_API_BASE}/generations`, {
    method: "POST",
    headers: headers(),
    body: JSON.stringify({
      prompt,
      modelId: MODEL_ID,
      width: 1280,
      height: 720,
      num_images: 1,
      alchemy: true,
      photoReal: false,
      presetStyle: "ILLUSTRATION",
    }),
  });

  if (!createRes.ok) {
    const err = await createRes.text();
    throw new Error(`Leonardo API error: ${createRes.status} — ${err}`);
  }

  const createData = await createRes.json();
  const generationId: string | undefined =
    createData.sdGenerationJob?.generationId;

  if (!generationId) throw new Error("Leonardo tidak mengembalikan generationId");

  // Poll sampai selesai (maks 90 detik)
  for (let i = 0; i < 45; i++) {
    await new Promise((r) => setTimeout(r, 2000));

    const pollRes = await fetch(`${LEONARDO_API_BASE}/generations/${generationId}`, {
      headers: headers(),
    });

    if (!pollRes.ok) continue;

    const pollData = await pollRes.json();
    const gen = pollData.generations_by_pk;

    if (gen?.status === "COMPLETE") {
      const url: string | undefined = gen.generated_images?.[0]?.url;
      if (!url) throw new Error("Leonardo selesai tapi tidak ada gambar");
      return url;
    }

    if (gen?.status === "FAILED") {
      throw new Error("Leonardo gagal menggenerate gambar");
    }
  }

  throw new Error("Timeout menunggu Leonardo AI (90 detik)");
}

export function buildImagePrompt(
  title: string,
  theme: string | null,
  moralLesson: string | null,
): string {
  const base = `Children's animated illustration, cute panda character named Bimo and fox character named Kiko, colorful and cheerful, soft lighting, vibrant colors`;
  const context = [
    `Scene from episode: "${title}"`,
    theme ? `Theme: ${theme}` : null,
    moralLesson ? `Moral: ${moralLesson}` : null,
  ]
    .filter(Boolean)
    .join(". ");

  return `${base}. ${context}. High quality, 2D animation style, suitable for children aged 3-8.`;
}
