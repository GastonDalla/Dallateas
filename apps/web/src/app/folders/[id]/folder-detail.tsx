"use client";

import {
  closestCenter,
  DndContext,
  type DragEndEvent,
  PointerSensor,
  TouchSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import {
  arrayMove,
  rectSortingStrategy,
  SortableContext,
} from "@dnd-kit/sortable";
import { Button } from "@dallateas/ui/components/button";
import { Input } from "@dallateas/ui/components/input";
import { useMutation, useQuery } from "@tanstack/react-query";
import {
  ArrowLeft,
  Disc3,
  FileDown,
  Copy,
  Globe,
  GripVertical,
  Lock,
  QrCode,
  Users as UsersIcon,
  Trash2,
  UserPlus,
  Users,
} from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { toast } from "sonner";

import { CustomSelect } from "@/components/custom-select";
import { useHaptic } from "@/hooks/use-haptic";
import { ExportPdf } from "@/components/export-pdf";
import { QrDownload } from "@/components/qr-download";
import { SortableItem } from "@/components/sortable-item";
import { VinylCard } from "@/components/vinyl-card";
import { queryClient, trpc } from "@/utils/trpc";

const ROLES = [
  { value: "VIEWER", label: "Solo ver" },
  { value: "CONTRIBUTOR", label: "Agregar" },
  { value: "EDITOR", label: "Agregar + Eliminar" },
  { value: "ADMIN", label: "Todo" },
] as const;

export default function FolderDetail({ id }: { id: string }) {
  const haptic = useHaptic();
  const folderQuery = useQuery(trpc.folderGet.queryOptions({ id }));
  const folder = folderQuery.data;
  const isOwnerCheck = (folder as any)?.isOwner ?? false;
  const collabsQuery = useQuery({
    ...trpc.folderCollaborators.queryOptions({ folderId: id }),
    enabled: isOwnerCheck,
  });
  const collabs = collabsQuery.data ?? [];

  const [showInvite, setShowInvite] = useState(false);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState<"VIEWER" | "CONTRIBUTOR" | "EDITOR" | "ADMIN">("VIEWER");
  const [showQr, setShowQr] = useState(false);

  const reorderVinyls = useMutation({
    ...trpc.folderReorderVinyls.mutationOptions(),
    onError: () => {
      queryClient.invalidateQueries({ queryKey: trpc.folderGet.queryOptions({ id }).queryKey });
      toast.error("Error al reordenar");
    },
  });

  const invite = useMutation({
    ...trpc.folderInvite.mutationOptions(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: trpc.folderCollaborators.queryOptions({ folderId: id }).queryKey });
      setInviteEmail("");
      setShowInvite(false);
      toast.success("Colaborador invitado");
    },
    onError: (err) => toast.error(err.message),
  });

  const removeCollab = useMutation({
    ...trpc.folderRemoveCollaborator.mutationOptions(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: trpc.folderCollaborators.queryOptions({ folderId: id }).queryKey });
      toast.success("Colaborador eliminado");
    },
  });

  const updateRole = useMutation({
    ...trpc.folderUpdateCollaboratorRole.mutationOptions(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: trpc.folderCollaborators.queryOptions({ folderId: id }).queryKey });
    },
  });

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 200, tolerance: 5 } }),
  );

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over || active.id === over.id || !folder) return;
    const oldIndex = folder.vinyls.findIndex((v: any) => v.id === active.id);
    const newIndex = folder.vinyls.findIndex((v: any) => v.id === over.id);
    if (oldIndex === -1 || newIndex === -1) return;
    const newOrder = arrayMove(folder.vinyls, oldIndex, newIndex);
    haptic.trigger("medium");
    queryClient.setQueryData(trpc.folderGet.queryOptions({ id }).queryKey, { ...folder, vinyls: newOrder });
    reorderVinyls.mutate({ folderId: id, vinylOrder: newOrder.map((v: any) => v.id) });
  }

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
        <p className="text-sm text-muted-foreground">Carpeta no encontrada.</p>
        <Link href="/folders" className="text-sm text-primary underline">Volver a carpetas</Link>
      </div>
    );
  }

  const vinylIds = folder.vinyls.map((v: any) => v.id);
  const publicUrl = typeof window !== "undefined" ? `${window.location.origin}/batea/${id}` : "";

  const isOwner = (folder as any).isOwner ?? true;
  const role: string | null = (folder as any).collaboratorRole ?? null;
  const canEdit = isOwner || role === "EDITOR" || role === "ADMIN";
  const canAdd = isOwner || role === "CONTRIBUTOR" || role === "EDITOR" || role === "ADMIN";
  const canManageCollabs = isOwner;
  const canReorder = isOwner || role === "EDITOR" || role === "ADMIN";

  return (
    <div className="mx-auto max-w-3xl px-4 py-6 pb-24">
      <Link href="/folders" className="mb-5 inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground">
        <ArrowLeft className="h-4 w-4" /> Carpetas
      </Link>

      <header className="mb-6 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            {folder.color && <div className="h-4 w-4 rounded-full" style={{ backgroundColor: folder.color }} />}
            <h1 className="font-heading text-2xl font-bold">{folder.name}</h1>
            <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] ${
              folder.visibility === "PUBLIC" ? "bg-green-500/10 text-green-600 dark:text-green-400" :
              folder.visibility === "ACCOUNT" ? "bg-blue-500/10 text-blue-600 dark:text-blue-400" :
              "bg-muted text-muted-foreground"
            }`}>
              {folder.visibility === "PUBLIC" ? <><Globe className="h-3 w-3" /> Publica</> :
               folder.visibility === "ACCOUNT" ? <><UsersIcon className="h-3 w-3" /> Con cuenta</> :
               <><Lock className="h-3 w-3" /> Privada</>}
            </span>
          </div>
          <div className="flex items-center gap-1.5">
            {folder.visibility !== "PRIVATE" && (
              <>
                <Button
                  type="button"
                  variant="outline"
                  size="icon-sm"
                  onClick={() => {
                    const url = folder.password
                      ? `${publicUrl}?pw=${encodeURIComponent(folder.password)}`
                      : publicUrl;
                    navigator.clipboard.writeText(url);
                    toast.success("Link copiado");
                  }}
                  title="Copiar link"
                >
                  <Copy className="h-3.5 w-3.5" />
                </Button>
                <Button type="button" variant="outline" size="icon-sm" onClick={() => setShowQr(!showQr)} title="QR Code">
                  <QrCode className="h-3.5 w-3.5" />
                </Button>
              </>
            )}
            {folder.vinyls.length > 0 && (
              <ExportPdf
                title={folder.name}
                vinyls={folder.vinyls.map((v: any) => ({
                  title: v.title, artist: v.artist, label: v.label,
                  genre: v.genre, year: v.year, bpm: v.bpm,
                }))}
              />
            )}
          </div>
        </div>
        {folder.description && <p className="text-sm text-muted-foreground">{folder.description}</p>}
        <p className="flex flex-wrap items-center gap-1.5 text-xs text-muted-foreground">
          {!isOwner && (folder as any).owner && (
            <span>de <span className="font-medium text-foreground">{(folder as any).owner.name}</span> ·</span>
          )}
          {folder.vinyls.length} vinilos
          {canReorder && folder.vinyls.length > 1 && (
            <span className="flex items-center gap-0.5 text-primary/60">
              <GripVertical className="h-3 w-3" /> Arrastra para reordenar
            </span>
          )}
          {role && (
            <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-medium text-primary">
              {role === "VIEWER" ? "Solo ver" : role === "CONTRIBUTOR" ? "Agregar" : role === "EDITOR" ? "Editar" : "Admin"}
            </span>
          )}
        </p>
      </header>

      {}
      {showQr && folder.visibility !== "PRIVATE" && (
        <div className="mb-6 rounded-lg border border-border/60 bg-card p-4 shadow-sm">
          <QrDownload url={publicUrl} label={folder.name} />
        </div>
      )}

      {}
      {canManageCollabs && (
      <div className="mb-6 rounded-lg border border-border/60 bg-card p-4 shadow-sm">
        <div className="mb-3 flex items-center justify-between">
          <h3 className="flex items-center gap-1.5 font-heading text-sm font-semibold">
            <Users className="h-4 w-4 text-primary" /> Colaboradores
          </h3>
          <button type="button" onClick={() => setShowInvite(!showInvite)} className="flex items-center gap-1 text-xs text-primary hover:underline">
            <UserPlus className="h-3.5 w-3.5" /> Invitar
          </button>
        </div>

        {showInvite && (
          <div className="mb-3 flex flex-wrap gap-2">
            <Input
              type="email"
              placeholder="Email del colaborador"
              value={inviteEmail}
              onChange={(e) => setInviteEmail(e.target.value)}
              className="min-w-0 flex-1"
            />
            <CustomSelect
              value={inviteRole}
              onChange={(v) => setInviteRole(v as any)}
              options={[...ROLES]}
              label="Rol del colaborador"
              className="w-32"
            />
            <Button
              type="button"
              size="sm"
              disabled={!inviteEmail.trim() || invite.isPending}
              onClick={() => invite.mutate({ folderId: id, email: inviteEmail.trim(), role: inviteRole })}
            >
              Invitar
            </Button>
          </div>
        )}

        {collabs.length === 0 ? (
          <p className="text-xs text-muted-foreground">Sin colaboradores. Invita a alguien para compartir esta carpeta.</p>
        ) : (
          <div className="space-y-2">
            {collabs.map((c: any) => (
              <div key={c.id} className="flex items-center justify-between text-xs">
                <div>
                  <span className="font-medium">{c.user.name}</span>
                </div>
                <div className="flex items-center gap-2">
                  <CustomSelect
                    value={c.role}
                    onChange={(v) => updateRole.mutate({ folderId: id, userId: c.user.id, role: v as any })}
                    options={[...ROLES]}
                    label="Cambiar rol"
                    className="w-32"
                  />
                  <button type="button" onClick={() => removeCollab.mutate({ folderId: id, userId: c.user.id })} className="text-destructive hover:text-destructive/80">
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
      )}

      {}
      {folder.vinyls.length === 0 ? (
        <div className="flex flex-col items-center gap-3 rounded-lg border border-dashed border-border/60 py-16 text-center">
          <Disc3 className="h-10 w-10 text-muted-foreground/30" />
          <p className="text-sm text-muted-foreground">
            Esta carpeta todavia no tiene vinilos. Agrega vinilos desde el boton + y asignalos a esta carpeta.
          </p>
        </div>
      ) : canReorder ? (
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
          <SortableContext items={vinylIds} strategy={rectSortingStrategy}>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
              {folder.vinyls.map((vinyl: any) => (
                <SortableItem key={vinyl.id} id={vinyl.id}>
                  <VinylCard id={vinyl.id} title={vinyl.title} artist={vinyl.artist} genre={vinyl.genre} style={vinyl.style} coverUrl={vinyl.coverUrl} href={`/vinyl/${vinyl.id}`} />
                </SortableItem>
              ))}
            </div>
          </SortableContext>
        </DndContext>
      ) : (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
          {folder.vinyls.map((vinyl: any) => (
            <VinylCard key={vinyl.id} id={vinyl.id} title={vinyl.title} artist={vinyl.artist} genre={vinyl.genre} style={vinyl.style} coverUrl={vinyl.coverUrl} href={`/vinyl/${vinyl.id}`} />
          ))}
        </div>
      )}
    </div>
  );
}
