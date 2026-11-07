import { Checkbox } from "@dallateas/ui/components/checkbox";
import { Input } from "@dallateas/ui/components/input";
import { Label } from "@dallateas/ui/components/label";
import { cn } from "@dallateas/ui/lib/utils";
import type { ComponentProps, ReactNode } from "react";

/** 44px and 16px text on a phone, which also stops iOS from zooming into the field. */
export const CONTROL = "h-11 text-base md:h-9 md:text-sm";

export const PRIMARY_ACTION = "h-11 w-full text-base md:h-9 md:text-sm";

export const TEXT_LINK = "font-medium text-link underline-offset-4 hover:underline";

export type FieldFrameProps = {
  id: string;
  label: string;
  /** For controls in a row that already says what it holds. */
  hideLabel?: boolean;
  optional?: boolean;
  hint?: ReactNode;
  error?: string;
  /** Sits on the label line, at the right. */
  labelAction?: ReactNode;
};

/** The ids a control has to point at, so a screen reader announces its hint and its error. */
export function describedBy(id: string, hint?: ReactNode, error?: string) {
  const ids = [hint ? `${id}-hint` : null, error ? `${id}-error` : null].filter(Boolean);
  return ids.length > 0 ? ids.join(" ") : undefined;
}

export function FieldFrame({
  id,
  label,
  hideLabel,
  optional,
  hint,
  error,
  labelAction,
  children,
}: FieldFrameProps & { children: ReactNode }) {
  return (
    <div className="min-w-0 space-y-2">
      <div className={cn("flex items-baseline justify-between gap-3", hideLabel && "sr-only")}>
        <Label htmlFor={id} className="text-sm font-medium">
          {label}
          {optional && <span className="font-normal text-muted-foreground">Opcional</span>}
        </Label>
        {labelAction}
      </div>
      {children}
      {hint && (
        <p id={`${id}-hint`} className="text-[13px] text-pretty text-muted-foreground">
          {hint}
        </p>
      )}
      {error && (
        <p id={`${id}-error`} className="text-[13px] text-destructive">
          {error}
        </p>
      )}
    </div>
  );
}

type FieldProps = Omit<ComponentProps<"input">, "id" | "prefix"> &
  FieldFrameProps & {
    /** Fixed text joined to the start of the input, like `/p/`. */
    prefix?: string;
  };

export function Field({ id, label, hideLabel, optional, hint, error, labelAction, prefix, className, ...input }: FieldProps) {
  const control = (
    <Input
      id={id}
      aria-invalid={error ? true : undefined}
      aria-describedby={describedBy(id, hint, error)}
      className={cn(CONTROL, prefix && "rounded-l-none", className)}
      {...input}
    />
  );

  return (
    <FieldFrame
      id={id}
      label={label}
      hideLabel={hideLabel}
      optional={optional}
      hint={hint}
      error={error}
      labelAction={labelAction}
    >
      {prefix ? (
        <div className="flex">
          <span className="flex shrink-0 items-center rounded-l-md border border-r-0 border-input bg-muted px-3 text-sm text-muted-foreground">
            {prefix}
          </span>
          {control}
        </div>
      ) : (
        control
      )}
    </FieldFrame>
  );
}

type TextAreaFieldProps = Omit<ComponentProps<"textarea">, "id"> & FieldFrameProps;

export function TextAreaField({ id, label, hideLabel, optional, hint, error, labelAction, className, ...textarea }: TextAreaFieldProps) {
  return (
    <FieldFrame
      id={id}
      label={label}
      hideLabel={hideLabel}
      optional={optional}
      hint={hint}
      error={error}
      labelAction={labelAction}
    >
      <textarea
        id={id}
        aria-invalid={error ? true : undefined}
        aria-describedby={describedBy(id, hint, error)}
        className={cn(
          "w-full resize-y rounded-md border border-input bg-transparent px-2.5 py-2 text-base transition-colors outline-none placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-1 focus-visible:ring-ring/50 aria-invalid:border-destructive md:text-sm dark:bg-input/30",
          className,
        )}
        {...textarea}
      />
    </FieldFrame>
  );
}

type CodeFieldProps = {
  id?: string;
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
  error?: string;
  autoFocus?: boolean;
};

/** The six digits sent by email. */
export function CodeField({ id = "code", value, onChange, disabled, error, autoFocus }: CodeFieldProps) {
  return (
    <Field
      id={id}
      label="Código de 6 dígitos"
      type="text"
      inputMode="numeric"
      autoComplete="one-time-code"
      maxLength={6}
      placeholder="000000"
      value={value}
      onChange={(event) => onChange(event.target.value.replace(/\D/g, "").slice(0, 6))}
      disabled={disabled}
      error={error}
      autoFocus={autoFocus}
      className="h-14 font-heading text-3xl font-bold tabular tracking-[0.3em] md:h-14 md:text-3xl"
    />
  );
}

type CheckFieldProps = {
  id: string;
  label: string;
  hint?: ReactNode;
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
};

export function CheckField({ id, label, hint, checked, onCheckedChange }: CheckFieldProps) {
  return (
    <div className="flex items-start gap-3">
      <Checkbox
        id={id}
        checked={checked}
        onCheckedChange={(next) => onCheckedChange(next)}
        aria-describedby={describedBy(id, hint)}
        className="mt-0.5"
      />
      <div className="min-w-0 space-y-1">
        <Label htmlFor={id} className="text-sm leading-5 font-medium">
          {label}
        </Label>
        {hint && (
          <p id={`${id}-hint`} className="text-[13px] text-pretty text-muted-foreground">
            {hint}
          </p>
        )}
      </div>
    </div>
  );
}

type FormSectionProps = {
  title: string;
  description?: ReactNode;
  children: ReactNode;
};

/** One part of a settings screen: what it is on the left, its controls on the right. */
export function FormSection({ title, description, children }: FormSectionProps) {
  return (
    <section className="grid gap-4 border-t border-border py-8 md:grid-cols-[14rem_minmax(0,1fr)] md:gap-8">
      <div>
        <h2 className="text-base font-semibold">{title}</h2>
        {description && <p className="mt-1 text-sm text-pretty text-muted-foreground">{description}</p>}
      </div>
      <div className="min-w-0 space-y-4">{children}</div>
    </section>
  );
}
