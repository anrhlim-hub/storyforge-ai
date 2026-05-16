import { r2, isR2Configured } from "@/lib/storage/r2";
import { ListObjectsV2Command } from "@aws-sdk/client-s3";

const BUCKET = process.env.R2_BUCKET_NAME!;
const PUBLIC_URL = process.env.R2_PUBLIC_URL!;
const MUSIC_PREFIX = "music-library/";

// Fallback: public domain children's music dari archive.org / freepd.com
const FALLBACK_TRACKS = [
  {
    name: "Happy Children",
    url: "https://freepd.com/music/Happy%20Boy%20Theme.mp3",
    mood: "happy",
  },
  {
    name: "Playful Adventure",
    url: "https://freepd.com/music/Pixelland.mp3",
    mood: "adventure",
  },
  {
    name: "Gentle Bedtime",
    url: "https://freepd.com/music/Acoustic%20Meditation.mp3",
    mood: "calm",
  },
];

function pickByMood(mood: string | null): (typeof FALLBACK_TRACKS)[0] {
  if (!mood) return FALLBACK_TRACKS[0];
  const lower = mood.toLowerCase();
  if (lower.includes("petualangan") || lower.includes("adventure") || lower.includes("seru")) {
    return FALLBACK_TRACKS[1];
  }
  if (lower.includes("tidur") || lower.includes("tenang") || lower.includes("damai")) {
    return FALLBACK_TRACKS[2];
  }
  return FALLBACK_TRACKS[0];
}

export async function getMusicTrack(
  theme: string | null,
): Promise<{ url: string; name: string; source: "r2" | "fallback" }> {
  // Coba ambil dari R2 music-library/ dulu
  if (isR2Configured()) {
    try {
      const res = await r2.send(
        new ListObjectsV2Command({ Bucket: BUCKET, Prefix: MUSIC_PREFIX }),
      );
      const objects = (res.Contents ?? []).filter((o) => o.Key?.endsWith(".mp3"));
      if (objects.length > 0) {
        const picked = objects[Math.floor(Math.random() * objects.length)];
        return {
          url: `${PUBLIC_URL}/${picked.Key}`,
          name: picked.Key!.replace(MUSIC_PREFIX, "").replace(".mp3", ""),
          source: "r2",
        };
      }
    } catch {
      // Fallback ke default jika R2 gagal
    }
  }

  // Fallback ke FreePD public domain tracks
  const track = pickByMood(theme);
  return { ...track, source: "fallback" };
}
