"use client";

import { Button } from "@dallateas/ui/components/button";
import { Loader2 } from "lucide-react";
import type { Route } from "next";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import { z } from "zod";

import PasswordStrengthBar from "@/components/password-strength-bar";
import { AuthColumn, StepBar } from "@/components/profile/auth-column";
import { CodeField, Field, PRIMARY_ACTION, TEXT_LINK } from "@/components/profile/fields";
import { authErrorMessage, fieldErrors } from "@/components/profile/form-errors";
import { PasswordField } from "@/components/profile/password-field";
import { useHaptic } from "@/hooks/use-haptic";
import { authClient } from "@/lib/auth-client";

const STEPS = ["email", "code", "password"] as const;
type Step = (typeof STEPS)[number];

const emailSchema = z.string().trim().min(1, "Ingresá tu email").email("Email inválido");

const passwordSchema = z
  .object({
    newPassword: z.string().min(8, "Mínimo 8 caracteres").max(128, "Máximo 128 caracteres"),
    confirmPassword: z.string().min(1, "Confirmá tu contraseña"),
  })
  .refine((values) => values.newPassword === values.confirmPassword, {
    message: "Las contraseñas no coinciden",
    path: ["confirmPassword"],
  });

const SUBMIT_LABELS: Record<Step, { idle: string; busy: string }> = {
  email: { idle: "Enviar código", busy: "Enviando" },
  code: { idle: "Verificar código", busy: "Verificando" },
  password: { idle: "Restablecer contraseña", busy: "Restableciendo" },
};

export default function ForgotPasswordForm() {
  const router = useRouter();
  const haptic = useHaptic();
  const [step, setStep] = useState<Step>("email");
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [attempted, setAttempted] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const address = email.trim();
  const emailError = attempted ? emailSchema.safeParse(email).error?.issues[0]?.message : undefined;
  const passwords = passwordSchema.safeParse({ newPassword, confirmPassword });
  const passwordErrors = attempted && !passwords.success ? fieldErrors(passwords.error) : {};

  async function sendCode() {
    const { error } = await authClient.emailOtp.sendVerificationOtp({ email: address, type: "forget-password" });
    if (error) {
      toast.error(authErrorMessage(error, "No pudimos enviar el código"));
      return;
    }
    toast.success("Código enviado a tu email");
    setAttempted(false);
    setStep("code");
  }

  async function checkCode() {
    const { error } = await authClient.emailOtp.checkVerificationOtp({
      email: address,
      otp: code,
      type: "forget-password",
    });
    if (error) {
      haptic.trigger("error");
      toast.error(authErrorMessage(error, "Código incorrecto o vencido"));
      return;
    }
    haptic.trigger("success");
    setAttempted(false);
    setStep("password");
  }

  async function resetPassword() {
    const { error } = await authClient.emailOtp.resetPassword({ email: address, otp: code, password: newPassword });
    if (error) {
      haptic.trigger("error");
      toast.error(authErrorMessage(error, "No pudimos restablecer la contraseña"));
      return;
    }
    haptic.trigger("success");
    toast.success("Contraseña actualizada. Iniciá sesión");
    router.push(`/login?email=${encodeURIComponent(address)}` as Route);
  }

  async function run(action: () => Promise<void>) {
    setIsLoading(true);
    try {
      await action();
    } catch {
      toast.error("No pudimos conectarnos. Probá de nuevo");
    } finally {
      setIsLoading(false);
    }
  }

  function submit() {
    setAttempted(true);
    if (step === "email" && emailSchema.safeParse(email).success) void run(sendCode);
    if (step === "code" && code.length === 6) void run(checkCode);
    if (step === "password" && passwords.success) void run(resetPassword);
  }

  const copy = {
    email: { title: "Recuperar contraseña", description: "Ingresá tu email y te mandamos un código" },
    code: { title: "Revisá tu email", description: `Ingresá el código que mandamos a ${address}` },
    password: { title: "Nueva contraseña", description: "Elegí la contraseña con la que vas a entrar" },
  }[step];

  return (
    <AuthColumn
      title={copy.title}
      description={copy.description}
      footer={
        <Link href="/login" className={TEXT_LINK}>
          Volver a iniciar sesión
        </Link>
      }
    >
      <StepBar step={STEPS.indexOf(step) + 1} total={STEPS.length} />

      <form
        noValidate
        className="space-y-4"
        onSubmit={(event) => {
          event.preventDefault();
          submit();
        }}
      >
        {step === "email" && (
          <Field
            id="email"
            label="Email"
            type="email"
            autoComplete="email"
            placeholder="tu@email.com"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            error={emailError}
            disabled={isLoading}
          />
        )}

        {step === "code" && <CodeField value={code} onChange={setCode} disabled={isLoading} autoFocus />}

        {step === "password" && (
          <>
            <div className="space-y-2">
              <PasswordField
                id="new-password"
                label="Nueva contraseña"
                autoComplete="new-password"
                value={newPassword}
                onChange={(event) => setNewPassword(event.target.value)}
                error={passwordErrors.newPassword}
                disabled={isLoading}
                autoFocus
              />
              <PasswordStrengthBar password={newPassword} />
            </div>
            <PasswordField
              id="confirm-password"
              label="Confirmar contraseña"
              autoComplete="new-password"
              value={confirmPassword}
              onChange={(event) => setConfirmPassword(event.target.value)}
              error={passwordErrors.confirmPassword}
              disabled={isLoading}
            />
          </>
        )}

        <Button type="submit" className={PRIMARY_ACTION} disabled={isLoading || (step === "code" && code.length < 6)}>
          {isLoading && <Loader2 aria-hidden="true" className="size-4 motion-safe:animate-spin" />}
          {isLoading ? SUBMIT_LABELS[step].busy : SUBMIT_LABELS[step].idle}
        </Button>

        {step === "code" && (
          <button
            type="button"
            onClick={() => void run(sendCode)}
            disabled={isLoading}
            className="min-h-11 text-sm text-muted-foreground hover:text-foreground hover:underline md:min-h-0"
          >
            Reenviar código
          </button>
        )}
      </form>
    </AuthColumn>
  );
}
