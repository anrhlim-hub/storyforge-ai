import { NextResponse } from "next/server";
import { createClient } from "@/lib/db/server";
import { generateVoiceBuffer, type VoiceCharacter } from "@/lib/ai/elevenlabs";
import { uploadBuffer, getPublicUrl, buildAssetKey } from "@/lib/storage/r2";

export async function POST(request: Request) {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { episodeId, text, character = "narrator" } = await request.json();
  if (!episodeId || !text) {
    return NextResponse.json({ error: "episodeId dan text wajib diisi" }, { status: 400 });
  }

  const audioBuffer = await generateVoiceBuffer(text, character as VoiceCharacter);

  const filename = `voice_${character}_${Date.now()}.mp3`;
  const key = buildAssetKey(episodeId, "audio", filename);
  await uploadBuffer(key, audioBuffer, "audio/mpeg");
  const url = getPublicUrl(key);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: asset, error } = await (supabase as any)
    .from("assets")
    .insert({
      episode_id: episodeId,
      name: filename,
      type: "audio",
      subtype: `voice_${character}`,
      url,
      size_bytes: audioBuffer.length,
    })
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ asset, url }, { status: 201 });
}
