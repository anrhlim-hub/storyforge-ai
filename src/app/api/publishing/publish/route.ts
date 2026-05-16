import { NextResponse } from "next/server";
import { createClient } from "@/lib/db/server";
import { isFacebookConfigured, publishVideoToFacebook } from "@/lib/facebook";
import { notifyEpisodePublished } from "@/lib/notifications/email";

export async function POST(request: Request) {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { episodeId } = await request.json();
  if (!episodeId) return NextResponse.json({ error: "episodeId wajib diisi" }, { status: 400 });

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const db = supabase as any;

  const { data: episode, error: fetchError } = await db
    .from("episodes")
    .select("*")
    .eq("id", episodeId)
    .single();

  if (fetchError || !episode) {
    return NextResponse.json({ error: "Episode tidak ditemukan" }, { status: 404 });
  }

  if (episode.status !== "approved") {
    return NextResponse.json({ error: "Episode harus berstatus approved untuk dipublish" }, { status: 400 });
  }

  // Tandai sedang publishing
  await db
    .from("episodes")
    .update({ status: "publishing", updated_at: new Date().toISOString() })
    .eq("id", episodeId);

  // Mode simulasi: jika Facebook belum dikonfigurasi atau video_url kosong
  if (!isFacebookConfigured() || !episode.video_url) {
    const simulatedPostId = `sim_${Date.now()}`;

    const { data: updated } = await db
      .from("episodes")
      .update({
        status: "published",
        published_at: new Date().toISOString(),
        facebook_post_id: simulatedPostId,
        published_url: null,
        updated_at: new Date().toISOString(),
      })
      .eq("id", episodeId)
      .select()
      .single();

    const warning = !isFacebookConfigured()
      ? "Facebook belum dikonfigurasi — mode simulasi aktif"
      : "Video URL belum tersedia — mode simulasi aktif";

    void notifyEpisodePublished(episode.title as string, episode.id as string, null);
    return NextResponse.json({ episode: updated, simulated: true, warning });
  }

  // Publish nyata ke Facebook
  try {
    const description = [episode.theme, episode.moral_lesson ? `Pesan moral: ${episode.moral_lesson}` : ""]
      .filter(Boolean)
      .join("\n\n");

    const { postId, permalink } = await publishVideoToFacebook({
      videoUrl: episode.video_url,
      title: episode.title,
      description,
    });

    const { data: updated } = await db
      .from("episodes")
      .update({
        status: "published",
        published_at: new Date().toISOString(),
        facebook_post_id: postId,
        published_url: permalink,
        updated_at: new Date().toISOString(),
      })
      .eq("id", episodeId)
      .select()
      .single();

    void notifyEpisodePublished(episode.title as string, episode.id as string, permalink);
    return NextResponse.json({ episode: updated, simulated: false });
  } catch (err: unknown) {
    // Kembalikan ke approved jika gagal
    await db
      .from("episodes")
      .update({ status: "approved", updated_at: new Date().toISOString() })
      .eq("id", episodeId);

    const message = err instanceof Error ? err.message : "Gagal publish ke Facebook";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
