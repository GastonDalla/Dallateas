import { analyzeSet } from "@dallateas/dj/mixing";
import { DEFAULT_PITCH_RANGE } from "@dallateas/dj/tempo";
import { cn } from "@dallateas/ui/lib/utils";

import { BpmSticker } from "@/components/dj/bpm-sticker";
import { Cover } from "@/components/dj/cover";
import { KeyTag } from "@/components/dj/key-tag";
import { formatPitch, formatRunningTime } from "@/lib/format";

import styles from "./landing.module.css";
import { RELATION_COPY, SAMPLE_SET } from "./sample-record";
import { ScrollRow } from "./scroll-row";

const RISE_PER_BPM = 12;

/** Starts on the page's left margin and keeps going past the right one, so the row reads as continuing. */
const GUTTER = "scroll-pl-4 pl-4 md:scroll-pl-8 md:pl-8 min-[80rem]:scroll-pl-[max(2rem,calc((100cqw-75rem)/2))] min-[80rem]:pl-[max(2rem,calc((100cqw-75rem)/2))]";

export function SetFlowSection() {
  const { transitions, totalSeconds, minBpm, maxBpm } = analyzeSet(SAMPLE_SET, { pitchRange: DEFAULT_PITCH_RANGE });

  return (
    <section aria-labelledby="set-title" className="mt-32 @container md:mt-48">
      <ScrollRow
        label="Set de ejemplo"
        showProgress
        className="[&>div:not(:last-child)]:mx-4 md:[&>div:not(:last-child)]:mx-8 min-[80rem]:[&>div:not(:last-child)]:mx-[max(2rem,calc((100cqw-75rem)/2))]"
        rowClassName={GUTTER}
        heading={
          <div>
            <h2 id="set-title" className="font-heading text-[clamp(2.5rem,1.6rem+3vw,3.5rem)] leading-none font-bold text-balance uppercase">
              El set, cambio por cambio
            </h2>
            <p className="mt-3 max-w-[52ch] text-lg text-pretty">
              Ordená una batea y mirá qué pitch pide cada cambio. El que va a doler lo ves en casa, no en la cabina.
            </p>
          </div>
        }
      >
        <ol className="flex gap-4 md:gap-8">
          {SAMPLE_SET.map((record, index) => {
            const change = index > 0 ? transitions[index - 1] : null;
            const verdict = change?.relation ? RELATION_COPY[change.relation] : null;

            return (
              <li key={record.id} className="flex w-[72vw] shrink-0 snap-start flex-col sm:w-70">
                <p className="text-lg font-semibold">{record.moment}</p>
                <div aria-hidden="true" style={{ height: ((maxBpm ?? record.bpm) - record.bpm) * RISE_PER_BPM + 16 }} />
                <div className={cn(styles.paper, "relative bg-background text-foreground")}>
                  <Cover alt="" sizes="280px" />
                  <p className="absolute inset-x-4 top-3 font-heading text-[28px] leading-none font-bold">{record.title}</p>
                  <div className="absolute inset-x-4 bottom-3 flex items-center justify-between gap-2 text-sm">
                    <BpmSticker tempo={String(record.bpm)} approximate={record.approximate} size="md" />
                    <KeyTag value={record.key} />
                  </div>
                </div>
                <p className="tabular mt-3 text-sm">
                  {change?.pitch == null ? "Sale con el fader en 0%" : `Entra a ${formatPitch(change.pitch)}`}
                </p>
                {verdict && <p className={cn("text-sm font-semibold", verdict.tone)}>{verdict.label}</p>}
              </li>
            );
          })}
        </ol>
      </ScrollRow>
      <p className="tabular mx-4 mt-6 text-sm text-muted-foreground md:mx-8 min-[80rem]:mx-[max(2rem,calc((100cqw-75rem)/2))]">
        Set inventado: {SAMPLE_SET.length} discos, {formatRunningTime(totalSeconds)}, de {minBpm} a {maxBpm} BPM
      </p>
    </section>
  );
}
