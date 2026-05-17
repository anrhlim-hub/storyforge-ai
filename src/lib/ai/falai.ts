import { fal } from "@fal-ai/client";

export function isFalConfigured(): boolean {
  const key = process.env.FAL_API_KEY;
  return !!(key && key !== "your_fal_api_key");
}

export async function animateImageFal(
  imageUrl: string,
  prompt: string,
): Promise<string> {
  fal.config({ credentials: process.env.FAL_API_KEY! });

  // LTX Video image-to-video — ~$0.02-0.05 per video, fast & affordable
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const result = await (fal.subscribe as any)("fal-ai/ltx-video/image-to-video", {
    input: {
      image_url: imageUrl,
      prompt,
      duration: 5,
      resolution: "720p",
    },
  });

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const url: string | undefined = (result as any)?.data?.video?.url;
  if (!url) throw new Error("FAL.ai LTX Video tidak mengembalikan URL video");
  return url;
}

export function buildAnimationPromptFal(title: string, theme: string | null): string {
  return [
    "Gentle camera movement, children's 2D animation style",
    `Scene from episode: "${title}"`,
    theme ? `Theme: ${theme}` : null,
    "Soft smooth motion, colorful, cheerful, suitable for children",
  ]
    .filter(Boolean)
    .join(". ");
}
