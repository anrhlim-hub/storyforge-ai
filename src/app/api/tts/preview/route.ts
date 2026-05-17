import { NextResponse } from "next/server";
import { createClient } from "@/lib/db/server";
import { isGoogleTtsConfigured, generateVoiceBufferGoogle, type TtsCharacter } from "@/lib/ai/google-tts";
import { generateVoiceBuffer, type VoiceCharacter } from "@/lib/ai/elevenlabs";

const VALID_CHARACTERS = ["bimo", "kiko", "narrator"] as const;

export async function POST(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { character, text } = await request.json() as { character: string; text: string };

  if (!VALID_CHARACTERS.includes(character as TtsCharacter)) {
    return NextResponse.json({ error: "Karakter tidak valid" }, { status: 400 });
  }
  if (!text || text.trim().length === 0) {
    return NextResponse.json({ error: "Teks tidak boleh kosong" }, { status: 400 });
  }
  if (text.length > 500) {
    return NextResponse.json({ error: "Teks maksimal 500 karakter" }, { status: 400 });
  }

  let buffer: Buffer;
  if (isGoogleTtsConfigured()) {
    buffer = await generateVoiceBufferGoogle(text.trim(), character as TtsCharacter);
  } else {
    buffer = await generateVoiceBuffer(text.trim(), character as VoiceCharacter);
  }

  return new Response(buffer.buffer as ArrayBuffer, {
    headers: {
      "Content-Type": "audio/mpeg",
      "Content-Length": buffer.length.toString(),
      "Cache-Control": "no-store",
    },
  });
}
