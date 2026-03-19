"use client";

import { Button } from "@dallateas/ui/components/button";
import { Input } from "@dallateas/ui/components/input";
import { Label } from "@dallateas/ui/components/label";
import { Eye, EyeOff, Loader2, Mail, Wand2 } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import { z } from "zod";

import { useHaptic } from "@/hooks/use-haptic";
import { authClient } from "@/lib/auth-client";

const schema = z.object({
  email: z.string().min(1, "El email es requerido").email("Email invalido"),
  password: z.string().min(8, "Minimo 8 caracteres"),
});

type Fields = z.infer<typeof schema>;
type FieldErrors = Partial<Record<keyof Fields, string>>;

export default function SignInForm() {
  const router = useRouter();
  const haptic = useHaptic();
  const [mode, setMode] = useState<"password" | "magic">("password");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState<FieldErrors>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [magicSent, setMagicSent] = useState(false);

  function validate(overrides?: Partial<Fields>): boolean {
    const data = { email, password, ...overrides };
    const result = schema.safeParse(data);
    if (result.success) {
      setErrors({});
      return true;
    }
    const next: FieldErrors = {};
    for (const issue of result.error.issues) {
      const key = issue.path[0] as keyof FieldErrors;
      if (!next[key]) next[key] = issue.message;
    }
    setErrors(next);
    return false;
  }

  function handleBlur(field: keyof Fields) {
    setTouched((prev) => ({ ...prev, [field]: true }));
    validate();
  }

  async function handlePasswordLogin() {
    setTouched({ email: true, password: true });
    if (!validate()) return;

    setIsSubmitting(true);
    try {
      await authClient.signIn.email(
        { email: email.trim(), password },
        {
          onSuccess: (ctx) => {
            haptic.trigger("success");
            if (!ctx.data.user.emailVerified) {
              router.push(`/verify-email?email=${encodeURIComponent(email.trim())}&from=login`);
              toast.info("Verifica tu email para continuar");
            } else {
              router.push("/dashboard");
              toast.success("Sesion iniciada");
            }
          },
          onError: (error) => {
            haptic.trigger("error");
            const msg = error.error.message?.toLowerCase() ?? "";
            if (msg.includes("email") && (msg.includes("verif") || msg.includes("not verified"))) {
              router.push(`/verify-email?email=${encodeURIComponent(email.trim())}&from=login`);
              toast.info("Verifica tu email para continuar");
            } else {
              toast.error(error.error.message || "Credenciales incorrectas");
            }
          },
        },
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleMagicLink() {
    if (!email.trim() || !z.string().email().safeParse(email).success) {
      setTouched({ email: true });
      setErrors({ email: "Email invalido" });
      return;
    }
    setIsSubmitting(true);
    try {
      const res = await authClient.signIn.magicLink({ email: email.trim() });
      if (res.error) {
        toast.error(res.error.message || "Error al enviar magic link");
      } else {
        setMagicSent(true);
        toast.success("Link enviado a tu email");
      }
    } catch {
      toast.error("Error al enviar magic link");
    } finally {
      setIsSubmitting(false);
    }
  }

  const emailErr = touched.email ? errors.email : undefined;
  const passErr = touched.password ? errors.password : undefined;
  const inputError = "border-red-500 focus-visible:ring-red-500";

  if (magicSent) {
    return (
      <div className="mx-auto mt-16 w-full max-w-md px-6 text-center">
        <div className="mb-6 flex justify-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
            <Mail className="h-8 w-8 text-primary" />
          </div>
        </div>
        <h1 className="font-heading mb-2 text-2xl font-bold">Revisa tu email</h1>
        <p className="text-sm text-muted-foreground">
          Enviamos un link de acceso a{" "}
          <span className="font-medium text-foreground">{email}</span>.
          Hace click en el link para ingresar.
        </p>
        <button
          type="button"
          onClick={() => setMagicSent(false)}
          className="mt-6 text-sm text-muted-foreground hover:text-foreground hover:underline"
        >
          Usar otro metodo
        </button>
      </div>
    );
  }

  return (
    <div className="mx-auto mt-10 w-full max-w-md p-6">
      <h1 className="font-heading mb-2 text-center text-2xl font-bold">Iniciar sesion</h1>
      <p className="mb-6 text-center text-sm text-muted-foreground">
        Ingresa a tu cuenta de Dallateas
      </p>

      {/* Mode toggle */}
      <div className="mb-6 flex gap-1 rounded-md bg-muted p-1">
        <button
          type="button"
          onClick={() => setMode("password")}
          className={`flex flex-1 items-center justify-center gap-1.5 rounded px-3 py-1.5 text-xs font-medium transition-colors ${mode === "password" ? "bg-card text-foreground shadow-sm" : "text-muted-foreground"}`}
        >
          Contrasena
        </button>
        <button
          type="button"
          onClick={() => setMode("magic")}
          className={`flex flex-1 items-center justify-center gap-1.5 rounded px-3 py-1.5 text-xs font-medium transition-colors ${mode === "magic" ? "bg-card text-foreground shadow-sm" : "text-muted-foreground"}`}
        >
          <Wand2 className="h-3 w-3" /> Magic Link
        </button>
      </div>

      <div className="space-y-4">
        <div className="space-y-1.5">
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            type="email"
            autoComplete="email"
            placeholder="tu@email.com"
            value={email}
            onChange={(e) => {
              setEmail(e.target.value);
              if (touched.email) validate({ email: e.target.value });
            }}
            onBlur={() => handleBlur("email")}
            className={emailErr ? inputError : ""}
            disabled={isSubmitting}
          />
          {emailErr && <p className="text-xs text-red-500">{emailErr}</p>}
        </div>

        {mode === "password" && (
          <>
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <Label htmlFor="password">Contrasena</Label>
                <Link
                  href="/forgot-password"
                  className="text-xs text-muted-foreground hover:text-foreground hover:underline"
                >
                  Olvidaste tu contrasena?
                </Link>
              </div>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  autoComplete="current-password"
                  placeholder="Minimo 8 caracteres"
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    if (touched.password) validate({ password: e.target.value });
                  }}
                  onBlur={() => handleBlur("password")}
                  className={`pr-10 ${passErr ? inputError : ""}`}
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
              {passErr && <p className="text-xs text-red-500">{passErr}</p>}
            </div>

            <Button type="button" className="w-full" disabled={isSubmitting} onClick={handlePasswordLogin}>
              {isSubmitting ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Ingresando...</> : "Ingresar"}
            </Button>
          </>
        )}

        {mode === "magic" && (
          <Button type="button" className="w-full" disabled={isSubmitting} onClick={handleMagicLink}>
            {isSubmitting ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Enviando...</> : "Enviar magic link"}
          </Button>
        )}
      </div>

      <p className="mt-6 text-center text-sm text-muted-foreground">
        No tenes cuenta?{" "}
        <Link href="/register" className="font-medium text-foreground underline-offset-4 hover:underline">
          Registrate
        </Link>
      </p>
    </div>
  );
}
