"use client";

import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, Calendar, Disc3, Eye, EyeOff, Folder, Lock, Mail, Music, User } from "lucide-react";
import Link from "next/link";
import { useParams } from "next/navigation";

import { trpc } from "@/utils/trpc";

export default function AdminUserPage() {
  const { id } = useParams<{ id: string }>();
  const userQuery = useQuery(trpc.adminGetUser.queryOptions({ userId: id }));
  const user = userQuery.data;

  if (userQuery.isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Disc3 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-8">
        <Link href="/admin" className="mb-5 inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft className="h-4 w-4" /> Admin
        </Link>
        <p className="text-sm text-muted-foreground">Usuario no encontrado.</p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-8 pb-24">
      <Link href="/admin" className="mb-6 inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="h-4 w-4" /> Admin
      </Link>

      {/* User header */}
      <section className="mb-6 flex items-center gap-4 rounded-lg border border-border/60 bg-card p-4 shadow-sm">
        <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-primary/10">
          {user.image ? (
            <img src={user.image} alt="" className="h-14 w-14 rounded-full object-cover" width={56} height={56} />
          ) : (
            <User className="h-7 w-7 text-primary" />
          )}
        </div>
        <div className="flex-1 min-w-0">
          <h1 className="font-heading text-xl font-bold truncate">{user.name}</h1>
          <p className="flex items-center gap-1 text-sm text-muted-foreground">
            <Mail className="h-3.5 w-3.5" /> {user.email}
          </p>
          <div className="mt-1 flex flex-wrap items-center gap-2 text-xs">
            <span className={`rounded-full px-2 py-0.5 font-medium ${user.role === "admin" ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground"}`}>
              {user.role}
            </span>
            {user.banned && <span className="rounded-full bg-destructive/10 px-2 py-0.5 text-destructive">Baneado</span>}
            {user.emailVerified && <span className="rounded-full bg-green-500/10 px-2 py-0.5 text-green-600">Verificado</span>}
            <span className="flex items-center gap-1 text-muted-foreground">
              <Calendar className="h-3 w-3" /> {new Date(user.createdAt).toLocaleDateString("es-AR")}
            </span>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="mb-6 grid grid-cols-2 gap-3">
        <div className="flex items-center gap-3 rounded-lg border border-border/60 bg-card p-4 shadow-sm">
          <Music className="h-5 w-5 text-primary" />
          <div>
            <p className="font-heading text-xl font-bold">{user._count.vinyls}</p>
            <p className="text-xs text-muted-foreground">Vinilos</p>
          </div>
        </div>
        <div className="flex items-center gap-3 rounded-lg border border-border/60 bg-card p-4 shadow-sm">
          <Folder className="h-5 w-5 text-primary" />
          <div>
            <p className="font-heading text-xl font-bold">{user._count.folders}</p>
            <p className="text-xs text-muted-foreground">Carpetas</p>
          </div>
        </div>
      </section>

      {/* Folders */}
      {user.folders.length > 0 && (
        <section className="mb-6 space-y-3">
          <h2 className="font-heading text-lg font-semibold">Carpetas</h2>
          <div className="space-y-2">
            {user.folders.map((folder: any) => (
              <Link key={folder.id} href={`/folders/${folder.id}` as any} className="flex items-center gap-3 rounded-lg border border-border/60 bg-card p-3 shadow-sm transition-colors hover:bg-accent">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg" style={{ backgroundColor: folder.color ? `${folder.color}20` : undefined }}>
                  <Folder className="h-4 w-4" style={{ color: folder.color ?? undefined }} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{folder.name}</p>
                  <p className="text-[10px] text-muted-foreground">
                    {folder.type} · {folder._count.vinyls} vinilos · {folder._count.collaborators} colaboradores
                  </p>
                </div>
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  {folder.visibility === "PUBLIC" ? <Eye className="h-3.5 w-3.5 text-green-500" /> : folder.visibility === "ACCOUNT" ? <Lock className="h-3.5 w-3.5 text-blue-500" /> : <EyeOff className="h-3.5 w-3.5" />}
                  <span>{folder.viewCount} vistas</span>
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* Recent vinyls */}
      {user.vinyls.length > 0 && (
        <section className="space-y-3">
          <h2 className="font-heading text-lg font-semibold">Vinilos recientes</h2>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-4">
            {user.vinyls.map((vinyl: any) => (
              <Link key={vinyl.id} href={`/vinyl/${vinyl.id}` as any} className="block rounded-lg border border-border/60 bg-card p-2 shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md">
                <div className="aspect-square overflow-hidden rounded-md bg-muted mb-1.5">
                  {vinyl.coverUrl ? (
                    <img src={vinyl.coverUrl} alt={vinyl.title} className="h-full w-full object-cover" loading="lazy" decoding="async" width={150} height={150} />
                  ) : (
                    <div className="flex h-full items-center justify-center">
                      <Disc3 className="h-6 w-6 text-muted-foreground/30" />
                    </div>
                  )}
                </div>
                <p className="truncate text-[11px] font-medium">{vinyl.title}</p>
                <p className="truncate text-[10px] text-muted-foreground">{vinyl.artist}</p>
              </Link>
            ))}
          </div>
        </section>
      )}

      <p className="mt-6 text-center text-[10px] text-muted-foreground">ID: {user.id}</p>
    </div>
  );
}
