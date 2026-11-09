"use client";

import { PITCH_RANGES } from "@dallateas/dj/tempo";
import { cn } from "@dallateas/ui/lib/utils";

type PitchRangePickerProps = {
  value: number;
  onChange: (range: number) => void;
  /** Radio group name, unique on the page. */
  name: string;
  className?: string;
};

export function PitchRangePicker({ value, onChange, name, className }: PitchRangePickerProps) {
  return (
    <fieldset className={cn("min-w-0", className)}>
      <legend className="sr-only">Rango del fader</legend>
      <div className="inline-flex divide-x divide-border overflow-hidden rounded-md border border-border">
        {PITCH_RANGES.map((range) => (
          <label key={range} className="relative cursor-pointer">
            <input
              type="radio"
              name={name}
              value={range}
              checked={value === range}
              onChange={() => onChange(range)}
              className="peer sr-only"
            />
            <span className="tabular flex h-11 min-w-12 items-center justify-center px-2 text-sm text-muted-foreground transition-colors peer-checked:bg-accent peer-checked:font-medium peer-checked:text-accent-foreground peer-focus-visible:outline-2 peer-focus-visible:-outline-offset-2 peer-focus-visible:outline-ring hover:text-foreground md:h-9">
              ±{range}%
            </span>
          </label>
        ))}
      </div>
    </fieldset>
  );
}
