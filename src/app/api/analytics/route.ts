import { NextResponse } from "next/server";
import { createClient } from "@/lib/db/server";
import { isFacebookConfigured } from "@/lib/facebook";

const GRAPH_API_BASE = "https://graph.facebook.com/v19.0";

function getCountByMonth(items: Record<string, string>[], dateField: string) {
  const months: Record<string, number> = {};
  const now = new Date();

  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    months[key] = 0;
  }

  items.forEach((item) => {
    if (!item[dateField]) return;
    const d = new Date(item[dateField]);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    if (key in months) months[key]++;
  });

  return Object.entries(months).map(([month, count]) => ({
    month: new Date(month + "-01").toLocaleDateString("id-ID", { month: "short", year: "2-digit" }),
    count,
  }));
}

export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const db = supabase as any;

  const { data: episodes } = await db
    .from("episodes")
    .select("id, status, created_at, published_at, title, facebook_post_id, published_url")
    .order("created_at", { ascending: true });

  const all = episodes ?? [];

  const inProductionStatuses = ["scripting", "voice_over", "animating", "compositing", "review"];

  const stats = {
    total: all.length,
    draft: all.filter((e: Record<string, string>) => e.status === "draft").length,
    inProduction: all.filter((e: Record<string, string>) => inProductionStatuses.includes(e.status)).length,
    approved: all.filter((e: Record<string, string>) => e.status === "approved").length,
    published: all.filter((e: Record<string, string>) => e.status === "published").length,
  };

  const publishedEpisodes = all.filter(
    (e: Record<string, string>) => e.status === "published" && e.published_at
  );

  const recentPublished = [...publishedEpisodes]
    .sort((a: Record<string, string>, b: Record<string, string>) =>
      new Date(b.published_at).getTime() - new Date(a.published_at).getTime()
    )
    .slice(0, 5);

  const episodesByMonth = getCountByMonth(all, "created_at");
  const publishedByMonth = getCountByMonth(publishedEpisodes, "published_at");

  let facebookPage = null;
  if (isFacebookConfigured()) {
    try {
      const res = await fetch(
        `${GRAPH_API_BASE}/${process.env.FACEBOOK_PAGE_ID}?fields=name,fan_count,followers_count&access_token=${process.env.FACEBOOK_ACCESS_TOKEN}`
      );
      if (res.ok) {
        const data = await res.json();
        facebookPage = {
          name: data.name as string,
          followers: (data.followers_count ?? data.fan_count ?? 0) as number,
        };
      }
    } catch {
      // Facebook API gagal, lanjut tanpa data page
    }
  }

  return NextResponse.json({
    stats,
    episodesByMonth,
    publishedByMonth,
    recentPublished,
    facebookPage,
  });
}
