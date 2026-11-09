import { cn } from "@dallateas/ui/lib/utils";

import { formatPitch } from "@/lib/format";

type PitchRulerProps = {
  /** Where the fader sits, in percent. */
  pitch: number;
  /** How far the fader travels each way. */
  range: number;
  className?: string;
};

const TICKS = 17;

/** A pitch fader scale. It says at a glance how far a change pushes the record. */
export function PitchRuler({ pitch, range, className }: PitchRulerProps) {
  const reachable = Math.abs(pitch) <= range;
  const position = Math.max(-1, Math.min(1, pitch / range));

  return (
    <div
      role="img"
      aria-label={`Pitch ${formatPitch(pitch)}, ${reachable ? "dentro" : "fuera"} del rango de ±${range}%`}
      className={cn("relative h-5 w-full", className)}
    >
      <div className="absolute inset-x-0 top-1/2 flex -translate-y-1/2 items-center justify-between" aria-hidden="true">
        {Array.from({ length: TICKS }, (_, index) => (
          <span
            key={index}
            className={cn("w-px bg-foreground/25", index === (TICKS - 1) / 2 ? "h-4 bg-foreground/60" : index % 4 === 0 ? "h-3" : "h-2")}
          />
        ))}
      </div>
      <span
        aria-hidden="true"
        style={{ left: `${50 + position * 50}%` }}
        className={cn(
          "absolute top-1/2 h-4 w-1.5 -translate-x-1/2 -translate-y-1/2 rounded-sm",
          reachable ? "bg-primary" : "bg-clash",
        )}
      />
    </div>
  );
}
