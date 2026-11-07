"use client";

import { DEFAULT_PITCH_RANGE } from "@dallateas/dj/tempo";
import { cn } from "@dallateas/ui/lib/utils";
import { useState, type ReactNode } from "react";

import { BpmSticker } from "@/components/dj/bpm-sticker";
import { KeyTag } from "@/components/dj/key-tag";
import { PitchRuler } from "@/components/dj/pitch-ruler";
import { formatPitch } from "@/lib/format";

import styles from "./landing.module.css";
import { RecordDisc } from "./record-disc";
import { cutAtPitch, SAMPLE_RECORD, SAMPLE_SIDES, type SampleCut } from "./sample-record";

function pitchNote(pitch: number) {
  if (pitch === 0) return "En una bandeja, el tempo se lleva la tonalidad";

  const [firstCut] = SAMPLE_SIDES[0]!.cuts;
  if (!cutAtPitch(firstCut!, pitch).keyMoved) return "Cambió el tempo, la tonalidad todavía aguanta";
  return `Sin key lock: la tonalidad ${pitch > 0 ? "subió" : "bajó"} un semitono`;
}

function CutRow({ cut, pitch }: { cut: SampleCut; pitch: number }) {
  const { tempo, key, keyMoved } = cutAtPitch(cut, pitch);

  return (
    <li className="grid grid-cols-[1.75rem_minmax(0,1fr)_4.5rem_4.25rem] items-center gap-x-2 py-1.5 sm:grid-cols-[2rem_minmax(0,1fr)_2.75rem_5rem_5rem]">
      <span className="tabular text-sm text-muted-foreground">{cut.position}</span>
      <span className="truncate text-base font-medium">{cut.title}</span>
      <span className="tabular hidden text-right text-sm text-muted-foreground sm:block">{cut.duration}</span>
      <span className="text-right">
        <BpmSticker tempo={tempo} approximate={cut.approximate} size="md" />
      </span>
      <span className={cn("text-right text-sm", keyMoved && "font-semibold text-link")}>
        <KeyTag value={key} />
        {keyMoved && <span className="sr-only">, impresa {cut.key}</span>}
      </span>
    </li>
  );
}

/** The back of the sleeve in the hero, whose fader moves every cut printed on it. */
export function PitchSleeve({ children }: { children: ReactNode }) {
  const [pitch, setPitch] = useState(0);

  return (
    <div className="relative mx-auto w-full max-w-[75rem]">
      <RecordDisc
        pitch={pitch}
        className="absolute top-4 left-[30rem] hidden w-[50rem] @min-[70rem]:block"
      />

      <article
        className={cn(
          styles.paper,
          "relative mx-auto w-full max-w-[52rem] bg-background px-5 pt-6 pb-5 text-foreground @container sm:px-12 sm:pt-12 sm:pb-8 @min-[70rem]:mx-0",
          "motion-safe:animate-in motion-safe:duration-300 motion-safe:ease-[cubic-bezier(0.2,0,0,1)] motion-safe:slide-in-from-bottom-3",
        )}
      >
        {children}

        <div className="dark mt-6 bg-background px-4 pt-3 pb-4 text-foreground sm:mt-8 sm:px-6">
          <div className="flex items-baseline justify-between gap-4">
            <label htmlFor="pitch-fader" className="text-base font-medium">
              Pitch
            </label>
            <output htmlFor="pitch-fader" className="tabular font-heading text-[28px] leading-none font-bold">
              {formatPitch(pitch)}
            </output>
          </div>
          <div className="relative mt-1">
            <div aria-hidden="true" className="absolute inset-x-3 top-1/2 -translate-y-1/2">
              <PitchRuler pitch={pitch} range={DEFAULT_PITCH_RANGE} />
            </div>
            <input
              id="pitch-fader"
              type="range"
              min={-DEFAULT_PITCH_RANGE}
              max={DEFAULT_PITCH_RANGE}
              step={0.1}
              value={pitch}
              onChange={(event) => setPitch(event.target.valueAsNumber)}
              aria-valuetext={formatPitch(pitch)}
              className={cn(styles.fader, "relative")}
            />
          </div>
          <p aria-live="polite" className="mt-1 text-sm text-muted-foreground">
            {pitchNote(pitch)}
          </p>
        </div>

        <div className="mt-6 flex items-baseline justify-between gap-4 text-sm">
          <p className="font-medium">
            {SAMPLE_RECORD.artist}, {SAMPLE_RECORD.title}
          </p>
          <p className="text-muted-foreground">Disco inventado</p>
        </div>

        <div className="mt-2 grid gap-3">
          {SAMPLE_SIDES.map((side) => (
            <section key={side.name} aria-label={side.name}>
              <ol>
                {side.cuts.map((cut) => (
                  <CutRow key={cut.position} cut={cut} pitch={pitch} />
                ))}
              </ol>
            </section>
          ))}
        </div>

        <p className="mt-6 text-sm text-muted-foreground">
          {SAMPLE_RECORD.label} {SAMPLE_RECORD.catalog}, 33⅓ RPM
        </p>
      </article>
    </div>
  );
}
