"use client";

import { Button } from "@dallateas/ui/components/button";
import { Loader2 } from "lucide-react";
import type { Route } from "next";
import Link from "next/link";
import { useState } from "react";
import { toast } from "sonner";

import { AuthColumn } from "@/components/profile/auth-column";
import { CodeField, PRIMARY_ACTION, TEXT_LINK } from "@/components/profile/fields";
import { authErrorMessage } from "@/components/profile/form-errors";
import { useHaptic } from "@/hooks/use-haptic";
import { authClient } from "@/lib/auth-client";

function VerifiedNotice({ email }: { email: string }) {
  const address = encodeURIComponent(email);

  return (
    <AuthColumn title="Email verificado" description="Ya podés entrar a tu colección">
      <Button render={<Link href={`/login?email=${address}` as Route} />} nativeButton={false} className={PRIMARY_ACTION}>
        Ingresar
      </Button>
      <p className="mt-6 text-sm text-pretty text-muted-foreground">
        Si tu contraseña no funciona, podés{" "}
        <Link href={`/login?mode=code&email=${address}` as Route} className={TEXT_LINK}>
          entrar con un código
        </Link>{" "}
        o{" "}
        <Link href="/forgot-password" className={TEXT_LINK}>
          restablecerla
        </Link>
      </p>
    </AuthColumn>
  );
}

export default function VerifyEmailForm({ email }: { email: string }) {
  const haptic = useHaptic();
  const [code, setCode] = useState("");
  const [verified, setVerified] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [isResending, setIsResending] = useState(false);

  async function verify() {
    if (code.length < 6) return;
    setIsVerifying(true);
    try {
      const { error } = await authClient.emailOtp.verifyEmail({ email, otp: code });
      if (error) {
        haptic.trigger("error");
        toast.error(authErrorMessage(error, "Código incorrecto o vencido"));
        return;
      }
      haptic.trigger("success");
      setVerified(true);
    } catch {
      toast.error("No pudimos conectarnos. Probá de nuevo");
    } finally {
      setIsVerifying(false);
    }
  }

  async function resend() {
    setIsResending(true);
    try {
      const { error } = await authClient.emailOtp.sendVerificationOtp({ email, type: "email-verification" });
      if (error) toast.error(authErrorMessage(error, "No pudimos reenviar el código"));
      else toast.success("Código reenviado");
    } catch {
      toast.error("No pudimos conectarnos. Probá de nuevo");
    } finally {
      setIsResending(false);
    }
  }

  if (verified) return <VerifiedNotice email={email} />;

  return (
    <AuthColumn
      title="Verificá tu email"
      description={
        <>
          Mandamos un código de 6 dígitos a <span className="font-medium text-foreground">{email}</span>
        </>
      }
    >
      <form
        noValidate
        className="space-y-4"
        onSubmit={(event) => {
          event.preventDefault();
          void verify();
        }}
      >
        <CodeField value={code} onChange={setCode} disabled={isVerifying} />

        <Button type="submit" className={PRIMARY_ACTION} disabled={isVerifying || code.length < 6}>
          {isVerifying && <Loader2 aria-hidden="true" className="size-4 motion-safe:animate-spin" />}
          {isVerifying ? "Verificando" : "Verificar"}
        </Button>

        <button
          type="button"
          onClick={() => void resend()}
          disabled={isResending}
          className="min-h-11 text-sm text-muted-foreground hover:text-foreground hover:underline md:min-h-0"
        >
          {isResending ? "Reenviando" : "¿No te llegó? Reenviar código"}
        </button>
      </form>
    </AuthColumn>
  );
}
