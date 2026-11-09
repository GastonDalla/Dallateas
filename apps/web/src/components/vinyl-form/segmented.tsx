import { cn } from "@dallateas/ui/lib/utils";
import type { ReactNode } from "react";

type SegmentedOption<T> = {
  value: T;
  label: ReactNode;
  /** For options drawn as an icon. */
  ariaLabel?: string;
};

type SegmentedProps<T> = {
  label: string;
  options: readonly SegmentedOption<T>[];
  value: T;
  onChange: (value: T) => void;
  className?: string;
};

/** A short choice with every option in view: a view, a method, a fader range. */
export function Segmented<T extends string | number>({ label, options, value, onChange, className }: SegmentedProps<T>) {
  return (
    <div role="group" aria-label={label} className={cn("inline-flex rounded-md border border-border p-0.5", className)}>
      {options.map((option) => (
        <button
          key={option.value}
          type="button"
          aria-label={option.ariaLabel}
          aria-pressed={option.value === value}
          onClick={() => onChange(option.value)}
          className={cn(
            "tabular flex h-10 min-w-10 flex-1 items-center justify-center gap-1.5 rounded-sm px-2.5 text-[13px] font-medium whitespace-nowrap transition-colors duration-[120ms] focus-visible:outline-2 focus-visible:outline-ring md:h-7 md:min-w-7",
            option.value === value ? "bg-accent text-accent-foreground" : "text-muted-foreground hover:text-foreground",
          )}
        >
          {option.label}
        </button>
      ))}
    </div>
  );
}
