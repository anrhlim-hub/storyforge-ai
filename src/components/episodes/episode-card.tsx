import Link from "next/link";
import { Film, Clock, MoreHorizontal, Pencil, Trash2 } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { id as idLocale } from "date-fns/locale";

import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { StatusBadge } from "./status-badge";
import type { Episode } from "@/types/database";

interface EpisodeCardProps {
  episode: Episode;
  onDelete?: (id: string) => void;
}

export function EpisodeCard({ episode, onDelete }: EpisodeCardProps) {
  const timeAgo = formatDistanceToNow(new Date(episode.created_at), {
    addSuffix: true,
    locale: idLocale,
  });

  return (
    <Card className="group flex flex-col transition-shadow hover:shadow-md">
      {/* Thumbnail placeholder */}
      <div className="relative aspect-video overflow-hidden rounded-t-xl bg-gradient-to-br from-[#7BC043]/20 to-[#FF7F32]/20">
        {episode.thumbnail_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={episode.thumbnail_url}
            alt={episode.title}
            className="h-full w-full object-cover"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center">
            <Film className="h-10 w-10 text-muted-foreground/30" />
          </div>
        )}
        <div className="absolute right-2 top-2">
          <StatusBadge status={episode.status} />
        </div>
      </div>

      <CardHeader className="flex-row items-start justify-between gap-2 pb-2 pt-3">
        <div className="min-w-0 flex-1">
          <Link href={`/episodes/${episode.id}`} className="hover:underline">
            <h3 className="truncate font-semibold leading-tight">{episode.title}</h3>
          </Link>
          {episode.episode_number && (
            <p className="mt-0.5 text-xs text-muted-foreground">
              S{episode.season} E{episode.episode_number}
            </p>
          )}
        </div>

        <DropdownMenu>
          <DropdownMenuTrigger
            className="shrink-0 opacity-0 group-hover:opacity-100"
            render={
              <Button variant="ghost" size="icon-sm">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            }
          />
          <DropdownMenuContent align="end">
            <DropdownMenuItem render={<Link href={`/episodes/${episode.id}/edit`} />} >
              <Pencil className="mr-2 h-4 w-4" />
              Edit
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              className="text-destructive focus:text-destructive"
              onClick={() => onDelete?.(episode.id)}
            >
              <Trash2 className="mr-2 h-4 w-4" />
              Hapus
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </CardHeader>

      <CardContent className="flex-1 pb-2">
        {episode.theme && (
          <p className="line-clamp-2 text-sm text-muted-foreground">{episode.theme}</p>
        )}
      </CardContent>

      <CardFooter className="gap-3 pt-0 text-xs text-muted-foreground">
        <span className="flex items-center gap-1">
          <Clock className="h-3 w-3" />
          {episode.target_duration}s
        </span>
        <span className="ml-auto">{timeAgo}</span>
      </CardFooter>
    </Card>
  );
}
