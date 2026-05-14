import { NextResponse } from "next/server";
import { createClient } from "@/lib/db/server";

export async function POST(request: Request) {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { episodeId } = await request.json();
  if (!episodeId) return NextResponse.json({ error: "episodeId wajib diisi" }, { status: 400 });

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const db = supabase as any;

  // Resolve semua open notes sebelum approve
  await db
    .from("review_notes")
    .update({ status: "resolved" })
    .eq("episode_id", episodeId)
    .eq("status", "open");

  const { data: episode, error } = await db
    .from("episodes")
    .update({
      status: "approved",
      reviewed_by: user.id,
      updated_at: new Date().toISOString(),
    })
    .eq("id", episodeId)
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(episode);
}
