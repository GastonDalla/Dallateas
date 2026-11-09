import { cn } from "@dallateas/ui/lib/utils";
import type { Route } from "next";
import Link from "next/link";
import type { ReactNode } from "react";

import { Cover } from "@/components/dj/cover";
import { KeyTag } from "@/components/dj/key-tag";
import { recordKey, RecordSticker, recordTempo } from "@/components/dj/track-tempo";
import { RECORD_CONDITIONS } from "@/lib/format";

import type { ListedVinyl } from "./types";

type CollectionTableProps = {
  vinyls: ListedVinyl[];
  renderActions: (vinyl: ListedVinyl) => ReactNode;
};

const WIDE = "hidden lg:table-cell";
const MEDIUM = "hidden md:table-cell";
const DASH = <span className="text-muted-foreground">—</span>;

function conditionLabel({ mediaCondition, sleeveCondition }: ListedVinyl) {
  const media = mediaCondition ? RECORD_CONDITIONS[mediaCondition].short : null;
  const sleeve = sleeveCondition ? RECORD_CONDITIONS[sleeveCondition].short : null;
  if (!media && !sleeve) return null;
  return `${media ?? "—"}/${sleeve ?? "—"}`;
}

function keysLabel(vinyl: ListedVinyl) {
  const key = recordKey(vinyl.tracks);
  if (key) return <KeyTag value={key} />;

  const keys = [...new Set(vinyl.tracks.flatMap(({ camelotKey }) => camelotKey ?? []))];
  return keys.length > 0 ? <span className="tabular">{keys.join(" ")}</span> : DASH;
}

/** What a hidden column holds, moved under the name so a narrow screen loses no field. */
function narrowDetails(vinyl: ListedVinyl) {
  return [vinyl.label, vinyl.year, vinyl.location].filter(Boolean).join(" · ");
}

export function CollectionTable({ vinyls, renderActions }: CollectionTableProps) {
  return (
    <table className="w-full table-fixed text-sm">
      <thead className="text-left text-[13px] text-muted-foreground">
        <tr>
          <th scope="col" className="h-9 font-normal">
            Disco
          </th>
          <th scope="col" className={cn(WIDE, "w-40 font-normal")}>
            Sello
          </th>
          <th scope="col" className={cn(WIDE, "w-16 text-right font-normal")}>
            Año
          </th>
          <th scope="col" className="w-24 pl-4 font-normal">
            BPM
          </th>
          <th scope="col" className={cn(MEDIUM, "w-28 font-normal")}>
            Tonalidad
          </th>
          <th scope="col" className={cn(MEDIUM, "w-24 font-normal")}>
            Estado
          </th>
          <th scope="col" className={cn(WIDE, "w-36 font-normal")}>
            Ubicación
          </th>
          <th scope="col" className="w-11 md:w-9">
            <span className="sr-only">Acciones</span>
          </th>
        </tr>
      </thead>
      <tbody>
        {vinyls.map((vinyl) => {
          const condition = conditionLabel(vinyl);
          const details = narrowDetails(vinyl);

          return (
            <tr key={vinyl.id} className="border-t border-border">
              <td className="py-2">
                <Link href={`/vinyl/${vinyl.id}` as Route} className="group flex min-w-0 items-center gap-3">
                  <Cover src={vinyl.coverUrl} alt="" sizes="48px" className="size-12 shrink-0" />
                  <span className="min-w-0">
                    <span className="block truncate font-medium transition-colors duration-[120ms] group-hover:text-link">{vinyl.title}</span>
                    <span className="block truncate text-[13px] text-muted-foreground">{vinyl.artist}</span>
                    {details && <span className="block truncate text-[13px] text-muted-foreground lg:hidden">{details}</span>}
                    {condition && <span className="block truncate text-[13px] text-muted-foreground md:hidden">{condition}</span>}
                  </span>
                </Link>
              </td>
              <td className={cn(WIDE, "truncate pr-3 text-muted-foreground")}>{vinyl.label ?? "—"}</td>
              <td className={cn(WIDE, "tabular pr-3 text-right text-muted-foreground")}>{vinyl.year ?? "—"}</td>
              <td className="pl-4">
                {recordTempo(vinyl.tracks, vinyl.bpm) ? <RecordSticker tracks={vinyl.tracks} bpm={vinyl.bpm} /> : DASH}
              </td>
              <td className={cn(MEDIUM, "truncate pr-3")}>{keysLabel(vinyl)}</td>
              <td className={cn(MEDIUM, "tabular pr-3 text-muted-foreground")}>{condition ?? "—"}</td>
              <td className={cn(WIDE, "truncate pr-3 text-muted-foreground")}>{vinyl.location ?? "—"}</td>
              <td>{renderActions(vinyl)}</td>
            </tr>
          );
        })}
      </tbody>
    </table>
  );
}
