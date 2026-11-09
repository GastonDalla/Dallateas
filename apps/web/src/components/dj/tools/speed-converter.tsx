"use client";

import { convertRpm } from "@dallateas/dj/tempo";
import { useState } from "react";

import { formatBpm } from "@/lib/format";

import { parseTempo } from "./numbers";
import { TempoField } from "./tempo-field";

const CHANGES = [
  { from: 33, to: 45, label: "Un 33 pasado a 45" },
  { from: 45, to: 33, label: "Un 45 pasado a 33" },
] as const;

/** Playing a record at the wrong speed on purpose is an old trick, and it moves the tempo by more than a third. */
export function SpeedConverter() {
  const [value, setValue] = useState("124");
  const tempo = parseTempo(value);

  return (
    <div className="grid items-start gap-x-12 gap-y-6 md:grid-cols-[12rem_minmax(0,1fr)]">
      <TempoField id="speed-tempo" label="Tempo del disco" value={value} onChange={setValue} />
      <dl className="divide-y divide-border border-y border-border" aria-live="polite">
        {CHANGES.map(({ from, to, label }) => (
          <div key={label} className="flex items-baseline justify-between gap-4 py-3">
            <dt className="text-sm text-muted-foreground">{label}</dt>
            <dd className="tabular font-heading text-3xl font-bold leading-none">
              {tempo === null ? (
                <span className="text-sm font-normal text-muted-foreground">—</span>
              ) : (
                formatBpm(Math.round(convertRpm(tempo, from, to) * 10) / 10)
              )}
            </dd>
          </div>
        ))}
      </dl>
    </div>
  );
}
