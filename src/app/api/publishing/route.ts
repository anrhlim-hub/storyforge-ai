import { NextResponse } from "next/server";
import { createClient } from "@/lib/db/server";
import { isFacebookConfigured } from "@/lib/facebook";

export async function GET() {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const db = supabase as any;

  const { data, error } = await db
    .from("episodes")
    .select("*")
    .in("status", ["approved", "publishing", "published"])
    .order("updated_at", { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({
    episodes: data ?? [],
    facebookConfigured: isFacebookConfigured(),
  });
}
