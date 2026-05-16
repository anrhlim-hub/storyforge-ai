const RUNWAY_API_BASE = "https://api.runwayml.com/v1";
const RUNWAY_VERSION = "2024-11-06";

export function isRunwayConfigured(): boolean {
  const key = process.env.RUNWAY_API_KEY;
  return !!(key && key !== "your_runway_api_key");
}

function headers() {
  return {
    "Content-Type": "application/json",
    Authorization: `Bearer ${process.env.RUNWAY_API_KEY!}`,
    "X-Runway-Version": RUNWAY_VERSION,
  };
}

export async function animateImage(
  imageUrl: string,
  prompt: string,
): Promise<string> {
  const createRes = await fetch(`${RUNWAY_API_BASE}/image_to_video`, {
    method: "POST",
    headers: headers(),
    body: JSON.stringify({
      promptImage: imageUrl,
      promptText: prompt,
      model: "gen3a_turbo",
      duration: 5,
      ratio: "1280:720",
    }),
  });

  if (!createRes.ok) {
    const err = await createRes.text();
    throw new Error(`Runway API error: ${createRes.status} — ${err}`);
  }

  const createData = await createRes.json();
  const taskId: string | undefined = createData.id;

  if (!taskId) throw new Error("Runway tidak mengembalikan task ID");

  // Poll sampai selesai (maks 90 detik — batas serverless)
  for (let i = 0; i < 18; i++) {
    await new Promise((r) => setTimeout(r, 5000));

    const pollRes = await fetch(`${RUNWAY_API_BASE}/tasks/${taskId}`, {
      headers: headers(),
    });

    if (!pollRes.ok) continue;

    const pollData = await pollRes.json();

    if (pollData.status === "SUCCEEDED") {
      const url: string | undefined = pollData.output?.[0];
      if (!url) throw new Error("Runway selesai tapi tidak ada video");
      return url;
    }

    if (pollData.status === "FAILED") {
      throw new Error(
        `Runway gagal: ${pollData.failure ?? pollData.failureCode ?? "Unknown error"}`,
      );
    }
  }

  throw new Error("Timeout menunggu Runway ML (90 detik) — coba lagi nanti");
}

export function buildAnimationPrompt(title: string, theme: string | null): string {
  return [
    "Gentle camera movement, children's 2D animation style",
    `Scene from episode: "${title}"`,
    theme ? `Theme: ${theme}` : null,
    "Soft smooth motion, colorful, cheerful atmosphere, suitable for children",
  ]
    .filter(Boolean)
    .join(". ");
}
