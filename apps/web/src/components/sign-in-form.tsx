"use client";

import { Button } from "@dallateas/ui/components/button";
import { cn } from "@dallateas/ui/lib/utils";
import { Loader2 } from "lucide-react";
import type { Route } from "next";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import { z } from "zod";

import { AuthColumn } from "@/components/profile/auth-column";
import { CodeField, Field, PRIMARY_ACTION, TEXT_LINK } from "@/components/profile/fields";
import { authErrorMessage } from "@/components/profile/form-errors";
import { PasswordField } from "@/components/profile/password-field";
import { useHaptic } from "@/hooks/use-haptic";
import { authClient } from "@/lib/auth-client";

export type SignInMode = "password" | "code" | "magic";

const MODES: { value: SignInMode; label: string }[] = [
  { value: "password", label: "Contraseña" },
  { value: "code", label: "Código" },
  { value: "magic", label: "Link por email" },
];

const SUBMIT_LABELS = {
  password: { idle: "Ingresar", busy: "Ingresando" },
  sendCode: { idle: "Enviar código", busy: "Enviando" },
  code: { idle: "Ingresar", busy: "Ingresando" },
  magic: { idle: "Enviar link", busy: "Enviando" },
};

const emailSchema = z.string().trim().min(1, "Ingresá tu email").email("Email inválido");
const passwordSchema = z.string().min(8, "Mínimo 8 caracteres");

function firstIssue(schema: z.ZodType, value: string) {
  return schema.safeParse(value).error?.issues[0]?.message;
}

type SignInFormProps = {
  initialMode?: SignInMode;
  initialEmail?: string;
  /** Set when an emailed link brought the visitor back here because it no longer works. */
  linkFailed?: boolean;
};

