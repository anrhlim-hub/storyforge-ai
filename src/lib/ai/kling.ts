import { createHmac } from "crypto";

const KLING_API_BASE = "https://api.klingai.com";

export function isKlingConfigured(): boolean {
  const keyId = process.env.KLING_ACCESS_KEY_ID;
  const keySecret = process.env.KLING_ACCESS_KEY_SECRET;
  return !!(keyId && keySecret && keyId !== "your_kling_key_id");
}

function base64url(str: string): string {
  return Buffer.from(str)
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
}

function generateToken(): string {
  const keyId = process.env.KLING_ACCESS_KEY_ID!;
  const keySecret = process.env.KLING_ACCESS_KEY_SECRET!;
  const now = Math.floor(Date.now() / 1000);
  const header = base64url(JSON.stringify({ alg: "HS256", typ: "JWT" }));
  const payload = base64url(JSON.stringify({ iss: keyId, exp: now + 1800, nbf: now - 5 }));
  const message = `${header}.${payload}`;
  const sig = createHmac("sha256", keySecret)
    .update(message)
    .digest("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
  return `${message}.${sig}`;
}

function headers() {
  return {
    "Content-Type": "application/json",
    Authorization: `Bearer ${generateToken()}`,
  };
}

export async function animateImageKling(
  imageUrl: string,
  prompt: string,
): Promise<string> {
  // Submit task
  const submitRes = await fetch(`${KLING_API_BASE}/v1/videos/image2video`, {
    method: "POST",
    headers: headers(),
    body: JSON.stringify({
      model_name: "kling-v1-5",
      mode: "std",
      image: imageUrl,
      prompt,
      duration: "5",
      aspect_ratio: "16:9",
      cfg_scale: 0.5,
    }),
  });

  if (!submitRes.ok) {
    const err = await submitRes.text();
    throw new Error(`Kling API error: ${submitRes.status} — ${err}`);
  }

  const submitData = await submitRes.json();
  if (submitData.code !== 0) {
    throw new Error(`Kling error: ${submitData.message}`);
  }

  const taskId: string = submitData.data?.task_id;
  if (!taskId) throw new Error("Kling tidak mengembalikan task ID");

  // Poll setiap 10 detik, maks 180 detik (18 iterasi)
  for (let i = 0; i < 18; i++) {
    await new Promise((r) => setTimeout(r, 10000));

    const pollRes = await fetch(
      `${KLING_API_BASE}/v1/videos/image2video/${taskId}`,
      { headers: headers() },
    );

    if (!pollRes.ok) continue;

    const pollData = await pollRes.json();
    const status: string = pollData.data?.task_status;

    if (status === "succeed") {
      const url: string | undefined = pollData.data?.task_result?.videos?.[0]?.url;
      if (!url) throw new Error("Kling selesai tapi tidak ada URL video");
      return url;
    }

    if (status === "failed") {
      throw new Error(`Kling gagal: ${pollData.data?.task_status_msg ?? "Unknown error"}`);
    }
  }

  throw new Error("Timeout menunggu Kling (180 detik) — coba lagi nanti");
}

export function buildAnimationPromptKling(title: string, theme: string | null): string {
  return [
    "Gentle camera movement, children's 2D animation style",
    `Scene from episode: "${title}"`,
    theme ? `Theme: ${theme}` : null,
    "Soft smooth motion, colorful, cheerful, suitable for children",
  ]
    .filter(Boolean)
    .join(". ");
}
