import { TRPCError } from "@trpc/server";
import { ArrowLeft, Lock } from "lucide-react";
import type { Metadata, Route } from "next";
import Link from "next/link";

import { Cover } from "@/components/dj/cover";
import { Avatar } from "@/components/profile/avatar";
import { EmptyState } from "@/components/shell/empty-state";
import { requireAdmin } from "@/server/session";
import { getServerCaller } from "@/server/trpc";

export const metadata: Metadata = {
  title: "Usuario",
  robots: { index: false, follow: false },
};

const TYPE_LABELS: Record<string, string> = { GENRE: "Género", SET: "Set", OTHER: "Otra" };
const VISIBILITY_LABELS: Record<string, string> = { PUBLIC: "Pública", ACCOUNT: "Con cuenta", PRIVATE: "Privada" };

async function findUser(userId: string) {
  const caller = await getServerCaller();
  try {
    return await caller.adminGetUser({ userId });
  } catch (error) {
    if (error instanceof TRPCError && (error.code === "NOT_FOUND" || error.code === "BAD_REQUEST")) return null;
    throw error;
  }
}

function BackToAdmin() {
  return (
    <Link
      href="/admin"
      className="mb-6 inline-flex min-h-11 items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground md:min-h-0"
    >
      <ArrowLeft aria-hidden="true" className="size-4" />
      Admin
    </Link>
  );
}

export default async function AdminUserPage({ params }: PageProps<"/admin/user/[id]">) {
  await requireAdmin();
  const { id } = await params;
  const user = await findUser(id);

  if (!user) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-6 md:px-8 md:py-8">
        <BackToAdmin />
        <EmptyState title="Usuario no encontrado" description="Puede que ya se haya eliminado" />
      </div>
    );
  }

  const facts = [
    user.role === "admin" ? "Admin" : "Usuario",
    user.emailVerified ? "Verificado" : "Sin verificar",
    `Alta ${user.createdAt.toLocaleDateString("es-AR")}`,
  ];

  return (
    <div className="mx-auto max-w-3xl px-4 py-6 md:px-8 md:py-8">
      <BackToAdmin />

      <header className="flex items-start gap-4">
        <Avatar name={user.name} src={user.image} />
        <div className="min-w-0 flex-1">
          <h1 className="truncate font-heading text-3xl leading-none font-bold">{user.name}</h1>
          <p className="mt-1 truncate text-sm text-muted-foreground">{user.email}</p>
          <p className="mt-1 text-[13px] text-muted-foreground">
            {user.banned && <span className="text-destructive">Baneado · </span>}
            {facts.join(" · ")}
          </p>
        </div>
      </header>

      <dl className="mt-8 flex gap-10 border-t border-border pt-6">
        <div className="flex flex-col-reverse">
          <dt className="mt-1 text-sm text-muted-foreground">Vinilos</dt>
          <dd className="font-heading text-3xl leading-none font-bold tabular">{user._count.vinyls}</dd>
        </div>
        <div className="flex flex-col-reverse">
          <dt className="mt-1 text-sm text-muted-foreground">Carpetas</dt>
          <dd className="font-heading text-3xl leading-none font-bold tabular">{user._count.folders}</dd>
        </div>
      </dl>

      {user.folders.length > 0 && (
        <section className="mt-8">
          <h2 className="text-base font-semibold">Carpetas</h2>
          <ul className="mt-2 divide-y divide-border border-y border-border">
            {user.folders.map((folder) => (
              <li key={folder.id}>
                <Link href={`/folders/${folder.id}` as Route} className="group flex items-center gap-3 py-3">
                  {folder.color && (
                    <span aria-hidden="true" className="size-2.5 shrink-0" style={{ backgroundColor: folder.color }} />
                  )}
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-medium group-hover:underline">{folder.name}</span>
                    <span className="block truncate text-[13px] text-muted-foreground">
                      {TYPE_LABELS[folder.type] ?? folder.type} · {folder._count.vinyls} vinilos ·{" "}
                      {folder._count.collaborators} colaboradores
                    </span>
                  </span>
                  <span className="flex shrink-0 items-center gap-1.5 text-[13px] text-muted-foreground">
                    {folder.visibility === "PRIVATE" && <Lock aria-hidden="true" className="size-3.5" />}
                    {VISIBILITY_LABELS[folder.visibility] ?? folder.visibility}
                    <span className="tabular"> · {folder.viewCount} vistas</span>
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}

      {user.vinyls.length > 0 && (
        <section className="mt-8">
          <h2 className="text-base font-semibold">Vinilos recientes</h2>
          <ul className="mt-3 grid grid-cols-2 gap-x-3 gap-y-4 sm:grid-cols-3 md:grid-cols-4">
            {user.vinyls.map((vinyl) => (
              <li key={vinyl.id} className="min-w-0">
                <Link href={`/vinyl/${vinyl.id}` as Route} className="group block">
                  <Cover src={vinyl.coverUrl} alt="" sizes="(min-width: 768px) 170px, 45vw" />
                  <span className="mt-1.5 block truncate text-[13px] font-medium group-hover:underline">{vinyl.title}</span>
                  <span className="block truncate text-[13px] text-muted-foreground">{vinyl.artist}</span>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}

      <p className="mt-8 text-xs text-muted-foreground">ID {user.id}</p>
    </div>
  );
}
