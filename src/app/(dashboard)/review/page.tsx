import { ClipboardCheck } from "lucide-react";

export default function ReviewPage() {
  return (
    <div className="flex flex-col items-center justify-center h-full py-20 text-center">
      <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10 mb-4">
        <ClipboardCheck className="h-8 w-8 text-primary" />
      </div>
      <h1 className="text-2xl font-bold">Review Hub</h1>
      <p className="mt-2 text-muted-foreground max-w-sm">
        Approval workflow dan review catatan untuk setiap episode. Fitur ini akan hadir di Phase 7.
      </p>
    </div>
  );
}
