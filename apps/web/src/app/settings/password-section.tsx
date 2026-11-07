"use client";

import { Button } from "@dallateas/ui/components/button";
import { Loader2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { z } from "zod";

import PasswordStrengthBar from "@/components/password-strength-bar";
import { FormSection } from "@/components/profile/fields";
import { authErrorMessage, fieldErrors } from "@/components/profile/form-errors";
import { PasswordField } from "@/components/profile/password-field";
import { useHaptic } from "@/hooks/use-haptic";
import { authClient } from "@/lib/auth-client";

const passwordSchema = z
  .object({
    currentPassword: z.string().min(1, "Ingresá tu contraseña actual"),
    newPassword: z.string().min(8, "Mínimo 8 caracteres").max(128, "Máximo 128 caracteres"),
    confirmPassword: z.string().min(1, "Confirmá tu contraseña"),
  })
  .refine((values) => values.newPassword === values.confirmPassword, {
    message: "Las contraseñas no coinciden",
    path: ["confirmPassword"],
  });

const EMPTY_PASSWORDS = { currentPassword: "", newPassword: "", confirmPassword: "" };

function PasswordForm({ onClose }: { onClose: () => void }) {
  const haptic = useHaptic();
  const [values, setValues] = useState(EMPTY_PASSWORDS);
  const [attempted, setAttempted] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const validation = passwordSchema.safeParse(values);
  const errors = attempted && !validation.success ? fieldErrors(validation.error) : {};

  function update(field: keyof typeof EMPTY_PASSWORDS, value: string) {
    setValues((current) => ({ ...current, [field]: value }));
  }

  async function changePassword() {
    setAttempted(true);
    if (!validation.success) return;

    setIsSaving(true);
    try {
      const { error } = await authClient.changePassword({
        currentPassword: values.currentPassword,
        newPassword: values.newPassword,
        revokeOtherSessions: true,
      });
      if (error) {
        haptic.trigger("error");
        toast.error(authErrorMessage(error, "No pudimos cambiar la contraseña"));
        return;
      }
      haptic.trigger("success");
      toast.success("Contraseña actualizada");
      onClose();
    } catch {
      toast.error("No pudimos conectarnos. Probá de nuevo");
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <form
      noValidate
      className="space-y-4"
      onSubmit={(event) => {
        event.preventDefault();
        void changePassword();
      }}
    >
      <PasswordField
        id="current-password"
        label="Contraseña actual"
        autoComplete="current-password"
        autoFocus
        value={values.currentPassword}
        onChange={(event) => update("currentPassword", event.target.value)}
        error={errors.currentPassword}
        disabled={isSaving}
      />
      <div className="space-y-2">
        <PasswordField
          id="new-password"
          label="Nueva contraseña"
          autoComplete="new-password"
          value={values.newPassword}
          onChange={(event) => update("newPassword", event.target.value)}
          error={errors.newPassword}
          disabled={isSaving}
        />
        <PasswordStrengthBar password={values.newPassword} />
      </div>
      <PasswordField
        id="confirm-password"
        label="Confirmar contraseña"
        autoComplete="new-password"
        value={values.confirmPassword}
        onChange={(event) => update("confirmPassword", event.target.value)}
        error={errors.confirmPassword}
        disabled={isSaving}
      />
      <div className="flex gap-2">
        <Button type="submit" variant="outline" disabled={isSaving} className="h-11 px-3 text-sm md:h-9">
          {isSaving && <Loader2 aria-hidden="true" className="size-4 motion-safe:animate-spin" />}
          Cambiar contraseña
        </Button>
        <Button type="button" variant="ghost" onClick={onClose} disabled={isSaving} className="h-11 px-3 text-sm md:h-9">
          Cancelar
        </Button>
      </div>
    </form>
  );
}

export function PasswordSection() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <FormSection title="Contraseña" description="Al cambiarla se cierran tus otras sesiones">
      {isOpen ? (
        <PasswordForm onClose={() => setIsOpen(false)} />
      ) : (
        <Button type="button" variant="outline" onClick={() => setIsOpen(true)} className="h-11 px-3 text-sm md:h-9">
          Cambiar contraseña
        </Button>
      )}
    </FormSection>
  );
}
