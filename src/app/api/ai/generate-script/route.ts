import { NextResponse } from "next/server";
import { createClient } from "@/lib/db/server";
import { generateScript } from "@/lib/ai/claude";

export async function POST(request: Request) {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { episodeId } = await request.json();
  if (!episodeId) {
    return NextResponse.json({ error: "episodeId wajib diisi" }, { status: 400 });
  }

  const { data: episode, error } = await supabase
    .from("episodes")
    .select("title, theme, moral_lesson, target_duration")
    .eq("id", episodeId)
    .single();

  if (error || !episode) {
    return NextResponse.json({ error: "Episode tidak ditemukan" }, { status: 404 });
  }

  const script = await generateScript({
    title: episode.title,
    theme: episode.theme,
    moral_lesson: episode.moral_lesson,
    target_duration: episode.target_duration,
  });

  return NextResponse.json({ script });
}
