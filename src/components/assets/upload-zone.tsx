"use client";

import { useRef, useState, useCallback } from "react";
import { Upload, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import type { AssetType } from "@/types/database";

interface UploadZoneProps {
  episodeId?: string;
  assetType: AssetType;
  onUploaded: (asset: { name: string; url: string; key: string; size: number; type: AssetType }) => void;
  /** url = public URL dari R2, key = storage key */
  accept?: string;
  className?: string;
}

const ACCEPTED: Record<AssetType, string> = {
  image: "image/*",
  audio: "audio/*",
  video: "video/*",
  music: "audio/*",
  sfx:   "audio/*",
};

export function UploadZone({ episodeId, assetType, onUploaded, accept, className }: UploadZoneProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);
  const [uploading, setUploading] = useState(false);

  const uploadFile = useCallback(async (file: File) => {
    setUploading(true);
    try {
      const params = new URLSearchParams({
        filename: file.name,
        contentType: file.type,
        type: assetType,
        ...(episodeId ? { episodeId } : {}),
      });

      const res = await fetch(`/api/assets/upload-url?${params}`);
      if (!res.ok) throw new Error("Gagal mendapatkan upload URL");
      const { uploadUrl, key, publicUrl } = await res.json();

      const putRes = await fetch(uploadUrl, {
        method: "PUT",
        body: file,
        headers: { "Content-Type": file.type },
      });
      if (!putRes.ok) throw new Error("Upload ke storage gagal");

      onUploaded({ name: file.name, url: publicUrl, key, size: file.size, type: assetType });
      toast.success(`${file.name} berhasil diupload`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Upload gagal");
    } finally {
      setUploading(false);
    }
  }, [assetType, episodeId, onUploaded]);

  const handleFiles = useCallback((files: FileList | null) => {
    if (!files || files.length === 0) return;
    uploadFile(files[0]);
  }, [uploadFile]);

  const onDragOver = (e: React.DragEvent) => { e.preventDefault(); setDragging(true); };
  const onDragLeave = () => setDragging(false);
  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
    handleFiles(e.dataTransfer.files);
  };

  return (
    <div
      className={cn(
        "flex cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed p-8 transition-colors",
        dragging ? "border-primary bg-primary/5" : "border-muted-foreground/25 hover:border-primary/50 hover:bg-muted/30",
        uploading && "pointer-events-none opacity-60",
        className,
      )}
      onClick={() => inputRef.current?.click()}
      onDragOver={onDragOver}
      onDragLeave={onDragLeave}
      onDrop={onDrop}
    >
      <input
        ref={inputRef}
        type="file"
        className="hidden"
        accept={accept ?? ACCEPTED[assetType]}
        onChange={(e) => handleFiles(e.target.files)}
      />

      {uploading ? (
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      ) : (
        <Upload className="h-8 w-8 text-muted-foreground" />
      )}

      <p className="text-sm text-muted-foreground">
        {uploading ? "Mengupload..." : "Klik atau seret file ke sini"}
      </p>
      <p className="text-xs text-muted-foreground/60 capitalize">
        {assetType} • {accept ?? ACCEPTED[assetType]}
      </p>
    </div>
  );
}
