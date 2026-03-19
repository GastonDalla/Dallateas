"use client";

import { Disc3 } from "lucide-react";
import Link from "next/link";
import { memo } from "react";

type VinylCardProps = {
  id: string;
  title: string;
  artist: string;
  genre?: string | null;
  style?: string | null;
  coverUrl?: string | null;
  href?: string;
};

export const VinylCard = memo(function VinylCard({
  title,
  artist,
  genre,
  style,
  coverUrl,
  href,
}: VinylCardProps) {
  const content = (
    <article className="group flex flex-col gap-1.5 rounded-lg border border-border/60 bg-card p-2 shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md">
      <div className="aspect-square w-full overflow-hidden rounded-md bg-muted">
        {coverUrl ? (
          <img
            src={coverUrl}
            alt={`${title} — ${artist}`}
            loading="lazy"
            decoding="async"
            width={200}
            height={200}
            className="h-full w-full object-cover transition-transform group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full items-center justify-center">
            <Disc3 className="h-8 w-8 text-muted-foreground/30" aria-hidden="true" />
          </div>
        )}
      </div>
      <div className="space-y-0.5">
        <h3 className="line-clamp-2 text-xs font-semibold">{title}</h3>
        <p className="line-clamp-1 text-[11px] text-muted-foreground">
          {artist}
        </p>
        <div className="flex flex-wrap gap-1">
          {genre && (
            <span className="inline-flex items-center rounded-full bg-primary/10 px-2 py-0.5 text-[10px] text-primary">
              {genre}
            </span>
          )}
          {style && (
            <span className="inline-flex items-center rounded-full bg-accent px-2 py-0.5 text-[10px] text-accent-foreground">
              {style.split(",")[0]?.trim()}
            </span>
          )}
        </div>
      </div>
    </article>
  );

  if (href) {
    return (
      <Link href={href as any} className="block">
        {content}
      </Link>
    );
  }

  return content;
});
