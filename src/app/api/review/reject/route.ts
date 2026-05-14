import { NextResponse } from "next/server";
import { createClient } from "@/lib/db/server";

export async function POST(request: Request) {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { episodeId, reason } = await request.json();
  if (!episodeId) return NextResponse.json({ error: "episodeId wajib diisi" }, { status: 400 });

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const db = supabase as any;

  // Tambah note penolakan jika ada alasan
  if (reason?.trim()) {
    await db.from("review_notes").insert({
      episode_id: episodeId,
      reviewer_id: user.id,
      note: `[DITOLAK] ${reason.trim()}`,
      status: "open",
    });
  }

  const { data: episode, error } = await db
    .from("episodes")
    .update({
      status: "scripting",
      updated_at: new Date().toISOString(),
    })
    .eq("id", episodeId)
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(episode);
}
