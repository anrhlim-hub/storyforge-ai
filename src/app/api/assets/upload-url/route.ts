import { NextResponse } from "next/server";
import { createClient } from "@/lib/db/server";
import { getUploadUrl, buildAssetKey, getPublicUrl, isR2Configured } from "@/lib/storage/r2";

export async function GET(request: Request) {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const filename = searchParams.get("filename");
  const contentType = searchParams.get("contentType");
  const type = searchParams.get("type");
  const episodeId = searchParams.get("episodeId");

  if (!filename || !contentType || !type) {
    return NextResponse.json({ error: "filename, contentType, dan type wajib diisi" }, { status: 400 });
  }

  if (!isR2Configured()) {
    return NextResponse.json(
      { error: "Cloudflare R2 belum dikonfigurasi. Silakan isi R2_ACCOUNT_ID, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY, R2_BUCKET_NAME, dan R2_PUBLIC_URL di .env.local" },
      { status: 503 },
    );
  }

  const key = buildAssetKey(episodeId ?? "global", type, filename);
  const uploadUrl = await getUploadUrl(key, contentType);
  const publicUrl = getPublicUrl(key);

  return NextResponse.json({ uploadUrl, key, publicUrl });
}
