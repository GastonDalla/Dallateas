"use client";

import { Button } from "@dallateas/ui/components/button";
import { Input } from "@dallateas/ui/components/input";
import { Label } from "@dallateas/ui/components/label";
import { ArrowLeft, ArrowRight, Eye, EyeOff, Loader2, User, Mail, Lock } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import { z } from "zod";

import { useHaptic } from "@/hooks/use-haptic";
import { authClient } from "@/lib/auth-client";
import PasswordStrengthBar from "@/components/password-strength-bar";

const usernameSchema = z.object({
  name: z.string().min(2, "Minimo 2 caracteres").max(100, "Maximo 100 caracteres"),
  username: z
    .string()
    .min(3, "Minimo 3 caracteres")
    .max(30, "Maximo 30 caracteres")
    .regex(/^[a-zA-Z0-9_]+$/, "Solo letras, numeros y guiones bajos"),
});

const emailSchema = z.object({
  email: z.string().min(1, "El email es requerido").email("Email invalido"),
});

const passwordSchema = z
  .object({
    password: z
      .string()
      .min(8, "Minimo 8 caracteres")
      .max(128, "Maximo 128 caracteres"),
    confirmPassword: z.string().min(1, "Confirma tu contrasena"),
  })
  .refine((d) => d.password === d.confirmPassword, {
    message: "Las contrasenas no coinciden",
    path: ["confirmPassword"],
  });

type Step = "username" | "email" | "password";
const STEPS: Step[] = ["username", "email", "password"];

