"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import {
  Clapperboard, Volume2, ImageIcon, Film, Music,
  Video, Send, RefreshCw, CheckCircle2, XCircle,
  Clock, Loader2, ExternalLink,
} from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import type { JobStatus, JobType } from "@/types/database";

type Episode = { id: string; title: string; status: string };

type Job = {
  id: string;
  episode_id: string;
  job_type: JobType;
  status: JobStatus;
  priority: number;
  attempts: number;
  error_message: string | null;
  started_at: string | null;
  completed_at: string | null;
  created_at: string;
  episodes: Episode | null;
};

const JOB_META: Record<JobType, { label: string; Icon: React.ElementType; color: string }> = {
  script_generation: { label: "Script",      Icon: Clapperboard, color: "text-violet-500" },
  voice_over:        { label: "Voice Over",  Icon: Volume2,      color: "text-blue-500"   },
  image_generation:  { label: "Gambar",      Icon: ImageIcon,    color: "text-green-500"  },
  animation:         { label: "Animasi",     Icon: Film,         color: "text-orange-500" },
  music_generation:  { label: "Musik",       Icon: Music,        color: "text-pink-500"   },
  video_composition: { label: "Compose",     Icon: Video,        color: "text-cyan-500"   },
  publishing:        { label: "Publish",     Icon: Send,         color: "text-primary"    },
};

const STATUS_META: Record<JobStatus, { label: string; Icon: React.ElementType; className: string }> = {
  pending:    { label: "Menunggu",  Icon: Clock,       className: "text-muted-foreground"   },
  processing: { label: "Berjalan", Icon: Loader2,     className: "text-blue-500 animate-spin" },
  completed:  { label: "Selesai",  Icon: CheckCircle2,className: "text-green-500"           },
  failed:     { label: "Gagal",    Icon: XCircle,     className: "text-destructive"         },
  retrying:   { label: "Retry",    Icon: RefreshCw,   className: "text-orange-500 animate-spin" },
};

const PIPELINE_ORDER: JobType[] = [
  "script_generation", "voice_over", "image_generation",
  "animation", "music_generation", "video_composition", "publishing",
];

