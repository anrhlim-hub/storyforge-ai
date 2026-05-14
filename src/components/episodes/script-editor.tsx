"use client";

import { Textarea } from "@/components/ui/textarea";

interface ScriptEditorProps {
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
}

const CHAR_TARGET = 800;

export function ScriptEditor({ value, onChange, disabled }: ScriptEditorProps) {
  const charCount = value.length;
  const wordCount = value.trim() ? value.trim().split(/\s+/).length : 0;
  const progress = Math.min((charCount / CHAR_TARGET) * 100, 100);

  return (
    <div className="space-y-2">
      <Textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
        placeholder="Tuliskan script episode di sini...&#10;&#10;Contoh:&#10;[Scene 1 - Padang Rumput]&#10;Bimo: (melihat bunga) Wah, bunga ini sangat cantik!&#10;Kiko: Iya! Tapi kenapa bunganya layu ya?"
        className="min-h-[320px] resize-y font-mono text-sm leading-relaxed"
      />
      <div className="flex items-center justify-between text-xs text-muted-foreground">
        <span>{wordCount} kata · {charCount} karakter</span>
        <div className="flex items-center gap-2">
          <div className="h-1.5 w-24 overflow-hidden rounded-full bg-muted">
            <div
              className="h-full rounded-full bg-primary transition-all"
              style={{ width: `${progress}%` }}
            />
          </div>
          <span>{charCount}/{CHAR_TARGET}</span>
        </div>
      </div>
    </div>
  );
}
