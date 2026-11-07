"use client";

import { Button } from "@dallateas/ui/components/button";
import { Plus } from "lucide-react";

import { CustomSelect } from "@/components/custom-select";

import { Field, FormSection } from "./fields";
import { newRowId, type ProfileErrors, type ProfileForm, type SocialRow } from "./profile-form";
import { RowRemoveButton } from "./row-remove-button";

const MAX_LINKS = 15;

const SOCIAL_PLATFORMS = [
  { value: "instagram", label: "Instagram" },
  { value: "youtube", label: "YouTube" },
  { value: "soundcloud", label: "SoundCloud" },
  { value: "mixcloud", label: "Mixcloud" },
  { value: "bandcamp", label: "Bandcamp" },
  { value: "spotify", label: "Spotify" },
  { value: "discogs", label: "Discogs" },
  { value: "tiktok", label: "TikTok" },
  { value: "twitter", label: "X / Twitter" },
  { value: "facebook", label: "Facebook" },
  { value: "whatsapp", label: "WhatsApp" },
  { value: "telegram", label: "Telegram" },
  { value: "website", label: "Sitio web" },
  { value: "custom", label: "Personalizado" },
];

function platformLabel(platform: string) {
  return SOCIAL_PLATFORMS.find(({ value }) => value === platform)?.label ?? platform;
}

type SocialLinkRowProps = {
  row: SocialRow;
  error?: string;
  onChange: (changes: Partial<SocialRow>) => void;
  onRemove: () => void;
};

function SocialLinkRow({ row, error, onChange, onRemove }: SocialLinkRowProps) {
  const name = platformLabel(row.platform);

  return (
    <li className="space-y-2 border-t border-border pt-4 first:border-t-0 first:pt-0">
      <div className="flex items-start gap-2">
        <CustomSelect
          value={row.platform}
          onChange={(platform) => onChange({ platform })}
          options={SOCIAL_PLATFORMS}
          label={`Plataforma: ${name}`}
          className="w-36 shrink-0"
        />
        <div className="min-w-0 flex-1">
          <Field
            id={`social-${row.id}`}
            label={`Link de ${name}`}
            hideLabel
            type="url"
            inputMode="url"
            placeholder="https://"
            maxLength={500}
            value={row.url}
            onChange={(event) => onChange({ url: event.target.value })}
            error={error}
          />
        </div>
        <RowRemoveButton label={`Quitar el link de ${name}`} onClick={onRemove} />
      </div>
      {row.platform === "custom" && (
        <Field
          id={`social-label-${row.id}`}
          label="Nombre del link"
          hideLabel
          placeholder="Nombre del link (Resident Advisor, Booking)"
          maxLength={50}
          value={row.label}
          onChange={(event) => onChange({ label: event.target.value })}
        />
      )}
    </li>
  );
}

type SocialLinksSectionProps = {
  rows: SocialRow[];
  update: (changes: Pick<ProfileForm, "socialLinks">) => void;
  errors: ProfileErrors;
};

export function SocialLinksSection({ rows, update, errors }: SocialLinksSectionProps) {
  function changeRow(id: string, changes: Partial<SocialRow>) {
    update({ socialLinks: rows.map((row) => (row.id === id ? { ...row, ...changes } : row)) });
  }

  return (
    <FormSection
      title="Redes y links"
      description="Usá Personalizado para Resident Advisor, Beatport o tu booking"
    >
      {rows.length > 0 && (
        <ul className="space-y-4">
          {rows.map((row) => (
            <SocialLinkRow
              key={row.id}
              row={row}
              error={errors[`social:${row.id}`]}
              onChange={(changes) => changeRow(row.id, changes)}
              onRemove={() => update({ socialLinks: rows.filter(({ id }) => id !== row.id) })}
            />
          ))}
        </ul>
      )}
      {rows.length < MAX_LINKS && (
        <Button
          type="button"
          variant="outline"
          onClick={() => update({ socialLinks: [...rows, { id: newRowId(), platform: "instagram", url: "", label: "" }] })}
          className="h-11 px-3 text-sm md:h-9"
        >
          <Plus aria-hidden="true" />
          Agregar link
        </Button>
      )}
    </FormSection>
  );
}
