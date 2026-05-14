import { ImageIcon, Music, Video, Volume2, FileAudio } from "lucide-react";
import { cn } from "@/lib/utils";
import type { AssetType } from "@/types/database";

const iconMap: Record<AssetType, { Icon: React.ElementType; className: string }> = {
  image:  { Icon: ImageIcon,  className: "text-blue-500 bg-blue-100 dark:bg-blue-900/30" },
  audio:  { Icon: Volume2,    className: "text-purple-500 bg-purple-100 dark:bg-purple-900/30" },
  video:  { Icon: Video,      className: "text-orange-500 bg-orange-100 dark:bg-orange-900/30" },
  music:  { Icon: Music,      className: "text-green-500 bg-green-100 dark:bg-green-900/30" },
  sfx:    { Icon: FileAudio,  className: "text-pink-500 bg-pink-100 dark:bg-pink-900/30" },
};

interface AssetTypeIconProps {
  type: AssetType;
  size?: "sm" | "md" | "lg";
  className?: string;
}

const sizeMap = { sm: "h-8 w-8 [&_svg]:h-4 [&_svg]:w-4", md: "h-10 w-10 [&_svg]:h-5 [&_svg]:w-5", lg: "h-14 w-14 [&_svg]:h-7 [&_svg]:w-7" };

export function AssetTypeIcon({ type, size = "md", className }: AssetTypeIconProps) {
  const { Icon, className: colorClass } = iconMap[type] ?? iconMap.image;
  return (
    <div className={cn("flex shrink-0 items-center justify-center rounded-xl", colorClass, sizeMap[size], className)}>
      <Icon />
    </div>
  );
}
