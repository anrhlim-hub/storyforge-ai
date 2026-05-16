import { NextResponse } from "next/server";
import { createClient } from "@/lib/db/server";
import { redis, QUEUE_KEY, isRedisConfigured } from "@/lib/queue/redis";

export async function POST(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { jobIds } = await request.json();
  if (!Array.isArray(jobIds) || jobIds.length === 0) {
    return NextResponse.json({ error: "jobIds wajib diisi" }, { status: 400 });
  }

  if (!isRedisConfigured()) {
    return NextResponse.json({ error: "Redis belum dikonfigurasi" }, { status: 503 });
  }

  await redis.rpush(QUEUE_KEY, ...jobIds);

  return NextResponse.json({ queued: jobIds.length, message: `${jobIds.length} job ditambahkan ke antrian` });
}

export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  if (!isRedisConfigured()) {
    return NextResponse.json({ queueLength: 0, configured: false });
  }

  const queueLength = await redis.llen(QUEUE_KEY);
  return NextResponse.json({ queueLength, configured: true });
}
