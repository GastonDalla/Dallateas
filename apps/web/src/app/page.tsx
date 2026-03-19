"use client";

import { useQuery } from "@tanstack/react-query";
import { Disc3, FolderOpen, Music, Users } from "lucide-react";
import Link from "next/link";

import { authClient } from "@/lib/auth-client";
import { trpc } from "@/utils/trpc";

export default function Home() {
  const { data: session } = authClient.useSession();
  const publicFolders = useQuery(trpc.publicFolders.queryOptions({}));
  const stats = useQuery(trpc.publicStats.queryOptions());
  const folders = publicFolders.data?.items ?? [];

  return (
    <div className="flex flex-col gap-10 pb-24">
      {/* Hero */}
      <section className="relative flex flex-col items-center gap-5 px-4 pt-16 text-center">
        <div className="absolute inset-0 -z-10 bg-gradient-to-b from-primary/5 to-transparent" />
        <div className="flex h-14 w-14 items-center justify-center rounded-full bg-primary/10">
          <Disc3 className="h-8 w-8 text-primary" />
        </div>
        <div className="space-y-2">
          <h1 className="font-heading text-4xl font-bold tracking-tight md:text-5xl">
            Dallateas
          </h1>
          <p className="mx-auto max-w-md text-sm text-muted-foreground md:text-base">
            Organiza tu coleccion de vinilos en bateas, arma tus sets y comparti
            tus carpetas con el mundo.
          </p>
        </div>
        {!session ? (
          <div className="flex gap-3 pt-2">
            <Link
              href="/register"
              className="rounded-md bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground shadow-sm transition-colors hover:bg-primary/90"
            >
              Crear cuenta
            </Link>
            <Link
              href="/login"
              className="rounded-md border border-border bg-card px-5 py-2.5 text-sm font-medium text-foreground shadow-sm transition-colors hover:bg-accent"
            >
              Ingresar
            </Link>
          </div>
        ) : (
          <div className="flex gap-3 pt-2">
            <Link
              href="/dashboard"
              className="rounded-md bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground shadow-sm transition-colors hover:bg-primary/90"
            >
              Ir a mi coleccion
            </Link>
            <Link
              href="/bateas"
              className="rounded-md border border-border bg-card px-5 py-2.5 text-sm font-medium text-foreground shadow-sm transition-colors hover:bg-accent"
            >
              Explorar bateas
            </Link>
          </div>
        )}
      </section>

      {/* Stats */}
      {stats.data && (
        <section className="mx-auto grid max-w-lg grid-cols-3 gap-3 px-4">
          <div className="flex flex-col items-center gap-1 rounded-lg border border-border/60 bg-card p-4 shadow-sm">
            <Music className="h-5 w-5 text-primary" />
            <span className="font-heading text-2xl font-bold">
              {stats.data.totalVinyls}
            </span>
            <span className="text-[11px] text-muted-foreground">Vinilos</span>
          </div>
          <div className="flex flex-col items-center gap-1 rounded-lg border border-border/60 bg-card p-4 shadow-sm">
            <FolderOpen className="h-5 w-5 text-primary" />
            <span className="font-heading text-2xl font-bold">
              {stats.data.totalPublicFolders}
            </span>
            <span className="text-[11px] text-muted-foreground">
              Bateas publicas
            </span>
          </div>
          <div className="flex flex-col items-center gap-1 rounded-lg border border-border/60 bg-card p-4 shadow-sm">
            <Users className="h-5 w-5 text-primary" />
            <span className="font-heading text-2xl font-bold">
              {stats.data.totalUsers}
            </span>
            <span className="text-[11px] text-muted-foreground">
              Coleccionistas
            </span>
          </div>
        </section>
      )}

      {/* Features — only for non-authenticated users */}
      {!session && (
        <section className="mx-auto grid max-w-2xl grid-cols-3 gap-3 px-4">
          {[
            { icon: Music, title: "Cataloga", desc: "Tus vinilos con metadata de Discogs y barcode" },
            { icon: FolderOpen, title: "Organiza", desc: "Bateas por genero, sets o como quieras" },
            { icon: Users, title: "Comparti", desc: "Hace publicas tus bateas favoritas" },
          ].map((feat) => (
            <div
              key={feat.title}
              className="flex flex-col items-center gap-2.5 rounded-lg border border-border/60 bg-card p-4 text-center shadow-sm"
            >
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
                <feat.icon className="h-5 w-5 text-primary" />
              </div>
              <span className="font-heading text-sm font-semibold">{feat.title}</span>
              <span className="text-[11px] leading-snug text-muted-foreground">{feat.desc}</span>
            </div>
          ))}
        </section>
      )}

      {/* Public Bateas */}
      {folders.length > 0 && (
        <section className="mx-auto w-full max-w-3xl px-4">
          <div className="mb-5 flex items-center justify-between">
            <h2 className="font-heading text-xl font-semibold">Bateas publicas</h2>
            <Link href="/bateas" className="text-xs font-medium text-primary hover:underline">
              Ver todas
            </Link>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            {folders.map((folder) => (
              <Link
                key={folder.id}
                href={`/batea/${folder.id}` as any}
                className="group flex flex-col gap-3 rounded-lg border border-border/60 bg-card p-4 shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {folder.color && (
                      <div className="h-3 w-3 rounded-full" style={{ backgroundColor: folder.color }} />
                    )}
                    <h3 className="font-heading font-semibold">{folder.name}</h3>
                  </div>
                  <span className="text-xs text-muted-foreground">{folder.vinylCount} vinilos</span>
                </div>
                {folder.description && (
                  <p className="line-clamp-2 text-xs text-muted-foreground">{folder.description}</p>
                )}
                {folder.vinyls.length > 0 && (
                  <div className="grid grid-cols-4 gap-1.5">
                    {folder.vinyls.slice(0, 4).map((vinyl: any) => (
                      <div key={vinyl.id} className="aspect-square overflow-hidden rounded-md bg-muted">
                        {vinyl.coverUrl ? (
                          <img src={vinyl.coverUrl} alt={vinyl.title} loading="lazy" decoding="async" width={80} height={80} className="h-full w-full object-cover" />
                        ) : (
                          <div className="flex h-full items-center justify-center">
                            <Disc3 className="h-4 w-4 text-muted-foreground/40" />
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
                <p className="text-xs text-muted-foreground">por {folder.owner.name}</p>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* Empty state */}
      {folders.length === 0 && !publicFolders.isLoading && (
        <section className="mx-auto w-full max-w-md px-4 text-center">
          <div className="rounded-lg border border-dashed border-border/60 p-10">
            <Disc3 className="mx-auto mb-3 h-10 w-10 text-muted-foreground/30" />
            <p className="text-sm text-muted-foreground">
              Todavia no hay bateas publicas. Se el primero en compartir tu coleccion.
            </p>
          </div>
        </section>
      )}
    </div>
  );
}
