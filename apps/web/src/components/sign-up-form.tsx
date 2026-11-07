"use client";

import { Button } from "@dallateas/ui/components/button";
import { ArrowLeft, ArrowRight, Loader2 } from "lucide-react";
import type { Route } from "next";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import { z } from "zod";

import PasswordStrengthBar from "@/components/password-strength-bar";
import { AuthColumn, StepBar } from "@/components/profile/auth-column";
import { Field, TEXT_LINK } from "@/components/profile/fields";
import { authErrorMessage, fieldErrors } from "@/components/profile/form-errors";
import { PasswordField } from "@/components/profile/password-field";
import { useHaptic } from "@/hooks/use-haptic";
import { authClient } from "@/lib/auth-client";

const STEPS = ["username", "email", "password"] as const;
type Step = (typeof STEPS)[number];

const STEP_SCHEMAS = {
  username: z.object({
    name: z.string().trim().min(2, "Mínimo 2 caracteres").max(100, "Máximo 100 caracteres"),
    username: z
      .string()
      .min(3, "Mínimo 3 caracteres")
      .max(30, "Máximo 30 caracteres")
      .regex(/^[a-zA-Z0-9_]+$/, "Solo letras, números y guiones bajos"),
  }),
  email: z.object({
    email: z.string().trim().min(1, "Ingresá tu email").email("Email inválido"),
  }),
  password: z
    .object({
      password: z.string().min(8, "Mínimo 8 caracteres").max(128, "Máximo 128 caracteres"),
      confirmPassword: z.string().min(1, "Confirmá tu contraseña"),
    })
    .refine((values) => values.password === values.confirmPassword, {
      message: "Las contraseñas no coinciden",
      path: ["confirmPassword"],
    }),
};

const STEP_COPY: Record<Step, { title: string; description: string }> = {
  username: { title: "¿Cómo te llamás?", description: "Elegí tu nombre y un nombre de usuario único" },
  email: { title: "Tu email", description: "Lo usamos para verificar tu cuenta" },
  password: { title: "Creá tu contraseña", description: "Mínimo 8 caracteres. Cuanto más variada, mejor" },
};

/** Where a rejected sign-up has to go back to, so the message lands on the field that caused it. */
const REJECTED_FIELDS: Record<string, { step: Step; field: string }> = {
  INVALID_USERNAME: { step: "username", field: "username" },
  USERNAME_IS_ALREADY_TAKEN: { step: "username", field: "username" },
  USERNAME_TOO_LONG: { step: "username", field: "username" },
  USERNAME_TOO_SHORT: { step: "username", field: "username" },
  INVALID_EMAIL: { step: "email", field: "email" },
  USER_ALREADY_EXISTS: { step: "email", field: "email" },
  USER_ALREADY_EXISTS_USE_ANOTHER_EMAIL: { step: "email", field: "email" },
  PASSWORD_COMPROMISED: { step: "password", field: "password" },
  PASSWORD_TOO_LONG: { step: "password", field: "password" },
  PASSWORD_TOO_SHORT: { step: "password", field: "password" },
};

const EMPTY_VALUES = { name: "", username: "", email: "", password: "", confirmPassword: "" };
type Values = typeof EMPTY_VALUES;

