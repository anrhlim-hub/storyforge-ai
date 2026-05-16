import { NextResponse } from "next/server";
import { createServiceClient } from "@/lib/db/service";
import { isFacebookConfigured, publishVideoToFacebook } from "@/lib/facebook";

// Dipanggil oleh Vercel Cron setiap jam
export async function GET(request: Request) {
  const authHeader = request.headers.get("authorization");
  if (
    process.env.CRON_SECRET &&
    authHeader !== `Bearer ${process.env.CRON_SECRET}`
  ) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const supabase = createServiceClient() as any;

  // Cari episode yang jadwalnya sudah lewat dan belum dipublish
  const now = new Date().toISOString();
  const { data: episodes, error } = await supabase
    .from("episodes")
    .select("*")
    .eq("status", "approved")
    .not("scheduled_at", "is", null)
    .lte("scheduled_at", now);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  if (!episodes || episodes.length === 0) {
    return NextResponse.json({ published: 0, message: "Tidak ada episode terjadwal" });
  }

  const results: { id: string; title: string; success: boolean; error?: string }[] = [];

  for (const episode of episodes) {
    try {
      await supabase
        .from("episodes")
        .update({ status: "publishing", updated_at: new Date().toISOString() })
        .eq("id", episode.id);

      if (!isFacebookConfigured() || !episode.video_url) {
        const simulatedPostId = `sim_${Date.now()}`;
        await supabase
          .from("episodes")
          .update({
            status: "published",
            published_at: new Date().toISOString(),
            facebook_post_id: simulatedPostId,
            published_url: null,
            scheduled_at: null,
            updated_at: new Date().toISOString(),
          })
          .eq("id", episode.id);

        results.push({ id: episode.id, title: episode.title, success: true });
        continue;
      }

      const description = [
        episode.theme,
        episode.moral_lesson ? `Pesan moral: ${episode.moral_lesson}` : "",
      ].filter(Boolean).join("\n\n");

      const { postId, permalink } = await publishVideoToFacebook({
        videoUrl: episode.video_url,
        title: episode.title,
        description,
      });

      await supabase
        .from("episodes")
        .update({
          status: "published",
          published_at: new Date().toISOString(),
          facebook_post_id: postId,
          published_url: permalink,
          scheduled_at: null,
          updated_at: new Date().toISOString(),
        })
        .eq("id", episode.id);

      results.push({ id: episode.id, title: episode.title, success: true });
    } catch (err) {
      const message = err instanceof Error ? err.message : "Gagal publish";
      await supabase
        .from("episodes")
        .update({ status: "approved", updated_at: new Date().toISOString() })
        .eq("id", episode.id);
      results.push({ id: episode.id, title: episode.title, success: false, error: message });
    }
  }

  const successCount = results.filter((r) => r.success).length;
  return NextResponse.json({ published: successCount, total: episodes.length, results });
}
