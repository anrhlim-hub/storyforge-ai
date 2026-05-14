import { NextResponse } from "next/server";
import { createClient } from "@/lib/db/server";
import type { EpisodeFormValues } from "@/components/episodes/episode-form";

export async function GET() {
  const supabase = await createClient();

  const { data: episodes, error } = await supabase
    .from("episodes")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(episodes);
}

export async function POST(request: Request) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = (await request.json()) as EpisodeFormValues;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const db = supabase as any;
  const { data: episode, error } = await db
    .from("episodes")
    .insert({
      title: body.title,
      episode_number: body.episode_number ?? null,
      season: body.season ?? 1,
      theme: body.theme ?? null,
      moral_lesson: body.moral_lesson ?? null,
      target_duration: body.target_duration ?? 60,
      status: "draft",
      created_by: user.id,
    })
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(episode, { status: 201 });
}
