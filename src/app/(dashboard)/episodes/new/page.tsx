"use client";

import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

import { Button } from "@/components/ui/button";
import { EpisodeForm, type EpisodeFormValues } from "@/components/episodes/episode-form";

export default function NewEpisodePage() {
  const router = useRouter();

  async function handleSubmit(values: EpisodeFormValues) {
    const res = await fetch("/api/episodes", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(values),
    });

    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error ?? "Gagal membuat episode");
    }

    const episode = await res.json();
    router.push(`/episodes/${episode.id}`);
    router.refresh();
  }

  return (
    <div className="mx-auto max-w-2xl p-6">
      <div className="mb-6 flex items-center gap-3">
        <Button variant="ghost" size="icon-sm" render={<Link href="/episodes" />}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-xl font-bold">Buat Episode Baru</h1>
          <p className="text-sm text-muted-foreground">Isi detail episode animasi</p>
        </div>
      </div>

      <div className="rounded-2xl border bg-card p-6">
        <EpisodeForm onSubmit={handleSubmit} submitLabel="Buat Episode" />
      </div>
    </div>
  );
}
