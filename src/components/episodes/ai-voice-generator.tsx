"use client";

import { useState } from "react";
import { Mic, Loader2, Volume2, Play, Pause } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface AiVoiceGeneratorProps {
  episodeId: string;
  script: string;
  onGenerated?: (url: string) => void;
}

const CHARACTERS = [
  { value: "narrator", label: "Narrator" },
  { value: "bimo",     label: "Bimo (Panda)" },
  { value: "kiko",     label: "Kiko (Rubah)" },
];

export function AiVoiceGenerator({ episodeId, script, onGenerated }: AiVoiceGeneratorProps) {
  const [character, setCharacter] = useState("narrator");
  const [generating, setGenerating] = useState(false);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [playing, setPlaying] = useState(false);
  const [audio, setAudio] = useState<HTMLAudioElement | null>(null);

  async function generate() {
    if (!script.trim()) {
      toast.error("Script kosong — tulis script terlebih dahulu");
      return;
    }
    setGenerating(true);
    setAudioUrl(null);
    try {
      const res = await fetch("/api/ai/generate-voice", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ episodeId, text: script, character }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Generasi gagal");
      setAudioUrl(data.url);
      onGenerated?.(data.url);
      toast.success("Voice over berhasil digenerate");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Generasi voice over gagal");
    } finally {
      setGenerating(false);
    }
  }

  function togglePlay() {
    if (!audioUrl) return;
    if (playing && audio) {
      audio.pause();
      setPlaying(false);
      return;
    }
    const a = new Audio(audioUrl);
    a.onended = () => setPlaying(false);
    a.play();
    setAudio(a);
    setPlaying(true);
  }

  return (
    <div className="rounded-xl border border-dashed border-purple-500/40 bg-purple-500/5 p-4">
      <div className="flex items-center gap-2 mb-3">
        <Mic className="h-4 w-4 text-purple-500" />
        <span className="text-sm font-medium">Generate Voice Over</span>
      </div>

      <div className="flex items-center gap-3 flex-wrap">
        <Select value={character} onValueChange={(v) => { if (v) setCharacter(v); }}>
          <SelectTrigger className="w-44">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {CHARACTERS.map(({ value, label }) => (
              <SelectItem key={value} value={value}>{label}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Button size="sm" onClick={generate} disabled={generating} className="bg-purple-600 hover:bg-purple-700">
          {generating ? (
            <>
              <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" />
              Generating...
            </>
          ) : (
            <>
              <Volume2 className="mr-2 h-3.5 w-3.5" />
              Generate
            </>
          )}
        </Button>

        {audioUrl && (
          <Button size="sm" variant="outline" onClick={togglePlay}>
            {playing ? (
              <Pause className="mr-2 h-3.5 w-3.5" />
            ) : (
              <Play className="mr-2 h-3.5 w-3.5" />
            )}
            {playing ? "Pause" : "Play"}
          </Button>
        )}
      </div>

      {generating && (
        <p className="mt-2 text-xs text-muted-foreground">
          ElevenLabs sedang membuat audio... (biasanya 5-15 detik)
        </p>
      )}
      {audioUrl && (
        <p className="mt-2 text-xs text-green-600">
          ✓ Audio tersimpan di Asset Library
        </p>
      )}
    </div>
  );
}
