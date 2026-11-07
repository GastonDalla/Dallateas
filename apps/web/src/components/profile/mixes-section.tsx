"use client";

import { Button } from "@dallateas/ui/components/button";
import { cn } from "@dallateas/ui/lib/utils";
import { Plus } from "lucide-react";

import { Field, FormSection } from "./fields";
import { newRowId, type Layout, type MixRow, type ProfileErrors, type ProfileForm } from "./profile-form";
import { RowRemoveButton } from "./row-remove-button";

const MAX_MIXES = 20;

const LAYOUTS: { value: Layout; label: string }[] = [
  { value: "card", label: "Tarjetas" },
  { value: "slider", label: "Carrusel" },
];

function LayoutToggle({ value, onChange }: { value: Layout; onChange: (layout: Layout) => void }) {
  return (
    <div role="group" aria-label="Cómo mostrar tus sets" className="inline-flex rounded-md border border-input">
      {LAYOUTS.map((layout) => (
        <button
          key={layout.value}
          type="button"
          aria-pressed={value === layout.value}
          onClick={() => onChange(layout.value)}
          className={cn(
            "h-11 px-3 text-sm transition-colors md:h-8",
            value === layout.value ? "bg-accent font-medium text-accent-foreground" : "text-muted-foreground hover:text-foreground",
          )}
        >
          {layout.label}
        </button>
      ))}
    </div>
  );
}

type MixesSectionProps = {
  form: ProfileForm;
  update: (changes: Partial<ProfileForm>) => void;
  errors: ProfileErrors;
};

export function MixesSection({ form, update, errors }: MixesSectionProps) {
  const { mixes } = form;

  function changeRow(id: string, changes: Partial<MixRow>) {
    update({ mixes: mixes.map((mix) => (mix.id === id ? { ...mix, ...changes } : mix)) });
  }

  return (
    <>
      <FormSection title="Mix destacado" description="El que querés que escuchen primero. YouTube, SoundCloud o Mixcloud">
        <Field
          id="dj-mix-title"
          label="Nombre del mix"
          optional
          placeholder="Live at Club X"
          maxLength={200}
          value={form.featuredMixTitle}
          onChange={(event) => update({ featuredMixTitle: event.target.value })}
        />
        <Field
          id="dj-mix-url"
          label="Link del mix"
          optional
          type="url"
          inputMode="url"
          placeholder="https://"
          maxLength={500}
          value={form.featuredMixUrl}
          onChange={(event) => update({ featuredMixUrl: event.target.value })}
          error={errors.featuredMixUrl}
        />
      </FormSection>

      <FormSection title="Sets y mixes" description="Cualquier link. Se embebe solo cuando se puede">
        <LayoutToggle value={form.mixesLayout} onChange={(mixesLayout) => update({ mixesLayout })} />

        {mixes.length > 0 && (
          <ul className="space-y-4">
            {mixes.map((mix) => (
              <li key={mix.id} className="flex items-start gap-2 border-t border-border pt-4 first:border-t-0 first:pt-0">
                <div className="min-w-0 flex-1 space-y-2">
                  <Field
                    id={`mix-title-${mix.id}`}
                    label="Nombre del set"
                    hideLabel
                    placeholder="Nombre del set o mix"
                    maxLength={200}
                    value={mix.title}
                    onChange={(event) => changeRow(mix.id, { title: event.target.value })}
                  />
                  <Field
                    id={`mix-url-${mix.id}`}
                    label="Link del set"
                    hideLabel
                    type="url"
                    inputMode="url"
                    placeholder="https://"
                    maxLength={500}
                    value={mix.url}
                    onChange={(event) => changeRow(mix.id, { url: event.target.value })}
                    error={errors[`mix:${mix.id}`]}
                  />
                </div>
                <RowRemoveButton
                  label={mix.title ? `Quitar ${mix.title}` : "Quitar este set"}
                  onClick={() => update({ mixes: mixes.filter(({ id }) => id !== mix.id) })}
                />
              </li>
            ))}
          </ul>
        )}

        {mixes.length < MAX_MIXES && (
          <Button
            type="button"
            variant="outline"
            onClick={() => update({ mixes: [...mixes, { id: newRowId(), title: "", url: "" }] })}
            className="h-11 px-3 text-sm md:h-9"
          >
            <Plus aria-hidden="true" />
            Agregar set
          </Button>
        )}
      </FormSection>
    </>
  );
}
