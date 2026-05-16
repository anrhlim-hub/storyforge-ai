import { NextResponse } from "next/server";
import { createClient } from "@/lib/db/server";
import { isFacebookConfigured, validateToken } from "@/lib/facebook";

function isConfigured(value: string | undefined, placeholder: string): boolean {
  return !!(value && value !== placeholder && value.length > 10);
}

export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const e = process.env;

  const fbConfigured = isFacebookConfigured();
  const fbToken = fbConfigured ? await validateToken().catch(() => null) : null;

  return NextResponse.json({
    integrations: {
      facebook: {
        configured: fbConfigured,
        pageId: fbConfigured ? e.FACEBOOK_PAGE_ID : null,
        tokenValid: fbToken?.valid ?? null,
        tokenExpiresAt: fbToken?.expiresAt ?? null,
        tokenScopes: fbToken?.scopes ?? [],
        tokenError: fbToken?.error ?? null,
      },
      openai: {
        configured: isConfigured(e.OPENAI_API_KEY, "your_openai_api_key"),
      },
      elevenlabs: {
        configured: isConfigured(e.ELEVENLABS_API_KEY, "your_elevenlabs_api_key"),
      },
      runway: {
        configured: isConfigured(e.RUNWAY_API_KEY, "your_runway_api_key"),
      },
      leonardo: {
        configured: isConfigured(e.LEONARDO_API_KEY, "your_leonardo_api_key"),
      },
      suno: {
        configured: isConfigured(e.SUNO_API_KEY, "your_suno_api_key"),
        note: "Suno belum memiliki API publik resmi — fitur musik dalam simulasi",
      },
      cloudflareR2: {
        configured: isConfigured(e.R2_ACCOUNT_ID, "your_r2_account_id"),
        bucketName: isConfigured(e.R2_ACCOUNT_ID, "your_r2_account_id") ? e.R2_BUCKET_NAME : null,
      },
      redis: {
        configured: isConfigured(e.UPSTASH_REDIS_REST_URL, "your_redis_url") &&
                    isConfigured(e.UPSTASH_REDIS_REST_TOKEN, "your_redis_token"),
      },
    },
  });
}
