import { ArrowLeft } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";

import { PageHeader } from "@/components/shell/page-header";
import { requireSession } from "@/server/session";

import ImportPage from "./import-page";

export const metadata: Metadata = {
  title: "Importar vinilos",
  robots: { index: false, follow: false },
};

export default async function Import() {
  await requireSession();

  return (
    <div className="mx-auto flex w-full max-w-4xl flex-col gap-6 px-4 py-6 md:px-8 md:py-8">
      <Link
        href="/dashboard"
        className="inline-flex h-11 items-center gap-1.5 self-start text-sm text-muted-foreground transition-colors hover:text-foreground md:h-auto"
      >
        <ArrowLeft aria-hidden="true" className="size-4" />
        Colección
      </Link>
      <PageHeader title="Importar vinilos" description="Traé tu colección desde un CSV o desde tu cuenta de Discogs" />
      <ImportPage />
    </div>
  );
}
