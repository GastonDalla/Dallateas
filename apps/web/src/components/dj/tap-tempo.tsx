"use client";

import { Button } from "@dallateas/ui/components/button";
import { cn } from "@dallateas/ui/lib/utils";
import { appendTap, bpmFromTaps } from "@dallateas/dj/tempo";
import { useState, type KeyboardEvent } from "react";

import { useHaptic } from "@/hooks/use-haptic";
import { formatBpm } from "@/lib/format";

type TapTempoProps = {
  /** Offers a button to keep the result, such as saving it to a track. */
  onConfirm?: (bpm: number) => void;
  confirmLabel?: string;
  className?: string;
};

/** Tap along with the record. Pointer down, not click, because a click lands late and skews the tempo. */
export function TapTempo({ onConfirm, confirmLabel = "Usar este BPM", className }: TapTempoProps) {
  const haptic = useHaptic();
  const [taps, setTaps] = useState<number[]>([]);
  const bpm = bpmFromTaps(taps);

  function tap(timestamp: number) {
    haptic.trigger("selection");
    setTaps((current) => appendTap(current, timestamp));
  }

  function handleKeyDown(event: KeyboardEvent<HTMLButtonElement>) {
    if ((event.key === " " || event.key === "Enter") && !event.repeat) {
      event.preventDefault();
      tap(event.timeStamp);
    }
  }

  return (
    <div className={cn("flex flex-col gap-3", className)}>
      <button
        type="button"
        onPointerDown={(event) => tap(event.timeStamp)}
        onKeyDown={handleKeyDown}
        className="flex h-44 w-full touch-manipulation select-none flex-col items-center justify-center gap-1 bg-primary text-primary-foreground transition-transform active:scale-[0.99]"
      >
        <span className="tabular font-heading text-7xl font-bold leading-none" aria-live="polite">
          {bpm === null ? "—" : formatBpm(bpm)}
        </span>
        <span className="text-sm font-medium">
          {taps.length === 0 ? "Tocá al ritmo del bombo" : bpm === null ? "Seguí tocando" : `${taps.length} golpes`}
        </span>
      </button>

      <div className="flex items-center justify-between gap-2">
        <Button variant="ghost" size="sm" disabled={taps.length === 0} onClick={() => setTaps([])}>
          Empezar de nuevo
        </Button>
        {onConfirm && bpm !== null && (
          <Button size="sm" onClick={() => onConfirm(bpm)}>
            {confirmLabel}
          </Button>
        )}
      </div>
    </div>
  );
}
