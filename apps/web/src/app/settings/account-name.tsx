"use client";

import { Button } from "@dallateas/ui/components/button";
import { Loader2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { z } from "zod";

import { Field } from "@/components/profile/fields";
import { authErrorMessage } from "@/components/profile/form-errors";
import { useHaptic } from "@/hooks/use-haptic";
import { authClient } from "@/lib/auth-client";

const nameSchema = z.string().trim().min(2, "Mínimo 2 caracteres").max(100, "Máximo 100 caracteres");

export function AccountName({ name }: { name: string }) {
  const haptic = useHaptic();
  const [savedName, setSavedName] = useState(name);
  const [draft, setDraft] = useState<string | null>(null);
  const [attempted, setAttempted] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  async function save(value: string) {
    setAttempted(true);
    const parsed = nameSchema.safeParse(value);
    if (!parsed.success) return;

    setIsSaving(true);
    try {
      const { error } = await authClient.updateUser({ name: parsed.data });
      if (error) {
        toast.error(authErrorMessage(error, "No pudimos actualizar tu nombre"));
        return;
      }
      haptic.trigger("success");
      toast.success("Nombre actualizado");
      setSavedName(parsed.data);
      setDraft(null);
    } catch {
      toast.error("No pudimos conectarnos. Probá de nuevo");
    } finally {
      setIsSaving(false);
    }
  }

  if (draft === null) {
    return (
      <div className="flex items-baseline gap-3">
        <p className="min-w-0 truncate text-base font-semibold">{savedName}</p>
        <button
          type="button"
          onClick={() => {
            setAttempted(false);
            setDraft(savedName);
          }}
          className="min-h-11 shrink-0 text-sm text-link hover:underline md:min-h-0"
        >
          Editar
        </button>
      </div>
    );
  }

  return (
    <form
      noValidate
      className="mb-3 space-y-3"
      onSubmit={(event) => {
        event.preventDefault();
        void save(draft);
      }}
    >
      <Field
        id="account-name"
        label="Nombre"
        autoComplete="name"
        autoFocus
        value={draft}
        onChange={(event) => setDraft(event.target.value)}
        error={attempted ? nameSchema.safeParse(draft).error?.issues[0]?.message : undefined}
        disabled={isSaving}
      />
      <div className="flex gap-2">
        <Button type="submit" variant="outline" disabled={isSaving} className="h-11 px-3 text-sm md:h-9">
          {isSaving && <Loader2 aria-hidden="true" className="size-4 motion-safe:animate-spin" />}
          Guardar
        </Button>
        <Button type="button" variant="ghost" onClick={() => setDraft(null)} disabled={isSaving} className="h-11 px-3 text-sm md:h-9">
          Cancelar
        </Button>
      </div>
    </form>
  );
}
