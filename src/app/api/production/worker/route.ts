import { NextResponse } from "next/server";
import { redis, QUEUE_KEY, isRedisConfigured } from "@/lib/queue/redis";

export async function POST(request: Request) {
  if (!isRedisConfigured()) {
    return NextResponse.json({ error: "Redis belum dikonfigurasi" }, { status: 503 });
  }

  const jobId = await redis.lpop<string>(QUEUE_KEY);
  if (!jobId) {
    return NextResponse.json({ done: true, message: "Antrian kosong" });
  }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

  // Teruskan cookie (user session) DAN internal secret agar run endpoint bisa auth
  const cookieHeader = request.headers.get("cookie") ?? "";

  const res = await fetch(`${appUrl}/api/production/run`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      cookie: cookieHeader,
      "x-internal-secret": process.env.CRON_SECRET ?? "",
    },
    body: JSON.stringify({ jobId }),
  });

  const result = await res.json().catch(() => ({}));

  if (!res.ok) {
    return NextResponse.json({ jobId, error: result?.error ?? "Job gagal", remaining: await redis.llen(QUEUE_KEY) }, { status: 500 });
  }

  const remaining = await redis.llen(QUEUE_KEY);
  return NextResponse.json({ jobId, done: false, remaining, result });
}

export async function GET() {
  if (!isRedisConfigured()) {
    return NextResponse.json({ queueLength: 0, configured: false });
  }
  const queueLength = await redis.llen(QUEUE_KEY);
  return NextResponse.json({ queueLength, configured: true });
}
