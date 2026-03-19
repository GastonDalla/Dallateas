"use client";

import { Button } from "@dallateas/ui/components/button";
import { Input } from "@dallateas/ui/components/input";
import { Label } from "@dallateas/ui/components/label";
import { CheckCircle, Eye, EyeOff, KeyRound, Loader2 } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import { z } from "zod";

import { useHaptic } from "@/hooks/use-haptic";
import { authClient } from "@/lib/auth-client";
import PasswordStrengthBar from "@/components/password-strength-bar";

const passwordSchema = z
  .object({
    newPassword: z.string().min(8, "Minimo 8 caracteres"),
    confirmPassword: z.string().min(8, "Minimo 8 caracteres"),
  })
  .refine((d) => d.newPassword === d.confirmPassword, {
    message: "Las contrasenas no coinciden",
    path: ["confirmPassword"],
  });

export default function ForgotPasswordPage() {
  const router = useRouter();
  const haptic = useHaptic();
  const [step, setStep] = useState<"email" | "otp" | "password">("email");
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  async function handleSendOtp() {
    if (!email.trim()) { toast.error("Ingresa tu email"); return; }
    setIsLoading(true);
    try {
      await authClient.emailOtp.sendVerificationOtp({
        email: email.trim(),
        type: "forget-password",
      });
      toast.success("Codigo enviado a tu email");
      setStep("otp");
    } catch {
      toast.error("Error al enviar el codigo");
    } finally {
      setIsLoading(false);
    }
  }

  async function handleVerifyOtp() {
    if (otp.length < 6) { toast.error("Ingresa el codigo de 6 digitos"); return; }
    setIsLoading(true);
    try {
      const res = await authClient.emailOtp.checkVerificationOtp({
        email: email.trim(),
        otp,
        type: "forget-password",
      });
      if (res.error) {
        toast.error(res.error.message || "Codigo invalido o expirado");
      } else {
        haptic.trigger("success");
        toast.success("Codigo verificado");
        setStep("password");
      }
    } catch {
      toast.error("Error al verificar el codigo");
    } finally {
      setIsLoading(false);
    }
  }

  async function handleResetPassword() {
    const result = passwordSchema.safeParse({ newPassword, confirmPassword });
    if (!result.success) {
      const errs: Record<string, string> = {};
      for (const issue of result.error.issues) {
        const key = String(issue.path[0]);
        if (!errs[key]) errs[key] = issue.message;
      }
      setErrors(errs);
      return;
    }
    setErrors({});
    setIsLoading(true);
    try {
      const res = await authClient.emailOtp.resetPassword({
        email: email.trim(),
        otp,
        password: newPassword,
      });
      if (res.error) {
        toast.error(res.error.message || "Error al restablecer");
      } else {
        haptic.trigger("success");
        toast.success("Contrasena actualizada. Inicia sesion.");
        router.push("/login");
      }
    } catch {
      toast.error("Error al restablecer la contrasena");
    } finally {
      setIsLoading(false);
    }
  }

  const inputError = "border-red-500 focus-visible:ring-red-500";
  const titles = { email: "Recuperar contrasena", otp: "Verificar codigo", password: "Nueva contrasena" };
  const descs = {
    email: "Ingresa tu email y te enviamos un codigo.",
    otp: `Ingresa el codigo de 6 digitos que enviamos a ${email}`,
    password: "Ahora podes crear tu nueva contrasena.",
  };

  return (
    <div className="mx-auto mt-16 w-full max-w-md px-6">
      <div className="mb-6 flex justify-center">
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
          {step === "password" ? <CheckCircle className="h-8 w-8 text-primary" /> : <KeyRound className="h-8 w-8 text-primary" />}
        </div>
      </div>

      <h1 className="font-heading mb-2 text-center text-2xl font-bold">{titles[step]}</h1>
      <p className="mb-8 text-center text-sm text-muted-foreground">{descs[step]}</p>

      {/* Step indicator */}
      <div className="mb-6 flex items-center justify-center gap-2">
        {["email", "otp", "password"].map((s, i) => (
          <div key={s} className={`h-1.5 w-8 rounded-full transition-colors ${
            ["email", "otp", "password"].indexOf(step) >= i ? "bg-primary" : "bg-muted"
          }`} />
        ))}
      </div>

      {step === "email" && (
        <div className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email" type="email" autoComplete="email" placeholder="tu@email.com"
              value={email} onChange={(e) => setEmail(e.target.value)} disabled={isLoading}
              onKeyDown={(e) => { if (e.key === "Enter") handleSendOtp(); }}
            />
          </div>
          <Button type="button" className="w-full" disabled={isLoading || !email.trim()} onClick={handleSendOtp}>
            {isLoading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Enviando...</> : "Enviar codigo"}
          </Button>
        </div>
      )}

      {step === "otp" && (
        <div className="space-y-4">
          <Input
            type="text" inputMode="numeric" maxLength={6} placeholder="000000"
            value={otp} onChange={(e) => setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))}
            className="h-14 text-center text-2xl font-bold tracking-[0.5em]" disabled={isLoading}
            onKeyDown={(e) => { if (e.key === "Enter") handleVerifyOtp(); }}
          />
          <Button type="button" className="w-full" disabled={isLoading || otp.length < 6} onClick={handleVerifyOtp}>
            {isLoading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Verificando...</> : "Verificar codigo"}
          </Button>
          <button type="button" onClick={handleSendOtp} disabled={isLoading} className="w-full text-center text-xs text-muted-foreground hover:underline">
            Reenviar codigo
          </button>
        </div>
      )}

      {step === "password" && (
        <div className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="new-pass">Nueva contrasena</Label>
            <div className="relative">
              <Input id="new-pass" type={showPassword ? "text" : "password"} autoComplete="new-password" placeholder="Minimo 8 caracteres"
                value={newPassword} onChange={(e) => setNewPassword(e.target.value)}
                className={`pr-10 ${errors.newPassword ? inputError : ""}`} disabled={isLoading} />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                aria-label={showPassword ? "Ocultar contrasena" : "Mostrar contrasena"}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                tabIndex={-1}
              >
                {showPassword ? <EyeOff className="h-4 w-4" aria-hidden="true" /> : <Eye className="h-4 w-4" aria-hidden="true" />}
              </button>
            </div>
            {errors.newPassword && <p className="text-xs text-red-500">{errors.newPassword}</p>}
            <PasswordStrengthBar password={newPassword} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="confirm-pass">Confirmar contrasena</Label>
            <Input id="confirm-pass" type={showPassword ? "text" : "password"} autoComplete="new-password"
              value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)}
              className={errors.confirmPassword ? inputError : ""} disabled={isLoading} />
            {errors.confirmPassword && <p className="text-xs text-red-500">{errors.confirmPassword}</p>}
          </div>
          <Button type="button" className="w-full" disabled={isLoading} onClick={handleResetPassword}>
            {isLoading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Restableciendo...</> : "Restablecer contrasena"}
          </Button>
        </div>
      )}

      <p className="mt-6 text-center text-sm text-muted-foreground">
        <Link href="/login" className="font-medium text-foreground underline-offset-4 hover:underline">Volver al login</Link>
      </p>
    </div>
  );
}
