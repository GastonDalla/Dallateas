import { ArrowLeft } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";

import { PageHeader } from "@/components/shell/page-header";
import { requireSession } from "@/server/session";

import { SessionsList } from "./sessions-list";

export const metadata: Metadata = {
  title: "Sesiones",
  robots: { index: false, follow: false },
};

export default async function Sessions() {
  const { session } = await requireSession();

  return (
    <div className="mx-auto max-w-2xl px-4 py-6 md:px-8 md:py-8">
      <Link
        href="/settings"
        className="mb-6 inline-flex min-h-11 items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground md:min-h-0"
      >
        <ArrowLeft aria-hidden="true" className="size-4" />
        Configuración
      </Link>
      <PageHeader title="Mis sesiones" description="Dónde tenés la cuenta abierta" className="mb-6" />
      <SessionsList currentSessionId={session.id} />
    </div>
  );
}