export default function ProductionPage() {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState<JobStatus | "all">("all");

  const loadJobs = useCallback(async () => {
    setLoading(true);
    const params = filterStatus !== "all" ? `?status=${filterStatus}` : "";
    const res = await fetch(`/api/production/jobs${params}`);
    if (res.ok) setJobs(await res.json());
    setLoading(false);
  }, [filterStatus]);

  useEffect(() => { loadJobs(); }, [loadJobs]);

  async function handleRetry(jobId: string) {
    const res = await fetch(`/api/production/jobs/${jobId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: "pending", error_message: null }),
    });
    if (res.ok) {
      toast.success("Job dikembalikan ke antrian");
      loadJobs();
    } else {
      toast.error("Gagal retry job");
    }
  }

  // Kelompokkan jobs per episode
  const byEpisode = jobs.reduce<Record<string, { episode: Episode | null; jobs: Job[] }>>((acc, job) => {
    const eid = job.episode_id;
    if (!acc[eid]) acc[eid] = { episode: job.episodes, jobs: [] };
    acc[eid].jobs.push(job);
    return acc;
  }, {});

  const counts = {
    processing: jobs.filter((j) => j.status === "processing").length,
    pending:    jobs.filter((j) => j.status === "pending").length,
    completed:  jobs.filter((j) => j.status === "completed").length,
    failed:     jobs.filter((j) => j.status === "failed").length,
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Production Pipeline</h1>
          <p className="text-sm text-muted-foreground">
            Status antrian job produksi animasi
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={loadJobs}>
          <RefreshCw className="mr-2 h-3.5 w-3.5" />
          Refresh
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {([
          { key: "processing", label: "Berjalan",  color: "text-blue-500",    bg: "bg-blue-500/10"  },
          { key: "pending",    label: "Menunggu",  color: "text-muted-foreground", bg: "bg-muted"   },
          { key: "completed",  label: "Selesai",   color: "text-green-500",   bg: "bg-green-500/10" },
          { key: "failed",     label: "Gagal",     color: "text-destructive", bg: "bg-destructive/10" },
        ] as const).map(({ key, label, color, bg }) => (
          <button
            key={key}
            onClick={() => setFilterStatus(filterStatus === key ? "all" : key)}
            className={`rounded-xl border p-4 text-left transition-colors hover:bg-muted/50 ${filterStatus === key ? "border-primary bg-primary/5" : ""}`}
          >
            <p className={`text-2xl font-bold ${color}`}>{counts[key]}</p>
            <p className="text-sm text-muted-foreground">{label}</p>
          </button>
        ))}
      </div>

      {/* Filter */}
      <div className="flex gap-2 flex-wrap">
        {(["all", "processing", "pending", "completed", "failed", "retrying"] as const).map((s) => (
          <button
            key={s}
            onClick={() => setFilterStatus(s)}
            className={`rounded-full px-3 py-1 text-sm font-medium border transition-colors ${
              filterStatus === s
                ? "bg-primary text-primary-foreground border-primary"
                : "bg-background border-border hover:bg-muted"
            }`}
          >
            {s === "all" ? "Semua" : STATUS_META[s]?.label ?? s}
          </button>
        ))}
      </div>

      {/* Job list per episode */}
      {loading ? (
        <div className="space-y-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-32 animate-pulse rounded-2xl bg-muted" />
          ))}
        </div>
      ) : Object.keys(byEpisode).length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-2xl border-2 border-dashed py-20 text-center">
          <Clapperboard className="mb-4 h-12 w-12 opacity-30" />
          <p className="font-medium text-muted-foreground">Belum ada job produksi</p>
          <p className="mt-1 text-sm text-muted-foreground">
            Buka episode dan klik &quot;Mulai Produksi&quot; untuk memulai
          </p>
          <Button variant="outline" size="sm" className="mt-4" render={<Link href="/episodes" />}>
            <ExternalLink className="mr-2 h-3.5 w-3.5" />
            Ke Daftar Episode
          </Button>
        </div>
      ) : (
        <div className="space-y-4">
          {Object.entries(byEpisode).map(([episodeId, { episode, jobs: epJobs }]) => {
            const jobMap = Object.fromEntries(epJobs.map((j) => [j.job_type, j]));
            const hasFailure = epJobs.some((j) => j.status === "failed");
            const allDone = PIPELINE_ORDER
              .filter((t) => t !== "script_generation")
              .every((t) => jobMap[t]?.status === "completed");

            return (
              <div key={episodeId} className="rounded-2xl border bg-card p-5">
                {/* Episode header */}
                <div className="mb-4 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Link
                      href={`/episodes/${episodeId}`}
                      className="font-semibold hover:text-primary transition-colors line-clamp-1"
                    >
                      {episode?.title ?? "Episode tidak diketahui"}
                    </Link>
                    {allDone && (
                      <span className="rounded-full bg-green-500/10 px-2 py-0.5 text-xs font-medium text-green-600">
                        Selesai
                      </span>
                    )}
                    {hasFailure && (
                      <span className="rounded-full bg-destructive/10 px-2 py-0.5 text-xs font-medium text-destructive">
                        Ada Error
                      </span>
                    )}
                  </div>
                  <span className="text-xs text-muted-foreground">{epJobs.length} job</span>
                </div>

                {/* Pipeline steps */}
                <div className="flex flex-wrap gap-2">
                  {PIPELINE_ORDER.map((type, idx) => {
                    const job = jobMap[type];
                    const meta = JOB_META[type];
                    const sMeta = job ? STATUS_META[job.status] : null;
                    const StatusIcon = sMeta?.Icon;

                    return (
                      <div key={type} className="flex items-center gap-1.5">
                        <div
                          className={`flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-medium transition-colors ${
                            !job
                              ? "border-dashed border-border bg-muted/30 text-muted-foreground/50"
                              : job.status === "completed"
                              ? "border-green-200 bg-green-500/5 text-green-700"
                              : job.status === "failed"
                              ? "border-destructive/30 bg-destructive/5 text-destructive"
                              : job.status === "processing"
                              ? "border-blue-200 bg-blue-500/5 text-blue-700"
                              : "border-border bg-background text-muted-foreground"
                          }`}
                        >
                          <meta.Icon className={`h-3.5 w-3.5 ${job ? meta.color : ""}`} />
                          <span>{meta.label}</span>
                          {StatusIcon && (
                            <StatusIcon className={`h-3 w-3 ${sMeta?.className ?? ""}`} />
                          )}
                        </div>

                        {/* Retry button for failed jobs */}
                        {job?.status === "failed" && (
                          <button
                            onClick={() => handleRetry(job.id)}
                            className="rounded p-0.5 text-muted-foreground hover:text-foreground"
                            title="Retry job ini"
                          >
                            <RefreshCw className="h-3 w-3" />
                          </button>
                        )}

                        {/* Arrow separator */}
                        {idx < PIPELINE_ORDER.length - 1 && (
                          <span className="text-muted-foreground/30 text-xs">›</span>
                        )}
                      </div>
                    );
                  })}
                </div>

                {/* Error messages */}
                {epJobs.filter((j) => j.status === "failed" && j.error_message).map((j) => (
                  <div key={j.id} className="mt-3 rounded-lg bg-destructive/5 border border-destructive/20 px-3 py-2 text-xs text-destructive">
                    <span className="font-medium">{JOB_META[j.job_type].label}:</span> {j.error_message}
                  </div>
                ))}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
