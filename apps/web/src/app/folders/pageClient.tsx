"use client";

import { useState } from "react";

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
  SortableContext,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { useMutation, useQuery } from "@tanstack/react-query";
import {
  Disc3,
  Edit2,
  FolderOpen,
  Globe,
  GripVertical,
  Lock,
  Share2,
  Trash2,
  Users,
} from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";

import { useHaptic } from "@/hooks/use-haptic";
import { ConfirmDialog } from "@/components/confirm-dialog";
import { FolderForm } from "@/components/folder-form";
import { SortableHandleItem } from "@/components/sortable-item";
import { queryClient, trpc } from "@/utils/trpc";

const ROLE_LABELS: Record<string, string> = {
  VIEWER: "Solo ver",
  CONTRIBUTOR: "Agregar",
  EDITOR: "Editar",
  ADMIN: "Admin",
};

export default function FoldersPageClient() {
  const foldersQuery = useQuery(trpc.foldersList.queryOptions());
  const collabsQuery = useQuery(trpc.myCollaborations.queryOptions());
  const folders = foldersQuery.data ?? [];
  const collabs = collabsQuery.data ?? [];
  const foldersKey = trpc.foldersList.queryOptions().queryKey;
  const haptic = useHaptic();

  const [showCreate, setShowCreate] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const createFolder = useMutation({
    ...trpc.folderCreate.mutationOptions(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: foldersKey });
      setShowCreate(false);
      toast.success("Carpeta creada");
    },
    onError: (err) => toast.error(err.message),
  });

  const updateFolder = useMutation({
    ...trpc.folderUpdate.mutationOptions(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: foldersKey });
      setEditingId(null);
      toast.success("Carpeta actualizada");
    },
    onError: (err) => toast.error(err.message),
  });

  const deleteFolder = useMutation({
    ...trpc.folderDelete.mutationOptions(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: foldersKey });
      setDeletingId(null);
      toast.success("Carpeta eliminada");
    },
    onError: (err) => toast.error(err.message),
  });


  const reorderFolders = useMutation({
    ...trpc.folderReorder.mutationOptions(),
    onError: () => {
      queryClient.invalidateQueries({ queryKey: foldersKey });
      toast.error("Error al reordenar");
    },
  });

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 200, tolerance: 5 } }),
  );

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const oldIndex = folders.findIndex((f) => f.id === active.id);
    const newIndex = folders.findIndex((f) => f.id === over.id);
    if (oldIndex === -1 || newIndex === -1) return;

    const newOrder = arrayMove(folders, oldIndex, newIndex);

    haptic.trigger("medium");
    queryClient.setQueryData(foldersKey, newOrder);

    reorderFolders.mutate({
      folderOrder: newOrder.map((f) => f.id),
    });
  }

  const deletingFolder = folders.find((f) => f.id === deletingId);
  const folderIds = folders.map((f) => f.id);

  return (
    <div className="flex h-full flex-col gap-4 p-4 pb-20">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="font-heading text-xl font-bold">Carpetas</h1>
          <p className="text-sm text-muted-foreground">
            Organiza tus vinilos y comparti tus bateas.
            {folders.length > 1 && " Arrastra para reordenar."}
          </p>
        </div>
        {!showCreate && (
          <button
            type="button"
            onClick={() => setShowCreate(true)}
            className="rounded-md bg-primary px-3.5 py-2 text-xs font-medium text-primary-foreground shadow-sm transition-colors hover:bg-primary/90"
          >
            + Nueva
          </button>
        )}
      </header>

      {showCreate && (
        <div className="rounded-lg border border-border/60 bg-card p-4 shadow-sm">
          <h3 className="font-heading mb-3 font-semibold">Nueva carpeta</h3>
          <FolderForm
            isSubmitting={createFolder.isPending}
            onSubmit={(data) => createFolder.mutate(data)}
            onCancel={() => setShowCreate(false)}
            submitLabel="Crear carpeta"
          />
        </div>
      )}

      {foldersQuery.isLoading ? (
        <div className="flex items-center justify-center py-16">
          <Disc3 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : folders.length === 0 && !showCreate ? (
        <div className="flex flex-col items-center gap-3 py-16 text-center">
          <FolderOpen className="h-10 w-10 text-muted-foreground/30" />
          <p className="text-sm text-muted-foreground">
            Todavia no tenes carpetas. Crea una para organizar tus vinilos.
          </p>
        </div>
      ) : (
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
          <SortableContext items={folderIds} strategy={verticalListSortingStrategy}>
            <div className="space-y-2">
              {folders.map((folder) =>
                editingId === folder.id ? (
                  <div key={folder.id} className="rounded-lg border border-primary/30 bg-card p-4 shadow-sm">
                    <h3 className="font-heading mb-3 font-semibold">Editar carpeta</h3>
                    <FolderForm
                      initial={{
                        name: folder.name,
                        description: folder.description ?? "",
                        type: folder.type,
                        color: folder.color ?? "",
                        visibility: folder.visibility,
                      }}
                      isSubmitting={updateFolder.isPending}
                      onSubmit={(data) => updateFolder.mutate({ ...data, id: folder.id })}
                      onCancel={() => setEditingId(null)}
                      submitLabel="Guardar cambios"
                    />
                  </div>
                ) : (
                  <SortableHandleItem key={folder.id} id={folder.id} disabled={editingId !== null}>
                    {({ handleProps }) => (
                      <div className="group flex items-center gap-2 rounded-lg border border-border/60 bg-card shadow-sm transition-all hover:shadow-md">
                        {}
                        <div
                          {...handleProps}
                          className="flex shrink-0 items-center self-stretch px-2 text-muted-foreground/40 hover:text-muted-foreground"
                        >
                          <GripVertical className="h-4 w-4" />
                        </div>

                        {}
                        <Link
                          href={`/folders/${folder.id}` as any}
                          className="flex flex-1 items-center justify-between py-3 pr-3"
                        >
                          <div className="flex items-center gap-2.5">
                            {folder.color && (
                              <div className="h-3 w-3 rounded-full" style={{ backgroundColor: folder.color }} />
                            )}
                            <div>
                              <span className="text-sm font-medium">{folder.name}</span>
                              {folder.description && (
                                <p className="line-clamp-1 text-xs text-muted-foreground">{folder.description}</p>
                              )}
                            </div>
                          </div>
                        </Link>

                        {}
                        <div className="flex shrink-0 items-center gap-2 pr-3" onClick={(e) => e.stopPropagation()}>
                          <span className="text-xs text-muted-foreground">{folder._count.vinyls}</span>
                          <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] ${
                            folder.visibility === "PUBLIC" ? "bg-green-500/10 text-green-600 dark:text-green-400" :
                            folder.visibility === "ACCOUNT" ? "bg-blue-500/10 text-blue-600 dark:text-blue-400" :
                            "bg-muted text-muted-foreground"
                          }`}>
                            {folder.visibility === "PUBLIC" ? <Globe className="h-3 w-3" /> :
                             folder.visibility === "ACCOUNT" ? <Users className="h-3 w-3" /> :
                             <Lock className="h-3 w-3" />}
                          </span>
                          <button
                            type="button"
                            onClick={() => setEditingId(folder.id)}
                            className="rounded-md p-1.5 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                          >
                            <Edit2 className="h-3.5 w-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => setDeletingId(folder.id)}
                            className="rounded-md p-1.5 text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </div>
                    )}
                  </SortableHandleItem>
                ),
              )}
            </div>
          </SortableContext>
        </DndContext>
      )}

      {}
      {collabs.length > 0 && (
        <div className="space-y-2">
          <h2 className="flex items-center gap-2 font-heading text-sm font-semibold text-muted-foreground">
            <Share2 className="h-4 w-4" aria-hidden="true" />
            Compartidas conmigo
          </h2>
          {collabs.map((c: any) => (
            <Link
              key={c.id}
              href={`/folders/${c.folder.id}` as any}
              className="flex items-center gap-3 rounded-lg border border-border/60 bg-card px-4 py-3 shadow-sm transition-all hover:shadow-md"
            >
              <div className="flex flex-1 items-center gap-2.5">
                {c.folder.color && (
                  <div className="h-3 w-3 shrink-0 rounded-full" style={{ backgroundColor: c.folder.color }} />
                )}
                <div className="min-w-0">
                  <span className="text-sm font-medium">{c.folder.name}</span>
                  <p className="text-xs text-muted-foreground">
                    de {c.folder.user.name}
                  </p>
                </div>
              </div>
              <div className="flex shrink-0 items-center gap-2">
                <span className="text-xs text-muted-foreground">{c.folder._count.vinyls}</span>
                <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-medium text-primary">
                  {ROLE_LABELS[c.role] ?? c.role}
                </span>
              </div>
            </Link>
          ))}
        </div>
      )}

      <ConfirmDialog
        open={!!deletingId}
        title="Eliminar carpeta"
        description={`Seguro que queres eliminar "${deletingFolder?.name}"? Los vinilos no se eliminan, solo la carpeta.`}
        isLoading={deleteFolder.isPending}
        onConfirm={() => deletingId && deleteFolder.mutate({ id: deletingId })}
        onCancel={() => setDeletingId(null)}
      />
    </div>
  );
}
