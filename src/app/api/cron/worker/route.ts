import { NextResponse } from "next/server";
import { redis, QUEUE_KEY, isRedisConfigured } from "@/lib/queue/redis";

// Dipanggil oleh Vercel Cron setiap 1 menit
export async function GET(request: Request) {
  const authHeader = request.headers.get("authorization");
  if (
    process.env.CRON_SECRET &&
    authHeader !== `Bearer ${process.env.CRON_SECRET}`
  ) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!isRedisConfigured()) {
    return NextResponse.json({ skipped: true, reason: "Redis not configured" });
  }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
  const processed: string[] = [];
  const errors: string[] = [];

  // Proses semua job dalam queue satu per satu (max 20 per cron run)
  for (let i = 0; i < 20; i++) {
    const jobId = await redis.lpop<string>(QUEUE_KEY);
    if (!jobId) break;

    // Panggil run endpoint langsung dengan service role (internal secret)
    const res = await fetch(`${appUrl}/api/production/run`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-internal-secret": process.env.CRON_SECRET ?? "",
      },
      body: JSON.stringify({ jobId }),
    });

    if (res.ok) {
      processed.push(jobId);
    } else {
      const err = await res.json().catch(() => ({}));
      errors.push(`${jobId}: ${err?.error ?? "unknown"}`);
      // Push kembali ke queue untuk dicoba lagi nanti
      await redis.rpush(QUEUE_KEY, jobId);
      break;
    }
  }

  const remaining = await redis.llen(QUEUE_KEY);
  return NextResponse.json({ processed: processed.length, errors, remaining });
}
