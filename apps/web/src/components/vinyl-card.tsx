import { cn } from "@dallateas/ui/lib/utils";
import type { Route } from "next";
import Link from "next/link";
import type { ReactNode } from "react";

import { Cover } from "@/components/dj/cover";
import { RecordSticker } from "@/components/dj/track-tempo";
import { RECORD_CONDITIONS, type BPM_SOURCE_LABELS } from "@/lib/format";

type VinylCardProps = {
  id?: string;
  title: string;
  artist: string;
  genre?: string | null;
  style?: string | null;
  coverUrl?: string | null;
  href?: string;
  /** Cuts with a tempo, for the sticker. */
  tracks?: readonly {
    bpm: number | null;
    bpmSource: keyof typeof BPM_SOURCE_LABELS | null;
    camelotKey: string | null;
  }[];
  bpm?: number | null;
  condition?: keyof typeof RECORD_CONDITIONS | null;
  /** The cover's rendered width. */
  sizes?: string;
  priority?: boolean;
  /** A menu for the record, outside the link so it can hold its own controls. */
  actions?: ReactNode;
};

const GRID_SIZES = "(min-width: 1280px) 16vw, (min-width: 1024px) 18vw, (min-width: 768px) 22vw, (min-width: 640px) 30vw, 46vw";

const NO_TRACKS: NonNullable<VinylCardProps["tracks"]> = [];

/** A record in a crate: the sleeve with its sticker, then what you would read on the spine. */
export function VinylCard({
  title,
  artist,
  genre,
  style,
  coverUrl,
  href,
  tracks = NO_TRACKS,
  bpm,
  condition,
  sizes = GRID_SIZES,
  priority,
  actions,
}: VinylCardProps) {
  const details = [genre, style?.split(",")[0]?.trim()].filter(Boolean).join(" · ");

  const content = (
    <>
      <div className="relative">
        <Cover src={coverUrl} alt="" sizes={sizes} priority={priority} />
        <RecordSticker tracks={tracks} bpm={bpm} className="absolute top-1.5 left-1.5" />
        {condition && (
          <span className="tabular absolute bottom-1.5 left-1.5 rounded-sm bg-background px-1.5 py-0.5 text-xs font-medium text-foreground">
            <span className="sr-only">Estado del disco: </span>
            {RECORD_CONDITIONS[condition].short}
          </span>
        )}
      </div>
      <div className={cn("mt-2 flex flex-col", actions && "pr-9")}>
        <h3 className="truncate font-sans text-sm font-medium transition-colors duration-[120ms] group-hover:text-link">{title}</h3>
        <p className="truncate text-[13px] text-muted-foreground">{artist}</p>
        {details && <p className="truncate text-[13px] text-muted-foreground">{details}</p>}
      </div>
    </>
  );

  return (
    <article className="group relative min-w-0">
      {href ? (
        <Link href={href as Route} className="block">
          {content}
        </Link>
      ) : (
        content
      )}
      {actions && <div className="absolute right-0 bottom-0">{actions}</div>}
    </article>
  );
}
