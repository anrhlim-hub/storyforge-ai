import { cn } from "@/lib/utils";
import type { EpisodeStatus } from "@/types/database";

const statusConfig: Record<EpisodeStatus, { label: string; className: string }> = {
  draft:        { label: "Draft",        className: "bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400" },
  scripting:    { label: "Scripting",    className: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400" },
  voice_over:   { label: "Voice Over",   className: "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400" },
  animating:    { label: "Animating",    className: "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400" },
  compositing:  { label: "Compositing",  className: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400" },
  review:       { label: "Review",       className: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400" },
  approved:     { label: "Approved",     className: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400" },
  publishing:   { label: "Publishing",   className: "bg-cyan-100 text-cyan-700 dark:bg-cyan-900/30 dark:text-cyan-400" },
  published:    { label: "Published",    className: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400" },
  failed:       { label: "Failed",       className: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400" },
};

interface StatusBadgeProps {
  status: EpisodeStatus;
  className?: string;
}

export function StatusBadge({ status, className }: StatusBadgeProps) {
  const config = statusConfig[status] ?? statusConfig.draft;
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium",
        config.className,
        className,
      )}
    >
      {config.label}
    </span>
  );
}
