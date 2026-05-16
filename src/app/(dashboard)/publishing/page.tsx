"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { format, formatDistanceToNow, isPast } from "date-fns";
import { id as idLocale } from "date-fns/locale";
import {
  Send, CheckCircle2, Clock, Calendar, ExternalLink,
  RefreshCw, Loader2, AlertCircle, Play, X, Globe, Share2,
} from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/episodes/status-badge";
import type { Episode } from "@/types/database";

export default function PublishingPage() {
  const [episodes, setEpisodes] = useState<Episode[]>([]);
  const [loading, setLoading] = useState(true);
  const [fbConfigured, setFbConfigured] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    const res = await fetch("/api/publishing");
    if (res.ok) {
      const data = await res.json();
      setEpisodes(data.episodes ?? []);
      setFbConfigured(data.facebookConfigured ?? false);
    }
    setLoading(false);
  }, []);

  useEffect(() => { void load(); }, [load]);

  const ready = episodes.filter((e) => e.status === "approved" && !e.scheduled_at);
  const scheduled = episodes.filter((e) => e.status === "approved" && !!e.scheduled_at);
  const inProgress = episodes.filter((e) => e.status === "publishing");
  const published = episodes.filter((e) => e.status === "published");

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Publishing Engine</h1>
          <p className="text-sm text-muted-foreground">
            Jadwalkan dan publish episode ke Facebook
          </p>
        </div>
        <div className="flex items-center gap-2">
          {/* Facebook status badge */}
          <span
            className={`flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-medium ${
              fbConfigured
                ? "border-blue-200 bg-blue-500/10 text-blue-600"
                : "border-amber-200 bg-amber-500/10 text-amber-600"
            }`}
          >
            <Globe className="h-3 w-3" />
            {fbConfigured ? "FB Terhubung" : "FB Belum Dikonfigurasi"}
          </span>
          <Button variant="outline" size="sm" onClick={load}>
            <RefreshCw className="mr-2 h-3.5 w-3.5" />
            Refresh
          </Button>
        </div>
      </div>

      {/* Banner jika Facebook belum dikonfigurasi */}
      {!fbConfigured && (
        <div className="flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-500/10 p-4">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-amber-600" />
          <div className="text-sm">
            <p className="font-medium text-amber-700">Mode Simulasi Aktif</p>
            <p className="mt-0.5 text-amber-600">
              Facebook belum dikonfigurasi. Publish akan berjalan dalam mode simulasi — data tersimpan di database tapi tidak dikirim ke Facebook.
              Tambahkan <code className="rounded bg-amber-100 px-1 font-mono text-xs">FACEBOOK_PAGE_ID</code> dan{" "}
              <code className="rounded bg-amber-100 px-1 font-mono text-xs">FACEBOOK_ACCESS_TOKEN</code> di{" "}
              <code className="rounded bg-amber-100 px-1 font-mono text-xs">.env.local</code> untuk mengaktifkan.
            </p>
          </div>
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[
          { label: "Siap Dipublish", value: ready.length,      color: "text-green-500",  bg: "bg-green-500/10"  },
          { label: "Terjadwal",      value: scheduled.length,  color: "text-blue-500",   bg: "bg-blue-500/10"   },
          { label: "Sedang Proses",  value: inProgress.length, color: "text-amber-500",  bg: "bg-amber-500/10"  },
          { label: "Dipublish",      value: published.length,  color: "text-primary",    bg: "bg-primary/10"    },
        ].map(({ label, value, color, bg }) => (
          <div key={label} className={`rounded-xl border p-4 ${bg}`}>
            <p className={`text-2xl font-bold ${color}`}>{value}</p>
            <p className="text-sm text-muted-foreground">{label}</p>
          </div>
        ))}
      </div>

      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-24 animate-pulse rounded-2xl bg-muted" />
          ))}
        </div>
      ) : (
        <div className="space-y-8">
          {/* Siap Dipublish */}
          {ready.length > 0 && (
            <section>
              <h2 className="mb-3 flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-green-600">
                <CheckCircle2 className="h-4 w-4" />
                Siap Dipublish ({ready.length})
              </h2>
              <div className="space-y-3">
                {ready.map((ep) => (
                  <PublishCard key={ep.id} episode={ep} onAction={load} />
                ))}
              </div>
            </section>
          )}

          {/* Terjadwal */}
          {scheduled.length > 0 && (
            <section>
              <h2 className="mb-3 flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-blue-600">
                <Calendar className="h-4 w-4" />
                Terjadwal ({scheduled.length})
              </h2>
              <div className="space-y-3">
                {scheduled.map((ep) => (
                  <PublishCard key={ep.id} episode={ep} onAction={load} />
                ))}
              </div>
            </section>
          )}

          {/* Sedang Proses */}
          {inProgress.length > 0 && (
            <section>
              <h2 className="mb-3 flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-amber-600">
                <Loader2 className="h-4 w-4 animate-spin" />
                Sedang Diproses ({inProgress.length})
              </h2>
              <div className="space-y-3">
                {inProgress.map((ep) => (
                  <div key={ep.id} className="flex items-center justify-between rounded-xl border bg-card p-4">
                    <div className="flex items-center gap-3">
                      <Loader2 className="h-5 w-5 animate-spin text-amber-500" />
                      <div>
                        <Link href={`/episodes/${ep.id}`} className="font-medium hover:text-primary transition-colors">
                          {ep.title}
                        </Link>
                        <p className="text-xs text-muted-foreground mt-0.5">Sedang diupload ke Facebook...</p>
                      </div>
                    </div>
                    <StatusBadge status={ep.status} />
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Sudah Dipublish */}
          {published.length > 0 && (
            <section>
              <h2 className="mb-3 flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-primary">
                <Send className="h-4 w-4" />
                Sudah Dipublish ({published.length})
              </h2>
              <div className="space-y-3">
                {published.map((ep) => (
                  <div key={ep.id} className="flex items-center justify-between rounded-xl border bg-card p-4">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                        <Share2 className="h-4 w-4 text-primary" />
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <Link href={`/episodes/${ep.id}`} className="font-medium hover:text-primary transition-colors truncate">
                            {ep.title}
                          </Link>
                          <StatusBadge status={ep.status} />
                        </div>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          Dipublish{" "}
                          {ep.published_at
                            ? formatDistanceToNow(new Date(ep.published_at), { addSuffix: true, locale: idLocale })
                            : "—"}
                          {ep.facebook_post_id?.startsWith("sim_") && (
                            <span className="ml-2 rounded-full bg-amber-100 px-1.5 py-0.5 text-xs text-amber-700">
                              Simulasi
                            </span>
                          )}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <Button variant="outline" size="sm" render={<Link href={`/episodes/${ep.id}`} />}>
                        <ExternalLink className="mr-1.5 h-3.5 w-3.5" />
                        Detail
                      </Button>
                      {ep.published_url && (
                        <Button size="sm" className="bg-blue-600 hover:bg-blue-700" render={<a href={ep.published_url} target="_blank" rel="noopener noreferrer" />}>
                          <ExternalLink className="mr-1.5 h-3.5 w-3.5" />
                          Lihat di FB
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Empty state */}
          {episodes.length === 0 && (
            <div className="flex flex-col items-center justify-center rounded-2xl border-2 border-dashed py-20 text-center">
              <Send className="mb-4 h-12 w-12 opacity-30" />
              <p className="font-medium text-muted-foreground">Belum ada episode siap dipublish</p>
              <p className="mt-1 text-sm text-muted-foreground">
                Episode harus berstatus <strong>Approved</strong> terlebih dahulu
              </p>
              <Button variant="outline" size="sm" className="mt-4" render={<Link href="/review" />}>
                <ExternalLink className="mr-2 h-3.5 w-3.5" />
                Ke Review Hub
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function PublishCard({ episode, onAction }: { episode: Episode; onAction: () => void }) {
  const [publishing, setPublishing] = useState(false);
  const [showSchedule, setShowSchedule] = useState(false);
  const [scheduledAt, setScheduledAt] = useState(
    episode.scheduled_at ? episode.scheduled_at.slice(0, 16) : ""
  );
  const [savingSchedule, setSavingSchedule] = useState(false);

  const isScheduled = !!episode.scheduled_at;
  const schedulePast = isScheduled && isPast(new Date(episode.scheduled_at!));

  async function handlePublish() {
    setPublishing(true);
    const res = await fetch("/api/publishing/publish", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ episodeId: episode.id }),
    });
    const data = await res.json();
    if (res.ok) {
      if (data.simulated) {
        toast.success("Episode dipublish (mode simulasi)", { description: data.warning });
      } else {
        toast.success("Episode berhasil dipublish ke Facebook!");
      }
      onAction();
    } else {
      toast.error(data.error ?? "Gagal publish episode");
    }
    setPublishing(false);
  }

  async function handleSaveSchedule() {
    setSavingSchedule(true);
    const res = await fetch("/api/publishing/schedule", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        episodeId: episode.id,
        scheduledAt: scheduledAt ? new Date(scheduledAt).toISOString() : null,
      }),
    });
    if (res.ok) {
      toast.success(scheduledAt ? "Jadwal disimpan" : "Jadwal dibatalkan");
      setShowSchedule(false);
      onAction();
    } else {
      toast.error("Gagal menyimpan jadwal");
    }
    setSavingSchedule(false);
  }

  async function handleCancelSchedule() {
    setSavingSchedule(true);
    const res = await fetch("/api/publishing/schedule", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ episodeId: episode.id, scheduledAt: null }),
    });
    if (res.ok) {
      toast.success("Jadwal dibatalkan");
      onAction();
    } else {
      toast.error("Gagal membatalkan jadwal");
    }
    setSavingSchedule(false);
  }

  return (
    <div className="rounded-xl border bg-card p-4 space-y-3">
      {/* Episode info + actions */}
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-3 min-w-0">
          <div className="flex flex-col gap-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <Link
                href={`/episodes/${episode.id}`}
                className="font-medium hover:text-primary transition-colors truncate"
              >
                {episode.title}
              </Link>
              <StatusBadge status={episode.status} />
              {schedulePast && (
                <span className="rounded-full border border-green-200 bg-green-500/10 px-2 py-0.5 text-xs font-medium text-green-600">
                  Siap Dikirim
                </span>
              )}
            </div>
            <div className="flex items-center gap-3 text-xs text-muted-foreground flex-wrap">
              {episode.episode_number && (
                <span>S{episode.season} E{episode.episode_number}</span>
              )}
              {episode.theme && (
                <span className="truncate max-w-[200px]">{episode.theme}</span>
              )}
              {isScheduled && (
                <span className="flex items-center gap-1 text-blue-600">
                  <Clock className="h-3 w-3" />
                  {format(new Date(episode.scheduled_at!), "d MMM yyyy, HH:mm", { locale: idLocale })}
                  {schedulePast ? " (lewat jadwal)" : ` · ${formatDistanceToNow(new Date(episode.scheduled_at!), { locale: idLocale })}`}
                </span>
              )}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <Button variant="outline" size="sm" render={<Link href={`/episodes/${episode.id}`} />}>
            <ExternalLink className="mr-1.5 h-3.5 w-3.5" />
            Detail
          </Button>

          {!isScheduled && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowSchedule((v) => !v)}
            >
              <Calendar className="mr-1.5 h-3.5 w-3.5" />
              Jadwalkan
            </Button>
          )}

          {isScheduled && (
            <Button
              variant="outline"
              size="sm"
              className="text-destructive hover:text-destructive"
              onClick={handleCancelSchedule}
              disabled={savingSchedule}
            >
              {savingSchedule ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <X className="h-3.5 w-3.5" />}
            </Button>
          )}

          <Button
            size="sm"
            className="bg-blue-600 hover:bg-blue-700"
            onClick={handlePublish}
            disabled={publishing}
          >
            {publishing
              ? <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
              : <Play className="mr-1.5 h-3.5 w-3.5" />
            }
            {publishing ? "Publishing..." : "Publish Sekarang"}
          </Button>
        </div>
      </div>

      {/* Form jadwal */}
      {showSchedule && (
        <div className="flex items-center gap-2 rounded-lg border border-blue-200 bg-blue-500/5 p-3">
          <Calendar className="h-4 w-4 shrink-0 text-blue-500" />
          <input
            type="datetime-local"
            className="flex-1 h-8 rounded-md border border-input bg-background px-3 text-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
            value={scheduledAt}
            onChange={(e) => setScheduledAt(e.target.value)}
            min={new Date().toISOString().slice(0, 16)}
          />
          <Button size="sm" onClick={handleSaveSchedule} disabled={savingSchedule || !scheduledAt}>
            {savingSchedule ? "..." : "Simpan"}
          </Button>
          <Button size="sm" variant="ghost" onClick={() => setShowSchedule(false)}>
            Batal
          </Button>
        </div>
      )}
    </div>
  );
}
