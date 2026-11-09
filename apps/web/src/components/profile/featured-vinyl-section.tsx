"use client";

import { useQuery } from "@tanstack/react-query";

import { VinylPicker } from "@/components/vinyl-picker";
import { trpc } from "@/utils/trpc";

import { FormSection } from "./fields";
import type { ProfileForm } from "./profile-form";

export type FeaturedVinyl = {
  id: string;
  title: string;
  artist: string;
  coverUrl: string | null;
  genre: string | null;
};

type FeaturedVinylSectionProps = {
  value: string | null;
  /** The saved pick, which can be older than the records the picker loads. */
  current: FeaturedVinyl | null;
  update: (changes: Pick<ProfileForm, "featuredVinylId">) => void;
};

export function FeaturedVinylSection({ value, current, update }: FeaturedVinylSectionProps) {
  const vinyls = useQuery(trpc.vinylsList.queryOptions({ limit: 200 }));
  const items = vinyls.data?.items ?? [];
  const options = current && !items.some(({ id }) => id === current.id) ? [current, ...items] : items;

  return (
    <FormSection title="Vinilo favorito" description="Un disco de tu colección para destacar en tu perfil">
      <VinylPicker vinyls={options} value={value} onChange={(featuredVinylId) => update({ featuredVinylId })} />
    </FormSection>
  );
}
