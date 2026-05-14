"use client";

import { useState } from "react";
import { Sparkles, Loader2, Check, RefreshCw, ChevronDown, ChevronUp } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface AiScriptGeneratorProps {
  episodeId: string;
  onAccept: (script: string) => void;
}

export function AiScriptGenerator({ episodeId, onAccept }: AiScriptGeneratorProps) {
  const [generating, setGenerating] = useState(false);
  const [preview, setPreview] = useState<string | null>(null);
  const [expanded, setExpanded] = useState(true);

  async function generate() {
    setGenerating(true);
    setPreview(null);
    try {
      const res = await fetch("/api/ai/generate-script", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ episodeId }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Generasi gagal");
      setPreview(data.script);
      setExpanded(true);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Generasi script gagal");
    } finally {
      setGenerating(false);
    }
  }

  function accept() {
    if (!preview) return;
    onAccept(preview);
    setPreview(null);
    toast.success("Script AI berhasil diterapkan");
  }

  return (
    <div className="rounded-xl border border-dashed border-primary/40 bg-primary/5 p-4">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-primary" />
          <span className="text-sm font-medium">Generate Script dengan AI</span>
        </div>

        <div className="flex items-center gap-2">
          {preview && (
            <Button size="sm" variant="ghost" onClick={() => setExpanded((v) => !v)}>
              {expanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
            </Button>
          )}
          <Button size="sm" onClick={generate} disabled={generating}>
            {generating ? (
              <>
                <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" />
                Generating...
              </>
            ) : preview ? (
              <>
                <RefreshCw className="mr-2 h-3.5 w-3.5" />
                Buat Ulang
              </>
            ) : (
              <>
                <Sparkles className="mr-2 h-3.5 w-3.5" />
                Generate
              </>
            )}
          </Button>
        </div>
      </div>

      {generating && (
        <div className="mt-3 flex items-center gap-2 text-xs text-muted-foreground">
          <Loader2 className="h-3 w-3 animate-spin" />
          Claude sedang menulis script... (biasanya 10-20 detik)
        </div>
      )}

      {preview && expanded && (
        <div className="mt-4 space-y-3">
          <pre className={cn(
            "max-h-64 overflow-y-auto whitespace-pre-wrap rounded-lg bg-background p-3",
            "font-mono text-xs leading-relaxed ring-1 ring-border",
          )}>
            {preview}
          </pre>
          <div className="flex justify-end">
            <Button size="sm" onClick={accept}>
              <Check className="mr-2 h-3.5 w-3.5" />
              Gunakan Script Ini
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
