import { BarChart3 } from "lucide-react";

export default function AnalyticsPage() {
  return (
    <div className="flex flex-col items-center justify-center h-full py-20 text-center">
      <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10 mb-4">
        <BarChart3 className="h-8 w-8 text-primary" />
      </div>
      <h1 className="text-2xl font-bold">Analytics</h1>
      <p className="mt-2 text-muted-foreground max-w-sm">
        Statistik performa episode di Facebook. Fitur ini akan hadir di Phase 9.
      </p>
    </div>
  );
}
