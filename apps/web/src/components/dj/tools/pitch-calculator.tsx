"use client";

import { CAMELOT_KEYS, keyAtPitch, keyLabel, parseKey, semitonesAtPitch } from "@dallateas/dj/camelot";
import { bpmAtPitch, pitchToMatch } from "@dallateas/dj/tempo";
import { Button } from "@dallateas/ui/components/button";
import { Label } from "@dallateas/ui/components/label";
import { useState } from "react";

import { KeyTag } from "@/components/dj/key-tag";
import { PitchRuler } from "@/components/dj/pitch-ruler";
import { formatBpm, formatPitch } from "@/lib/format";
import { usePitchRange } from "@/lib/pitch-range";

import { formatSemitones, parseTempo } from "./numbers";
import { PitchRangePicker } from "./pitch-range-picker";
import { TempoField } from "./tempo-field";

const FADER_STEP = 0.1;

function KeyShift({ pitch, keyValue }: { pitch: number; keyValue: string }) {
  const key = parseKey(keyValue);

  return (
    <dl className="grid gap-x-6 gap-y-2 border-t border-border pt-4 text-sm sm:grid-cols-[auto_minmax(0,1fr)]">
      <dt className="text-muted-foreground">La tonalidad se corre</dt>
      <dd className="tabular font-medium">{formatSemitones(semitonesAtPitch(pitch))} semitonos</dd>
      <dt className="text-muted-foreground">Queda sonando en</dt>
      <dd className="font-medium">
        {key ? <KeyTag value={keyAtPitch(key, pitch)} /> : <span className="font-normal text-muted-foreground">Elegí la tonalidad del disco</span>}
      </dd>
    </dl>
  );
}

function FaderToTempo({ tempo, range }: { tempo: number | null; range: number }) {
  const [fader, setFader] = useState(0);
  const position = Math.max(-range, Math.min(range, fader));

  return (
    <div className="grid items-end gap-x-8 gap-y-4 border-t border-border pt-6 md:grid-cols-[minmax(0,1fr)_auto]">
      <div className="flex min-w-0 flex-col gap-1">
        <h3 className="font-medium">Del fader al tempo</h3>
        <label htmlFor="pitch-fader" className="tabular text-sm text-muted-foreground">
          Fader en {formatPitch(position)}
        </label>
        <input
          id="pitch-fader"
          type="range"
          min={-range}
          max={range}
          step={FADER_STEP}
          value={position}
          onChange={(event) => setFader(Number(event.target.value))}
          aria-valuetext={formatPitch(position)}
          className="h-11 w-full cursor-pointer accent-primary"
        />
        <div className="tabular flex items-center justify-between text-xs text-muted-foreground">
          <span>−{range}%</span>
          <Button variant="ghost" size="sm" disabled={position === 0} onClick={() => setFader(0)}>
            Volver a cero
          </Button>
          <span>+{range}%</span>
        </div>
      </div>
      <p className="flex items-baseline gap-2 md:justify-end">
        {tempo === null ? (
          <span className="text-sm text-muted-foreground">Cargá el tempo del disco</span>
        ) : (
          <>
            <span className="tabular font-heading text-5xl font-bold leading-none">
              {formatBpm(Math.round(bpmAtPitch(tempo, position) * 10) / 10)}
            </span>
            <span className="text-sm text-muted-foreground">BPM</span>
          </>
        )}
      </p>
    </div>
  );
}

/** How far a record has to move on the fader, and what that does to its key on a deck without key lock. */
export function PitchCalculator() {
  const [range, setRange] = usePitchRange();
  const [deckTempo, setDeckTempo] = useState("124");
  const [targetTempo, setTargetTempo] = useState("128");
  const [keyValue, setKeyValue] = useState("");

  const deck = parseTempo(deckTempo);
  const target = parseTempo(targetTempo);
  const pitch = deck !== null && target !== null ? pitchToMatch(deck, target) : null;
  const reachable = pitch !== null && Math.abs(pitch) <= range;

  return (
    <div className="flex flex-col gap-8">
      <div className="grid gap-8 lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)] lg:gap-12">
        <div className="flex flex-col gap-5">
          <div className="grid grid-cols-2 gap-4">
            <TempoField id="pitch-deck" label="Disco en la bandeja" value={deckTempo} onChange={setDeckTempo} />
            <TempoField id="pitch-target" label="Tempo a alcanzar" value={targetTempo} onChange={setTargetTempo} />
          </div>

          <div className="flex flex-col gap-2">
            <span className="text-sm leading-tight">Rango del fader</span>
            <PitchRangePicker name="calculator-range" value={range} onChange={setRange} />
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="pitch-key" className="text-sm leading-tight">
              Tonalidad del disco (opcional)
            </Label>
            <select
              id="pitch-key"
              value={keyValue}
              onChange={(event) => setKeyValue(event.target.value)}
              className="tabular h-11 w-full rounded-md border border-input bg-background px-2.5 text-sm outline-none focus-visible:border-ring focus-visible:ring-1 focus-visible:ring-ring/50 md:h-9"
            >
              <option value="">Sin elegir</option>
              {CAMELOT_KEYS.map((key) => (
                <option key={key} value={key}>
                  {key} {keyLabel(key)}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="flex flex-col gap-4 bg-card p-5 md:p-6" aria-live="polite">
          <p className="text-sm text-muted-foreground">Fader en</p>
          {pitch === null ? (
            <p className="text-sm text-muted-foreground">Cargá los dos tempos</p>
          ) : (
            <>
              <p className="tabular font-heading text-7xl font-bold leading-none md:text-8xl">{formatPitch(pitch)}</p>
              <PitchRuler pitch={pitch} range={range} className="h-6" />
              <p className={reachable ? "text-sm font-medium text-good" : "text-sm font-medium text-clash"}>
                {reachable ? `Llegás con un fader de ±${range}%` : `No llegás: tu fader da ±${range}%`}
              </p>
              <KeyShift pitch={pitch} keyValue={keyValue} />
              <p className="text-sm text-pretty text-muted-foreground">
                Una bandeja no tiene key lock: si subís el pitch, sube la tonalidad
              </p>
            </>
          )}
        </div>
      </div>

      <FaderToTempo tempo={deck} range={range} />
    </div>
  );
}
