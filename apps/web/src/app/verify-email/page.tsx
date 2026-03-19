"use client";

import { Button } from "@dallateas/ui/components/button";
import { Input } from "@dallateas/ui/components/input";
import { Loader2, Mail } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";

import { authClient } from "@/lib/auth-client";

export default function VerifyEmailPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const emailParam = searchParams.get("email") ?? "";
  const fromLogin = searchParams.get("from") === "login";
  const sentRef = useRef(false);

  const [otp, setOtp] = useState("");
  const [isVerifying, setIsVerifying] = useState(false);
  const [isResending, setIsResending] = useState(false);

  useEffect(() => {
    if (fromLogin && emailParam && !sentRef.current) {
      sentRef.current = true;
      authClient.emailOtp
        .sendVerificationOtp({ email: emailParam, type: "email-verification" })
        .then(() => toast.info("Codigo enviado a tu email"))
        .catch(() => {});
    }
  }, [fromLogin, emailParam]);

  async function handleVerify() {
    if (otp.length < 6) {
      toast.error("Ingresa el codigo de 6 digitos");
      return;
    }
    setIsVerifying(true);
    try {
      const res = await authClient.emailOtp.verifyEmail({
        email: emailParam,
        otp,
      });
      if (res.error) {
        toast.error(res.error.message || "Codigo invalido");
      } else {
        toast.success("Email verificado");
        router.push("/dashboard");
      }
    } catch {
      toast.error("Error al verificar");
    } finally {
      setIsVerifying(false);
    }
  }

  async function handleResend() {
    if (!emailParam) {
      toast.error("Email no disponible");
      return;
    }
    setIsResending(true);
    try {
      await authClient.emailOtp.sendVerificationOtp({
        email: emailParam,
        type: "email-verification",
      });
      toast.success("Codigo reenviado");
    } catch {
      toast.error("Error al reenviar");
    } finally {
      setIsResending(false);
    }
  }

  return (
    <div className="mx-auto mt-16 w-full max-w-md px-6 text-center">
      <div className="mb-6 flex justify-center">
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
          <Mail className="h-8 w-8 text-primary" />
        </div>
      </div>

      <h1 className="font-heading mb-2 text-2xl font-bold">Verifica tu email</h1>
      <p className="mb-8 text-sm text-muted-foreground">
        Enviamos un codigo de 6 digitos a{" "}
        <span className="font-medium text-foreground">{emailParam || "tu email"}</span>
      </p>

      <div className="space-y-4">
        <Input
          type="text"
          inputMode="numeric"
          maxLength={6}
          placeholder="000000"
          value={otp}
          onChange={(e) => setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))}
          className="h-14 text-center text-2xl font-bold tracking-[0.5em]"
          disabled={isVerifying}
          onKeyDown={(e) => {
            if (e.key === "Enter") handleVerify();
          }}
        />

        <Button
          type="button"
          className="w-full"
          disabled={isVerifying || otp.length < 6}
          onClick={handleVerify}
        >
          {isVerifying ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Verificando...
            </>
          ) : (
            "Verificar"
          )}
        </Button>

        <button
          type="button"
          onClick={handleResend}
          disabled={isResending}
          className="text-sm text-muted-foreground hover:text-foreground hover:underline"
        >
          {isResending ? "Reenviando..." : "No recibiste el codigo? Reenviar"}
        </button>
      </div>
    </div>
  );
}
