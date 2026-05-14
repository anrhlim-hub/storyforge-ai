"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Clapperboard, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";

export function StartProductionButton({ episodeId, hasScript }: { episodeId: string; hasScript: boolean }) {
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function handleStart() {
    if (!hasScript) {
      toast.error("Episode harus punya script dulu sebelum diproduksi");
      return;
    }
    setLoading(true);
    const res = await fetch("/api/production/start", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ episodeId }),
    });
    const data = await res.json();
    if (res.ok) {
      toast.success(`${data.count} job produksi dibuat! Cek Production Pipeline.`);
      router.refresh();
    } else {
      toast.error(data.error ?? "Gagal memulai produksi");
    }
    setLoading(false);
  }

  return (
    <Button onClick={handleStart} disabled={loading || !hasScript} size="sm">
      {loading ? (
        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
      ) : (
        <Clapperboard className="mr-2 h-4 w-4" />
      )}
      {loading ? "Memulai..." : "Mulai Produksi"}
    </Button>
  );
}
