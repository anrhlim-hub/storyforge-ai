import { NextResponse } from "next/server";
import { createClient } from "@/lib/db/server";

export async function POST(request: Request) {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { episodeId, scheduledAt } = await request.json();
  if (!episodeId) return NextResponse.json({ error: "episodeId wajib diisi" }, { status: 400 });

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const db = supabase as any;

  const { data: episode, error } = await db
    .from("episodes")
    .update({
      scheduled_at: scheduledAt ?? null,
      updated_at: new Date().toISOString(),
    })
    .eq("id", episodeId)
    .eq("status", "approved")
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  if (!episode) return NextResponse.json({ error: "Episode tidak ditemukan atau bukan status approved" }, { status: 404 });

  return NextResponse.json(episode);
}
