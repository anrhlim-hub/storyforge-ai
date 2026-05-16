import { NextResponse } from "next/server";
import { createClient } from "@/lib/db/server";

export async function GET(request: Request) {
  const supabase = await createClient();
  const { searchParams } = new URL(request.url);
  const episodeId = searchParams.get("episodeId");
  const status = searchParams.get("status");

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const db = supabase as any;
  let query = db
    .from("production_jobs")
    .select(`
      *,
      episodes (id, title, status)
    `)
    .order("created_at", { ascending: false });

  if (episodeId) query = query.eq("episode_id", episodeId);
  if (status) query = query.eq("status", status);

  const { data: jobs, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json(jobs);
}
