"use client";

import { beatMs, delayTimes, NOTE_VALUES, PHRASE_BARS, phraseSeconds, type NoteValue } from "@dallateas/dj/timing";
import { useState } from "react";

import { Readout } from "@/components/dj/readout";

import { formatClock, parseTempo } from "./numbers";
import { TempoField } from "./tempo-field";

const NOTE_LABELS: Record<NoteValue, string> = {
  bar: "1 compás",
  half: "1/2",
  quarter: "1/4, un golpe",
  "dotted-eighth": "1/8 con puntillo",
  "quarter-triplet": "1/4 de tresillo",
  eighth: "1/8",
  sixteenth: "1/16",
};

function phraseLabel(bars: number) {
  return bars === 1 ? "1 compás" : `${bars} compases`;
}

function Empty() {
  return <span className="text-sm font-normal text-muted-foreground">—</span>;
}

/** What a tempo means in time: how long a phrase lasts and what to set a delay to. */
export function TempoTable() {
  const [value, setValue] = useState("126");
  const tempo = parseTempo(value);
  const delays = tempo === null ? null : new Map(delayTimes(tempo).map(({ id, ms }) => [id, ms]));

  return (
    <div className="grid items-start gap-x-12 gap-y-8 md:grid-cols-[12rem_minmax(0,1fr)_minmax(0,1fr)]">
      <div className="flex flex-col gap-6">
        <TempoField id="table-tempo" label="Tempo" value={value} onChange={setValue} />
        <p aria-live="polite">
          <span className="block text-sm text-muted-foreground">Un golpe dura</span>
          <Readout value={tempo === null ? "—" : String(Math.round(beatMs(tempo)))} className="text-5xl leading-none" />
          <span className="ml-1 text-sm text-muted-foreground">ms</span>
        </p>
      </div>

      <section aria-labelledby="table-phrases">
        <h3 id="table-phrases" className="font-medium">
          Cuánto dura una frase
        </h3>
        <dl className="mt-3 divide-y divide-border border-y border-border">
          {PHRASE_BARS.map((bars) => (
            <div key={bars} className="flex items-baseline justify-between gap-4 py-2.5">
              <dt className="text-sm text-muted-foreground">{phraseLabel(bars)}</dt>
              <dd className="tabular font-heading text-2xl leading-none font-bold">
                {tempo === null ? <Empty /> : formatClock(phraseSeconds(tempo, bars))}
              </dd>
            </div>
          ))}
        </dl>
      </section>

      <section aria-labelledby="table-delays">
        <h3 id="table-delays" className="font-medium">
          Delay y eco, en milisegundos
        </h3>
        <dl className="mt-3 divide-y divide-border border-y border-border">
          {NOTE_VALUES.map(({ id }) => {
            const ms = delays?.get(id);
            return (
              <div key={id} className="flex items-baseline justify-between gap-4 py-2.5">
                <dt className="text-sm text-muted-foreground">{NOTE_LABELS[id]}</dt>
                <dd className="tabular font-heading text-2xl leading-none font-bold">
                  {ms === undefined ? <Empty /> : Math.round(ms)}
                </dd>
              </div>
            );
          })}
        </dl>
      </section>
    </div>
  );
}
