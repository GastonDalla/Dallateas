"use client";

import { bpmAtPitch, DEFAULT_PITCH_RANGE } from "@dallateas/dj/tempo";
import { Button } from "@dallateas/ui/components/button";
import { cn } from "@dallateas/ui/lib/utils";
import { useEffect, useRef, useState, type KeyboardEvent, type ReactNode } from "react";

import { BpmSticker } from "@/components/dj/bpm-sticker";
import { Readout } from "@/components/dj/readout";
import { formatBpm, formatPitch } from "@/lib/format";

import { BeatEngine } from "./beat-engine";
import { FIRST_ROUND, judgeMatch, newRound, type BeatRound, type BeatVerdict } from "./beat-round";

const FINE_STEP = 0.05;
/** A hand on the platter: a few percent of speed while held, like a jog wheel. */
const NUDGE = 0.03;
const BEATS_PER_BAR = 4;

const VERDICT_COPY: Record<BeatVerdict, { label: string; tone: string }> = {
  locked: { label: "Clavado", tone: "text-good" },
  close: { label: "Cerca", tone: "text-warn" },
  off: { label: "Se te va", tone: "text-clash" },
};

function BeatLights({ beat, label }: { beat: number | null; label: string }) {
  return (
    <div aria-hidden="true" className="flex gap-1.5" title={label}>
      {Array.from({ length: BEATS_PER_BAR }, (_, index) => (
        <span
          key={index}
          className={cn(
            "size-4 rounded-sm bg-foreground/15",
            beat !== null && beat % BEATS_PER_BAR === index && (index === 0 ? "bg-primary" : "bg-foreground"),
          )}
        />
      ))}
    </div>
  );
}

/** Acts while held, like a hand on the platter. Space and Enter hold it from the keyboard. */
function HoldButton({ disabled, onHold, children }: { disabled: boolean; onHold: (held: boolean) => void; children: ReactNode }) {
  function handleKeyDown(event: KeyboardEvent<HTMLButtonElement>) {
    if ((event.key === " " || event.key === "Enter") && !event.repeat) {
      event.preventDefault();
      onHold(true);
    }
  }

  return (
    <button
      type="button"
      disabled={disabled}
      onPointerDown={() => onHold(true)}
      onPointerUp={() => onHold(false)}
      onPointerLeave={() => onHold(false)}
      onPointerCancel={() => onHold(false)}
      onKeyDown={handleKeyDown}
      onKeyUp={() => onHold(false)}
      onBlur={() => onHold(false)}
      className="h-14 touch-manipulation border border-border font-medium select-none transition-colors duration-100 hover:bg-muted active:scale-[0.98] disabled:opacity-50"
    >
      {children}
    </button>
  );
}

type DeckProps = {
  name: string;
  side: string;
  tempo: string;
  beat: number | null;
  children?: ReactNode;
};

function Deck({ name, side, tempo, beat, children }: DeckProps) {
  return (
    <section aria-label={name} className="flex flex-col gap-3">
      <div className="flex items-baseline justify-between gap-3">
        <h3 className="font-medium">{name}</h3>
        <span className="text-sm text-muted-foreground">{side}</span>
      </div>
      <p>
        <Readout value={tempo} className="text-6xl leading-none md:text-7xl" />
      </p>
      <div className="flex items-center justify-between gap-3">
        <BeatLights beat={beat} label={`Golpe de ${name}`} />
        {children}
      </div>
    </section>
  );
}

/**
 * Beatmatching by ear, the one skill a turntable demands. The room plays at a hidden tempo; the DJ
 * rides the fader and nudges the platter until the two kicks sound as one.
 */
