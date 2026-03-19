import prisma from "@/lib/prisma";
import type { Metadata } from "next";

import BateaDetail from "./batea-detail";

type Props = { params: Promise<{ id: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const folder = await prisma.folder.findFirst({
    where: { id, visibility: { not: "PRIVATE" } },
    select: { name: true, description: true, user: { select: { name: true } } },
  });

  if (!folder) {
    return { title: "Batea no encontrada" };
  }

  const title = `${folder.name} — Batea de ${folder.user.name}`;
  const description = folder.description || `Coleccion de vinilos de ${folder.user.name}`;

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      type: "website",
    },
    twitter: {
      card: "summary",
      title,
      description,
    },
  };
}

export default async function BateaPage({ params }: Props) {
  const { id } = await params;
  return <BateaDetail id={id} />;
}
