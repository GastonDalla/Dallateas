import { Button } from "@dallateas/ui/components/button";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { after } from "next/server";

import { EmptyState } from "@/components/shell/empty-state";
import { serializeJsonLd } from "@/lib/json-ld";
import { getServerCaller } from "@/server/trpc";

import { crateJsonLd, metaDescription, shareableImage, SITE_URL, socialCard } from "../seo";
import BateaDetail from "./batea-detail";
import { loadCrate } from "./load-crate";

type Props = { params: Promise<{ id: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const crate = await loadCrate(id);

  if (crate.status === "missing") return { title: "Batea no encontrada", robots: { index: false } };
  if (crate.status === "account-required") return { title: "Batea para miembros", robots: { index: false } };

  const { folder } = crate;
  const title = `${folder.name}, batea de ${folder.user.name}`;
  const description = metaDescription(
    folder.description ?? `Vinilos de ${folder.user.name} en Dallateas, con el BPM de cada disco en la tapa.`,
  );
  const cover = shareableImage(folder.vinyls.find(({ coverUrl }) => shareableImage(coverUrl))?.coverUrl);

  return {
    title,
    description,
    alternates: { canonical: `/batea/${id}` },
    robots: { index: folder.visibility === "PUBLIC" && !folder.locked },
    ...socialCard({ title, description, image: cover }),
  };
}

export default async function BateaPage({ params }: Props) {
  const { id } = await params;
  const crate = await loadCrate(id);

  if (crate.status === "missing") notFound();

  if (crate.status === "account-required") {
    return (
      <div className="mx-auto max-w-[75rem] px-4 py-8 md:px-8 md:py-12">
        <EmptyState
          title="Esta batea es para gente con cuenta"
          description="Ingresá para verla."
          action={
            <Button render={<Link href="/login" />} nativeButton={false} className="h-11 px-4 text-sm">
              Ingresar
            </Button>
          }
        />
      </div>
    );
  }

  const caller = await getServerCaller();
  after(() => caller.folderRecordView({ id }).catch((error) => console.error("Folder view not recorded", error)));

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: serializeJsonLd(crateJsonLd(crate.folder, SITE_URL)) }}
      />
      <BateaDetail folder={crate.folder} />
    </>
  );
}
