import Link from "next/link";
import { Plus, Film } from "lucide-react";

import { createClient } from "@/lib/db/server";
import { Button } from "@/components/ui/button";
import { EpisodeCard } from "@/components/episodes/episode-card";

export default async function EpisodesPage() {
  const supabase = await createClient();

  const { data: episodes } = await supabase
    .from("episodes")
    .select("*")
    .order("created_at", { ascending: false });

  const list = episodes ?? [];

  return (
    <div className="flex flex-col gap-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Episodes</h1>
          <p className="text-muted-foreground">
            {list.length} episode{list.length !== 1 ? "s" : ""}
          </p>
        </div>
        <Button render={<Link href="/episodes/new" />}>
          <Plus className="mr-2 h-4 w-4" />
          Buat Episode
        </Button>
      </div>

      {/* Empty state */}
      {list.length === 0 && (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed bg-muted/30 py-20 text-center">
          <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-primary/10 text-primary">
            <Film className="h-7 w-7" />
          </div>
          <h3 className="text-lg font-semibold">Belum ada episode</h3>
          <p className="mt-1 text-sm text-muted-foreground">
            Buat episode pertama untuk memulai produksi animasi.
          </p>
          <Button className="mt-4" render={<Link href="/episodes/new" />}>
            <Plus className="mr-2 h-4 w-4" />
            Buat Episode Pertama
          </Button>
        </div>
      )}

      {/* Grid */}
      {list.length > 0 && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {list.map((episode) => (
            <EpisodeCard key={episode.id} episode={episode} />
          ))}
        </div>
      )}
    </div>
  );
}
