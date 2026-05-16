"use client";

import { useEffect, useState, useCallback } from "react";
import { ImageIcon, Music, Video, Volume2, FileAudio, Plus } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { AssetCard } from "@/components/assets/asset-card";
import { AssetTypeIcon } from "@/components/assets/asset-type-icon";
import { UploadZone } from "@/components/assets/upload-zone";
import type { Asset, AssetType } from "@/types/database";

const ASSET_TYPES: { value: AssetType; label: string; Icon: React.ElementType }[] = [
  { value: "image", label: "Gambar",  Icon: ImageIcon  },
  { value: "audio", label: "Audio",   Icon: Volume2    },
  { value: "music", label: "Musik",   Icon: Music      },
  { value: "sfx",   label: "SFX",     Icon: FileAudio  },
  { value: "video", label: "Video",   Icon: Video      },
];

export default function AssetsPage() {
  const [assets, setAssets] = useState<Asset[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterType, setFilterType] = useState<AssetType | "all">("all");
  const [uploadType, setUploadType] = useState<AssetType>("image");
  const [dialogOpen, setDialogOpen] = useState(false);

  const loadAssets = useCallback(async () => {
    setLoading(true);
    const params = filterType !== "all" ? `?type=${filterType}` : "";
    const res = await fetch(`/api/assets${params}`);
    if (res.ok) setAssets(await res.json());
    setLoading(false);
  }, [filterType]);

  useEffect(() => { void loadAssets(); }, [loadAssets]);

  async function handleUploaded(data: { name: string; url: string; key: string; size: number; type: AssetType }) {
    const res = await fetch("/api/assets", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: data.name, type: data.type, url: data.url, size_bytes: data.size }),
    });
    if (res.ok) {
      await loadAssets();
      setDialogOpen(false);
    } else {
      toast.error("Gagal menyimpan asset");
    }
  }

  async function handleDelete(id: string) {
    const res = await fetch(`/api/assets/${id}`, { method: "DELETE" });
    if (res.ok) {
      setAssets((prev) => prev.filter((a) => a.id !== id));
      toast.success("Asset dihapus");
    } else {
      toast.error("Gagal menghapus asset");
    }
  }

  const counts = assets.reduce<Record<string, number>>((acc, a) => {
    acc[a.type] = (acc[a.type] ?? 0) + 1;
    return acc;
  }, {});

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Asset Library</h1>
          <p className="text-sm text-muted-foreground">
            {assets.length} aset tersimpan
          </p>
        </div>

        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger render={<Button />}>
            <Plus className="mr-2 h-4 w-4" />
            Upload Asset
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Upload Asset Baru</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 pt-2">
              <div className="space-y-2">
                <label className="text-sm font-medium">Tipe Asset</label>
                <Select value={uploadType} onValueChange={(v) => setUploadType(v as AssetType)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {ASSET_TYPES.map(({ value, label }) => (
                      <SelectItem key={value} value={value}>{label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <UploadZone
                assetType={uploadType}
                onUploaded={handleUploaded}
              />
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
        {ASSET_TYPES.map(({ value, label }) => (
          <button
            key={value}
            onClick={() => setFilterType(filterType === value ? "all" : value)}
            className={`flex items-center gap-3 rounded-xl border p-3 text-left transition-colors hover:bg-muted/50 ${filterType === value ? "border-primary bg-primary/5" : ""}`}
          >
            <AssetTypeIcon type={value} size="sm" />
            <div>
              <p className="text-xs text-muted-foreground">{label}</p>
              <p className="font-semibold">{counts[value] ?? 0}</p>
            </div>
          </button>
        ))}
      </div>

      {/* Grid */}
      {loading ? (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
          {Array.from({ length: 10 }).map((_, i) => (
            <div key={i} className="aspect-square animate-pulse rounded-xl bg-muted" />
          ))}
        </div>
      ) : assets.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-xl border-2 border-dashed py-20 text-center">
          <AssetTypeIcon type={filterType === "all" ? "image" : filterType} size="lg" className="mb-4 opacity-40" />
          <p className="font-medium text-muted-foreground">Belum ada asset</p>
          <p className="mt-1 text-sm text-muted-foreground">
            Klik &quot;Upload Asset&quot; untuk menambahkan file
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
          {assets.map((asset) => (
            <AssetCard key={asset.id} asset={asset} onDelete={handleDelete} />
          ))}
        </div>
      )}
    </div>
  );
}
