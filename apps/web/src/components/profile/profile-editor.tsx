"use client";

import { Button } from "@dallateas/ui/components/button";
import { useMutation, useQueryClient, useSuspenseQuery } from "@tanstack/react-query";
import { ExternalLink, Loader2 } from "lucide-react";
import type { Route } from "next";
import Link from "next/link";
import { useState } from "react";
import { toast } from "sonner";

import { PageHeader } from "@/components/shell/page-header";
import { useHaptic } from "@/hooks/use-haptic";
import { trpc } from "@/utils/trpc";

import { AboutSection } from "./about-section";
import { BookingSection } from "./booking-section";
import { FeaturedVinylSection, type FeaturedVinyl } from "./featured-vinyl-section";
import { GigsSection, type Gig } from "./gigs-section";
import { IdentitySection } from "./identity-section";
import { MixesSection } from "./mixes-section";
import {
  isDirty,
  profileFormErrors,
  toProfileForm,
  toProfileUpdate,
  type ProfileForm,
  type SavedProfile,
} from "./profile-form";
import { SocialLinksSection } from "./social-links-section";

type ProfileEditorProps = {
  username: string | null;
};

/** Remounts the form after each save, so it starts over from the links as the server normalised them. */
export function ProfileEditor({ username }: ProfileEditorProps) {
  const { data: profile } = useSuspenseQuery(trpc.djProfileGet.queryOptions());
  const [revision, setRevision] = useState(0);

  return (
    <ProfileFields
      key={revision}
      profile={profile}
      gigs={profile?.gigs ?? []}
      featuredVinyl={profile?.featuredVinyl ?? null}
      viewCount={profile?.viewCount ?? 0}
      publicPath={publicPath(profile, username)}
      onSaved={() => setRevision((current) => current + 1)}
    />
  );
}

/** A preview needs a saved profile: its owner can open it even while it is private. */
function publicPath(profile: { slug: string | null } | null, username: string | null) {
  const address = profile?.slug ?? username;
  return profile && address ? (`/p/${address}` as Route) : null;
}

type ProfileFieldsProps = {
  profile: SavedProfile | null;
  gigs: Gig[];
  featuredVinyl: FeaturedVinyl | null;
  viewCount: number;
  publicPath: Route | null;
  onSaved: () => void;
};

function ProfileFields({ profile, gigs, featuredVinyl, viewCount, publicPath, onSaved }: ProfileFieldsProps) {
  const haptic = useHaptic();
  const queryClient = useQueryClient();
  const [form, setForm] = useState(() => toProfileForm(profile));
  const [attempted, setAttempted] = useState(false);

  const errors = profileFormErrors(form, profile);
  const shownErrors = attempted ? errors : {};
  const dirty = isDirty(form, toProfileForm(profile));

  function update(changes: Partial<ProfileForm>) {
    setForm((current) => ({ ...current, ...changes }));
  }

  const save = useMutation({
    ...trpc.djProfileUpdate.mutationOptions(),
    onSuccess: async () => {
      haptic.trigger("success");
      await queryClient.invalidateQueries({ queryKey: trpc.djProfileGet.queryKey() });
      toast.success("Perfil guardado");
      onSaved();
    },
    onError: (error) => {
      haptic.trigger("error");
      toast.error(error.message);
    },
  });

  function submit() {
    setAttempted(true);
    if (Object.keys(errors).length > 0) {
      haptic.trigger("error");
      toast.error("Revisá los campos marcados");
      return;
    }
    save.mutate(toProfileUpdate(form));
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-6 md:px-8 md:py-8">
      <PageHeader
        title="Perfil DJ"
        description="Lo que ven los promotores y otros DJ en tu página pública"
        className="mb-8"
        actions={
          publicPath && (
            <Button
              variant="outline"
              render={<Link href={publicPath} target="_blank" />}
              nativeButton={false}
              className="h-11 px-3 text-sm md:h-9"
            >
              <ExternalLink aria-hidden="true" />
              Ver mi perfil
            </Button>
          )
        }
      />

      {/* Keeps a focused control clear of the sticky save bar and the phone nav. */}
      <form
        noValidate
        className="[&_:is(input,textarea,button)]:scroll-mb-36"
        onSubmit={(event) => {
          event.preventDefault();
          submit();
        }}
      >
        <IdentitySection
          form={form}
          update={update}
          error={shownErrors.slug}
          viewCount={viewCount}
          publicPath={publicPath}
        />
        <AboutSection form={form} update={update} errors={shownErrors} />
        <FeaturedVinylSection value={form.featuredVinylId} current={featuredVinyl} update={update} />
        <SocialLinksSection rows={form.socialLinks} update={update} errors={shownErrors} />
        <MixesSection form={form} update={update} errors={shownErrors} />
        <BookingSection form={form} update={update} errors={shownErrors} />

        <div className="sticky bottom-[calc(3.3125rem+max(0.375rem,env(safe-area-inset-bottom)))] z-20 -mx-4 flex items-center justify-between gap-4 border-t border-border bg-background px-4 py-3 md:bottom-0 md:mx-0 md:px-0">
          <p aria-live="polite" className="text-sm text-muted-foreground">
            {dirty ? "Cambios sin guardar" : "Sin cambios"}
          </p>
          <Button type="submit" disabled={!dirty || save.isPending} className="h-11 px-4 text-base md:h-9 md:text-sm">
            {save.isPending && <Loader2 aria-hidden="true" className="size-4 motion-safe:animate-spin" />}
            {save.isPending ? "Guardando" : "Guardar perfil"}
          </Button>
        </div>
      </form>

      <GigsSection gigs={gigs} canAdd={profile !== null} />
    </div>
  );
}
