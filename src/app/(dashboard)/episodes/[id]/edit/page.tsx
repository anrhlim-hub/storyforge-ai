"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

import { Button } from "@/components/ui/button";
import { EpisodeForm, type EpisodeFormValues } from "@/components/episodes/episode-form";
import { ScriptEditor } from "@/components/episodes/script-editor";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { Episode } from "@/types/database";

export default function EditEpisodePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const router = useRouter();
  const [episode, setEpisode] = useState<Episode | null>(null);
  const [script, setScript] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    params.then(({ id }) => {
      fetch(`/api/episodes/${id}`)
        .then((r) => r.json())
        .then((data) => {
          setEpisode(data);
          setScript(data.script ?? "");
        });
    });
  }, [params]);

  async function handleSaveInfo(values: EpisodeFormValues) {
    if (!episode) return;
    const res = await fetch(`/api/episodes/${episode.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(values),
    });
    if (!res.ok) throw new Error("Gagal menyimpan");
    router.push(`/episodes/${episode.id}`);
    router.refresh();
  }

  async function handleSaveScript() {
    if (!episode) return;
    setSaving(true);
    await fetch(`/api/episodes/${episode.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ script }),
    });
    setSaving(false);
    router.refresh();
  }

  if (!episode) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl p-6">
      <div className="mb-6 flex items-center gap-3">
        <Button
          variant="ghost"
          size="icon-sm"
          render={<Link href={`/episodes/${episode.id}`} />}
        >
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-xl font-bold">Edit Episode</h1>
          <p className="text-sm text-muted-foreground truncate max-w-xs">{episode.title}</p>
        </div>
      </div>

      <Tabs defaultValue="info">
        <TabsList className="mb-5">
          <TabsTrigger value="info">Info</TabsTrigger>
          <TabsTrigger value="script">Script</TabsTrigger>
        </TabsList>

        <TabsContent value="info">
          <div className="rounded-2xl border bg-card p-6">
            <EpisodeForm
              defaultValues={episode}
              onSubmit={handleSaveInfo}
              submitLabel="Simpan Perubahan"
            />
          </div>
        </TabsContent>

        <TabsContent value="script">
          <div className="rounded-2xl border bg-card p-6 space-y-4">
            <div>
              <h2 className="font-semibold">Script Editor</h2>
              <p className="text-sm text-muted-foreground mt-0.5">
                Tulis script episode. Akan digunakan untuk voice over dan animasi.
              </p>
            </div>
            <ScriptEditor value={script} onChange={setScript} />
            <div className="flex justify-end">
              <Button onClick={handleSaveScript} disabled={saving}>
                {saving ? "Menyimpan..." : "Simpan Script"}
              </Button>
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
