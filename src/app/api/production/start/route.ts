import { NextResponse } from "next/server";
import { createClient } from "@/lib/db/server";
import type { JobType } from "@/types/database";

const PIPELINE_STEPS: JobType[] = [
  "voice_over",
  "image_generation",
  "animation",
  "music_generation",
  "video_composition",
  "publishing",
];

export async function POST(request: Request) {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { episodeId } = await request.json();
  if (!episodeId) return NextResponse.json({ error: "episodeId wajib diisi" }, { status: 400 });

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const db = supabase as any;

  const { data: episode } = await db
    .from("episodes")
    .select("id, title, script, status")
    .eq("id", episodeId)
    .single();

  if (!episode) return NextResponse.json({ error: "Episode tidak ditemukan" }, { status: 404 });
  if (!episode.script) return NextResponse.json({ error: "Episode belum punya script" }, { status: 400 });

  // Ambil jobs yang sudah ada untuk episode ini
  const { data: existingJobs } = await db
    .from("production_jobs")
    .select("job_type, status")
    .eq("episode_id", episodeId);

  const doneTypes = new Set(
    (existingJobs ?? [])
      .filter((j: { job_type: string; status: string }) => ["pending", "processing", "completed"].includes(j.status))
      .map((j: { job_type: string }) => j.job_type)
  );

  // Buat jobs untuk step yang belum ada
  const jobsToCreate = PIPELINE_STEPS
    .filter((type) => !doneTypes.has(type))
    .map((type, index) => ({
      episode_id: episodeId,
      job_type: type,
      status: "pending",
      priority: index + 1,
      payload: { episode_title: episode.title },
    }));

  if (jobsToCreate.length === 0) {
    return NextResponse.json({ message: "Semua job sudah dibuat", jobs: [] });
  }

  const { data: jobs, error } = await db
    .from("production_jobs")
    .insert(jobsToCreate)
    .select();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // Update status episode
  await db
    .from("episodes")
    .update({ status: "voice_over", updated_at: new Date().toISOString() })
    .eq("id", episodeId);

  return NextResponse.json({ jobs, count: jobs.length }, { status: 201 });
}
