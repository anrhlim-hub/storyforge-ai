import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Pencil, Clock, Calendar, CheckCircle2, Loader2, XCircle } from "lucide-react";
import { format } from "date-fns";
import { id as idLocale } from "date-fns/locale";

import { createClient } from "@/lib/db/server";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { StatusBadge } from "@/components/episodes/status-badge";
import { StartProductionButton } from "@/components/episodes/start-production-button";
import { ReviewPanel } from "@/components/episodes/review-panel";
import type { JobType, JobStatus } from "@/types/database";

type ProductionJob = { id: string; job_type: JobType; status: JobStatus; error_message: string | null };

const JOB_LABELS: Record<JobType, string> = {
  script_generation: "Script",
  voice_over: "Voice Over",
  image_generation: "Gambar",
  animation: "Animasi",
  music_generation: "Musik",
  video_composition: "Compose",
  publishing: "Publish",
};

type PageProps = { params: Promise<{ id: string }> };

export default async function EpisodeDetailPage({ params }: PageProps) {
  const { id } = await params;
  const supabase = await createClient();

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const db = supabase as any;

  const { data: episode, error } = await db
    .from("episodes")
    .select("*")
    .eq("id", id)
    .single();

  if (error || !episode) notFound();

  const { data: productionJobs } = await db
    .from("production_jobs")
    .select("id, job_type, status, error_message")
    .eq("episode_id", id)
    .order("priority", { ascending: true }) as { data: ProductionJob[] | null };

  const jobs = productionJobs ?? [];
  const PIPELINE: JobType[] = ["voice_over", "image_generation", "animation", "music_generation", "video_composition", "publishing"];

  return (
    <div className="mx-auto max-w-3xl p-6">
      {/* Back + Actions */}
      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon-sm" render={<Link href="/episodes" />}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <h1 className="text-xl font-bold">{episode.title}</h1>
          <StatusBadge status={episode.status} />
        </div>
        <div className="flex items-center gap-2">
          <StartProductionButton episodeId={id} hasScript={!!episode.script} />
          <Button variant="outline" size="sm" render={<Link href={`/episodes/${id}/edit`} />}>
            <Pencil className="mr-2 h-3.5 w-3.5" />
            Edit
          </Button>
        </div>
      </div>

      {/* Meta info */}
      <div className="mb-6 flex flex-wrap gap-4 text-sm text-muted-foreground">
        {episode.episode_number && (
          <span>S{episode.season} E{episode.episode_number}</span>
        )}
        <span className="flex items-center gap-1">
          <Clock className="h-3.5 w-3.5" />
          {episode.target_duration} detik
        </span>
        <span className="flex items-center gap-1">
          <Calendar className="h-3.5 w-3.5" />
          {format(new Date(episode.created_at), "d MMMM yyyy", { locale: idLocale })}
        </span>
      </div>

      <Separator className="mb-6" />

      {/* Tema & Pesan Moral */}
      <div className="mb-6 grid gap-4 sm:grid-cols-2">
        <div className="rounded-xl border bg-card p-4">
          <p className="mb-1 text-xs font-medium uppercase tracking-wide text-muted-foreground">
            Tema Cerita
          </p>
          <p className="text-sm">{episode.theme || <span className="italic text-muted-foreground">Belum diisi</span>}</p>
        </div>
        <div className="rounded-xl border bg-card p-4">
          <p className="mb-1 text-xs font-medium uppercase tracking-wide text-muted-foreground">
            Pesan Moral
          </p>
          <p className="text-sm">{episode.moral_lesson || <span className="italic text-muted-foreground">Belum diisi</span>}</p>
        </div>
      </div>

      {/* Script */}
      <div className="rounded-xl border bg-card p-5">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="font-semibold">Script</h2>
          {episode.script && (
            <span className="text-xs text-muted-foreground">
              v{episode.script_version}
            </span>
          )}
        </div>
        {episode.script ? (
          <pre className="whitespace-pre-wrap rounded-lg bg-muted p-4 font-mono text-sm leading-relaxed">
            {episode.script}
          </pre>
        ) : (
          <div className="rounded-lg border border-dashed py-8 text-center text-sm text-muted-foreground">
            Script belum ada.{" "}
            <Link href={`/episodes/${id}/edit`} className="text-primary hover:underline">
              Tambahkan script
            </Link>
            .
          </div>
        )}
      </div>

      {/* Review Panel — selalu tampil */}
      <ReviewPanel episodeId={id} episodeStatus={episode.status} />

      {/* Production Pipeline */}
      {jobs.length > 0 && (
        <div className="rounded-xl border bg-card p-5">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="font-semibold">Production Pipeline</h2>
            <Link href="/production" className="text-xs text-primary hover:underline">
              Lihat semua →
            </Link>
          </div>
          <div className="flex flex-wrap gap-2">
            {PIPELINE.map((type) => {
              const job = jobs.find((j) => j.job_type === type);
              const label = JOB_LABELS[type];
              if (!job) {
                return (
                  <div key={type} className="flex items-center gap-1.5 rounded-lg border border-dashed px-3 py-1.5 text-xs text-muted-foreground/40">
                    {label}
                  </div>
                );
              }
              const statusIcon =
                job.status === "completed" ? <CheckCircle2 className="h-3.5 w-3.5 text-green-500" /> :
                job.status === "processing" ? <Loader2 className="h-3.5 w-3.5 text-blue-500 animate-spin" /> :
                job.status === "failed" ? <XCircle className="h-3.5 w-3.5 text-destructive" /> :
                <Clock className="h-3.5 w-3.5 text-muted-foreground" />;
              return (
                <div
                  key={type}
                  className={`flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-medium ${
                    job.status === "completed" ? "border-green-200 bg-green-500/5 text-green-700" :
                    job.status === "failed"    ? "border-destructive/30 bg-destructive/5 text-destructive" :
                    job.status === "processing"? "border-blue-200 bg-blue-500/5 text-blue-700" :
                    "border-border bg-background text-muted-foreground"
                  }`}
                >
                  {label}
                  {statusIcon}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
