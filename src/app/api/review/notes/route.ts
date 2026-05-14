import { NextResponse } from "next/server";
import { createClient } from "@/lib/db/server";

export async function GET(request: Request) {
  const supabase = await createClient();
  const { searchParams } = new URL(request.url);
  const episodeId = searchParams.get("episodeId");

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const db = supabase as any;
  let query = db
    .from("review_notes")
    .select("*, profiles(full_name, avatar_url)")
    .order("created_at", { ascending: true });

  if (episodeId) query = query.eq("episode_id", episodeId);

  const { data: notes, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json(notes);
}

export async function POST(request: Request) {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { episodeId, note, timestamp_ref } = await request.json();
  if (!episodeId || !note?.trim()) {
    return NextResponse.json({ error: "episodeId dan note wajib diisi" }, { status: 400 });
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const db = supabase as any;
  const { data, error } = await db
    .from("review_notes")
    .insert({
      episode_id: episodeId,
      reviewer_id: user.id,
      note: note.trim(),
      status: "open",
      timestamp_ref: timestamp_ref ?? null,
    })
    .select("*, profiles(full_name, avatar_url)")
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data, { status: 201 });
}
