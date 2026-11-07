import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { after } from "next/server";
import { cache } from "react";

import { isMissingRecord } from "@/app/batea/record-errors";
import { metaDescription, shareableImage, socialCard } from "@/app/batea/seo";
import { getServerCaller } from "@/server/trpc";

import DjProfile from "./dj-profile";

type Props = { params: Promise<{ slug: string }> };

/** Read once per request: the metadata, the page and the view count all need it. */
const loadProfile = cache(async (slug: string) => {
  const caller = await getServerCaller();

  try {
    return await caller.djProfilePublic({ slug });
  } catch (error) {
    if (isMissingRecord(error)) return null;
    throw error;
  }
});

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const profile = await loadProfile(slug);

  if (!profile) return { title: "Perfil no encontrado", robots: { index: false } };

  const title = `${profile.name} (@${profile.username})`;
  const description = metaDescription(profile.bio ?? `Bateas, sets y fechas de ${profile.name} en Dallateas.`);

  return {
    title,
    description,
    alternates: { canonical: `/p/${slug}` },
    ...socialCard({ title, description, type: "profile", image: shareableImage(profile.image) }),
  };
}

export default async function ProfilePublicPage({ params }: Props) {
  const { slug } = await params;
  const [profile, caller] = await Promise.all([loadProfile(slug), getServerCaller()]);
  if (!profile) notFound();

  after(() => caller.djProfileRecordView({ id: profile.id }).catch((error) => console.error("Profile view not recorded", error)));

  return <DjProfile profile={profile} slug={slug} />;
}
