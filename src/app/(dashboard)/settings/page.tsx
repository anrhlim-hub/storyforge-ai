"use client";

import { useEffect, useState } from "react";
import {
  CheckCircle2, XCircle, Globe, Brain, Mic, Video,
  Image, Music2, Cloud, Database, RefreshCw, Info,
} from "lucide-react";

type Integrations = {
  facebook: { configured: boolean; pageId: string | null };
  openai: { configured: boolean };
  elevenlabs: { configured: boolean };
  falai: { configured: boolean };
  leonardo: { configured: boolean };
  suno: { configured: boolean };
  cloudflareR2: { configured: boolean; bucketName: string | null };
  redis: { configured: boolean };
};

type SettingsData = { integrations: Integrations };

const INTEGRATION_META = [
  {
    key: "openai",
    name: "OpenAI",
    description: "Generasi script dan skenario episode dengan GPT-4.",
    icon: Brain,
    color: "text-green-500",
    bg: "bg-green-500/10",
    envKey: "OPENAI_API_KEY",
    group: "ai",
  },
  {
    key: "elevenlabs",
    name: "ElevenLabs",
    description: "Text-to-speech untuk narasi dan dialog karakter.",
    icon: Mic,
    color: "text-purple-500",
    bg: "bg-purple-500/10",
    envKey: "ELEVENLABS_API_KEY",
    group: "ai",
  },
  {
    key: "falai",
    name: "FAL.ai (LTX Video)",
    description: "Generasi video animasi image-to-video dengan LTX Video.",
    icon: Video,
    color: "text-blue-500",
    bg: "bg-blue-500/10",
    envKey: "FAL_API_KEY",
    group: "ai",
  },
  {
    key: "leonardo",
    name: "Leonardo AI",
    description: "Generasi gambar dan ilustrasi karakter.",
    icon: Image,
    color: "text-amber-500",
    bg: "bg-amber-500/10",
    envKey: "LEONARDO_API_KEY",
    group: "ai",
  },
  {
    key: "suno",
    name: "Suno AI",
    description: "Generasi musik latar dan theme song episode.",
    icon: Music2,
    color: "text-pink-500",
    bg: "bg-pink-500/10",
    envKey: "SUNO_API_KEY",
    group: "ai",
  },
  {
    key: "facebook",
    name: "Facebook Page",
    description: "Publish video langsung ke Facebook Page Bimo & Kiko.",
    icon: Globe,
    color: "text-blue-600",
    bg: "bg-blue-600/10",
    envKey: "FACEBOOK_PAGE_ID + FACEBOOK_ACCESS_TOKEN",
    group: "publish",
  },
  {
    key: "cloudflareR2",
    name: "Cloudflare R2",
    description: "Penyimpanan video dan aset media yang dihasilkan.",
    icon: Cloud,
    color: "text-orange-500",
    bg: "bg-orange-500/10",
    envKey: "R2_ACCOUNT_ID + R2_ACCESS_KEY_ID + ...",
    group: "infra",
  },
  {
    key: "redis",
    name: "Upstash Redis",
    description: "Cache dan antrian job produksi background.",
    icon: Database,
    color: "text-red-500",
    bg: "bg-red-500/10",
    envKey: "UPSTASH_REDIS_REST_URL + UPSTASH_REDIS_REST_TOKEN",
    group: "infra",
  },
] as const;

type IntegrationKey = keyof Integrations;

function isConfigured(integrations: Integrations, key: string): boolean {
  const val = integrations[key as IntegrationKey];
  return typeof val === "object" && "configured" in val ? val.configured : false;
}

function StatusBadge({ ok }: { ok: boolean }) {
  if (ok) {
    return (
      <span className="flex items-center gap-1 text-xs font-medium text-green-600 bg-green-500/10 px-2 py-0.5 rounded-full">
        <CheckCircle2 className="h-3 w-3" />
        Terhubung
      </span>
    );
  }
  return (
    <span className="flex items-center gap-1 text-xs font-medium text-muted-foreground bg-muted px-2 py-0.5 rounded-full">
      <XCircle className="h-3 w-3" />
      Belum dikonfigurasi
    </span>
  );
}

