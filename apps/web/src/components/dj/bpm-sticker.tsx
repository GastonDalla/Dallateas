import { cn } from "@dallateas/ui/lib/utils";

type BpmStickerProps = {
  /** Already formatted, such as "124" or "124-128". */
  tempo: string;
  keyLabel?: string | null;
  /** A lookup rather than a measurement, drawn hollow so nobody mistakes it for one. */
  approximate?: boolean;
  size?: "sm" | "md";
  className?: string;
};

/** The sticker a DJ puts on a sleeve. Filled means measured, hollow means approximate. */
export function BpmSticker({ tempo, keyLabel, approximate = false, size = "sm", className }: BpmStickerProps) {
  return (
    <span
      className={cn(
        "tabular inline-flex items-baseline gap-1 rounded-sm font-heading font-bold leading-none",
        size === "sm" ? "px-1.5 py-1 text-sm" : "px-2 py-1.5 text-lg",
        approximate
          ? "border border-primary bg-background text-foreground"
          : "bg-primary text-primary-foreground",
        className,
      )}
    >
      <span className="sr-only">{approximate ? "BPM aproximado" : "BPM"}</span>
      {approximate ? `≈${tempo}` : tempo}
      {keyLabel && <span className="font-semibold opacity-75">{keyLabel}</span>}
    </span>
  );
}
