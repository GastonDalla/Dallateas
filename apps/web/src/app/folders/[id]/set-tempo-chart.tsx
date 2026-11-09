"use client";

import { labelIndexes, niceScale } from "@/components/dj/tools/chart-scale";
import { useChartCursor } from "@/components/dj/tools/use-chart-cursor";
import { formatBpm } from "@/lib/format";

import { tempoRuns } from "./set-model";

const MIN_POINTS = 2;

export type TempoPoint = { id: string; name: string; bpm: number | null };

type SetTempoChartProps = {
  points: readonly TempoPoint[];
  /** Index of the outgoing record of each change the fader cannot reach. */
  unreachable: readonly number[];
  pitchRange: number;
};

function Readout({ point, position }: { point: TempoPoint | undefined; position: number | null }) {
  if (!point || position === null) return <>Mové el cursor o usá las flechas</>;
  return (
    <>
      {position + 1}. {point.name}: {point.bpm === null ? "Sin BPM" : `${formatBpm(point.bpm)} BPM`}
    </>
  );
}

/** One line across the night. The plot stretches with its box, so its labels are HTML and never scale with it. */
export function SetTempoChart({ points, unreachable, pitchRange }: SetTempoChartProps) {
  const { index, surfaceProps } = useChartCursor(points.length, "points");

  const tempos = points.flatMap(({ bpm }) => (bpm === null ? [] : [bpm]));
  if (tempos.length < MIN_POINTS) {
    return <p className="text-sm text-muted-foreground">Con dos discos con BPM acá se dibuja el tempo del set</p>;
  }

  const scale = niceScale(Math.min(...tempos), Math.max(...tempos));
  const x = (position: number) => (position / (points.length - 1)) * 100;
  const y = (bpm: number) => 100 - ((bpm - scale.min) / (scale.max - scale.min)) * 100;

  const runs = tempoRuns(points);
  const missing = points.flatMap(({ bpm }, position) => (bpm === null ? [position] : []));
  const activeBpm = index === null ? null : (points[index]?.bpm ?? null);

  return (
    <figure>
      <figcaption className="mb-3 flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
        <span className="text-sm font-medium">Tempo del set</span>
        <span className="tabular truncate text-[13px] text-muted-foreground" aria-live="polite">
          <Readout point={index === null ? undefined : points[index]} position={index} />
        </span>
      </figcaption>

      <div className="h-48 pb-6 pl-9 md:h-56">
        <div
          {...surfaceProps}
          role="group"
          aria-label={`Tempo a lo largo del set, de ${formatBpm(Math.min(...tempos))} a ${formatBpm(Math.max(...tempos))} BPM. Las flechas recorren los discos`}
          className="relative h-full touch-pan-y focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-ring"
        >
          <svg
            viewBox="0 0 100 100"
            preserveAspectRatio="none"
            aria-hidden="true"
            className="absolute inset-0 size-full overflow-visible"
          >
            {scale.ticks.map((tick) => (
              <line
                key={tick}
                x1="0"
                x2="100"
                y1={y(tick)}
                y2={y(tick)}
                vectorEffect="non-scaling-stroke"
                className="stroke-border"
              />
            ))}
            {index !== null && (
              <line
                x1={x(index)}
                x2={x(index)}
                y1="0"
                y2="100"
                vectorEffect="non-scaling-stroke"
                className="stroke-muted-foreground"
              />
            )}
            {runs
              .filter((run) => run.length > 1)
              .map((run) => (
                <polyline
                  key={run[0]}
                  points={run.map((position) => `${x(position)},${y(points[position]!.bpm!)}`).join(" ")}
                  fill="none"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  vectorEffect="non-scaling-stroke"
                  className="stroke-primary"
                />
              ))}
          </svg>

          {scale.ticks.map((tick) => (
            <span
              key={tick}
              aria-hidden="true"
              style={{ top: `${y(tick)}%` }}
              className="tabular absolute -left-9 w-7 -translate-y-1/2 text-right text-xs text-muted-foreground"
            >
              {tick}
            </span>
          ))}

          {labelIndexes(points.length).map((position) => (
            <span
              key={points[position]!.id}
              aria-hidden="true"
              style={{ left: `${x(position)}%` }}
              className="tabular absolute top-full mt-1 -translate-x-1/2 text-xs text-muted-foreground"
            >
              {position + 1}
            </span>
          ))}

          {runs
            .filter((run) => run.length === 1)
            .map(([position]) => (
              <span
                key={position}
                aria-hidden="true"
                style={{ left: `${x(position!)}%`, top: `${y(points[position!]!.bpm!)}%` }}
                className="absolute size-2 -translate-1/2 rounded-full bg-primary"
              />
            ))}

          {missing.map((position) => (
            <span
              key={position}
              aria-hidden="true"
              style={{ left: `${x(position)}%` }}
              className="absolute bottom-0 h-0.5 w-3 -translate-x-1/2 bg-muted-foreground"
            />
          ))}

          {unreachable.map((position) => {
            const from = points[position]?.bpm;
            const to = points[position + 1]?.bpm;
            if (from == null || to == null) return null;

            return (
              <span
                key={position}
                aria-hidden="true"
                style={{ left: `${(x(position) + x(position + 1)) / 2}%`, top: `${y((from + to) / 2)}%` }}
                className="absolute size-3 -translate-1/2 rounded-full border-2 border-clash bg-card"
              />
            );
          })}

          {index !== null && activeBpm !== null && (
            <span
              aria-hidden="true"
              style={{ left: `${x(index)}%`, top: `${y(activeBpm)}%` }}
              className="absolute size-2.5 -translate-1/2 rounded-full bg-primary ring-2 ring-background"
            />
          )}
        </div>
      </div>

      {(unreachable.length > 0 || missing.length > 0) && (
        <div className="mt-2 flex flex-wrap gap-x-5 gap-y-1 pl-9 text-[13px] text-muted-foreground">
          {unreachable.length > 0 && (
            <span className="inline-flex items-center gap-1.5">
              <span aria-hidden="true" className="size-3 rounded-full border-2 border-clash bg-card" />
              No llega con ±{pitchRange}%
            </span>
          )}
          {missing.length > 0 && (
            <span className="inline-flex items-center gap-1.5">
              <span aria-hidden="true" className="h-0.5 w-3 bg-muted-foreground" />
              Sin BPM
            </span>
          )}
        </div>
      )}
    </figure>
  );
}
