import { NextResponse } from "next/server";
import { createClient } from "@/lib/db/server";

type RouteContext = { params: Promise<{ id: string }> };

export async function GET(_request: Request, { params }: RouteContext) {
  const { id } = await params;
  const supabase = await createClient();

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const db = supabase as any;
  const { data: character, error } = await db
    .from("characters")
    .select("*")
    .eq("id", id)
    .single();

  if (error || !character) {
    return NextResponse.json({ error: "Karakter tidak ditemukan" }, { status: 404 });
  }

  return NextResponse.json(character);
}

export async function PATCH(request: Request, { params }: RouteContext) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();

  const updateData: Record<string, unknown> = {};
  if (body.name !== undefined) updateData.name = body.name;
  if (body.type !== undefined) updateData.type = body.type;
  if (body.species !== undefined) updateData.species = body.species;
  if (body.description !== undefined) updateData.description = body.description;
  if (body.personality !== undefined) updateData.personality = body.personality;
  if (body.avatar_url !== undefined) updateData.avatar_url = body.avatar_url;
  if (body.reference_images !== undefined) updateData.reference_images = body.reference_images;
  if (body.is_active !== undefined) updateData.is_active = body.is_active;
  updateData.updated_at = new Date().toISOString();

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const db = supabase as any;
  const { data: character, error } = await db
    .from("characters")
    .update(updateData)
    .eq("id", id)
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(character);
}

export async function DELETE(_request: Request, { params }: RouteContext) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const db = supabase as any;
  const { error } = await db.from("characters").delete().eq("id", id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
