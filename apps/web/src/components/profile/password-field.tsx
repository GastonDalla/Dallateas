"use client";

import { Input } from "@dallateas/ui/components/input";
import { cn } from "@dallateas/ui/lib/utils";
import { Eye, EyeOff } from "lucide-react";
import { useState, type ComponentProps } from "react";

import { CONTROL, describedBy, FieldFrame, type FieldFrameProps } from "./fields";

type PasswordFieldProps = Omit<ComponentProps<"input">, "id" | "type"> & FieldFrameProps;

export function PasswordField({ id, label, hideLabel, optional, hint, error, labelAction, className, ...input }: PasswordFieldProps) {
  const [visible, setVisible] = useState(false);

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
      <div className="relative">
        <Input
          id={id}
          type={visible ? "text" : "password"}
          aria-invalid={error ? true : undefined}
          aria-describedby={describedBy(id, hint, error)}
          className={cn(CONTROL, "pr-11", className)}
          {...input}
        />
        <button
          type="button"
          onClick={() => setVisible(!visible)}
          aria-label={visible ? "Ocultar contraseña" : "Mostrar contraseña"}
          className="absolute inset-y-0 right-0 flex w-11 items-center justify-center text-muted-foreground transition-colors hover:text-foreground"
        >
          {visible ? <EyeOff aria-hidden="true" className="size-4" /> : <Eye aria-hidden="true" className="size-4" />}
        </button>
      </div>
    </FieldFrame>
  );
}
