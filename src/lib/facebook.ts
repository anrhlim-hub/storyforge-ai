const GRAPH_API_BASE = "https://graph.facebook.com/v19.0";

export function isFacebookConfigured(): boolean {
  const { FACEBOOK_PAGE_ID, FACEBOOK_ACCESS_TOKEN } = process.env;
  return !!(
    FACEBOOK_PAGE_ID && FACEBOOK_ACCESS_TOKEN &&
    FACEBOOK_PAGE_ID !== "your_facebook_page_id" &&
    FACEBOOK_ACCESS_TOKEN !== "your_facebook_access_token"
  );
}

export async function validateToken(): Promise<{
  valid: boolean;
  expiresAt: Date | null;
  scopes: string[];
  error?: string;
}> {
  const { FACEBOOK_APP_ID, FACEBOOK_APP_SECRET, FACEBOOK_ACCESS_TOKEN } = process.env;
  if (!FACEBOOK_APP_ID || !FACEBOOK_APP_SECRET || !FACEBOOK_ACCESS_TOKEN) {
    return { valid: false, expiresAt: null, scopes: [], error: "Kredensial Facebook tidak lengkap" };
  }

  const appToken = `${FACEBOOK_APP_ID}|${FACEBOOK_APP_SECRET}`;
  const res = await fetch(
    `${GRAPH_API_BASE}/debug_token?input_token=${FACEBOOK_ACCESS_TOKEN}&access_token=${appToken}`
  );
  const data = await res.json();

  if (!res.ok || data.error) {
    return { valid: false, expiresAt: null, scopes: [], error: data.error?.message ?? "Token tidak valid" };
  }

  const info = data.data;
  return {
    valid: info.is_valid === true,
    expiresAt: info.expires_at ? new Date(info.expires_at * 1000) : null,
    scopes: info.scopes ?? [],
    error: info.is_valid ? undefined : "Token sudah tidak valid",
  };
}

export async function extendToken(shortLivedToken: string): Promise<string> {
  const { FACEBOOK_APP_ID, FACEBOOK_APP_SECRET } = process.env;
  const res = await fetch(
    `${GRAPH_API_BASE}/oauth/access_token?grant_type=fb_exchange_token&client_id=${FACEBOOK_APP_ID}&client_secret=${FACEBOOK_APP_SECRET}&fb_exchange_token=${shortLivedToken}`
  );
  const data = await res.json();
  if (!res.ok || data.error) throw new Error(data.error?.message ?? "Gagal extend token");
  return data.access_token as string;
}

export async function publishVideoToFacebook({
  videoUrl,
  title,
  description,
}: {
  videoUrl: string;
  title: string;
  description: string;
}): Promise<{ postId: string; permalink: string }> {
  const { FACEBOOK_PAGE_ID: FB_PAGE_ID, FACEBOOK_ACCESS_TOKEN: FB_PAGE_ACCESS_TOKEN } = process.env;

  const res = await fetch(`${GRAPH_API_BASE}/${FB_PAGE_ID}/videos`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      file_url: videoUrl,
      title,
      description,
      access_token: FB_PAGE_ACCESS_TOKEN,
      published: true,
    }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err?.error?.message ?? "Gagal upload video ke Facebook");
  }

  const data = await res.json();
  return {
    postId: data.id as string,
    permalink: `https://www.facebook.com/${process.env.FACEBOOK_PAGE_ID}/videos/${data.id}`,
  };
}
