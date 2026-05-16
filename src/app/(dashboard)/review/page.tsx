"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { formatDistanceToNow } from "date-fns";
import { id as idLocale } from "date-fns/locale";
import {
  ClipboardCheck, CheckCircle2, XCircle, MessageSquare,
  Clock, ExternalLink, RefreshCw,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/episodes/status-badge";
import type { Episode } from "@/types/database";


export default function ReviewPage() {
  const [episodes, setEpisodes] = useState<Episode[]>([]);
  const [noteCounts, setNoteCounts] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    const res = await fetch("/api/episodes");
    if (res.ok) {
      const all: Episode[] = await res.json();
      // Tampilkan episode yang butuh perhatian: review, approved, scripting (returned), draft juga
      const reviewable = all.filter((e) =>
        ["review", "approved", "scripting", "voice_over", "animating", "compositing"].includes(e.status)
      );
      setEpisodes(reviewable);

      // Ambil note counts untuk setiap episode
      const counts: Record<string, number> = {};
      await Promise.all(
        reviewable.map(async (ep) => {
          const r = await fetch(`/api/review/notes?episodeId=${ep.id}`);
          if (r.ok) {
            const notes = await r.json();
            counts[ep.id] = notes.filter((n: { status: string }) => n.status === "open").length;
          }
        })
      );
      setNoteCounts(counts);
    }
    setLoading(false);
  }, []);

  useEffect(() => { void load(); }, [load]);

  const pendingReview = episodes.filter((e) => e.status === "review");
  const approved = episodes.filter((e) => e.status === "approved");
  const inProgress = episodes.filter((e) => !["review", "approved"].includes(e.status));
  const totalOpenNotes = Object.values(noteCounts).reduce((a, b) => a + b, 0);

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Review Hub</h1>
          <p className="text-sm text-muted-foreground">
            Approval workflow dan catatan review episode
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={load}>
          <RefreshCw className="mr-2 h-3.5 w-3.5" />
          Refresh
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[
          { label: "Butuh Review", value: pendingReview.length, color: "text-amber-500", bg: "bg-amber-500/10" },
          { label: "Disetujui",    value: approved.length,      color: "text-green-500", bg: "bg-green-500/10" },
          { label: "Sedang Proses",value: inProgress.length,    color: "text-blue-500",  bg: "bg-blue-500/10"  },
          { label: "Catatan Terbuka", value: totalOpenNotes,    color: "text-destructive",bg: "bg-destructive/10" },
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
            <div key={i} className="h-20 animate-pulse rounded-2xl bg-muted" />
          ))}
        </div>
      ) : (
        <div className="space-y-6">
          {/* Menunggu Review */}
          {pendingReview.length > 0 && (
            <section>
              <h2 className="mb-3 flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-amber-600">
                <Clock className="h-4 w-4" />
                Menunggu Review ({pendingReview.length})
              </h2>
              <div className="space-y-2">
                {pendingReview.map((ep) => (
                  <EpisodeReviewCard key={ep.id} episode={ep} openNotes={noteCounts[ep.id] ?? 0} onAction={load} />
                ))}
              </div>
            </section>
          )}

          {/* Disetujui */}
          {approved.length > 0 && (
            <section>
              <h2 className="mb-3 flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-green-600">
                <CheckCircle2 className="h-4 w-4" />
                Disetujui ({approved.length})
              </h2>
              <div className="space-y-2">
                {approved.map((ep) => (
                  <EpisodeReviewCard key={ep.id} episode={ep} openNotes={noteCounts[ep.id] ?? 0} onAction={load} />
                ))}
              </div>
            </section>
          )}

          {/* Dalam Proses */}
          {inProgress.length > 0 && (
            <section>
              <h2 className="mb-3 flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                <ClipboardCheck className="h-4 w-4" />
                Dalam Proses ({inProgress.length})
              </h2>
              <div className="space-y-2">
                {inProgress.map((ep) => (
                  <EpisodeReviewCard key={ep.id} episode={ep} openNotes={noteCounts[ep.id] ?? 0} onAction={load} />
                ))}
              </div>
            </section>
          )}

          {episodes.length === 0 && (
            <div className="flex flex-col items-center justify-center rounded-2xl border-2 border-dashed py-20 text-center">
              <ClipboardCheck className="mb-4 h-12 w-12 opacity-30" />
              <p className="font-medium text-muted-foreground">Belum ada episode untuk direview</p>
              <Button variant="outline" size="sm" className="mt-4" render={<Link href="/episodes" />}>
                <ExternalLink className="mr-2 h-3.5 w-3.5" />
                Ke Daftar Episode
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function EpisodeReviewCard({
  episode,
  openNotes,
  onAction,
}: {
  episode: Episode;
  openNotes: number;
  onAction: () => void;
}) {
  const [approving, setApproving] = useState(false);
  const [rejecting, setRejecting] = useState(false);
  const [rejectReason, setRejectReason] = useState("");
  const [showReject, setShowReject] = useState(false);

  async function handleApprove() {
    setApproving(true);
    await fetch("/api/review/approve", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ episodeId: episode.id }),
    });
    setApproving(false);
    onAction();
  }

  async function handleReject() {
    if (!rejectReason.trim()) return;
    setRejecting(true);
    await fetch("/api/review/reject", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ episodeId: episode.id, reason: rejectReason }),
    });
    setRejecting(false);
    setShowReject(false);
    setRejectReason("");
    onAction();
  }

  return (
    <div className="rounded-xl border bg-card p-4">
      <div className="flex items-center justify-between gap-4">
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
            </div>
            <div className="flex items-center gap-3 text-xs text-muted-foreground">
              <span>{formatDistanceToNow(new Date(episode.created_at), { addSuffix: true, locale: idLocale })}</span>
              {openNotes > 0 && (
                <span className="flex items-center gap-1 text-amber-600">
                  <MessageSquare className="h-3 w-3" />
                  {openNotes} catatan terbuka
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
          {episode.status === "review" && (
            <>
              <Button
                size="sm"
                className="bg-green-600 hover:bg-green-700"
                onClick={handleApprove}
                disabled={approving}
              >
                <CheckCircle2 className="mr-1.5 h-3.5 w-3.5" />
                {approving ? "..." : "Setujui"}
              </Button>
              <Button
                size="sm"
                variant="destructive"
                onClick={() => setShowReject((v) => !v)}
              >
                <XCircle className="mr-1.5 h-3.5 w-3.5" />
                Tolak
              </Button>
            </>
          )}
        </div>
      </div>

      {/* Form reject */}
      {showReject && (
        <div className="mt-3 flex gap-2">
          <input
            className="flex-1 h-9 rounded-md border border-input bg-transparent px-3 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
            placeholder="Alasan penolakan..."
            value={rejectReason}
            onChange={(e) => setRejectReason(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleReject()}
            autoFocus
          />
          <Button size="sm" variant="destructive" onClick={handleReject} disabled={rejecting || !rejectReason.trim()}>
            {rejecting ? "..." : "Kirim"}
          </Button>
          <Button size="sm" variant="ghost" onClick={() => setShowReject(false)}>Batal</Button>
        </div>
      )}
    </div>
  );
}
