import { NextResponse } from "next/server";
import { createClient } from "@/lib/db/server";
import type { AssetType } from "@/types/database";

export async function GET(request: Request) {
  const supabase = await createClient();

  const { searchParams } = new URL(request.url);
  const episodeId = searchParams.get("episodeId");
  const type = searchParams.get("type") as AssetType | null;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let query = (supabase as any).from("assets").select("*").order("created_at", { ascending: false });

  if (episodeId) query = query.eq("episode_id", episodeId);
  if (type) query = query.eq("type", type);

  const { data, error } = await query;
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data);
}

export async function POST(request: Request) {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const { name, type, subtype, url, episode_id, duration, size_bytes, metadata } = body;

  if (!name || !type || !url) {
    return NextResponse.json({ error: "name, type, dan url wajib diisi" }, { status: 400 });
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (supabase as any)
    .from("assets")
    .insert({ name, type, subtype: subtype ?? null, url, episode_id: episode_id ?? null, duration: duration ?? null, size_bytes: size_bytes ?? null, metadata: metadata ?? {} })
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data, { status: 201 });
}
