import { cn } from "@dallateas/ui/lib/utils";
import type { ReactNode } from "react";

/**
 * The three ways to get a tempo, drawn as the screen each one would show. The tempos are the ones
 * the sheets print, exported from here, so a picture cannot claim a number the copy does not.
 */

const round = (value: number) => Math.round(value * 10) / 10;

type ScreenProps = { className?: string };

function Frame({ title, meta, children, className }: { title: string; meta: string; children: ReactNode; className?: string }) {
  return (
    <figure className={cn("flex h-full flex-col gap-4 bg-background p-5 text-foreground md:p-8", className)}>
      <figcaption className="flex items-baseline justify-between gap-4 text-sm">
        <span className="font-medium">{title}</span>
        <span className="tabular text-muted-foreground">{meta}</span>
      </figcaption>
      <div className="flex min-h-0 flex-1 items-center">{children}</div>
    </figure>
  );
}

export const TAP_BPM = 124;
const TAP_BEATS = 8;
const TAP_COLUMNS_PER_BEAT = 24;
/** Six taps, the third a little late. Both intervals around it are dropped by the tap tempo. */
const TAPS = [1.01, 2.0, 3.3, 3.98, 5.01, 5.99];
const OUTLIER = 2;

/** Two bars of a kick loop up close, with the taps under it. */
export function TapScreen({ className }: ScreenProps) {
  const width = 640;
  const height = 360;
  const wave = { top: 24, bottom: 236 };
  const middle = (wave.top + wave.bottom) / 2;
  const half = (wave.bottom - wave.top) / 2;
  const columns = TAP_BEATS * TAP_COLUMNS_PER_BEAT;
  const step = width / columns;
  const beatX = (beat: number) => round((beat / TAP_BEATS) * width);

  const bars = Array.from({ length: columns }, (_, index) => {
    const phase = (index % TAP_COLUMNS_PER_BEAT) / TAP_COLUMNS_PER_BEAT;
    const kick = Math.exp(-phase * 7);
    const hat = 0.34 * Math.exp(-Math.abs(phase - 0.5) * 38);
    const bass = 0.16 + 0.06 * Math.sin(index * 0.9);
    return Math.min(1, Math.max(kick, hat, bass));
  });

  const intervals = TAPS.slice(1).map((tap, index) => Math.round((tap - TAPS[index]!) * (60_000 / TAP_BPM)));

  return (
    <Frame title="Tap tempo" meta={`${TAP_BPM} BPM, 2 compases`} className={className}>
      <svg viewBox={`0 0 ${width} ${height}`} role="img" aria-label="Forma de onda de dos compases con seis golpes de tap debajo, uno fuera de tiempo" className="h-auto w-full">
        {Array.from({ length: TAP_BEATS + 1 }, (_, beat) => (
          <line
            key={beat}
            x1={beatX(beat)}
            x2={beatX(beat)}
            y1={wave.top - 12}
            y2={wave.bottom + 12}
            strokeWidth={beat % 4 === 0 ? 2 : 1}
            className={beat % 4 === 0 ? "stroke-primary" : "stroke-border"}
          />
        ))}
        {bars.map((level, index) => (
          <rect
            key={index}
            x={round(index * step)}
            y={round(middle - level * half)}
            width={round(step * 0.62)}
            height={round(level * half * 2)}
            className="fill-foreground"
          />
        ))}
        {TAPS.map((tap, index) => {
          const x = beatX(tap);
          const off = index === OUTLIER;
          return (
            <g key={tap}>
              <path
                d={`M${x} 262 l-9 16 h18 z`}
                strokeWidth="2"
                className={off ? "fill-none stroke-muted-foreground" : "fill-primary stroke-primary"}
              />
              {index > 0 && (
                <text
                  x={round((beatX(TAPS[index - 1]!) + x) / 2)}
                  y="312"
                  textAnchor="middle"
                  className={cn("tabular text-[15px]", index === OUTLIER || index === OUTLIER + 1 ? "fill-muted-foreground" : "fill-foreground")}
                >
                  {intervals[index - 1]} ms
                </text>
              )}
            </g>
          );
        })}
        <text x={beatX(TAPS[OUTLIER]!)} y="346" textAnchor="middle" className="fill-muted-foreground text-[14px]">
          Fuera de tiempo: no cuenta
        </text>
      </svg>
    </Frame>
  );
}

export const MIC_BPM = 126.5;
const MIC_SECONDS = 12;
const TEMPO_AXIS = { low: 80, high: 180 };
const PEAKS = [
  { bpm: MIC_BPM, height: 1, width: 2.2 },
  { bpm: MIC_BPM * (4 / 3), height: 0.42, width: 3 },
  { bpm: MIC_BPM * (3 / 4), height: 0.38, width: 3 },
];

