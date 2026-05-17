import { NextResponse } from "next/server";
import { createClient } from "@/lib/db/server";
import { generateVoiceBuffer, type VoiceCharacter } from "@/lib/ai/elevenlabs";
import { isGoogleTtsConfigured, generateVoiceBufferGoogle, type TtsCharacter } from "@/lib/ai/google-tts";
import { uploadBuffer, buildAssetKey, getPublicUrl, isR2Configured, uploadFromUrl } from "@/lib/storage/r2";
import { generateScript } from "@/lib/ai/claude";
import { isLeonardoConfigured, generateSceneImage } from "@/lib/ai/leonardo";
import { isFalConfigured, animateImageFal, buildAnimationPromptFal } from "@/lib/ai/falai";
import { parseScenes } from "@/lib/ai/scene-parser";
import { isSunoConfigured, generateMusic, buildMusicPrompt } from "@/lib/ai/suno";
import { getMusicTrack } from "@/lib/ai/music-library";
import { notifyReviewReady, notifyProductionFailed } from "@/lib/notifications/email";

type ScriptLine = { character: VoiceCharacter; text: string };

function parseScript(script: string): ScriptLine[] {
  return script
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean)
    .reduce<ScriptLine[]>((acc, line) => {
      const match = line.match(/^\[(NARASI|BIMO|KIKO)\]\s*(.+)/i);
      if (match) {
        const raw = match[1].toUpperCase();
        const character: VoiceCharacter =
          raw === "BIMO" ? "bimo" : raw === "KIKO" ? "kiko" : "narrator";
        acc.push({ character, text: match[2].trim() });
      }
      return acc;
    }, []);
}

async function runScriptGeneration(episode: Record<string, unknown>) {
  const script = await generateScript({
    title: episode.title as string,
    theme: (episode.theme as string) ?? null,
    moral_lesson: (episode.moral_lesson as string) ?? null,
    target_duration: (episode.target_duration as number) ?? 300,
  });
  return { script };
}

async function runVoiceOver(episodeId: string, script: string) {
  const lines = parseScript(script);
  if (lines.length === 0) throw new Error("Script tidak memiliki dialog yang bisa diproses");

  if (!isR2Configured()) {
    return { simulated: true, lines: lines.length, warning: "R2 belum dikonfigurasi — mode simulasi" };
  }

  // Gunakan Google TTS (suara Indonesia + pitch adjustment) jika tersedia, fallback ke ElevenLabs
  const useGoogle = isGoogleTtsConfigured();

  const audioFiles: { character: string; url: string; key: string }[] = [];
  for (const line of lines) {
    let buffer: Buffer;
    if (useGoogle) {
      buffer = await generateVoiceBufferGoogle(line.text, line.character as TtsCharacter);
    } else {
      buffer = await generateVoiceBuffer(line.text, line.character as VoiceCharacter);
    }
    const key = buildAssetKey(episodeId, "voice", `${line.character}_${Date.now()}.mp3`);
    await uploadBuffer(key, buffer, "audio/mpeg");
    audioFiles.push({ character: line.character, url: getPublicUrl(key), key });
  }

  return {
    simulated: false,
    provider: useGoogle ? "google-tts" : "elevenlabs",
    lines: audioFiles.length,
    audio_files: audioFiles,
  };
}

async function runImageGeneration(episodeId: string, episode: Record<string, unknown>) {
  if (!isLeonardoConfigured()) {
    return { simulated: true, message: "Leonardo AI belum dikonfigurasi — mode simulasi" };
  }

  const scenes = parseScenes((episode.script as string) ?? "");

  if (scenes.length === 0) {
    return { simulated: true, message: "Script belum ada adegan NARASI" };
  }

  // Generate semua scene image secara paralel
  const imagePromises = scenes.map(async (scene) => {
    const url = await generateSceneImage(scene.imagePrompt);
    if (!isR2Configured()) return url;
    const key = buildAssetKey(episodeId, "images", `scene${scene.index}_${Date.now()}.jpg`);
    await uploadFromUrl(key, url, "image/jpeg");
    return getPublicUrl(key);
  });

  const sceneImages = await Promise.all(imagePromises);
  return { simulated: false, scene_images: sceneImages, count: sceneImages.length };
}

