"use client";

import { Button } from "@dallateas/ui/components/button";
import { Input } from "@dallateas/ui/components/input";
import { Label } from "@dallateas/ui/components/label";
import {
  Disc3,
  Eye,
  EyeOff,
  Folder,
  Loader2,
  Music,
  Settings,
  Shield,
  User,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import { z } from "zod";

import { useHaptic } from "@/hooks/use-haptic";
import { authClient } from "@/lib/auth-client";
import { useQuery } from "@tanstack/react-query";
import { trpc } from "@/utils/trpc";

const nameSchema = z.object({
  name: z.string().min(2, "Minimo 2 caracteres").max(100),
});

const passwordSchema = z
  .object({
    currentPassword: z.string().min(8, "Minimo 8 caracteres"),
    newPassword: z.string().min(8, "Minimo 8 caracteres").max(128),
    confirmPassword: z.string().min(8, "Minimo 8 caracteres"),
  })
  .refine((d) => d.newPassword === d.confirmPassword, {
    message: "Las contrasenas no coinciden",
    path: ["confirmPassword"],
  });

export default function SettingsPage() {
  const router = useRouter();
  const haptic = useHaptic();
  const { data: session, refetch } = authClient.useSession();

  const vinylsQuery = useQuery(trpc.vinylsList.queryOptions({}));
  const foldersQuery = useQuery(trpc.foldersList.queryOptions());

  const [editingName, setEditingName] = useState(false);
  const [name, setName] = useState("");
  const [nameError, setNameError] = useState("");
  const [savingName, setSavingName] = useState(false);

  const [showPassword, setShowPassword] = useState(false);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showCurrentPass, setShowCurrentPass] = useState(false);
  const [showNewPass, setShowNewPass] = useState(false);
  const [passErrors, setPassErrors] = useState<Record<string, string>>({});
  const [savingPassword, setSavingPassword] = useState(false);

  async function handleSaveName() {
    const result = nameSchema.safeParse({ name });
    if (!result.success) { setNameError(result.error.issues[0]?.message ?? "Error"); return; }
    setSavingName(true);
    try {
      await authClient.updateUser({ name: name.trim() });
      await refetch();
      haptic.trigger("success");
      setEditingName(false);
      toast.success("Nombre actualizado");
    } catch { toast.error("Error al actualizar nombre"); }
    finally { setSavingName(false); }
  }

  async function handleChangePassword() {
    const result = passwordSchema.safeParse({ currentPassword, newPassword, confirmPassword });
    if (!result.success) {
      const errs: Record<string, string> = {};
      for (const issue of result.error.issues) { const key = String(issue.path[0]); if (!errs[key]) errs[key] = issue.message; }
      setPassErrors(errs);
      return;
    }
    setPassErrors({});
    setSavingPassword(true);
    try {
      const res = await authClient.changePassword({ currentPassword, newPassword, revokeOtherSessions: true });
      if (res.error) { haptic.trigger("error"); toast.error(res.error.message || "Error"); }
      else { haptic.trigger("success"); toast.success("Contrasena actualizada"); setShowPassword(false); setCurrentPassword(""); setNewPassword(""); setConfirmPassword(""); }
    } catch { toast.error("Error al cambiar contrasena"); }
    finally { setSavingPassword(false); }
  }

  if (!session) {
    return (
      <div className="flex items-center justify-center py-20">
        <Disc3 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const vinylsData = (vinylsQuery.data as any)?.items ?? vinylsQuery.data ?? [];
  const totalVinyls = vinylsData.length;
  const totalFolders = foldersQuery.data?.length ?? 0;

  return (
    <div className="mx-auto max-w-lg space-y-6 px-4 py-8 pb-24">
      <div className="flex items-center gap-2">
        <Settings className="h-5 w-5 text-primary" aria-hidden="true" />
        <h1 className="font-heading text-2xl font-bold">Configuracion</h1>
      </div>

      {}
      <section className="flex items-center gap-4 rounded-lg border border-border/60 bg-card p-4 shadow-sm">
        <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-primary/10">
          {session.user.image ? (
            <img src={session.user.image} alt="" className="h-14 w-14 rounded-full object-cover" width={56} height={56} />
          ) : (
            <User className="h-7 w-7 text-primary" aria-hidden="true" />
          )}
        </div>
        <div className="flex-1 min-w-0">
          {editingName ? (
            <div className="flex items-center gap-2">
              <Input value={name} onChange={(e) => { setName(e.target.value); setNameError(""); }} className={`h-8 ${nameError ? "border-destructive" : ""}`} disabled={savingName} />
              <Button type="button" size="sm" onClick={handleSaveName} disabled={savingName}>
                {savingName ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : "Guardar"}
              </Button>
              <Button type="button" size="sm" variant="ghost" onClick={() => setEditingName(false)} disabled={savingName}>Cancelar</Button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <h2 className="font-heading text-lg font-semibold truncate">{session.user.name}</h2>
              <button type="button" onClick={() => { setName(session.user.name); setEditingName(true); }} className="shrink-0 text-xs text-primary hover:underline">Editar</button>
            </div>
          )}
          {nameError && <p className="mt-1 text-xs text-destructive">{nameError}</p>}
          <p className="text-sm text-muted-foreground truncate">{session.user.email}</p>
          {session.user.username && <p className="text-xs text-muted-foreground">@{session.user.username}</p>}
        </div>
      </section>

      {}
      <section className="grid grid-cols-2 gap-3">
        <div className="flex items-center gap-3 rounded-lg border border-border/60 bg-card p-4 shadow-sm">
          <Music className="h-5 w-5 text-primary" aria-hidden="true" />
          <div>
            <p className="font-heading text-xl font-bold">{totalVinyls}</p>
            <p className="text-xs text-muted-foreground">Vinilos</p>
          </div>
        </div>
        <div className="flex items-center gap-3 rounded-lg border border-border/60 bg-card p-4 shadow-sm">
          <Folder className="h-5 w-5 text-primary" aria-hidden="true" />
          <div>
            <p className="font-heading text-xl font-bold">{totalFolders}</p>
            <p className="text-xs text-muted-foreground">Carpetas</p>
          </div>
        </div>
      </section>

      {}
      <section className="space-y-2">
        <Link href="/profile" className="flex items-center justify-between rounded-lg border border-border/60 bg-card p-4 shadow-sm transition-colors hover:bg-accent">
          <div className="flex items-center gap-3">
            <Disc3 className="h-5 w-5 text-primary" aria-hidden="true" />
            <div>
              <p className="text-sm font-medium">Perfil DJ</p>
              <p className="text-xs text-muted-foreground">Edita tu perfil publico, redes sociales y videos</p>
            </div>
          </div>
        </Link>

        <Link href="/sessions" className="flex items-center justify-between rounded-lg border border-border/60 bg-card p-4 shadow-sm transition-colors hover:bg-accent">
          <div className="flex items-center gap-3">
            <Shield className="h-5 w-5 text-primary" aria-hidden="true" />
            <div>
              <p className="text-sm font-medium">Sesiones activas</p>
              <p className="text-xs text-muted-foreground">Ver y revocar tus sesiones</p>
            </div>
          </div>
        </Link>
      </section>

      {}
      <section className="rounded-lg border border-border/60 bg-card p-4 shadow-sm">
        <div className="flex items-center justify-between">
          <h3 className="font-heading font-semibold">Contrasena</h3>
          {!showPassword && <button type="button" onClick={() => setShowPassword(true)} className="text-xs text-primary hover:underline">Cambiar</button>}
        </div>
        {showPassword && (
          <div className="mt-4 space-y-3">
            <div className="space-y-1.5">
              <Label htmlFor="current-pass">Contrasena actual</Label>
              <div className="relative">
                <Input id="current-pass" type={showCurrentPass ? "text" : "password"} autoComplete="current-password" value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} className={`pr-10 ${passErrors.currentPassword ? "border-destructive" : ""}`} disabled={savingPassword} />
                <button type="button" onClick={() => setShowCurrentPass(!showCurrentPass)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground" aria-label={showCurrentPass ? "Ocultar" : "Mostrar"}>
                  {showCurrentPass ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              {passErrors.currentPassword && <p className="text-xs text-destructive">{passErrors.currentPassword}</p>}
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="new-pass">Nueva contrasena</Label>
              <div className="relative">
                <Input id="new-pass" type={showNewPass ? "text" : "password"} autoComplete="new-password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} className={`pr-10 ${passErrors.newPassword ? "border-destructive" : ""}`} disabled={savingPassword} />
                <button type="button" onClick={() => setShowNewPass(!showNewPass)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground" aria-label={showNewPass ? "Ocultar" : "Mostrar"}>
                  {showNewPass ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              {passErrors.newPassword && <p className="text-xs text-destructive">{passErrors.newPassword}</p>}
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="confirm-pass">Confirmar contrasena</Label>
              <Input id="confirm-pass" type="password" autoComplete="new-password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} className={passErrors.confirmPassword ? "border-destructive" : ""} disabled={savingPassword} />
              {passErrors.confirmPassword && <p className="text-xs text-destructive">{passErrors.confirmPassword}</p>}
            </div>
            <div className="flex gap-2 pt-1">
              <Button type="button" size="sm" onClick={handleChangePassword} disabled={savingPassword}>
                {savingPassword && <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />}
                Cambiar contrasena
              </Button>
              <Button type="button" size="sm" variant="ghost" onClick={() => { setShowPassword(false); setPassErrors({}); }} disabled={savingPassword}>Cancelar</Button>
            </div>
          </div>
        )}
      </section>

      <Button type="button" variant="outline" className="w-full" onClick={() => authClient.signOut({ fetchOptions: { onSuccess: () => router.push("/") } })}>
        Cerrar sesion
      </Button>
    </div>
  );
}
