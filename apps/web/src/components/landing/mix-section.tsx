import { keyLabel, parseKey } from "@dallateas/dj/camelot";
import { rankMixes } from "@dallateas/dj/mixing";
import { DEFAULT_PITCH_RANGE } from "@dallateas/dj/tempo";
import { cn } from "@dallateas/ui/lib/utils";
import Image from "next/image";

import { BpmSticker } from "@/components/dj/bpm-sticker";
import { PitchRuler } from "@/components/dj/pitch-ruler";
import { formatPitch } from "@/lib/format";

import { RELATION_COPY, SAMPLE_MIX_CANDIDATES, SAMPLE_MIX_SOURCE } from "./sample-record";

function keyName(value: string | null) {
  const key = parseKey(value);
  return key ? `${key} ${keyLabel(key)}` : "—";
}

export function MixSection() {
  const mixes = rankMixes(SAMPLE_MIX_SOURCE, SAMPLE_MIX_CANDIDATES, { pitchRange: DEFAULT_PITCH_RANGE });

  return (
    <section aria-labelledby="mix-title" className="relative bg-card px-4 py-16 md:px-8 md:py-24">
      <div className="mx-auto grid max-w-[75rem] items-center gap-10 md:grid-cols-2 md:gap-16">
        <div className="relative aspect-square">
          <Image
            src="/images/landing/sl-1200-mk5-from-above.jpg"
            alt="Bandeja Technics vista desde arriba, con el disco en el plato y el fader de pitch al costado"
            fill
            sizes="(min-width: 1280px) 584px, (min-width: 768px) 50vw, 100vw"
            className="object-cover"
          />
        </div>

        <div>
          <h2 id="mix-title" className="font-heading text-[clamp(2.5rem,1.6rem+3vw,3.5rem)] leading-none font-bold text-balance uppercase">
            Mezclá por lo que va a sonar
          </h2>
          <p className="mt-5 max-w-[46ch] text-lg text-pretty">
            Una bandeja no tiene key lock: si subís el pitch, sube la tonalidad. El buscador de mezclas ordena tus discos por la que va a sonar, no por la que dice la etiqueta.
          </p>

          <div data-ui className="mt-8">
            <p className="text-sm text-muted-foreground">
              Sale {SAMPLE_MIX_SOURCE.title}, {SAMPLE_MIX_SOURCE.bpm} BPM, {keyName(SAMPLE_MIX_SOURCE.key)}. Fader de ±{DEFAULT_PITCH_RANGE}%
            </p>
            <ol className="mt-3 divide-y divide-border">
              {mixes.map(({ track, pitch, effectiveKey, relation }) => {
                const verdict = relation ? RELATION_COPY[relation] : null;
                return (
                  <li key={track.id} className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-x-4 gap-y-1 py-3">
                    <p className="flex items-center gap-2.5 font-medium">
                      <BpmSticker tempo={String(track.bpm)} />
                      <span className="truncate">{track.title}</span>
                    </p>
                    <p className={cn("text-right text-sm font-semibold", verdict?.tone)}>{verdict?.label}</p>
                    <PitchRuler pitch={pitch} range={DEFAULT_PITCH_RANGE} />
                    <p className="tabular text-right text-sm">{formatPitch(pitch)}</p>
                    <p className="col-span-2 text-sm text-muted-foreground">
                      Dice {keyName(track.key)}, suena {keyName(effectiveKey)}
                    </p>
                  </li>
                );
              })}
            </ol>
          </div>
        </div>
      </div>
    </section>
  );
}
