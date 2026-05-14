import { Film } from "lucide-react";

export default function EpisodesPage() {
  return (
    <div className="flex flex-col gap-6 p-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Episodes</h1>
        <p className="text-muted-foreground">Kelola semua episode animasi Bimo &amp; Kiko.</p>
      </div>

      {/* Placeholder */}
      <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed bg-muted/30 py-20 text-center">
        <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-primary/10 text-primary">
          <Film className="h-7 w-7" />
        </div>
        <h3 className="text-lg font-semibold">Belum ada episode</h3>
        <p className="mt-1 text-sm text-muted-foreground">
          Buat episode pertama Anda dan mulai produksi otomatis.
        </p>
      </div>
    </div>
  );
}
