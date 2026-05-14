import { NextResponse } from "next/server";
import { createClient } from "@/lib/db/server";

export async function GET() {
  const supabase = await createClient();

  const { data: characters, error } = await supabase
    .from("characters")
    .select("*")
    .order("created_at", { ascending: true });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(characters);
}

export async function POST(request: Request) {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const db = supabase as any;
  const { data: character, error } = await db
    .from("characters")
    .insert({
      name: body.name,
      type: body.type ?? "supporting",
      species: body.species ?? null,
      description: body.description ?? null,
      personality: body.personality ?? null,
      avatar_url: body.avatar_url ?? null,
      reference_images: body.reference_images ?? [],
      is_active: body.is_active ?? true,
    })
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(character, { status: 201 });
}