export default function SignUpForm() {
  const router = useRouter();
  const haptic = useHaptic();
  const [step, setStep] = useState<Step>("username");
  const [values, setValues] = useState(EMPTY_VALUES);
  const [attempted, setAttempted] = useState(false);
  const [rejected, setRejected] = useState<{ field: string; message: string } | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const stepIndex = STEPS.indexOf(step);
  const validation = STEP_SCHEMAS[step].safeParse(values);
  const errors: Record<string, string> = {
    ...(attempted && !validation.success ? fieldErrors(validation.error) : {}),
    ...(rejected ? { [rejected.field]: rejected.message } : {}),
  };

  function update(field: keyof Values, value: string) {
    setValues((current) => ({ ...current, [field]: value }));
    if (rejected?.field === field) setRejected(null);
  }

  function goTo(next: Step) {
    setAttempted(false);
    setRejected(null);
    setStep(next);
  }

  async function createAccount() {
    setIsSubmitting(true);
    try {
      const email = values.email.trim();
      const { error } = await authClient.signUp.email({
        name: values.name.trim(),
        email,
        password: values.password,
        username: values.username.trim(),
      });

      if (!error) {
        haptic.trigger("success");
        toast.success("Cuenta creada. Verificá tu email");
        router.push(`/verify-email?email=${encodeURIComponent(email)}` as Route);
        return;
      }

      haptic.trigger("error");
      const message = authErrorMessage(error, "No pudimos crear la cuenta");
      const target = error.code ? REJECTED_FIELDS[error.code] : undefined;
      if (target) {
        goTo(target.step);
        setRejected({ field: target.field, message });
      } else {
        toast.error(message);
      }
    } catch {
      toast.error("No pudimos conectarnos. Probá de nuevo");
    } finally {
      setIsSubmitting(false);
    }
  }

  function submit() {
    setAttempted(true);
    if (!validation.success || rejected) return;

    const next = STEPS[stepIndex + 1];
    if (next) goTo(next);
    else void createAccount();
  }

  const previous = STEPS[stepIndex - 1];

  return (
    <AuthColumn
      title={STEP_COPY[step].title}
      description={STEP_COPY[step].description}
      footer={
        <>
          ¿Ya tenés cuenta?{" "}
          <Link href="/login" className={TEXT_LINK}>
            Ingresá
          </Link>
        </>
      }
    >
      <StepBar step={stepIndex + 1} total={STEPS.length} />

      <form
        noValidate
        className="space-y-4"
        onSubmit={(event) => {
          event.preventDefault();
          submit();
        }}
      >
        {step === "username" && (
          <>
            <Field
              id="name"
              label="Nombre"
              autoComplete="name"
              value={values.name}
              onChange={(event) => update("name", event.target.value)}
              error={errors.name}
            />
            <Field
              id="username"
              label="Nombre de usuario"
              prefix="@"
              autoComplete="username"
              placeholder="tu_usuario"
              value={values.username}
              onChange={(event) => update("username", event.target.value.replace(/[^a-zA-Z0-9_]/g, ""))}
              error={errors.username}
            />
          </>
        )}

        {step === "email" && (
          <Field
            id="email"
            label="Email"
            type="email"
            autoComplete="email"
            placeholder="tu@email.com"
            value={values.email}
            onChange={(event) => update("email", event.target.value)}
            error={errors.email}
            autoFocus
          />
        )}

        {step === "password" && (
          <>
            <div className="space-y-2">
              <PasswordField
                id="password"
                label="Contraseña"
                autoComplete="new-password"
                value={values.password}
                onChange={(event) => update("password", event.target.value)}
                error={errors.password}
                disabled={isSubmitting}
                autoFocus
              />
              <PasswordStrengthBar password={values.password} />
            </div>
            <PasswordField
              id="confirmPassword"
              label="Confirmar contraseña"
              autoComplete="new-password"
              value={values.confirmPassword}
              onChange={(event) => update("confirmPassword", event.target.value)}
              error={errors.confirmPassword}
              disabled={isSubmitting}
            />
          </>
        )}

        <div className="flex gap-2">
          {previous && (
            <Button
              type="button"
              variant="outline"
              aria-label="Volver al paso anterior"
              onClick={() => goTo(previous)}
              disabled={isSubmitting}
              className="size-11 md:size-9"
            >
              <ArrowLeft aria-hidden="true" />
            </Button>
          )}
          <Button type="submit" disabled={isSubmitting} className="h-11 flex-1 text-base md:h-9 md:text-sm">
            {isSubmitting && <Loader2 aria-hidden="true" className="size-4 motion-safe:animate-spin" />}
            {step === "password" ? (isSubmitting ? "Creando cuenta" : "Crear cuenta") : "Siguiente"}
            {step !== "password" && <ArrowRight aria-hidden="true" />}
          </Button>
        </div>
      </form>
    </AuthColumn>
  );
}
