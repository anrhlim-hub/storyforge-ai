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

  // Kling Standard image-to-video — $0.084/sec, ~$0.42 per 5s clip
  // Affordable & reliable, clear image-to-video endpoint
  const result = await fal.subscribe("fal-ai/kling-video/v1.5/standard/image-to-video", {
    input: {
      image_url: imageUrl,
      prompt,
      duration: "5",
      aspect_ratio: "16:9",
    },
  });

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const url: string | undefined = (result as any)?.data?.video?.url;
  if (!url) throw new Error("FAL.ai tidak mengembalikan URL video");
  return url;
}

export function buildAnimationPromptFal(title: string, theme: string | null): string {
  return [
    "Gentle camera movement, children's 2D animation style",
    `Scene from episode: "${title}"`,
    theme ? `Theme: ${theme}` : null,
    "Soft smooth motion, colorful, cheerful atmosphere, suitable for children",
  ]
    .filter(Boolean)
    .join(". ");
}