export default function SettingsPage() {
  const [data, setData] = useState<SettingsData | null>(null);
  const [loading, setLoading] = useState(true);

  async function load() {
    setLoading(true);
    try {
      const res = await fetch("/api/settings");
      if (res.ok) setData(await res.json());
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { void load(); }, []);

  const groups = [
    { id: "ai", label: "AI & Media" },
    { id: "publish", label: "Publishing" },
    { id: "infra", label: "Infrastruktur" },
  ];

  const configured = data
    ? INTEGRATION_META.filter((m) => isConfigured(data.integrations, m.key)).length
    : 0;
  const total = INTEGRATION_META.length;

  return (
    <div className="space-y-6 p-6 max-w-3xl">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Settings</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Konfigurasi integrasi dan layanan StoryForge AI
          </p>
        </div>
        <button
          onClick={load}
          className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <RefreshCw className="h-4 w-4" />
          Refresh
        </button>
      </div>

      {/* Summary */}
      {!loading && data && (
        <div className="rounded-xl border bg-card p-5 flex items-center gap-4">
          <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl ${
            configured === total ? "bg-green-500/10" : "bg-amber-500/10"
          }`}>
            <Info className={`h-6 w-6 ${configured === total ? "text-green-500" : "text-amber-500"}`} />
          </div>
          <div>
            <div className="font-semibold">
              {configured} dari {total} integrasi aktif
            </div>
            <div className="text-sm text-muted-foreground mt-0.5">
              {configured === total
                ? "Semua layanan terhubung dan siap digunakan."
                : `${total - configured} layanan belum dikonfigurasi — isi nilai di file .env.local`}
            </div>
          </div>
          {/* Progress bar */}
          <div className="ml-auto w-24 shrink-0">
            <div className="h-2 rounded-full bg-muted overflow-hidden">
              <div
                className="h-full rounded-full bg-green-500 transition-all"
                style={{ width: `${(configured / total) * 100}%` }}
              />
            </div>
            <div className="text-xs text-muted-foreground text-right mt-1">
              {Math.round((configured / total) * 100)}%
            </div>
          </div>
        </div>
      )}

      {/* Integration Groups */}
      {loading ? (
        <div className="space-y-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-32 rounded-xl bg-muted animate-pulse" />
          ))}
        </div>
      ) : data ? (
        groups.map((group) => {
          const items = INTEGRATION_META.filter((m) => m.group === group.id);
          return (
            <div key={group.id}>
              <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">
                {group.label}
              </h2>
              <div className="space-y-3">
                {items.map((item) => {
                  const ok = isConfigured(data.integrations, item.key);
                  const extra =
                    item.key === "facebook" && ok
                      ? data.integrations.facebook.pageId
                      : item.key === "cloudflareR2" && ok
                      ? data.integrations.cloudflareR2.bucketName
                      : null;

                  return (
                    <div
                      key={item.key}
                      className="flex items-center gap-4 rounded-xl border bg-card p-4"
                    >
                      <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${item.bg}`}>
                        <item.icon className={`h-5 w-5 ${item.color}`} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-sm">{item.name}</span>
                          {extra && (
                            <span className="text-xs text-muted-foreground truncate">· {extra}</span>
                          )}
                        </div>
                        <div className="text-xs text-muted-foreground mt-0.5">{item.description}</div>
                        {!ok && (
                          <div className="text-xs text-muted-foreground/70 mt-1 font-mono">
                            {item.envKey}
                          </div>
                        )}
                      </div>
                      <StatusBadge ok={ok} />
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })
      ) : (
        <div className="text-center py-10 text-muted-foreground text-sm">
          Gagal memuat settings
        </div>
      )}

      {/* Footer note */}
      {!loading && data && configured < total && (
        <div className="rounded-xl border border-dashed p-4 text-sm text-muted-foreground">
          <span className="font-medium text-foreground">Cara mengkonfigurasi:</span> Buka file{" "}
          <code className="text-xs bg-muted px-1 py-0.5 rounded">.env.local</code> di root project,
          ganti nilai placeholder dengan API key yang sebenarnya, lalu restart dev server.
        </div>
      )}
    </div>
  );
}
