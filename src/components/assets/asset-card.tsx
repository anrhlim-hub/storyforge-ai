"use client";

import { Trash2, ExternalLink } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { id as idLocale } from "date-fns/locale";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { AssetTypeIcon } from "./asset-type-icon";
import type { Asset } from "@/types/database";

interface AssetCardProps {
  asset: Asset;
  onDelete?: (id: string) => void;
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function AssetCard({ asset, onDelete }: AssetCardProps) {
  const timeAgo = formatDistanceToNow(new Date(asset.created_at), {
    addSuffix: true,
    locale: idLocale,
  });

  return (
    <Card className="group flex flex-col transition-shadow hover:shadow-md">
      {/* Preview area */}
      <div className="relative flex items-center justify-center overflow-hidden rounded-t-xl bg-muted/40 p-4">
        {asset.type === "image" ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={asset.url}
            alt={asset.name}
            className="max-h-32 w-full rounded-lg object-contain"
          />
        ) : (
          <AssetTypeIcon type={asset.type} size="lg" />
        )}

        {/* Hover actions */}
        <div className="absolute inset-0 flex items-center justify-center gap-2 bg-black/40 opacity-0 transition-opacity group-hover:opacity-100 rounded-t-xl">
          <Button
            size="icon-sm"
            variant="secondary"
            onClick={() => window.open(asset.url, "_blank")}
          >
            <ExternalLink className="h-4 w-4" />
          </Button>
          {onDelete && (
            <Button
              size="icon-sm"
              variant="destructive"
              onClick={() => onDelete(asset.id)}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          )}
        </div>
      </div>

      <CardContent className="flex-1 px-3 pb-1 pt-3">
        <p className="truncate text-sm font-medium leading-tight">{asset.name}</p>
        {asset.subtype && (
          <p className="mt-0.5 truncate text-xs text-muted-foreground capitalize">{asset.subtype}</p>
        )}
      </CardContent>

      <CardFooter className="gap-2 px-3 pb-3 pt-0 text-xs text-muted-foreground">
        {asset.size_bytes != null && (
          <span>{formatBytes(asset.size_bytes)}</span>
        )}
        <span className="ml-auto">{timeAgo}</span>
      </CardFooter>
    </Card>
  );
}
