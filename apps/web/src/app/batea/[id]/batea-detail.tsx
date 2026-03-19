"use client";

import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, Disc3, ListMusic, Lock } from "lucide-react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";

import { Button } from "@dallateas/ui/components/button";
import { Input } from "@dallateas/ui/components/input";
import { QrDownload } from "@/components/qr-download";
import { VinylCard } from "@/components/vinyl-card";
import { trpc } from "@/utils/trpc";

export default function BateaDetail({ id }: { id: string }) {
  const searchParams = useSearchParams();
  const urlPassword = searchParams.get("pw") ?? undefined;
  const [password, setPassword] = useState("");
  const [submittedPassword, setSubmittedPassword] = useState<string | undefined>(urlPassword);

  useEffect(() => {
    if (urlPassword && typeof window !== "undefined") {
      const url = new URL(window.location.href);
      url.searchParams.delete("pw");
      window.history.replaceState({}, "", url.toString());
    }
  }, [urlPassword]);

  const folderQuery = useQuery(
    trpc.publicFolderDetail.queryOptions({
      id,
      password: submittedPassword,
    }),
  );
  const folder = folderQuery.data;

  if (folderQuery.isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Disc3 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!folder) {
    return (
      <div className="flex flex-col items-center gap-4 py-20 text-center">
        <p className="text-sm text-muted-foreground">Esta batea no existe o no es publica.</p>
        <Link href="/bateas" className="text-sm text-primary underline">Ver todas las bateas</Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-6 pb-20">
      <Link
        href="/bateas"
        className="mb-5 inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" />
        Explorar bateas
      </Link>

      <header className="mb-6 space-y-3">
        <div className="flex items-start justify-between gap-3">
          <div className="space-y-2">
            <div className="flex items-center gap-2.5">
              {folder.color && (
                <div className="h-4 w-4 rounded-full" style={{ backgroundColor: folder.color }} />
              )}
              <h1 className="font-heading text-2xl font-bold">{folder.name}</h1>
              {folder.hasPassword && <Lock className="h-4 w-4 text-muted-foreground" />}
            </div>
            {folder.description && (
              <p className="text-sm text-muted-foreground">{folder.description}</p>
            )}
            <p className="text-xs text-muted-foreground">
              por {folder.user.name} · {folder.locked ? "contenido protegido" : `${folder.vinyls.length} vinilos`}
            </p>
          </div>
          {!folder.locked && (
            <QrDownload
              url={typeof window !== "undefined" ? window.location.href : ""}
              label={folder.name}
            />
          )}
        </div>
      </header>

      {}
      {folder.locked ? (
        <div className="flex flex-col items-center gap-4 rounded-lg border border-dashed border-border/60 py-16 text-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-muted">
            <Lock className="h-8 w-8 text-muted-foreground" />
          </div>
          <div className="space-y-1">
            <p className="text-sm font-medium">Esta batea tiene contrasena</p>
            <p className="text-xs text-muted-foreground">Ingresa la contrasena para ver el contenido.</p>
          </div>
          <div className="flex w-full max-w-xs gap-2">
            <Input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Contrasena"
              onKeyDown={(e) => {
                if (e.key === "Enter" && password.trim()) {
                  setSubmittedPassword(password.trim());
                }
              }}
            />
            <Button
              type="button"
              disabled={!password.trim()}
              onClick={() => setSubmittedPassword(password.trim())}
            >
              Entrar
            </Button>
          </div>
          {submittedPassword && (
            <p className="text-xs text-red-500">Contrasena incorrecta</p>
          )}
        </div>
      ) : folder.vinyls.length === 0 ? (
        <div className="flex flex-col items-center gap-3 rounded-lg border border-dashed border-border/60 py-16 text-center">
          <Disc3 className="h-10 w-10 text-muted-foreground/30" />
          <p className="text-sm text-muted-foreground">Esta batea todavia no tiene vinilos.</p>
        </div>
      ) : folder.type === "SET" ? (
        <div className="space-y-0">
          <div className="mb-3 flex items-center gap-2 text-xs text-muted-foreground">
            <ListMusic className="h-4 w-4" />
            <span>Tracklist · {folder.vinyls.length} tracks</span>
          </div>
          {folder.vinyls.map((vinyl: any, i: number) => (
            <Link
              key={vinyl.id}
              href={`/batea/${id}/vinyl/${vinyl.id}` as any}
              className="group flex items-center gap-3 border-b border-border/40 px-2 py-3 transition-colors last:border-b-0 hover:bg-muted/50"
            >
              <span className="w-6 shrink-0 text-right text-xs font-medium text-muted-foreground">
                {i + 1}
              </span>
              <div className="h-10 w-10 shrink-0 overflow-hidden rounded bg-muted">
                {vinyl.coverUrl ? (
                  <img src={vinyl.coverUrl} alt={vinyl.title} loading="lazy" decoding="async" width={40} height={40} className="h-full w-full object-cover" />
                ) : (
                  <div className="flex h-full items-center justify-center">
                    <Disc3 className="h-4 w-4 text-muted-foreground/30" />
                  </div>
                )}
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium group-hover:text-primary">{vinyl.title}</p>
                <p className="truncate text-xs text-muted-foreground">
                  {vinyl.artist}
                  {vinyl.label && <span> · {vinyl.label}</span>}
                </p>
              </div>
              <div className="hidden shrink-0 items-center gap-3 text-[11px] text-muted-foreground sm:flex">
                {vinyl.genre && (
                  <span className="rounded-full bg-primary/10 px-2 py-0.5 text-primary">{vinyl.genre}</span>
                )}
                {vinyl.style && (
                  <span className="rounded-full bg-accent px-2 py-0.5 text-accent-foreground">{vinyl.style.split(",")[0]?.trim()}</span>
                )}
                {vinyl.bpm && <span>{vinyl.bpm} BPM</span>}
                {vinyl.year && <span>{vinyl.year}</span>}
              </div>
            </Link>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
          {folder.vinyls.map((vinyl: any) => (
            <VinylCard
              key={vinyl.id}
              id={vinyl.id}
              title={vinyl.title}
              artist={vinyl.artist}
              genre={vinyl.genre}
              style={vinyl.style}
              coverUrl={vinyl.coverUrl}
              href={`/batea/${id}/vinyl/${vinyl.id}`}
            />
          ))}
        </div>
      )}
    </div>
  );
}
