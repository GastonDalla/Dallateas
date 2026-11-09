"use client";

import { profileSlug } from "@dallateas/api/schemas";
import { Button } from "@dallateas/ui/components/button";
import { useQuery } from "@tanstack/react-query";
import { Copy } from "lucide-react";
import type { Route } from "next";
import { toast } from "sonner";

import { useDebounce } from "@/hooks/use-debounce";
import { useHaptic } from "@/hooks/use-haptic";
import { trpc } from "@/utils/trpc";

import { CheckField, Field, FormSection } from "./fields";
import type { ProfileForm } from "./profile-form";

type IdentitySectionProps = {
  form: ProfileForm;
  update: (changes: Partial<ProfileForm>) => void;
  error?: string;
  viewCount: number;
  publicPath: Route | null;
};

function SlugStatus({ slug }: { slug: string }) {
  const debounced = useDebounce(slug, 500);
  const checkable = profileSlug.safeParse(debounced).success;
  const check = useQuery({
    ...trpc.djProfileCheckSlug.queryOptions({ slug: debounced }),
    enabled: checkable,
  });

  if (!checkable || debounced !== slug || !check.data) return "Mínimo 3 caracteres. Solo letras, números y guiones";
  return check.data.available ? <span className="text-good">Disponible</span> : <span className="text-destructive">Ya está en uso</span>;
}

export function IdentitySection({ form, update, error, viewCount, publicPath }: IdentitySectionProps) {
  const haptic = useHaptic();

  async function copyLink() {
    if (!publicPath) return;
    await navigator.clipboard.writeText(new URL(publicPath, window.location.origin).href);
    haptic.trigger("success");
    toast.success("Link copiado");
  }

  return (
    <FormSection title="Tu dirección" description="El link que compartís y quién lo puede ver">
      <Field
        id="dj-slug"
        label="URL personalizada"
        prefix="/p/"
        placeholder="tu-nombre-dj"
        maxLength={50}
        autoCapitalize="none"
        value={form.slug}
        onChange={(event) => update({ slug: event.target.value.toLowerCase().replace(/[^a-z0-9-]/g, "") })}
        hint={<SlugStatus slug={form.slug} />}
        error={error}
      />

      {publicPath && (
        <div className="flex items-center justify-between gap-3 text-sm">
          <span className="min-w-0 truncate text-muted-foreground">{publicPath}</span>
          <Button type="button" variant="ghost" onClick={() => void copyLink()} className="h-11 shrink-0 px-2 text-sm md:h-8">
            <Copy aria-hidden="true" />
            Copiar link
          </Button>
        </div>
      )}

      <CheckField
        id="dj-public"
        label="Perfil público"
        hint="Sin esto, tu perfil solo lo ves vos"
        checked={form.isPublic}
        onCheckedChange={(isPublic) => update({ isPublic })}
      />

      <CheckField
        id="dj-views"
        label="Mostrar las visitas"
        hint={`${viewCount} ${viewCount === 1 ? "visita" : "visitas"} al perfil hasta ahora`}
        checked={form.showViewCount}
        onCheckedChange={(showViewCount) => update({ showViewCount })}
      />
    </FormSection>
  );
}
