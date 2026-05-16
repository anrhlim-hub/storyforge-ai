import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);
const FROM = "StoryForge AI <noreply@resend.dev>";
const ADMIN_EMAIL = process.env.ADMIN_EMAIL ?? "anrhlim@gmail.com";
const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

function isEmailConfigured(): boolean {
  const key = process.env.RESEND_API_KEY;
  return !!(key && key !== "your_resend_api_key" && key.startsWith("re_"));
}

async function send(to: string, subject: string, html: string): Promise<void> {
  if (!isEmailConfigured()) return;
  try {
    await resend.emails.send({ from: FROM, to, subject, html });
  } catch {
    // Email gagal tidak boleh blokir flow utama
  }
}

function episodeUrl(episodeId: string) {
  return `${APP_URL}/episodes/${episodeId}`;
}

function baseTemplate(title: string, body: string, ctaUrl?: string, ctaLabel?: string) {
  return `
  <div style="font-family:sans-serif;max-width:520px;margin:0 auto;padding:24px">
    <h2 style="color:#1a1a1a;margin-bottom:8px">${title}</h2>
    <p style="color:#555;line-height:1.6">${body}</p>
    ${ctaUrl ? `<a href="${ctaUrl}" style="display:inline-block;margin-top:16px;padding:10px 20px;background:#7BC043;color:#fff;border-radius:8px;text-decoration:none;font-weight:600">${ctaLabel ?? "Buka"}</a>` : ""}
    <hr style="margin-top:32px;border:none;border-top:1px solid #eee">
    <p style="color:#aaa;font-size:12px;margin-top:12px">StoryForge AI · Bimo &amp; Kiko Animation Platform</p>
  </div>`;
}

export async function notifyReviewReady(episodeTitle: string, episodeId: string) {
  await send(
    ADMIN_EMAIL,
    `📋 Episode siap direview: ${episodeTitle}`,
    baseTemplate(
      "Episode Siap Direview",
      `Episode <strong>${episodeTitle}</strong> telah selesai diproduksi dan menunggu approval Anda.`,
      `${episodeUrl(episodeId)}`,
      "Buka & Review",
    ),
  );
}

export async function notifyEpisodeApproved(episodeTitle: string, episodeId: string) {
  await send(
    ADMIN_EMAIL,
    `✅ Episode disetujui: ${episodeTitle}`,
    baseTemplate(
      "Episode Disetujui",
      `Episode <strong>${episodeTitle}</strong> telah disetujui dan siap dipublish ke Facebook.`,
      `${APP_URL}/publishing`,
      "Buka Publishing",
    ),
  );
}

export async function notifyEpisodePublished(
  episodeTitle: string,
  episodeId: string,
  publishedUrl?: string | null,
) {
  await send(
    ADMIN_EMAIL,
    `🚀 Episode dipublish: ${episodeTitle}`,
    baseTemplate(
      "Episode Berhasil Dipublish",
      `Episode <strong>${episodeTitle}</strong> telah berhasil dipublish ke Facebook Page Bimo &amp; Kiko.`,
      publishedUrl ?? episodeUrl(episodeId),
      publishedUrl ? "Lihat di Facebook" : "Buka Episode",
    ),
  );
}

export async function notifyProductionFailed(episodeTitle: string, episodeId: string, errorMessage: string) {
  await send(
    ADMIN_EMAIL,
    `❌ Produksi gagal: ${episodeTitle}`,
    baseTemplate(
      "Produksi Episode Gagal",
      `Episode <strong>${episodeTitle}</strong> mengalami error saat produksi.<br><br>
       <code style="background:#fef2f2;padding:4px 8px;border-radius:4px;color:#dc2626">${errorMessage}</code>`,
      episodeUrl(episodeId),
      "Cek Pipeline",
    ),
  );
}
