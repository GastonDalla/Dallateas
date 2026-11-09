"use client";

import type { AppRouter } from "@dallateas/api/routers/index";
import { closestCenter, DndContext, type DragEndEvent } from "@dnd-kit/core";
import { arrayMove, SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { Button } from "@dallateas/ui/components/button";
import { Skeleton } from "@dallateas/ui/components/skeleton";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { inferRouterOutputs } from "@trpc/server";
import { Edit2, Trash2 } from "lucide-react";
import type { Route } from "next";
import Link from "next/link";
import { useState } from "react";
import { toast } from "sonner";

import { ConfirmDialog } from "@/components/confirm-dialog";
import { FolderForm } from "@/components/folder-form";
import { EmptyState } from "@/components/shell/empty-state";
import { PageHeader } from "@/components/shell/page-header";
import { DragHandle, SortableHandleItem, useSortSensors, type DragHandleProps } from "@/components/sortable-item";
import { useHaptic } from "@/hooks/use-haptic";
import { trpc } from "@/utils/trpc";

import { COLLABORATOR_ROLE_LABELS, FOLDER_TYPE_LABELS, FolderSwatch, VisibilityLabel } from "./folder-labels";

type RouterOutputs = inferRouterOutputs<AppRouter>;
type Folder = RouterOutputs["foldersList"][number];
type Collaboration = RouterOutputs["myCollaborations"][number];

function recordCount(count: number) {
  return count === 1 ? "1 vinilo" : `${count} vinilos`;
}

type FolderRowProps = {
  folder: Folder;
  handleProps: DragHandleProps;
  onEdit: () => void;
  onDelete: () => void;
};

function FolderRow({ folder, handleProps, onEdit, onDelete }: FolderRowProps) {
  return (
    <div className="flex items-center gap-1 bg-background transition-colors hover:bg-card">
      <DragHandle label={`Mover ${folder.name}`} handleProps={handleProps} />
      <Link
        href={`/folders/${folder.id}` as Route}
        className="flex min-w-0 flex-1 items-start gap-2.5 py-3 focus-visible:outline-2 focus-visible:outline-ring"
      >
        <span className="mt-1.5 flex w-3 shrink-0">
          <FolderSwatch color={folder.color} />
        </span>
        <span className="min-w-0">
          <span className="block truncate font-medium">{folder.name}</span>
          <span className="flex flex-wrap items-center gap-x-2 text-[13px] text-muted-foreground">
            <span>{FOLDER_TYPE_LABELS[folder.type]}</span>
            <span className="tabular">{recordCount(folder._count.vinyls)}</span>
            <VisibilityLabel visibility={folder.visibility} />
          </span>
          {folder.description && (
            <span className="mt-0.5 line-clamp-1 text-[13px] text-muted-foreground">{folder.description}</span>
          )}
        </span>
      </Link>
      <Button
        variant="ghost"
        size="icon"
        className="size-11 text-muted-foreground md:size-8"
        aria-label={`Editar ${folder.name}`}
        onClick={onEdit}
      >
        <Edit2 aria-hidden="true" />
      </Button>
      <Button
        variant="ghost"
        size="icon"
        className="size-11 text-muted-foreground hover:bg-destructive/10 hover:text-destructive md:size-8"
        aria-label={`Eliminar ${folder.name}`}
        onClick={onDelete}
      >
        <Trash2 aria-hidden="true" />
      </Button>
    </div>
  );
}

function CollaborationRow({ collaboration }: { collaboration: Collaboration }) {
  const { folder, role } = collaboration;

  return (
    <Link
      href={`/folders/${folder.id}` as Route}
      className="flex items-center gap-3 py-3 transition-colors hover:bg-card focus-visible:outline-2 focus-visible:outline-ring"
    >
      <span className="flex w-3 shrink-0">
        <FolderSwatch color={folder.color} />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block truncate font-medium">{folder.name}</span>
        <span className="block text-[13px] text-muted-foreground">de {folder.user.name}</span>
      </span>
      <span className="tabular shrink-0 text-[13px] text-muted-foreground">{recordCount(folder._count.vinyls)}</span>
      <span className="shrink-0 text-[13px] font-medium text-accent-foreground">
        {COLLABORATOR_ROLE_LABELS[role] ?? role}
      </span>
    </Link>
  );
}

function FolderListSkeleton() {
  return (
    <div className="divide-y divide-border border-y border-border" aria-hidden="true">
      {["first", "second", "third"].map((row) => (
        <div key={row} className="flex items-center gap-3 py-3">
          <Skeleton className="size-5" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-4 w-48" />
            <Skeleton className="h-3 w-32" />
          </div>
        </div>
      ))}
    </div>
  );
}

export function FoldersView() {
  const queryClient = useQueryClient();
  const haptic = useHaptic();
  const sensors = useSortSensors();

  const foldersQuery = useQuery(trpc.foldersList.queryOptions());
  const collaborationsQuery = useQuery(trpc.myCollaborations.queryOptions());
  const folders = foldersQuery.data ?? [];
  const collaborations = collaborationsQuery.data ?? [];

  const [creating, setCreating] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  function refreshFolders() {
    return queryClient.invalidateQueries({ queryKey: trpc.foldersList.queryKey() });
  }

  const createFolder = useMutation(
    trpc.folderCreate.mutationOptions({
      onSuccess: () => {
        void refreshFolders();
        setCreating(false);
        toast.success("Carpeta creada");
      },
      onError: (error) => toast.error(error.message),
    }),
  );

  const updateFolder = useMutation(
    trpc.folderUpdate.mutationOptions({
      onSuccess: () => {
        void refreshFolders();
        setEditingId(null);
        toast.success("Carpeta actualizada");
      },
      onError: (error) => toast.error(error.message),
    }),
  );

  const deleteFolder = useMutation(
    trpc.folderDelete.mutationOptions({
      onSuccess: () => {
        void refreshFolders();
        setDeletingId(null);
        toast.success("Carpeta eliminada");
      },
      onError: (error) => toast.error(error.message),
    }),
  );

  const reorderFolders = useMutation(
    trpc.folderReorder.mutationOptions({
      onError: () => {
        void refreshFolders();
        toast.error("No se pudo guardar el orden");
      },
    }),
  );

  function handleDragEnd({ active, over }: DragEndEvent) {
    if (!over || active.id === over.id) return;

    const from = folders.findIndex((folder) => folder.id === active.id);
    const to = folders.findIndex((folder) => folder.id === over.id);
    if (from === -1 || to === -1) return;

    const reordered = arrayMove(folders, from, to);
    haptic.trigger("medium");
    queryClient.setQueryData(trpc.foldersList.queryKey(), reordered);
    reorderFolders.mutate({ folderOrder: reordered.map(({ id }) => id) });
  }

  const deletingFolder = folders.find(({ id }) => id === deletingId);

  return (
    <div className="mx-auto flex w-full max-w-4xl flex-col gap-6 px-4 py-6 md:px-8 md:py-8">
      <PageHeader
        title="Carpetas"
        description={`Organizá tus vinilos y compartí tus bateas${folders.length > 1 ? ". Arrastrá para reordenar" : ""}`}
        actions={
          !creating && (
            <Button className="h-11 px-4 text-sm md:h-9" onClick={() => setCreating(true)}>
              Nueva carpeta
            </Button>
          )
        }
      />

      {creating && (
        <section aria-label="Nueva carpeta" className="border border-border bg-card p-4 md:p-6">
          <h2 className="mb-4 font-heading text-xl font-bold">Nueva carpeta</h2>
          <FolderForm
            isSubmitting={createFolder.isPending}
            onSubmit={(data) => createFolder.mutate(data)}
            onCancel={() => setCreating(false)}
            submitLabel="Crear carpeta"
          />
        </section>
      )}

      {foldersQuery.isPending ? (
        <FolderListSkeleton />
      ) : foldersQuery.isError ? (
        <EmptyState
          title="No se pudieron cargar las carpetas"
          action={
            <Button variant="outline" className="h-11 md:h-9" onClick={() => void foldersQuery.refetch()}>
              Reintentar
            </Button>
          }
        />
      ) : folders.length === 0 ? (
        !creating && (
          <EmptyState
            title="Todavía no tenés carpetas"
            description="Armá una por género, por fecha o por noche. Si la creás como set, te muestra el tempo y las mezclas en orden"
            action={
              <Button className="h-11 px-4 text-sm md:h-9" onClick={() => setCreating(true)}>
                Crear la primera
              </Button>
            }
          />
        )
      ) : (
        <DndContext id="folders" sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
          <SortableContext items={folders.map(({ id }) => id)} strategy={verticalListSortingStrategy}>
            <div className="divide-y divide-border border-y border-border">
              {folders.map((folder) =>
                editingId === folder.id ? (
                  <section key={folder.id} aria-label={`Editar ${folder.name}`} className="bg-card p-4 md:p-6">
                    <h2 className="mb-4 font-heading text-xl font-bold">Editar carpeta</h2>
                    <FolderForm
                      initial={{
                        name: folder.name,
                        description: folder.description ?? "",
                        type: folder.type,
                        color: folder.color ?? "",
                        visibility: folder.visibility,
                        hasPassword: folder.hasPassword,
                      }}
                      isSubmitting={updateFolder.isPending}
                      onSubmit={(data) => updateFolder.mutate({ ...data, id: folder.id })}
                      onCancel={() => setEditingId(null)}
                      submitLabel="Guardar cambios"
                    />
                  </section>
                ) : (
                  <SortableHandleItem key={folder.id} id={folder.id} disabled={editingId !== null}>
                    {(handleProps) => (
                      <FolderRow
                        folder={folder}
                        handleProps={handleProps}
                        onEdit={() => setEditingId(folder.id)}
                        onDelete={() => setDeletingId(folder.id)}
                      />
                    )}
                  </SortableHandleItem>
                ),
              )}
            </div>
          </SortableContext>
        </DndContext>
      )}

      {collaborations.length > 0 && (
        <section aria-labelledby="shared-folders">
          <h2 id="shared-folders" className="mb-2 font-heading text-xl font-bold">
            Compartidas conmigo
          </h2>
          <div className="divide-y divide-border border-y border-border">
            {collaborations.map((collaboration) => (
              <CollaborationRow key={collaboration.id} collaboration={collaboration} />
            ))}
          </div>
        </section>
      )}

      <ConfirmDialog
        open={deletingId !== null}
        title="Eliminar carpeta"
        description={`¿Seguro que querés eliminar "${deletingFolder?.name}"? Los vinilos no se eliminan, solo la carpeta.`}
        isLoading={deleteFolder.isPending}
        onConfirm={() => deletingId && deleteFolder.mutate({ id: deletingId })}
        onCancel={() => setDeletingId(null)}
      />
    </div>
  );
}
