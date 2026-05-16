"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import Link from "next/link";
import {
  Clapperboard, Volume2, ImageIcon, Film, Music,
  Video, Send, RefreshCw, CheckCircle2, XCircle,
  Clock, Loader2, ExternalLink, Play, Zap, ListTodo,
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
  const [queueLength, setQueueLength] = useState(0);
  const [workerRunning, setWorkerRunning] = useState(false);
  const workerRef = useRef(false);

  const loadJobs = useCallback(async () => {
    setLoading(true);
    const params = filterStatus !== "all" ? `?status=${filterStatus}` : "";
    const res = await fetch(`/api/production/jobs${params}`);
    if (res.ok) setJobs(await res.json());
    setLoading(false);
  }, [filterStatus]);

  const loadQueue = useCallback(async () => {
    const res = await fetch("/api/production/enqueue");
    if (res.ok) {
      const data = await res.json();
      setQueueLength(data.queueLength ?? 0);
    }
  }, []);

  useEffect(() => { loadJobs(); }, [loadJobs]);

  // Auto-refresh setiap 5 detik jika ada job processing/pending
  useEffect(() => {
    const hasActive = jobs.some((j) => j.status === "processing" || j.status === "pending");
    if (!hasActive) return;
    const interval = setInterval(() => { loadJobs(); loadQueue(); }, 5000);
    return () => clearInterval(interval);
  }, [jobs, loadJobs, loadQueue]);

  useEffect(() => { loadQueue(); }, [loadQueue]);

  // Worker loop — proses job dari Redis queue satu per satu
  const runWorker = useCallback(async () => {
    if (workerRef.current) return;
    workerRef.current = true;
    setWorkerRunning(true);

    try {
      while (true) {
        const res = await fetch("/api/production/worker", { method: "POST" });
        const data = await res.json();
        loadJobs();
        loadQueue();

        if (data.done || data.remaining === 0) break;
        if (!res.ok) {
          toast.error(`Job gagal: ${data.error ?? "error tidak diketahui"}`);
          break;
        }
      }
      toast.success("Semua job dalam antrian selesai diproses");
    } finally {
      workerRef.current = false;
      setWorkerRunning(false);
      loadJobs();
      loadQueue();
    }
  }, [loadJobs, loadQueue]);

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

  async function handleRun(jobId: string) {
    toast.info("Memulai job...");
    const res = await fetch("/api/production/run", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ jobId }),
    });
    if (res.ok) {
      toast.success("Job selesai");
      loadJobs();
    } else {
      const err = await res.json().catch(() => ({}));
      toast.error(err?.error ?? "Job gagal");
      loadJobs();
    }
  }

  async function handleSubmitReview(episodeId: string) {
    const res = await fetch(`/api/episodes/${episodeId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: "review" }),
    });
    if (res.ok) {
      toast.success("Episode dikirim ke Review Hub");
      loadJobs();
    } else {
      toast.error("Gagal kirim ke review");
    }
  }

  // Enqueue semua pending job ke Redis, lalu jalankan worker
  async function handleQueueAll(jobIds: string[]) {
    const enqRes = await fetch("/api/production/enqueue", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ jobIds }),
    });

    if (!enqRes.ok) {
      // Redis belum konfigurasi — fallback ke mode sequential lama
      toast.info(`Memproses ${jobIds.length} job (mode langsung)...`);
      for (const jobId of jobIds) {
        const res = await fetch("/api/production/run", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ jobId }),
        });
        if (!res.ok) {
          const err = await res.json().catch(() => ({}));
          toast.error(`Job gagal: ${err?.error ?? "error tidak diketahui"}`);
          break;
        }
      }
      toast.success("Pipeline selesai");
      loadJobs();
      return;
    }

    const data = await enqRes.json();
    toast.success(`${data.queued} job ditambahkan ke antrian`);
    loadQueue();
    runWorker();
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
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Production Pipeline</h1>
          <p className="text-sm text-muted-foreground">
            Status antrian job produksi animasi
          </p>
        </div>
        <div className="flex items-center gap-2">
          {/* Queue indicator */}
          {queueLength > 0 && (
            <span className="flex items-center gap-1.5 rounded-full border border-blue-200 bg-blue-500/10 px-3 py-1 text-xs font-medium text-blue-600">
              <ListTodo className="h-3 w-3" />
              {queueLength} dalam antrian
              {workerRunning && <Loader2 className="h-3 w-3 animate-spin" />}
            </span>
          )}
          <Button variant="outline" size="sm" onClick={() => { loadJobs(); loadQueue(); }}>
            <RefreshCw className="mr-2 h-3.5 w-3.5" />
            Refresh
          </Button>
        </div>
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
            className={`rounded-xl border p-4 text-left transition-colors hover:bg-muted/50 ${filterStatus === key ? `border-primary ${bg}` : ""}`}
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
                      <button
                        onClick={() => handleSubmitReview(episodeId)}
                        className="flex items-center gap-1 rounded-full bg-green-500/10 px-2.5 py-0.5 text-xs font-medium text-green-600 hover:bg-green-500/20 transition-colors"
                      >
                        <CheckCircle2 className="h-3 w-3" />
                        Kirim ke Review
                      </button>
                    )}
                    {hasFailure && (
                      <span className="rounded-full bg-destructive/10 px-2 py-0.5 text-xs font-medium text-destructive">
                        Ada Error
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    {(() => {
                      const pendingJobs = PIPELINE_ORDER
                        .map((t) => jobMap[t])
                        .filter((j) => j && j.status === "pending")
                        .map((j) => j!.id);
                      return pendingJobs.length > 0 ? (
                        <button
                          onClick={() => handleQueueAll(pendingJobs)}
                          disabled={workerRunning}
                          className="flex items-center gap-1 rounded-lg bg-primary px-2.5 py-1 text-xs font-medium text-primary-foreground hover:bg-primary/90 transition-colors disabled:opacity-50"
                        >
                          {workerRunning
                            ? <Loader2 className="h-3 w-3 animate-spin" />
                            : <Zap className="h-3 w-3" />
                          }
                          {workerRunning ? "Memproses..." : "Proses Semua"}
                        </button>
                      ) : null;
                    })()}
                    <span className="text-xs text-muted-foreground">{epJobs.length} job</span>
                  </div>
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

                        {/* Run button for pending jobs */}
                        {job?.status === "pending" && (
                          <button
                            onClick={() => handleRun(job.id)}
                            className="rounded p-0.5 text-green-600 hover:text-green-700"
                            title="Jalankan job ini"
                          >
                            <Play className="h-3 w-3" />
                          </button>
                        )}
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
