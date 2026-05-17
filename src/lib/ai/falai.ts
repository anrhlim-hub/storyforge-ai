import { fal } from "@fal-ai/client";

export function isFalConfigured(): boolean {
  const key = process.env.FAL_API_KEY;
  return !!(key && key !== "your_fal_api_key");
}

function configFal() {
  fal.config({ credentials: process.env.FAL_API_KEY! });
}

// Single clip — Kling v1.5 Standard image-to-video
export async function animateImageFal(
  imageUrl: string,
  prompt: string,
): Promise<string> {
  configFal();

  const result = await fal.subscribe("fal-ai/kling-video/v1.5/standard/image-to-video", {
    input: {
      image_url: imageUrl,
      prompt,
      duration: "5",
      aspect_ratio: "16:9",
    },
    pollInterval: 5000,
    timeout: 120000,
  });

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const url: string | undefined = (result as any)?.data?.video?.url;
  if (!url) throw new Error("FAL.ai Kling tidak mengembalikan URL video");
  return url;
}

// Submit multi-scene generation asynchronously — returns request IDs
export async function submitSceneAnimation(
  imageUrl: string,
  prompt: string,
): Promise<string> {
  configFal();

  const submitted = await fal.queue.submit("fal-ai/kling-video/v1.5/standard/image-to-video", {
    input: {
      image_url: imageUrl,
      prompt,
      duration: "5",
      aspect_ratio: "16:9",
    },
  });

  return submitted.request_id;
}

// Poll a submitted request until complete
export async function pollSceneAnimation(requestId: string): Promise<string> {
  configFal();

  const result = await fal.queue.result("fal-ai/kling-video/v1.5/standard/image-to-video", {
    requestId,
  });

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const url: string | undefined = (result as any)?.data?.video?.url;
  if (!url) throw new Error(`FAL.ai request ${requestId} selesai tanpa URL video`);
  return url;
}

export function buildAnimationPromptFal(title: string, theme: string | null): string {
  return [
    "Smooth gentle camera movement, children's 2D animation style",
    `Scene from episode: "${title}"`,
    theme ? `Theme: ${theme}` : null,
    "Bimo the cute panda and Kiko the cute fox, colorful and cheerful",
    "Soft natural motion, warm lighting, suitable for children aged 3-8",
  ]
    .filter(Boolean)
    .join(". ");
}
