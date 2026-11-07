"use client";

import { planRamp, type RampPlan } from "@dallateas/dj/timing";
import { Input } from "@dallateas/ui/components/input";
import { Label } from "@dallateas/ui/components/label";
import { useState } from "react";

import { formatBpm, formatPitch } from "@/lib/format";
import { Readout } from "@/components/dj/readout";

import { labelIndexes, niceScale } from "./chart-scale";
import { parseMinutes, parseTempo } from "./numbers";
import { TempoField } from "./tempo-field";

const WIDTH = 640;
const HEIGHT = 200;
const PAD = { top: 12, right: 12, bottom: 28, left: 40 };

function MinutesField({ id, label, value, onChange }: { id: string; label: string; value: string; onChange: (value: string) => void }) {
  const invalid = value.trim() !== "" && parseMinutes(value) === null;
  const errorId = `${id}-error`;

  return (
    <div className="flex flex-col gap-2">
      <Label htmlFor={id} className="text-sm leading-tight">
        {label}
      </Label>
      <Input
        id={id}
        inputMode="decimal"
        autoComplete="off"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        aria-invalid={invalid}
        aria-describedby={invalid ? errorId : undefined}
        className="tabular h-14 font-heading text-3xl font-bold md:text-3xl"
      />
      {invalid && (
        <p id={errorId} className="text-sm text-clash">
          Minutos, de 1 a 720
        </p>
      )}
    </div>
  );
}

/** The ramp drawn as stairs: one tread per record, so the size of every change is visible. */
function RampChart({ plan }: { plan: RampPlan }) {
  const { min, max, ticks } = niceScale(Math.min(...plan.tempos), Math.max(...plan.tempos));
  const innerWidth = WIDTH - PAD.left - PAD.right;
  const innerHeight = HEIGHT - PAD.top - PAD.bottom;
  const tread = innerWidth / plan.records;
  const y = (tempo: number) => PAD.top + innerHeight * (1 - (tempo - min) / (max - min));
  const x = (index: number) => PAD.left + tread * index;

  const stairs = plan.tempos
    .map((tempo, index) => `${index === 0 ? "M" : "L"}${x(index).toFixed(1)},${y(tempo).toFixed(1)} H${x(index + 1).toFixed(1)}`)
    .join(" ");

  return (
    <svg
      viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
      role="img"
      aria-label={`De ${formatBpm(plan.tempos[0]!)} a ${formatBpm(plan.tempos.at(-1)!)} BPM en ${plan.records} discos`}
      className="h-auto w-full"
    >
      {ticks.map((tick) => (
        <g key={tick}>
          <line x1={PAD.left} x2={WIDTH - PAD.right} y1={y(tick)} y2={y(tick)} strokeWidth="1" className="stroke-border" />
          <text x={PAD.left - 8} y={y(tick) + 4} textAnchor="end" className="tabular fill-muted-foreground text-[12px]">
            {tick}
          </text>
        </g>
      ))}
      {labelIndexes(plan.records).map((index) => (
        <text
          key={index}
          x={x(index) + tread / 2}
          y={HEIGHT - 8}
          textAnchor="middle"
          className="tabular fill-muted-foreground text-[12px]"
        >
          {index + 1}
        </text>
      ))}
      <path d={stairs} fill="none" strokeWidth="3" strokeLinejoin="round" className="stroke-chart-1" />
    </svg>
  );
}

/** Spreads a climb or a cool-down over a set, so no single mix has to carry it. */
export function SetRamp() {
  const [startValue, setStartValue] = useState("122");
  const [endValue, setEndValue] = useState("130");
  const [minutesValue, setMinutesValue] = useState("120");
  const [perRecordValue, setPerRecordValue] = useState("6");

  const start = parseTempo(startValue);
  const end = parseTempo(endValue);
  const minutes = parseMinutes(minutesValue);
  const perRecord = parseMinutes(perRecordValue);
  const plan =
    start !== null && end !== null && minutes !== null && perRecord !== null
      ? planRamp({ startBpm: start, endBpm: end, minutes, minutesPerRecord: perRecord })
      : null;
  const pitchPerChange = plan && start !== null ? (plan.stepBpm / start) * 100 : null;

  return (
    <div className="grid gap-8 lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)] lg:gap-12">
      <div className="grid grid-cols-2 content-start gap-4">
        <TempoField id="ramp-start" label="Arranca en" value={startValue} onChange={setStartValue} />
        <TempoField id="ramp-end" label="Termina en" value={endValue} onChange={setEndValue} />
        <MinutesField id="ramp-minutes" label="Minutos de set" value={minutesValue} onChange={setMinutesValue} />
        <MinutesField id="ramp-per-record" label="Minutos por disco" value={perRecordValue} onChange={setPerRecordValue} />
      </div>

      <div className="flex flex-col gap-4 bg-card p-5 md:p-6" aria-live="polite">
        {plan === null ? (
          <p className="text-sm text-muted-foreground">Cargá los dos tempos y los minutos</p>
        ) : (
          <>
            <dl className="grid grid-cols-2 gap-4">
              <div>
                <dt className="text-sm text-muted-foreground">Discos</dt>
                <dd>
                  <Readout value={String(plan.records)} className="text-6xl leading-none" />
                </dd>
              </div>
              <div>
                <dt className="text-sm text-muted-foreground">Por cambio</dt>
                <dd>
                  <Readout
                    value={`${plan.stepBpm > 0 ? "+" : plan.stepBpm < 0 ? "−" : ""}${formatBpm(Math.round(Math.abs(plan.stepBpm) * 10) / 10)}`}
                    className="text-6xl leading-none"
                  />
                </dd>
              </div>
            </dl>
            <p className="text-sm text-pretty text-muted-foreground">
              {plan.records === 1
                ? "Alcanza con un disco: no hay cambios"
                : plan.stepBpm === 0
                  ? "Todo el set al mismo tempo. Llevá algunos discos de más por si la pista pide otra cosa"
                  : `Cada mezcla ${plan.stepBpm > 0 ? "sube" : "baja"} ${formatBpm(Math.round(Math.abs(plan.stepBpm) * 10) / 10)} BPM, cerca de ${formatPitch(pitchPerChange ?? 0)} de fader. Llevá algunos discos de más por si la pista pide otra cosa`}
            </p>
            {plan.records > 1 && <RampChart plan={plan} />}
          </>
        )}
      </div>
    </div>
  );
}
