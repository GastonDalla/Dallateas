import { cn } from "@dallateas/ui/lib/utils";

const GROOVES = [86, 94, 102, 110, 118, 126, 148, 156, 164, 172, 180, 188];
const TURN_PER_PITCH_POINT = 14;

/** The record half out of its sleeve: a white label, with one band between the two cuts of a side. */
export function RecordDisc({ pitch, className }: { pitch: number; className?: string }) {
  return (
    <svg viewBox="0 0 400 400" aria-hidden="true" className={cn("select-none", className)}>
      <circle cx="200" cy="200" r="200" className="fill-card" />
      {GROOVES.map((radius) => (
        <circle key={radius} cx="200" cy="200" r={radius} fill="none" strokeWidth="1" className="stroke-muted" />
      ))}
      <g
        style={{ transform: `rotate(${pitch * TURN_PER_PITCH_POINT}deg)`, transformOrigin: "200px 200px" }}
        className="transition-transform duration-100 ease-out"
      >
        <circle cx="200" cy="200" r="70" className="fill-foreground" />
        <rect x="178" y="146" width="44" height="22" rx="1" className="fill-primary" />
        <text x="200" y="162" textAnchor="middle" className="fill-primary-foreground font-heading text-[15px] font-bold">
          33⅓
        </text>
        <text x="200" y="244" textAnchor="middle" className="fill-background font-heading text-[11px] font-semibold">
          Cara A
        </text>
      </g>
      <circle cx="200" cy="200" r="4" className="fill-background" />
    </svg>
  );
}
