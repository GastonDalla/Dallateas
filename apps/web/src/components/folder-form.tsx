"use client";

import { Button } from "@dallateas/ui/components/button";
import { Input } from "@dallateas/ui/components/input";
import { Label } from "@dallateas/ui/components/label";
import { cn } from "@dallateas/ui/lib/utils";
import { Eye, EyeOff, Globe, Loader2, Lock, Users } from "lucide-react";
import { useState, type FormEvent } from "react";

import { useHaptic } from "@/hooks/use-haptic";

const PALETTE = ["#c4312b", "#b7791f", "#2f7d54", "#0e7490", "#1d4ed8", "#be185d", "#5e5e59"];

const FOLDER_TYPES = [
  { value: "GENRE", label: "Género" },
  { value: "SET", label: "Set" },
  { value: "OTHER", label: "Otro" },
] as const;

const VISIBILITIES = [
  { value: "PUBLIC", label: "Pública", icon: Globe },
  { value: "ACCOUNT", label: "Con cuenta", icon: Users },
  { value: "PRIVATE", label: "Privada", icon: Lock },
] as const;

const MIN_PASSWORD_LENGTH = 4;

type FolderType = (typeof FOLDER_TYPES)[number]["value"];
type Visibility = (typeof VISIBILITIES)[number]["value"];

export type FolderFormData = {
  name: string;
  description?: string;
  type: FolderType;
  color?: string;
  visibility: Visibility;
  /** Left out keeps the current password, null removes it, a string replaces it. */
  password?: string | null;
};

type FolderFormProps = {
  initial?: Partial<FolderFormData> & { hasPassword?: boolean };
  isSubmitting: boolean;
  onSubmit: (data: FolderFormData) => void;
  onCancel?: () => void;
  submitLabel?: string;
};

const CHOICE_CLASSES =
  "flex h-11 cursor-pointer items-center justify-center gap-1.5 rounded-md border border-border px-3 text-sm text-muted-foreground transition-colors peer-checked:border-transparent peer-checked:bg-accent peer-checked:font-medium peer-checked:text-accent-foreground peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-ring hover:text-foreground md:h-9";

