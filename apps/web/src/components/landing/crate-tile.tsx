import { cn } from "@dallateas/ui/lib/utils";
import { Lock } from "lucide-react";
import type { Route } from "next";
import Link from "next/link";
import type { ComponentProps, ReactNode } from "react";

import { Cover } from "@/components/dj/cover";
import { RecordSticker } from "@/components/dj/track-tempo";

const COVERS_PER_TILE = 4;

type TileRecord = {
  id: string;
  title: string;
  artist: string;
  coverUrl: string | null;
  tracks: ComponentProps<typeof RecordSticker>["tracks"];
};

type CrateTileProps = {
  crate: {
    id: string;
    name: string;
    color: string | null;
    hasPassword: boolean;
    vinylCount: number;
    viewCount: number;
    owner: { name: string };
    vinyls: TileRecord[];
  };
  /** For the first crates on a page, whose covers are what loads first. */
  priority?: boolean;
  className?: string;
};

/** The card a record shop sticks up in a bin, so a crate reads as one from across the room. */
export function CrateTab({ color, locked, className, children }: {
  color: string | null;
  locked: boolean;
  className?: string;
  children: ReactNode;
}) {
  return (
    <div className={cn("inline-flex max-w-full items-center gap-2 bg-foreground px-3 py-2 text-background", className)}>
      {color && <span aria-hidden="true" style={{ backgroundColor: color }} className="size-3 shrink-0 rounded-sm" />}
      {children}
      {locked && <Lock aria-label="Con contraseña" className="size-4 shrink-0" />}
    </div>
  );
}

/** A cover wearing its sticker, the way a record sits in a crate. */
export function StickeredCover({ record, sizes, bpm, priority }: {
  record: TileRecord;
  sizes: string;
  bpm?: number | null;
  priority?: boolean;
}) {
  return (
    <div className="relative overflow-hidden">
      <Cover src={record.coverUrl} alt={`${record.title}, ${record.artist}`} sizes={sizes} priority={priority} />
      <RecordSticker tracks={record.tracks} bpm={bpm} className="absolute bottom-1 left-1" />
    </div>
  );
}

export function CrateTile({ crate, priority, className }: CrateTileProps) {
  const blanks = Math.max(0, COVERS_PER_TILE - crate.vinyls.length);
  const details = [
    `por ${crate.owner.name}`,
    `${crate.vinylCount} ${crate.vinylCount === 1 ? "vinilo" : "vinilos"}`,
    ...(crate.viewCount > 0 ? [`${crate.viewCount} ${crate.viewCount === 1 ? "vista" : "vistas"}`] : []),
  ];

  return (
    <Link href={`/batea/${crate.id}` as Route} className={cn("group block min-w-0", className)}>
      <CrateTab color={crate.color} locked={crate.hasPassword} className="pt-1.5 pb-1 font-heading text-xl leading-tight font-bold">
        <span className="truncate">{crate.name}</span>
      </CrateTab>
      <div className="grid grid-cols-4 gap-1 bg-foreground p-1">
        {crate.vinyls.slice(0, COVERS_PER_TILE).map((record) => (
          <StickeredCover key={record.id} record={record} priority={priority} sizes="(min-width: 768px) 12vw, 22vw" />
        ))}
        {Array.from({ length: blanks }, (_, index) => (
          <Cover key={index} alt="" sizes="96px" />
        ))}
      </div>
      <p className="tabular mt-2 text-sm text-muted-foreground transition-colors group-hover:text-foreground">
        {details.join(" · ")}
      </p>
    </Link>
  );
}
