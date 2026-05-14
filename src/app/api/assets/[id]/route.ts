import { NextResponse } from "next/server";
import { createClient } from "@/lib/db/server";
import { deleteFile } from "@/lib/storage/r2";

type RouteContext = { params: Promise<{ id: string }> };

export async function DELETE(_req: Request, { params }: RouteContext) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: asset, error: fetchError } = await (supabase as any)
    .from("assets")
    .select("url")
    .eq("id", id)
    .single();

  if (fetchError || !asset) {
    return NextResponse.json({ error: "Asset tidak ditemukan" }, { status: 404 });
  }

  // Hapus file dari R2 — ekstrak key dari URL
  try {
    const url = new URL(asset.url as string);
    const key = url.pathname.replace(/^\//, "");
    await deleteFile(key);
  } catch {
    // Lanjutkan meski gagal hapus dari R2 (file mungkin sudah tidak ada)
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (supabase as any).from("assets").delete().eq("id", id);
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return new NextResponse(null, { status: 204 });
}
