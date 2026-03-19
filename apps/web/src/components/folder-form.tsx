"use client";

import { Button } from "@dallateas/ui/components/button";
import { Input } from "@dallateas/ui/components/input";
import { Label } from "@dallateas/ui/components/label";
import { Eye, EyeOff, Globe, KeyRound, Loader2, Lock, Users } from "lucide-react";
import { useState } from "react";
import { z } from "zod";

import { useHaptic } from "@/hooks/use-haptic";

const PALETTE = [
  "#b45309",
  "#a16207",
  "#4d7c0f",
  "#0e7490",
  "#1d4ed8",
  "#7c3aed",
  "#be185d",
  "#dc2626",
];

const schema = z.object({
  name: z.string().min(1, "Nombre requerido").max(200),
  description: z.string().max(1000).optional(),
  type: z.enum(["GENRE", "SET", "OTHER"]),
  color: z
    .string()
    .regex(/^#[0-9a-fA-F]{6}$/)
    .optional(),
  visibility: z.enum(["PUBLIC", "ACCOUNT", "PRIVATE"]),
});

type FolderFormData = z.infer<typeof schema> & { password?: string | null };

type FolderFormProps = {
  initial?: Partial<FolderFormData>;
  isSubmitting: boolean;
  onSubmit: (data: FolderFormData) => void;
  onCancel?: () => void;
  submitLabel?: string;
};

export function FolderForm({
  initial,
  isSubmitting,
  onSubmit,
  onCancel,
  submitLabel = "Guardar",
}: FolderFormProps) {
  const [name, setName] = useState(initial?.name ?? "");
  const [description, setDescription] = useState(initial?.description ?? "");
  const [type, setType] = useState<"GENRE" | "SET" | "OTHER">(
    initial?.type ?? "OTHER",
  );
  const [color, setColor] = useState(initial?.color ?? "");
  const haptic = useHaptic();
  const [visibility, setVisibility] = useState<"PUBLIC" | "ACCOUNT" | "PRIVATE">(
    initial?.visibility ?? "PRIVATE",
  );
  const [password, setPassword] = useState(initial?.password ?? "");
  const [showPassword, setShowPassword] = useState(false);
  const [nameError, setNameError] = useState("");

  function handleSubmit() {
    const trimmed = name.trim();
    if (!trimmed) {
      setNameError("Nombre requerido");
      return;
    }
    setNameError("");
    onSubmit({
      name: trimmed,
      description: description.trim() || undefined,
      type,
      color: color || undefined,
      visibility,
      password: visibility !== "PRIVATE" && password.trim() ? password.trim() : null,
    });
  }

  return (
    <div className="space-y-4">
      <div className="space-y-1.5">
        <Label htmlFor="folder-name">Nombre *</Label>
        <Input
          id="folder-name"
          value={name}
          onChange={(e) => {
            setName(e.target.value);
            if (nameError) setNameError("");
          }}
          placeholder="Nombre de la carpeta"
          className={nameError ? "border-red-500" : ""}
          disabled={isSubmitting}
        />
        {nameError && <p className="text-xs text-red-500">{nameError}</p>}
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="folder-desc">Descripcion</Label>
        <textarea
          id="folder-desc"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={2}
          maxLength={1000}
          placeholder="Descripcion opcional"
          className="w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm outline-none transition-colors placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-1 focus-visible:ring-ring/50"
          disabled={isSubmitting}
        />
      </div>

      <div className="space-y-1.5">
        <Label>Tipo</Label>
        <div className="flex gap-2">
          {(["GENRE", "SET", "OTHER"] as const).map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => setType(t)}
              disabled={isSubmitting}
              className={`rounded-full px-3 py-1.5 text-xs font-medium transition-colors ${
                type === t
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "bg-muted text-muted-foreground hover:text-foreground"
              }`}
            >
              {t === "GENRE" ? "Genero" : t === "SET" ? "Set" : "Otro"}
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-1.5">
        <Label>Color</Label>
        <div className="flex gap-2">
          {PALETTE.map((c) => (
            <button
              key={c}
              type="button"
              onClick={() => setColor(color === c ? "" : c)}
              disabled={isSubmitting}
              aria-label={`Color ${c}`}
              aria-pressed={color === c}
              className={`h-7 w-7 rounded-full transition-all ${
                color === c
                  ? "ring-2 ring-ring ring-offset-2 ring-offset-background"
                  : "hover:scale-110"
              }`}
              style={{ backgroundColor: c }}
            />
          ))}
        </div>
      </div>

      <div className="space-y-1.5">
        <Label>Visibilidad</Label>
        <div className="flex gap-2">
          {([
            { value: "PUBLIC" as const, label: "Publica", icon: Globe, desc: "Cualquier persona" },
            { value: "ACCOUNT" as const, label: "Con cuenta", icon: Users, desc: "Solo usuarios registrados" },
            { value: "PRIVATE" as const, label: "Privada", icon: Lock, desc: "Solo vos" },
          ]).map((opt) => (
            <button
              key={opt.value}
              type="button"
              onClick={() => { haptic.trigger("selection"); setVisibility(opt.value); }}
              disabled={isSubmitting}
              className={`flex flex-1 flex-col items-center gap-1 rounded-lg border p-2.5 text-center transition-colors ${
                visibility === opt.value
                  ? "border-primary bg-primary/5 text-primary"
                  : "border-border/60 text-muted-foreground hover:border-border hover:text-foreground"
              }`}
            >
              <opt.icon className="h-4 w-4" />
              <span className="text-[11px] font-medium">{opt.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Password (only for non-private folders) */}
      {visibility !== "PRIVATE" && (
        <div className="space-y-1.5">
          <Label htmlFor="folder-pass" className="flex items-center gap-1.5">
            <KeyRound className="h-3.5 w-3.5" />
            Contrasena (opcional)
          </Label>
          <div className="relative">
            <Input
              id="folder-pass"
              type={showPassword ? "text" : "password"}
              value={password ?? ""}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Dejar vacio para acceso libre"
              maxLength={100}
              className="pr-10"
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
          <p className="text-[10px] text-muted-foreground">
            Si pones contrasena, solo quienes la tengan podran ver el contenido.
          </p>
        </div>
      )}

      <div className="flex gap-2 pt-2">
        {onCancel && (
          <Button
            type="button"
            variant="outline"
            onClick={onCancel}
            disabled={isSubmitting}
          >
            Cancelar
          </Button>
        )}
        <Button type="button" onClick={handleSubmit} disabled={isSubmitting}>
          {isSubmitting && (
            <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
          )}
          {submitLabel}
        </Button>
      </div>
    </div>
  );
}
