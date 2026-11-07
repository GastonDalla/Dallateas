import { cn } from "@dallateas/ui/lib/utils";
import type { ReactNode } from "react";

/** 16px on phones, because iOS zooms the page into any smaller input. */
export const controlClass =
  "h-11 w-full min-w-0 rounded-md border border-input bg-card px-3 text-base transition-colors duration-[120ms] placeholder:text-muted-foreground hover:border-foreground/30 focus-visible:border-ring focus-visible:outline-2 focus-visible:outline-ring aria-invalid:border-clash md:h-9 md:text-sm";

export const textareaClass = cn(controlClass, "h-auto py-2 md:h-auto");

/** Buttons that have to reach a thumb on a phone and stay compact on a desk. */
export const actionClass = "h-11 gap-1.5 px-3 text-[13px] md:h-8";

export const iconActionClass = "size-11 md:size-8";

type FieldProps = {
  label: string;
  htmlFor: string;
  hint?: ReactNode;
  className?: string;
  children: ReactNode;
};

export function Field({ label, htmlFor, hint, className, children }: FieldProps) {
  return (
    <div className={cn("flex min-w-0 flex-col gap-1.5", className)}>
      <label htmlFor={htmlFor} className="text-[13px] font-medium">
        {label}
      </label>
      {children}
      {hint && <p className="text-[13px] text-muted-foreground">{hint}</p>}
    </div>
  );
}

type FormSectionProps = {
  title: string;
  action?: ReactNode;
  children: ReactNode;
};

export function FormSection({ title, action, children }: FormSectionProps) {
  return (
    <section className="flex flex-col gap-3 border-t border-border pt-4">
      <div className="flex min-h-6 items-center justify-between gap-3">
        <h3 className="font-sans text-sm font-semibold">{title}</h3>
        {action}
      </div>
      {children}
    </section>
  );
}
