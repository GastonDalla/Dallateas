import prisma from "@dallateas/db";
import type { Metadata } from "next";
import { after } from "next/server";

import { getServerCaller } from "@/server/trpc";

import BateaDetail from "./batea-detail";

type Props = { params: Promise<{ id: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const folder = await prisma.folder.findFirst({
    where: { id, visibility: "PUBLIC" },
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
  const caller = await getServerCaller();
  after(() => caller.folderRecordView({ id }).catch((error) => console.error("Folder view not recorded", error)));

  return <BateaDetail id={id} />;
}