async function runAnimation(episodeId: string, episode: Record<string, unknown>, db: unknown) {
  if (!isFalConfigured()) {
    return { simulated: true, message: "FAL.ai belum dikonfigurasi — mode simulasi" };
  }

  // Ambil scene images dari hasil image_generation job
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: imgJob } = await (db as any)
    .from("production_jobs")
    .select("result")
    .eq("episode_id", episode.id)
    .eq("job_type", "image_generation")
    .eq("status", "completed")
    .single();

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const sceneImages: string[] = (imgJob?.result as any)?.scene_images ?? [];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const fallbackImage: string | null = (episode as any).thumbnail_url ?? null;

  const imagesToAnimate = sceneImages.length > 0 ? sceneImages : fallbackImage ? [fallbackImage] : [];

  if (imagesToAnimate.length === 0) {
    return { simulated: true, message: "Belum ada gambar — jalankan image_generation dulu" };
  }

  const scenes = parseScenes((episode.script as string) ?? "");

  // Generate semua video clip secara paralel (Kling Standard via FAL.ai)
  const clipPromises = imagesToAnimate.map(async (imgUrl, i) => {
    const scene = scenes[i];
    const prompt = scene
      ? scene.animationPrompt
      : buildAnimationPromptFal(episode.title as string, (episode.theme as string) ?? null);
    const clipUrl = await animateImageFal(imgUrl, prompt);
    if (!isR2Configured()) return clipUrl;
    const key = buildAssetKey(episodeId, "animation", `scene${i}_${Date.now()}.mp4`);
    await uploadFromUrl(key, clipUrl, "video/mp4");
    return getPublicUrl(key);
  });

  const sceneVideos = await Promise.all(clipPromises);
  return { simulated: false, scene_videos: sceneVideos, count: sceneVideos.length, video_url: sceneVideos[0] };
}

function simulateJob(jobType: string) {
  return {
    simulated: true,
    jobType,
    message: `${jobType} belum dikonfigurasi — mode simulasi aktif`,
  };
}

const EPISODE_STATUS_AFTER: Record<string, string> = {
  script_generation: "voice_over",
  voice_over:        "animating",
  image_generation:  "animating",
  animation:         "compositing",
  music_generation:  "compositing",
  video_composition: "review",
  publishing:        "review",
};

