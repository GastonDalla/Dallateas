import type { Metadata } from "next";

import DjProfilePage from "./dj-profile";

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  return {
    title: `@${slug} | Dallateas`,
    description: `Mira la coleccion y sets de @${slug} en Dallateas.`,
    openGraph: {
      title: `@${slug} | Dallateas`,
      description: `Perfil DJ de @${slug}`,
    },
  };
}

export default async function ProfilePublicPage({ params }: Props) {
  const { slug } = await params;
  return <DjProfilePage username={slug} />;
}