export function FolderForm({ initial, isSubmitting, onSubmit, onCancel, submitLabel = "Guardar" }: FolderFormProps) {
  const haptic = useHaptic();

  const [name, setName] = useState(initial?.name ?? "");
  const [description, setDescription] = useState(initial?.description ?? "");
  const [type, setType] = useState<FolderType>(initial?.type ?? "OTHER");
  const [color, setColor] = useState(initial?.color ?? "");
  const [visibility, setVisibility] = useState<Visibility>(initial?.visibility ?? "PRIVATE");
  const [password, setPassword] = useState("");
  const [removePassword, setRemovePassword] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [nameError, setNameError] = useState("");
  const [passwordError, setPasswordError] = useState("");

  // A colour saved before the palette changed stays visible, so editing never drops it silently.
  const swatches = initial?.color && !PALETTE.includes(initial.color) ? [...PALETTE, initial.color] : PALETTE;

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const trimmedName = name.trim();
    const trimmedPassword = password.trim();
    const newPassword = visibility !== "PRIVATE" && !removePassword && trimmedPassword ? trimmedPassword : undefined;

    setNameError(trimmedName ? "" : "Poné un nombre");
    const passwordTooShort = newPassword !== undefined && newPassword.length < MIN_PASSWORD_LENGTH;
    setPasswordError(passwordTooShort ? `La contraseña necesita al menos ${MIN_PASSWORD_LENGTH} caracteres` : "");
    if (!trimmedName || passwordTooShort) return;

    onSubmit({
      name: trimmedName,
      description: description.trim() || undefined,
      type,
      color: color || undefined,
      visibility,
      password: removePassword ? null : newPassword,
    });
  }

  return (
    <form className="flex flex-col gap-5" onSubmit={handleSubmit} noValidate>
      <div className="flex flex-col gap-2">
        <Label htmlFor="folder-name" className="text-sm">
          Nombre
        </Label>
        <Input
          id="folder-name"
          value={name}
          onChange={(event) => {
            setName(event.target.value);
            if (nameError) setNameError("");
          }}
          maxLength={200}
          placeholder="Sábado en el club"
          aria-invalid={Boolean(nameError)}
          aria-describedby={nameError ? "folder-name-error" : undefined}
          className="h-11 text-sm md:h-9 md:text-sm"
          disabled={isSubmitting}
        />
        {nameError && (
          <p id="folder-name-error" className="text-sm text-clash">
            {nameError}
          </p>
        )}
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor="folder-description" className="text-sm">
          Descripción (opcional)
        </Label>
        <textarea
          id="folder-description"
          value={description}
          onChange={(event) => setDescription(event.target.value)}
          rows={2}
          maxLength={1000}
          className="w-full rounded-md border border-input bg-transparent px-2.5 py-2 text-sm outline-none transition-colors placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-1 focus-visible:ring-ring/50"
          disabled={isSubmitting}
        />
      </div>

      <fieldset className="flex flex-col gap-2" disabled={isSubmitting}>
        <legend className="mb-2 text-sm">Tipo</legend>
        <div className="flex flex-wrap gap-2">
          {FOLDER_TYPES.map((option) => (
            <label key={option.value} className="min-w-20 flex-1 sm:flex-none">
              <input
                type="radio"
                name="folder-type"
                checked={type === option.value}
                onChange={() => setType(option.value)}
                className="peer sr-only"
              />
              <span className={CHOICE_CLASSES}>{option.label}</span>
            </label>
          ))}
        </div>
      </fieldset>

      <fieldset className="flex flex-col gap-2" disabled={isSubmitting}>
        <legend className="mb-2 text-sm">Color</legend>
        <div className="flex flex-wrap gap-2">
          {swatches.map((swatch) => (
            <button
              key={swatch}
              type="button"
              onClick={() => setColor(color === swatch ? "" : swatch)}
              aria-label={`Color ${swatch}`}
              aria-pressed={color === swatch}
              style={{ backgroundColor: swatch }}
              className={cn(
                "size-11 transition-opacity hover:opacity-80 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring md:size-8",
                color === swatch && "outline-2 outline-offset-2 outline-foreground",
              )}
            />
          ))}
        </div>
      </fieldset>

      <fieldset className="flex flex-col gap-2" disabled={isSubmitting}>
        <legend className="mb-2 text-sm">Visibilidad</legend>
        <div className="flex flex-wrap gap-2">
          {VISIBILITIES.map((option) => (
            <label key={option.value} className="min-w-28 flex-1 sm:flex-none">
              <input
                type="radio"
                name="folder-visibility"
                checked={visibility === option.value}
                onChange={() => {
                  haptic.trigger("selection");
                  setVisibility(option.value);
                }}
                className="peer sr-only"
              />
              <span className={CHOICE_CLASSES}>
                <option.icon aria-hidden="true" className="size-4" />
                {option.label}
              </span>
            </label>
          ))}
        </div>
      </fieldset>

      {visibility !== "PRIVATE" && (
        <div className="flex flex-col gap-2">
          <Label htmlFor="folder-password" className="text-sm">
            Contraseña (opcional)
          </Label>
          <div className="relative">
            <Input
              id="folder-password"
              type={showPassword ? "text" : "password"}
              value={password}
              onChange={(event) => {
                setPassword(event.target.value);
                if (passwordError) setPasswordError("");
              }}
              placeholder={initial?.hasPassword ? "Dejala vacía para mantener la actual" : "Dejala vacía para acceso libre"}
              maxLength={100}
              autoComplete="new-password"
              aria-invalid={Boolean(passwordError)}
              aria-describedby={passwordError ? "folder-password-error" : undefined}
              className="h-11 pr-11 text-sm md:h-9 md:text-sm"
              disabled={isSubmitting || removePassword}
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              aria-label={showPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
              className="absolute inset-y-0 right-0 flex w-11 items-center justify-center text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-ring"
            >
              {showPassword ? <EyeOff aria-hidden="true" className="size-4" /> : <Eye aria-hidden="true" className="size-4" />}
            </button>
          </div>
          {passwordError && (
            <p id="folder-password-error" className="text-sm text-clash">
              {passwordError}
            </p>
          )}
          {initial?.hasPassword && (
            <label className="flex min-h-11 items-center gap-2 text-sm text-muted-foreground md:min-h-0">
              <input
                type="checkbox"
                checked={removePassword}
                onChange={(event) => setRemovePassword(event.target.checked)}
                disabled={isSubmitting}
                className="size-4 accent-primary"
              />
              Quitar la contraseña
            </label>
          )}
          <p className="text-[13px] text-muted-foreground">Con contraseña, solo quien la tenga ve el contenido</p>
        </div>
      )}

      <div className="flex gap-2">
        <Button type="submit" className="h-11 px-4 text-sm md:h-9" disabled={isSubmitting}>
          {isSubmitting && <Loader2 aria-hidden="true" className="motion-safe:animate-spin" />}
          {submitLabel}
        </Button>
        {onCancel && (
          <Button type="button" variant="outline" className="h-11 px-4 text-sm md:h-9" onClick={onCancel} disabled={isSubmitting}>
            Cancelar
          </Button>
        )}
      </div>
    </form>
  );
}
