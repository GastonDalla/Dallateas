"use client";

import type { AppRouter } from "@dallateas/api/routers/index";
import type { KeyRelation } from "@dallateas/dj/camelot";
import { cn } from "@dallateas/ui/lib/utils";
import type { inferRouterOutputs } from "@trpc/server";
import type { Route } from "next";
import Link from "next/link";

import { BpmSticker } from "@/components/dj/bpm-sticker";
import { Cover } from "@/components/dj/cover";
import { KeyTag } from "@/components/dj/key-tag";
import { PitchRuler } from "@/components/dj/pitch-ruler";
import { DragHandle, type DragHandleProps } from "@/components/sortable-item";
import { formatBpm, formatPitch } from "@/lib/format";

type SetFlowData = inferRouterOutputs<AppRouter>["folderSetFlow"];

export type SetRowData = SetFlowData["rows"][number];
export type SetTransition = SetFlowData["transitions"][number];

const RELATIONS: Record<KeyRelation, { label: string; tone: string }> = {
  same: { label: "Misma tonalidad", tone: "text-good" },
  adjacent: { label: "Vecina", tone: "text-good" },
  relative: { label: "Relativa", tone: "text-good" },
  boost: { label: "Sube energía", tone: "text-warn" },
  clash: { label: "Choca", tone: "text-clash" },
};

const FIRST_WITH_TEMPO = "Primero con tempo";

type CutPickerProps = {
  row: SetRowData;
  disabled: boolean;
  onChoose: (trackId: string | null) => void;
};

function CutPicker({ row, disabled, onChoose }: CutPickerProps) {
  return (
    <select
      aria-label={`Corte de ${row.vinyl.title}`}
      value={row.chosen ? (row.trackId ?? "") : ""}
      disabled={disabled}
      onChange={(event) => onChoose(event.target.value || null)}
      className="tabular mt-1 h-11 w-full max-w-sm rounded-md border border-input bg-background px-2 text-[13px] outline-none focus-visible:border-ring focus-visible:ring-1 focus-visible:ring-ring/50 md:h-8"
    >
      <option value="">{FIRST_WITH_TEMPO}</option>
      {row.vinyl.tracks.map((track) => (
        <option key={track.id} value={track.id}>
          {track.side} {track.title}
          {track.bpm === null ? "" : ` · ${formatBpm(track.bpm)}`}
        </option>
      ))}
    </select>
  );
}

function ChangeDetails({ transition, pitchRange }: { transition: SetTransition; pitchRange: number }) {
  const { pitch, reachable, relation, effectiveKey, tempoFactor } = transition;

  if (pitch === null) {
    return <span className="text-muted-foreground">Falta el BPM de uno de los dos discos</span>;
  }

  return (
    <>
      <span className={cn("tabular w-14 font-medium", !reachable && "text-clash")}>{formatPitch(pitch)}</span>
      <PitchRuler pitch={pitch} range={pitchRange} className="w-28 sm:w-40" />
      {!reachable && <span className="font-medium text-clash">No llega con ±{pitchRange}%</span>}
      {tempoFactor === 2 && <span className="text-muted-foreground">A doble tiempo</span>}
      {tempoFactor === 0.5 && <span className="text-muted-foreground">A medio tiempo</span>}
      {relation ? (
        <span className={cn("font-medium", RELATIONS[relation].tone)}>{RELATIONS[relation].label}</span>
      ) : (
        <span className="text-muted-foreground">Sin tonalidad</span>
      )}
      {effectiveKey && (
        <span className="text-muted-foreground">
          Suena en <KeyTag value={effectiveKey} />
        </span>
      )}
    </>
  );
}

type SetRowProps = {
  row: SetRowData;
  position: number;
  approximate: boolean;
  /** Absent on the last record, and null while a new order is being recalculated. */
  transition: SetTransition | null | undefined;
  pitchRange: number;
  handleProps: DragHandleProps;
  canReorder: boolean;
  canChooseCut: boolean;
  choosing: boolean;
  onChooseCut: (trackId: string | null) => void;
};

export function SetRow({
  row,
  position,
  approximate,
  transition,
  pitchRange,
  handleProps,
  canReorder,
  canChooseCut,
  choosing,
  onChooseCut,
}: SetRowProps) {
  return (
    <div className="bg-background py-3">
      <div className="flex items-start gap-3">
        {canReorder && <DragHandle label={`Mover ${row.vinyl.title}`} handleProps={handleProps} className="-ml-2 md:ml-0" />}
        <span className="tabular w-5 shrink-0 pt-0.5 text-right text-sm text-muted-foreground">{position}</span>
        <Cover src={row.vinyl.coverUrl} alt="" sizes="48px" className="size-12 shrink-0" />

        <div className="min-w-0 flex-1">
          <Link
            href={`/vinyl/${row.id}` as Route}
            className="block truncate text-sm font-medium hover:underline focus-visible:outline-2 focus-visible:outline-ring"
          >
            {row.vinyl.artist} <span className="font-normal text-muted-foreground">{row.vinyl.title}</span>
          </Link>
          {canChooseCut && row.vinyl.tracks.length > 0 ? (
            <CutPicker row={row} disabled={choosing} onChoose={onChooseCut} />
          ) : (
            <p className="truncate text-[13px] text-muted-foreground">{row.label}</p>
          )}
        </div>

        <div className="flex shrink-0 flex-col items-end gap-1 text-sm sm:flex-row sm:items-center sm:gap-4">
          {row.bpm === null ? (
            <span className="text-[13px] text-muted-foreground">Sin BPM</span>
          ) : (
            <BpmSticker tempo={formatBpm(row.bpm)} approximate={approximate} />
          )}
          <span className="sm:w-16">
            <KeyTag value={row.key} />
          </span>
        </div>
      </div>

      {transition !== undefined && (
        <div
          className={cn(
            "mt-2 flex min-h-8 flex-wrap items-center gap-x-4 gap-y-1 border-l border-border pl-3 text-[13px]",
            canReorder ? "md:ml-34" : "md:ml-26",
          )}
        >
          {transition === null ? (
            <span className="text-muted-foreground">Recalculando el cambio</span>
          ) : (
            <ChangeDetails transition={transition} pitchRange={pitchRange} />
          )}
        </div>
      )}
    </div>
  );
}