export default function SignUpForm() {
  const router = useRouter();
  const haptic = useHaptic();
  const [step, setStep] = useState<Step>("username");
  const [name, setName] = useState("");
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const stepIndex = STEPS.indexOf(step);

  function validateStep(): boolean {
    let result;
    if (step === "username") {
      result = usernameSchema.safeParse({ name, username });
    } else if (step === "email") {
      result = emailSchema.safeParse({ email });
    } else {
      result = passwordSchema.safeParse({ password, confirmPassword });
    }

    if (result.success) {
      setErrors({});
      return true;
    }

    const next: Record<string, string> = {};
    for (const issue of result.error.issues) {
      const key = String(issue.path[0]);
      if (!next[key]) next[key] = issue.message;
    }
    setErrors(next);
    return false;
  }

  function handleNext() {
    if (!validateStep()) return;
    if (step === "username") setStep("email");
    else if (step === "email") setStep("password");
  }

  function handleBack() {
    setErrors({});
    if (step === "email") setStep("username");
    else if (step === "password") setStep("email");
  }

  async function handleSubmit() {
    if (!validateStep()) return;

    setIsSubmitting(true);
    try {
      await authClient.signUp.email(
        {
          name: name.trim(),
          email: email.trim(),
          password,
          username: username.trim(),
        },
        {
          onSuccess: () => {
            haptic.trigger("success");
            router.push(`/verify-email?email=${encodeURIComponent(email.trim())}`);
            toast.success("Cuenta creada. Verifica tu email.");
          },
          onError: (error) => {
            haptic.trigger("error");
            toast.error(error.error.message || "Error al crear la cuenta");
          },
        },
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  const titles: Record<Step, string> = {
    username: "Como te llamas?",
    email: "Tu email",
    password: "Crea tu contrasena",
  };

  const descriptions: Record<Step, string> = {
    username: "Elegí tu nombre y un nombre de usuario unico.",
    email: "Lo usamos para verificar tu cuenta.",
    password: "Minimo 8 caracteres. Cuanto mas variada, mejor.",
  };

  const icons: Record<Step, React.ReactNode> = {
    username: <User className="h-8 w-8 text-primary" />,
    email: <Mail className="h-8 w-8 text-primary" />,
    password: <Lock className="h-8 w-8 text-primary" />,
  };

  const inputError = "border-red-500 focus-visible:ring-red-500";

  return (
    <div className="mx-auto mt-10 w-full max-w-md p-6">
      <div className="mb-6 flex justify-center">
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
          {icons[step]}
        </div>
      </div>

      <h1 className="font-heading mb-2 text-center text-2xl font-bold">{titles[step]}</h1>
      <p className="mb-8 text-center text-sm text-muted-foreground">{descriptions[step]}</p>

      {/* Step indicator */}
      <div className="mb-6 flex items-center justify-center gap-2">
        {STEPS.map((_, i) => (
          <div
            key={i}
            className={`h-1.5 w-8 rounded-full transition-colors ${
              stepIndex >= i ? "bg-primary" : "bg-muted"
            }`}
          />
        ))}
      </div>

      {step === "username" && (
        <div className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="name">Nombre</Label>
            <Input
              id="name"
              autoComplete="name"
              placeholder="Tu nombre"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className={errors.name ? inputError : ""}
              disabled={isSubmitting}
              onKeyDown={(e) => { if (e.key === "Enter") handleNext(); }}
            />
            {errors.name && <p className="text-xs text-red-500">{errors.name}</p>}
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="username">Nombre de usuario</Label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">@</span>
              <Input
                id="username"
                autoComplete="username"
                placeholder="tu_usuario"
                value={username}
                onChange={(e) => setUsername(e.target.value.replace(/[^a-zA-Z0-9_]/g, ""))}
                className={`pl-7 ${errors.username ? inputError : ""}`}
                disabled={isSubmitting}
                onKeyDown={(e) => { if (e.key === "Enter") handleNext(); }}
              />
            </div>
            {errors.username && <p className="text-xs text-red-500">{errors.username}</p>}
          </div>
          <Button type="button" className="w-full" onClick={handleNext}>
            Siguiente <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </div>
      )}

      {step === "email" && (
        <div className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              autoComplete="email"
              placeholder="tu@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className={errors.email ? inputError : ""}
              disabled={isSubmitting}
              onKeyDown={(e) => { if (e.key === "Enter") handleNext(); }}
            />
            {errors.email && <p className="text-xs text-red-500">{errors.email}</p>}
          </div>
          <div className="flex gap-2">
            <Button type="button" variant="outline" onClick={handleBack} className="shrink-0">
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <Button type="button" className="flex-1" onClick={handleNext}>
              Siguiente <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </div>
        </div>
      )}

      {step === "password" && (
        <div className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="password">Contrasena</Label>
            <div className="relative">
              <Input
                id="password"
                type={showPassword ? "text" : "password"}
                autoComplete="new-password"
                placeholder="Minimo 8 caracteres"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className={`pr-10 ${errors.password ? inputError : ""}`}
                disabled={isSubmitting}
              />
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
            {errors.password && <p className="text-xs text-red-500">{errors.password}</p>}
            <PasswordStrengthBar password={password} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="confirmPassword">Confirmar contrasena</Label>
            <Input
              id="confirmPassword"
              type={showPassword ? "text" : "password"}
              autoComplete="new-password"
              placeholder="Repeti tu contrasena"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className={errors.confirmPassword ? inputError : ""}
              disabled={isSubmitting}
              onKeyDown={(e) => { if (e.key === "Enter") handleSubmit(); }}
            />
            {errors.confirmPassword && <p className="text-xs text-red-500">{errors.confirmPassword}</p>}
          </div>
          <div className="flex gap-2">
            <Button type="button" variant="outline" onClick={handleBack} className="shrink-0">
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <Button type="button" className="flex-1" disabled={isSubmitting} onClick={handleSubmit}>
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Creando cuenta...
                </>
              ) : (
                "Crear cuenta"
              )}
            </Button>
          </div>
        </div>
      )}

      <p className="mt-6 text-center text-sm text-muted-foreground">
        Ya tenes cuenta?{" "}
        <Link
          href="/login"
          className="font-medium text-foreground underline-offset-4 hover:underline"
        >
          Ingresa
        </Link>
      </p>
    </div>
  );
}