export async function POST(request: Request) {
  const supabase = await createClient();

  const { jobId } = await request.json();
  if (!jobId) return NextResponse.json({ error: "jobId wajib diisi" }, { status: 400 });

  // Izinkan panggilan internal dari worker/cron via secret header
  const internalSecret = request.headers.get("x-internal-secret");
  const isInternal = internalSecret && internalSecret === process.env.CRON_SECRET;

  if (!isInternal) {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let db: any;
  if (isInternal) {
    const { createServiceClient } = await import("@/lib/db/service");
    db = createServiceClient();
  } else {
    db = supabase;
  }

  const { data: job } = await db
    .from("production_jobs")
    .select("*, episodes(*)")
    .eq("id", jobId)
    .single();

  if (!job) return NextResponse.json({ error: "Job tidak ditemukan" }, { status: 404 });
  if (job.status === "completed") return NextResponse.json({ error: "Job sudah selesai" }, { status: 400 });
  if (job.status === "processing") return NextResponse.json({ error: "Job sedang berjalan" }, { status: 400 });

  const episode = job.episodes;
  if (!episode) return NextResponse.json({ error: "Episode tidak ditemukan" }, { status: 404 });

  await db.from("production_jobs").update({
    status: "processing",
    started_at: new Date().toISOString(),
    attempts: (job.attempts ?? 0) + 1,
    updated_at: new Date().toISOString(),
  }).eq("id", jobId);

  try {
    let result: Record<string, unknown>;

    switch (job.job_type) {
      case "script_generation":
        result = await runScriptGeneration(episode);
        await db.from("episodes").update({
          script: result.script,
          status: "voice_over",
          updated_at: new Date().toISOString(),
        }).eq("id", episode.id);
        break;

      case "voice_over":
        if (!episode.script) throw new Error("Episode belum memiliki script — generate script dulu");
        result = await runVoiceOver(episode.id, episode.script as string);
        await db.from("episodes").update({
          status: "animating",
          updated_at: new Date().toISOString(),
        }).eq("id", episode.id);
        break;

      case "image_generation": {
        result = await runImageGeneration(episode.id, episode);
        const thumbnailUpdate: Record<string, unknown> = {
          status: "animating",
          updated_at: new Date().toISOString(),
        };
        // Simpan gambar pertama sebagai thumbnail
        const sceneImgs = result.scene_images as string[] | undefined;
        if (sceneImgs && sceneImgs.length > 0) {
          thumbnailUpdate.thumbnail_url = sceneImgs[0];
        }
        await db.from("episodes").update(thumbnailUpdate).eq("id", episode.id);
        break;
      }

      case "animation": {
        result = await runAnimation(episode.id, episode, db);
        const animUpdate: Record<string, unknown> = {
          status: "compositing",
          updated_at: new Date().toISOString(),
        };
        // Simpan video pertama sebagai video_url utama
        if (!result.simulated && result.video_url) {
          animUpdate.video_url = result.video_url;
        }
        await db.from("episodes").update(animUpdate).eq("id", episode.id);
        break;
      }

      case "music_generation": {
        if (isSunoConfigured()) {
          // Gunakan Suno jika tersedia
          const musicUrl = await generateMusic(
            episode.title as string,
            (episode.theme as string) ?? null,
            (episode.moral_lesson as string) ?? null,
          );
          if (isR2Configured()) {
            const key = buildAssetKey(episode.id, "music", `bg_${Date.now()}.mp3`);
            await uploadFromUrl(key, musicUrl, "audio/mpeg");
            result = { music_url: getPublicUrl(key), source: "suno", key };
          } else {
            result = { music_url: musicUrl, source: "suno" };
          }
        } else {
          // Fallback ke music library (R2 atau FreePD public domain)
          const track = await getMusicTrack((episode.theme as string) ?? null);
          result = { music_url: track.url, name: track.name, source: track.source };
        }
        await db.from("episodes").update({
          status: "compositing",
          updated_at: new Date().toISOString(),
        }).eq("id", episode.id);
        break;
      }

      default: {
        result = simulateJob(job.job_type);
        const nextStatus = EPISODE_STATUS_AFTER[job.job_type];
        if (nextStatus) {
          const statusUpdate: Record<string, unknown> = {
            status: nextStatus,
            updated_at: new Date().toISOString(),
          };
          // video_composition selesai → set video_url final (pakai animation url jika ada)
          if (job.job_type === "video_composition" && episode.video_url) {
            statusUpdate.video_url = episode.video_url;
          }
          await db.from("episodes").update(statusUpdate).eq("id", episode.id);
        }
        break;
      }
    }

    const { data: updated } = await db.from("production_jobs").update({
      status: "completed",
      result,
      completed_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }).eq("id", jobId).select().single();

    // Kirim notifikasi saat episode masuk "review"
    if (EPISODE_STATUS_AFTER[job.job_type] === "review") {
      void notifyReviewReady(episode.title as string, episode.id as string);
    }

    return NextResponse.json(updated);

  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Terjadi kesalahan";
    await db.from("production_jobs").update({
      status: "failed",
      error_message: message,
      completed_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }).eq("id", jobId);
    void notifyProductionFailed(episode.title as string, episode.id as string, message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
