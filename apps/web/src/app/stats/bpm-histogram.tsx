"use client";

import { cn } from "@dallateas/ui/lib/utils";

import { labelIndexes, niceScale } from "@/components/dj/tools/chart-scale";
import { useChartCursor } from "@/components/dj/tools/use-chart-cursor";

import { BUCKET_SIZE, busiestBucket, fillBpmBuckets, type BpmBucket } from "./bpm-buckets";

function trackCount(count: number) {
  return count === 1 ? "1 track" : `${count} tracks`;
}

function bucketRange(bucket: number) {
  return `${bucket} a ${bucket + BUCKET_SIZE - 1} BPM`;
}

/** Where the collection sits, in bins of 5 BPM. The fluo marks the fullest bin, the place a set is easiest to build. */
export function BpmHistogram({ buckets }: { buckets: readonly BpmBucket[] }) {
  const filled = fillBpmBuckets(buckets);
  const { index, surfaceProps } = useChartCursor(filled.length, "slots");
  const busiest = busiestBucket(filled);

  if (busiest === null) {
    return (
      <div className="flex h-64 items-end border-b-2 border-border pb-3">
        <p className="text-sm text-muted-foreground">Cuando tus tracks tengan BPM, acá se ve en qué tempos estás parado</p>
      </div>
    );
  }

  const peak = filled[busiest]!;
  const shown = filled[index ?? busiest]!;
  const scale = niceScale(0, peak.count);
  const height = (count: number) => (count / scale.max) * 100;
  const slotCenter = (position: number) => ((position + 0.5) / filled.length) * 100;

  return (
    <figure>
      <figcaption className="mb-3 flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
        <span className="text-sm font-medium">Tempos de tu colección</span>
        <span className="tabular text-[13px] text-muted-foreground" aria-live="polite">
          {bucketRange(shown.bucket)}: {trackCount(shown.count)}
        </span>
      </figcaption>

      <div className="h-64 pb-6 pl-9">
        <div
          {...surfaceProps}
          role="group"
          aria-label={`Distribución de BPM. La zona más cargada va de ${bucketRange(peak.bucket)}, con ${trackCount(peak.count)}. Las flechas recorren los tempos`}
          className="relative h-full touch-pan-y focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-ring"
        >
          {scale.ticks.map((tick) => (
            <div key={tick} aria-hidden="true">
              <span
                style={{ bottom: `${height(tick)}%` }}
                className={cn("absolute inset-x-0", tick === 0 ? "h-0.5 bg-muted-foreground/60" : "h-px bg-border")}
              />
              <span
                style={{ bottom: `${height(tick)}%` }}
                className="tabular absolute -left-9 w-7 translate-y-1/2 text-right text-xs text-muted-foreground"
              >
                {tick}
              </span>
            </div>
          ))}

          <div className="absolute inset-0 flex gap-px" aria-hidden="true">
            {filled.map(({ bucket, count }, position) => (
              <div key={bucket} className="relative flex h-full min-w-0 flex-1 items-end justify-center">
                {count > 0 && (
                  <div
                    style={{ height: `${height(count)}%` }}
                    className={cn(
                      "w-full max-w-6 transition-colors",
                      position === busiest
                        ? "bg-primary"
                        : position === index
                          ? "bg-foreground/50"
                          : "bg-foreground/20",
                    )}
                  />
                )}
              </div>
            ))}
          </div>

          <span
            aria-hidden="true"
            style={{ left: `${slotCenter(busiest)}%`, bottom: `${height(peak.count)}%` }}
            className="tabular absolute -translate-x-1/2 pb-1 text-xs font-medium"
          >
            {peak.count}
          </span>

          {labelIndexes(filled.length).map((position) => (
            <span
              key={filled[position]!.bucket}
              aria-hidden="true"
              style={{ left: `${slotCenter(position)}%` }}
              className="tabular absolute top-full mt-1 -translate-x-1/2 text-xs text-muted-foreground"
            >
              {filled[position]!.bucket}
            </span>
          ))}
        </div>
      </div>
    </figure>
  );
}