export default function SignInForm({ initialMode = "password", initialEmail = "", linkFailed = false }: SignInFormProps) {
  const router = useRouter();
  const haptic = useHaptic();
  const [mode, setMode] = useState(initialMode);
  const [email, setEmail] = useState(initialEmail);
  const [password, setPassword] = useState("");
  const [code, setCode] = useState("");
  const [codeSent, setCodeSent] = useState(false);
  const [magicSent, setMagicSent] = useState(false);
  const [touched, setTouched] = useState({ email: false, password: false });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const address = email.trim();
  const emailError = touched.email ? firstIssue(emailSchema, email) : undefined;
  const passwordError = touched.password ? firstIssue(passwordSchema, password) : undefined;

  function enterApp() {
    haptic.trigger("success");
    toast.success("Sesión iniciada");
    router.push("/dashboard");
    // The shell lives in the root layout, which a client navigation does not render again.
    router.refresh();
  }

  async function goToVerification() {
    // Signing in does not send a code, and the one from the sign-up may have expired.
    await authClient.emailOtp.sendVerificationOtp({ email: address, type: "email-verification" });
    toast.info("Te mandamos un código para verificar tu email");
    router.push(`/verify-email?email=${encodeURIComponent(address)}` as Route);
  }

  async function signInWithPassword() {
    const { data, error } = await authClient.signIn.email({ email: address, password });
    if (error?.code === "EMAIL_NOT_VERIFIED" || (data && !data.user.emailVerified)) {
      await goToVerification();
    } else if (error) {
      haptic.trigger("error");
      toast.error(authErrorMessage(error, "No pudimos iniciar sesión"));
    } else {
      enterApp();
    }
  }

  async function sendCode() {
    const { error } = await authClient.emailOtp.sendVerificationOtp({ email: address, type: "sign-in" });
    if (error) {
      toast.error(authErrorMessage(error, "No pudimos enviar el código"));
      return;
    }
    setCodeSent(true);
    toast.success("Código enviado a tu email");
  }

  async function signInWithCode() {
    const { error } = await authClient.signIn.emailOtp({ email: address, otp: code });
    if (error) {
      haptic.trigger("error");
      toast.error(authErrorMessage(error, "No pudimos iniciar sesión"));
    } else {
      enterApp();
    }
  }

  async function sendMagicLink() {
    const { error } = await authClient.signIn.magicLink({
      email: address,
      callbackURL: "/dashboard",
      errorCallbackURL: "/login?error=link",
    });
    if (error) {
      toast.error(authErrorMessage(error, "No pudimos enviar el link"));
      return;
    }
    setMagicSent(true);
  }

  async function run(action: () => Promise<void>) {
    setIsSubmitting(true);
    try {
      await action();
    } catch {
      toast.error("No pudimos conectarnos. Probá de nuevo");
    } finally {
      setIsSubmitting(false);
    }
  }

  function submit() {
    setTouched({ email: true, password: mode === "password" });
    if (firstIssue(emailSchema, email)) return;

    if (mode === "password") {
      if (!firstIssue(passwordSchema, password)) void run(signInWithPassword);
    } else if (mode === "magic") {
      void run(sendMagicLink);
    } else if (!codeSent) {
      void run(sendCode);
    } else if (code.length === 6) {
      void run(signInWithCode);
    }
  }

  if (magicSent) {
    return (
      <AuthColumn
        title="Revisá tu email"
        description={
          <>
            Mandamos un link de acceso a <span className="font-medium text-foreground">{address}</span>. Abrilo desde
            este dispositivo para ingresar
          </>
        }
      >
        <button type="button" onClick={() => setMagicSent(false)} className={cn(TEXT_LINK, "min-h-11 text-sm md:min-h-0")}>
          Usar otro método
        </button>
      </AuthColumn>
    );
  }

  const enteringCode = mode === "code" && codeSent;
  const labels = SUBMIT_LABELS[mode === "code" && !codeSent ? "sendCode" : mode];

  return (
    <AuthColumn
      title="Iniciar sesión"
      description="Ingresá a tu cuenta de Dallateas"
      footer={
        <>
          ¿No tenés cuenta?{" "}
          <Link href="/register" className={TEXT_LINK}>
            Registrate
          </Link>
        </>
      }
    >
      {linkFailed && (
        <p role="alert" className="mb-6 text-sm text-destructive">
          El link venció o ya se usó. Pedí uno nuevo
        </p>
      )}

      <div role="group" aria-label="Cómo ingresar" className="mb-6 flex gap-6 border-b border-border">
        {MODES.map(({ value, label }) => (
          <button
            key={value}
            type="button"
            aria-pressed={mode === value}
            onClick={() => setMode(value)}
            className={cn(
              "-mb-px h-11 border-b-2 text-sm transition-colors md:h-9",
              mode === value
                ? "border-primary font-medium text-foreground"
                : "border-transparent text-muted-foreground hover:text-foreground",
            )}
          >
            {label}
          </button>
        ))}
      </div>

      <form
        noValidate
        className="space-y-4"
        onSubmit={(event) => {
          event.preventDefault();
          submit();
        }}
      >
        <Field
          id="email"
          label="Email"
          type="email"
          autoComplete="email"
          placeholder="tu@email.com"
          value={email}
          onChange={(event) => {
            setEmail(event.target.value);
            setCodeSent(false);
          }}
          onBlur={() => setTouched((current) => ({ ...current, email: true }))}
          error={emailError}
          disabled={isSubmitting}
        />

        {mode === "password" && (
          <PasswordField
            id="password"
            label="Contraseña"
            autoComplete="current-password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            onBlur={() => setTouched((current) => ({ ...current, password: true }))}
            error={passwordError}
            disabled={isSubmitting}
            labelAction={
              <Link href="/forgot-password" className="text-[13px] text-muted-foreground hover:text-foreground hover:underline">
                ¿Olvidaste tu contraseña?
              </Link>
            }
          />
        )}

        {enteringCode && <CodeField value={code} onChange={setCode} disabled={isSubmitting} autoFocus />}

        <Button type="submit" className={PRIMARY_ACTION} disabled={isSubmitting || (enteringCode && code.length < 6)}>
          {isSubmitting && <Loader2 aria-hidden="true" className="size-4 motion-safe:animate-spin" />}
          {isSubmitting ? labels.busy : labels.idle}
        </Button>

        {enteringCode && (
          <button
            type="button"
            onClick={() => void run(sendCode)}
            disabled={isSubmitting}
            className="min-h-11 text-sm text-muted-foreground hover:text-foreground hover:underline md:min-h-0"
          >
            Reenviar código
          </button>
        )}
      </form>
    </AuthColumn>
  );
}
