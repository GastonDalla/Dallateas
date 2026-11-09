import { ChevronRight } from "lucide-react";
import type { Metadata, Route } from "next";
import Link from "next/link";

import { Avatar } from "@/components/profile/avatar";
import { FormSection } from "@/components/profile/fields";
import { PageHeader } from "@/components/shell/page-header";
import { requireSession } from "@/server/session";
import { getServerCaller } from "@/server/trpc";

import { AccountName } from "./account-name";
import { PasswordSection } from "./password-section";
import { SignOutButton } from "./sign-out-button";

export const metadata: Metadata = {
  title: "Configuración",
  robots: { index: false, follow: false },
};

const SHORTCUTS: { href: Route; title: string; description: string }[] = [
  { href: "/profile", title: "Perfil DJ", description: "Tu página pública, redes, sets y fechas" },
  { href: "/sessions", title: "Sesiones activas", description: "Dónde tenés la cuenta abierta" },
];

export default async function Settings() {
  const { user } = await requireSession();
  const caller = await getServerCaller();
  const [stats, folders] = await Promise.all([caller.collectionStats(), caller.foldersList()]);

  return (
    <div className="mx-auto max-w-4xl px-4 py-6 md:px-8 md:py-8">
      <PageHeader title="Configuración" className="mb-8" />

      <FormSection title="Cuenta" description="Tu nombre y cómo te identificamos">
        <div className="flex items-start gap-4">
          <Avatar name={user.name} src={user.image} />
          <div className="min-w-0 flex-1">
            <AccountName name={user.name} />
            <p className="truncate text-sm text-muted-foreground">{user.email}</p>
            {user.username && <p className="truncate text-sm text-muted-foreground">@{user.username}</p>}
          </div>
        </div>
      </FormSection>

      <FormSection title="Tu colección">
        <dl className="flex gap-10">
          <div className="flex flex-col-reverse">
            <dt className="mt-1 text-sm text-muted-foreground">Vinilos</dt>
            <dd className="font-heading text-3xl font-bold leading-none tabular">{stats.totalVinyls}</dd>
          </div>
          <div className="flex flex-col-reverse">
            <dt className="mt-1 text-sm text-muted-foreground">Carpetas</dt>
            <dd className="font-heading text-3xl font-bold leading-none tabular">{folders.length}</dd>
          </div>
        </dl>
      </FormSection>

      <FormSection title="Más opciones">
        <ul className="-mt-3 divide-y divide-border">
          {SHORTCUTS.map(({ href, title, description }) => (
            <li key={href}>
              <Link href={href} className="group flex items-center justify-between gap-4 py-3">
                <span className="min-w-0">
                  <span className="block text-sm font-medium group-hover:underline">{title}</span>
                  <span className="block text-[13px] text-muted-foreground">{description}</span>
                </span>
                <ChevronRight aria-hidden="true" className="size-4 shrink-0 text-muted-foreground" />
              </Link>
            </li>
          ))}
        </ul>
      </FormSection>

      <PasswordSection />

      <FormSection title="Sesión" description="Cierra la sesión en este dispositivo">
        <SignOutButton />
      </FormSection>
    </div>
  );
}
