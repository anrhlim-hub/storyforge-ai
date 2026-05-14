import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Pencil, Clock, Calendar } from "lucide-react";
import { format } from "date-fns";
import { id as idLocale } from "date-fns/locale";

import { createClient } from "@/lib/db/server";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { StatusBadge } from "@/components/episodes/status-badge";

type PageProps = { params: Promise<{ id: string }> };

export default async function EpisodeDetailPage({ params }: PageProps) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: episode, error } = await supabase
    .from("episodes")
    .select("*")
    .eq("id", id)
    .single();

  if (error || !episode) notFound();

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
        <Button variant="outline" size="sm" render={<Link href={`/episodes/${id}/edit`} />}>
          <Pencil className="mr-2 h-3.5 w-3.5" />
          Edit
        </Button>
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
    </div>
  );
}
