"use client";

import { Input } from "@dallateas/ui/components/input";
import { Label } from "@dallateas/ui/components/label";
import { cn } from "@dallateas/ui/lib/utils";

import { parseTempo } from "./numbers";

type TempoFieldProps = {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  className?: string;
};

/** A text field on purpose: a number input refuses the comma a phone set to Spanish offers. */
export function TempoField({ id, label, value, onChange, className }: TempoFieldProps) {
  const invalid = value.trim() !== "" && parseTempo(value) === null;
  const errorId = `${id}-error`;

  return (
    <div className={cn("flex flex-col gap-2", className)}>
      <Label htmlFor={id} className="text-sm leading-tight">
        {label}
      </Label>
      <Input
        id={id}
        inputMode="decimal"
        autoComplete="off"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        aria-invalid={invalid}
        aria-describedby={invalid ? errorId : undefined}
        className="tabular h-14 font-heading text-3xl font-bold md:text-3xl"
      />
      {invalid && (
        <p id={errorId} className="text-sm text-clash">
          Un tempo entre 20 y 400
        </p>
      )}
    </div>
  );
}
