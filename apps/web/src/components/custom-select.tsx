"use client";

import { cn } from "@dallateas/ui/lib/utils";
import { Check, ChevronDown } from "lucide-react";

import { useAnchoredPopover } from "@/hooks/use-anchored-popover";

type SelectOption = {
  value: string;
  label: string;
};

type CustomSelectProps = {
  options: SelectOption[];
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  label?: string;
  className?: string;
  disabled?: boolean;
};

export function CustomSelect({
  options,
  value,
  onChange,
  placeholder = "Seleccionar",
  label,
  className,
  disabled = false,
}: CustomSelectProps) {
  const popover = useAnchoredPopover();
  const selected = options.find((option) => option.value === value);

  function choose(next: string) {
    onChange(next);
    popover.close();
  }

  return (
    <div className={className}>
      <button
        {...popover.triggerProps}
        type="button"
        disabled={disabled}
        aria-haspopup="listbox"
        aria-label={label}
        className="flex h-11 w-full items-center justify-between gap-2 rounded-md border border-input bg-card px-3 text-left text-sm transition-colors duration-[120ms] hover:border-foreground/30 focus-visible:outline-2 focus-visible:outline-ring disabled:cursor-not-allowed disabled:opacity-50 md:h-9"
      >
        <span className={cn("flex-1 truncate", !selected && "text-muted-foreground")}>
          {selected ? selected.label : placeholder}
        </span>
        <ChevronDown aria-hidden="true" className="size-4 shrink-0 text-muted-foreground" />
      </button>

      <div
        {...popover.panelProps}
        role="listbox"
        aria-label={label}
        className="fixed inset-auto m-0 max-h-56 overflow-y-auto overscroll-contain rounded-xl border border-border bg-popover p-1 text-popover-foreground shadow-md"
      >
        {options.map((option) => {
          const active = option.value === value;
          return (
            <button
              key={option.value}
              type="button"
              role="option"
              aria-selected={active}
              onClick={() => choose(option.value)}
              className={cn(
                "flex min-h-11 w-full items-center gap-2 rounded-md px-2.5 py-2 text-left text-sm transition-colors duration-[120ms] md:min-h-9",
                active ? "bg-accent font-medium text-accent-foreground" : "hover:bg-muted",
              )}
            >
              <span className="flex-1 truncate">{option.label}</span>
              {active && <Check aria-hidden="true" className="size-3.5 shrink-0" />}
            </button>
          );
        })}
      </div>
    </div>
  );
}