/** Twelve seconds of what the phone hears, and the tempo whose beats line up with it best. */
export function MicScreen({ className }: ScreenProps) {
  const width = 640;
  const envelope = { top: 8, bottom: 120 };
  const comb = { top: 176, bottom: 320 };
  const beat = 60 / MIC_BPM;

  const samples = 320;
  const level = (index: number) => {
    const time = (index / samples) * MIC_SECONDS;
    const sinceBeat = time % beat;
    const accent = Math.floor(time / beat) % 4 === 0 ? 1 : 0.82;
    return accent * Math.exp(-sinceBeat * 16) + 0.08 + 0.05 * Math.abs(Math.sin(index * 1.7));
  };
  const envelopePath =
    `M0 ${envelope.bottom} ` +
    Array.from({ length: samples + 1 }, (_, index) => {
      const x = round((index / samples) * width);
      const y = round(envelope.bottom - Math.min(1, level(index)) * (envelope.bottom - envelope.top));
      return `L${x} ${y}`;
    }).join(" ") +
    ` L${width} ${envelope.bottom} Z`;

  const tempoX = (bpm: number) => round(((bpm - TEMPO_AXIS.low) / (TEMPO_AXIS.high - TEMPO_AXIS.low)) * width);
  const score = (bpm: number) =>
    Math.min(1, 0.1 + 0.04 * Math.sin(bpm * 0.7) + PEAKS.reduce((sum, peak) => sum + peak.height * Math.exp(-(((bpm - peak.bpm) / peak.width) ** 2)), 0));
  const combPath = Array.from({ length: 201 }, (_, index) => {
    const bpm = TEMPO_AXIS.low + (index / 200) * (TEMPO_AXIS.high - TEMPO_AXIS.low);
    const y = round(comb.bottom - score(bpm) * (comb.bottom - comb.top));
    return `${index === 0 ? "M" : "L"}${tempoX(bpm)} ${y}`;
  }).join(" ");

  return (
    <Frame title="Micrófono" meta={`${MIC_SECONDS} segundos`} className={className}>
      <svg
        viewBox={`0 0 ${width} 360`}
        role="img"
        aria-label={`Doce segundos de golpes de bombo y, debajo, la curva de tempos con el pico en ${MIC_BPM} BPM`}
        className="h-auto w-full"
      >
        <path d={envelopePath} className="fill-foreground" />
        <text x="0" y="148" className="fill-muted-foreground text-[14px]">
          Lo que escucha el teléfono
        </text>
        <line x1="0" x2={width} y1={comb.bottom} y2={comb.bottom} strokeWidth="1" className="stroke-border" />
        <path d={combPath} fill="none" strokeWidth="2.5" strokeLinejoin="round" className="stroke-foreground" />
        <line x1={tempoX(MIC_BPM)} x2={tempoX(MIC_BPM)} y1={comb.top - 8} y2={comb.bottom} strokeWidth="2" className="stroke-primary" />
        <rect x={tempoX(MIC_BPM) + 8} y={comb.top - 10} width="62" height="26" rx="2" className="fill-primary" />
        <text x={tempoX(MIC_BPM) + 39} y={comb.top + 8} textAnchor="middle" className="tabular fill-primary-foreground font-heading text-[18px] font-bold">
          {MIC_BPM}
        </text>
        {[80, 100, 120, 140, 160, 180].map((bpm) => (
          <text
            key={bpm}
            x={tempoX(bpm)}
            y="344"
            textAnchor={bpm === TEMPO_AXIS.low ? "start" : bpm === TEMPO_AXIS.high ? "end" : "middle"}
            className="tabular fill-muted-foreground text-[14px]"
          >
            {bpm}
          </text>
        ))}
      </svg>
    </Frame>
  );
}

export const LOOKUP_BPM = 128;

const LOOKUP_RESULTS = [
  { title: "Último subte", artist: "Mesa Dos", tempo: `≈${LOOKUP_BPM}`, note: "mismo corte", chosen: true },
  { title: "Último subte (Dub)", artist: "Mesa Dos", tempo: "≈127", note: "otra versión, no se usa", chosen: false },
  { title: "Subte", artist: "Otra banda", tempo: "≈122", note: "otro tema, no se usa", chosen: false },
];

/** The lookup as a browser list: only the exact cut lends its tempo, and it stays approximate. */
export function LookupScreen({ className }: ScreenProps) {
  return (
    <Frame title="Búsqueda en Deezer" meta="B2 de Domingo a las 7" className={className}>
      <div className="w-full">
        <p className="border border-border px-4 py-3 text-base">
          <span className="text-muted-foreground">Busca </span>Mesa Dos, Último subte
        </p>
        <ul className="mt-4 divide-y divide-border border-y border-border">
          {LOOKUP_RESULTS.map(({ title, artist, tempo, note, chosen }) => (
            <li key={title} className={cn("grid grid-cols-[minmax(0,1fr)_auto] items-center gap-x-4 px-3 py-3", chosen && "bg-muted")}>
              <span className="min-w-0">
                <span className={cn("block truncate font-medium", !chosen && "text-muted-foreground")}>{title}</span>
                <span className="block truncate text-sm text-muted-foreground">
                  {artist}, {note}
                </span>
              </span>
              <span
                className={cn(
                  "tabular rounded-sm border px-2 py-1 font-heading text-lg leading-none font-bold",
                  chosen ? "border-primary" : "border-border text-muted-foreground line-through",
                )}
              >
                {tempo}
              </span>
            </li>
          ))}
        </ul>
      </div>
    </Frame>
  );
}