export function BeatTrainer() {
  const [round, setRound] = useState<BeatRound>(FIRST_ROUND);
  const [pitch, setPitch] = useState(0);
  const [running, setRunning] = useState(false);
  const [revealed, setRevealed] = useState(false);
  const [beats, setBeats] = useState<[number | null, number | null]>([null, null]);
  const [failed, setFailed] = useState(false);

  const engineRef = useRef<BeatEngine | null>(null);
  const roundRef = useRef(round);
  const pitchRef = useRef(pitch);
  const nudgeRef = useRef(0);

  const deckBpm = bpmAtPitch(round.recordBpm, pitch);
  const result = judgeMatch(round.houseBpm, deckBpm);
  const verdict = VERDICT_COPY[result.verdict];

  useEffect(() => () => void engineRef.current?.stop(), []);

  function changePitch(next: number) {
    const clamped = Math.max(-DEFAULT_PITCH_RANGE, Math.min(DEFAULT_PITCH_RANGE, Math.round(next * 100) / 100));
    pitchRef.current = clamped;
    setPitch(clamped);
  }

  async function start() {
    // A second tap before the first one starts must not stack a second engine.
    if (engineRef.current) return;
    setFailed(false);
    try {
      const engine = new BeatEngine(
        [
          { voice: "house", pan: -0.6, tempo: () => roundRef.current.houseBpm },
          {
            voice: "record",
            pan: 0.6,
            tempo: () => bpmAtPitch(roundRef.current.recordBpm, pitchRef.current) * (1 + nudgeRef.current * NUDGE),
          },
        ],
        (deck, beat) => setBeats((current) => (deck === 0 ? [beat, current[1]] : [current[0], beat])),
      );
      engineRef.current = engine;
      await engine.start(roundRef.current.lateBeats);
      setRunning(true);
    } catch {
      // Close whatever audio was opened before the failure, so a retry starts clean.
      const failedEngine = engineRef.current;
      engineRef.current = null;
      setFailed(true);
      await failedEngine?.stop().catch(() => undefined);
    }
  }

  async function stop() {
    const engine = engineRef.current;
    engineRef.current = null;
    setRunning(false);
    setBeats([null, null]);
    await engine?.stop();
  }

  async function nextRound() {
    await stop();
    const next = newRound(Math.random);
    roundRef.current = next;
    setRound(next);
    changePitch(0);
    setRevealed(false);
  }

  function nudge(direction: -1 | 0 | 1) {
    nudgeRef.current = direction;
  }

  return (
    <div className="dark flex flex-col gap-6 bg-card p-5 text-foreground md:p-8">
      <div className="grid gap-8 sm:grid-cols-2">
        <Deck name="La pista" side="Izquierda" tempo={revealed ? round.houseBpm.toFixed(2) : "---.--"} beat={beats[0]} />
        <Deck name="Tu disco" side="Derecha" tempo={deckBpm.toFixed(2)} beat={beats[1]}>
          <span className="flex items-center gap-2 text-sm text-muted-foreground">
            Etiqueta <BpmSticker tempo={String(round.recordBpm)} />
          </span>
        </Deck>
      </div>

      <div className="flex flex-col gap-2">
        <div className="flex items-baseline justify-between gap-4">
          <label htmlFor="trainer-pitch" className="font-medium">
            Pitch de tu disco
          </label>
          <output htmlFor="trainer-pitch" className="tabular font-heading text-2xl leading-none font-bold">
            {formatPitch(pitch)}
          </output>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon" aria-label="Bajar el pitch un poco" onClick={() => changePitch(pitch - FINE_STEP)}>
            −
          </Button>
          <input
            id="trainer-pitch"
            type="range"
            min={-DEFAULT_PITCH_RANGE}
            max={DEFAULT_PITCH_RANGE}
            step={FINE_STEP}
            value={pitch}
            onChange={(event) => changePitch(event.target.valueAsNumber)}
            aria-valuetext={formatPitch(pitch)}
            className="h-11 min-w-0 flex-1 cursor-pointer accent-primary"
          />
          <Button variant="outline" size="icon" aria-label="Subir el pitch un poco" onClick={() => changePitch(pitch + FINE_STEP)}>
            +
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2">
        <HoldButton disabled={!running} onHold={(held) => nudge(held ? -1 : 0)}>
          Frenar el plato
        </HoldButton>
        <HoldButton disabled={!running} onHold={(held) => nudge(held ? 1 : 0)}>
          Empujar el plato
        </HoldButton>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        {running ? (
          <Button variant="outline" className="h-11 px-5" onClick={() => void stop()}>
            Parar
          </Button>
        ) : (
          <Button className="h-11 px-5" onClick={() => void start()}>
            Que suene
          </Button>
        )}
        <Button variant="outline" className="h-11 px-5" disabled={revealed} onClick={() => setRevealed(true)}>
          Ver cómo voy
        </Button>
        <Button variant="ghost" className="h-11 px-5" onClick={() => void nextRound()}>
          Otro disco
        </Button>
      </div>

      <div aria-live="polite" className="min-h-12 text-sm">
        {failed && <p className="text-clash">Este navegador no deja sonar audio. Probá con otro</p>}
        {revealed && (
          <p className="text-pretty">
            <span className={cn("font-semibold", verdict.tone)}>{verdict.label}.</span>{" "}
            {result.verdict === "locked"
              ? `La pista está en ${formatBpm(round.houseBpm)} y vos en ${deckBpm.toFixed(2)}`
              : `Te ${result.gap > 0 ? "sobran" : "faltan"} ${Math.abs(result.gap).toFixed(2)} BPM: los bombos se separan ${Math.abs(Math.round(result.driftPerBar))} ms por compás. Mové el fader ${formatPitch(result.pitchNeeded)}`}
          </p>
        )}
        {!revealed && !failed && (
          <p className="text-muted-foreground">
            Con auriculares se escucha mejor: la pista suena a la izquierda y tu disco, con palmas, a la derecha
          </p>
        )}
      </div>
    </div>
  );
}
