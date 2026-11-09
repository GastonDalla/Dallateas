"use client";

import type { KeyRelation } from "@dallateas/dj/camelot";
import { PITCH_RANGES } from "@dallateas/dj/tempo";
import { cn } from "@dallateas/ui/lib/utils";
import type { AppRouter } from "@dallateas/api/routers/index";
import { keepPreviousData, useQuery } from "@tanstack/react-query";
import type { inferRouterOutputs } from "@trpc/server";
import { Loader2 } from "lucide-react";
import type { Route } from "next";
import Link from "next/link";

import { Cover } from "@/components/dj/cover";
import { KeyTag } from "@/components/dj/key-tag";
import { PitchRuler } from "@/components/dj/pitch-ruler";
import { Segmented } from "@/components/vinyl-form/segmented";
import { formatBpm, formatPitch } from "@/lib/format";
import { usePitchRange } from "@/lib/pitch-range";
import { trpc } from "@/utils/trpc";

type Mix = inferRouterOutputs<AppRouter>["trackMixCandidates"]["mixes"][number];

const RANGE_OPTIONS = PITCH_RANGES.map((range) => ({ value: range as number, label: `±${range}` }));

const RELATIONS: Record<KeyRelation, { label: string; className: string }> = {
  same: { label: "Misma tonalidad", className: "text-good" },
  adjacent: { label: "Vecina en la rueda", className: "text-good" },
  relative: { label: "Relativa", className: "text-good" },
  boost: { label: "Sube energía", className: "text-warn" },
  clash: { label: "Choca", className: "font-semibold text-clash" },
};

function tempoNote(tempoFactor: number) {
  if (tempoFactor === 2) return "Solo mezcla a doble tiempo";
  if (tempoFactor === 0.5) return "Solo mezcla a medio tiempo";
  return null;
}

function MixRow({ mix, range }: { mix: Mix; range: number }) {
  const { track, pitch, tempoFactor, effectiveKey, relation } = mix;
  const note = tempoNote(tempoFactor);
  const verdict = relation ? RELATIONS[relation] : null;

  return (
    <li className="border-t border-border first:border-t-0">
      <Link
        href={`/vinyl/${track.vinyl.id}` as Route}
        className="group grid grid-cols-[3rem_minmax(0,1fr)_auto] items-center gap-x-3 gap-y-1 py-2 md:grid-cols-[3rem_minmax(0,1fr)_auto_10rem]"
      >
        <Cover src={track.vinyl.coverUrl} alt="" sizes="48px" className="size-12" />

        <span className="min-w-0">
          <span className="block truncate text-sm font-medium transition-colors duration-[120ms] group-hover:text-link">
            {track.side} {track.title}
          </span>
          <span className="block truncate text-[13px] text-muted-foreground">
            {track.vinyl.artist}, {track.vinyl.title}
          </span>
          <span className="flex flex-wrap items-baseline gap-x-2 text-[13px]">
            <span className="text-muted-foreground">Suena en</span>
            <KeyTag value={effectiveKey} />
            {verdict && <span className={verdict.className}>{verdict.label}</span>}
            {note && <span className="text-muted-foreground">{note}</span>}
          </span>
        </span>

        <span className="text-right">
          <span className="tabular block font-heading text-xl leading-none font-bold">{formatPitch(pitch)}</span>
          <span className="tabular block text-[13px] text-muted-foreground">{track.bpm === null ? "—" : `${formatBpm(track.bpm)} BPM`}</span>
        </span>

        <PitchRuler pitch={pitch} range={range} className="col-span-full md:col-span-1" />
      </Link>
    </li>
  );
}

type MixPanelProps = {
  track: {
    id: string;
    side: string;
    bpm: number | null;
    bpmSource: string | null;
    camelotKey: string | null;
  };
};

/** The records that can follow this cut on these decks, judged on the key heard once the fader moves. */
export function MixPanel({ track }: MixPanelProps) {
  const [range, setRange] = usePitchRange();
  const { data, isLoading, isError, isPlaceholderData } = useQuery({
    ...trpc.trackMixCandidates.queryOptions({ trackId: track.id, pitchRange: range }),
    placeholderData: keepPreviousData,
  });
  const mixes = data?.mixes ?? [];

  return (
    <section aria-label={`Qué mezcla con ${track.side}`} className="flex flex-col gap-3 bg-card p-3 md:p-4">
      <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2">
        <h3 className="font-heading text-lg leading-none font-bold">Qué mezcla con {track.side}</h3>
        <Segmented label="Rango del pitch, en porcentaje" options={RANGE_OPTIONS} value={range} onChange={setRange} />
      </div>

      {track.bpmSource === "LOOKUP" && (
        <p className="text-[13px] text-muted-foreground">El BPM de este corte es aproximado, así que el pitch también</p>
      )}
      {!track.camelotKey && (
        <p className="text-[13px] text-muted-foreground">Sin tonalidad en este corte no puedo comparar las claves</p>
      )}

      {isLoading ? (
        <div role="status" aria-label="Buscando qué mezcla" className="flex justify-center py-6">
          <Loader2 aria-hidden="true" className="size-5 animate-spin text-muted-foreground" />
        </div>
      ) : isError ? (
        <p className="text-sm text-muted-foreground">No pudimos buscar qué mezcla con este corte</p>
      ) : mixes.length === 0 ? (
        <p className="text-sm text-muted-foreground">Ningún disco de tu colección llega con ±{range}%</p>
      ) : (
        <ul aria-busy={isPlaceholderData} className={cn("transition-opacity duration-[120ms]", isPlaceholderData && "opacity-60")}>
          {mixes.map((mix) => (
            <MixRow key={mix.track.id} mix={mix} range={range} />
          ))}
        </ul>
      )}
    </section>
  );
}
