"use client";

import type { AppRouter } from "@dallateas/api/routers/index";
import { closestCenter, DndContext, type DragEndEvent } from "@dnd-kit/core";
import { arrayMove, rectSortingStrategy, SortableContext } from "@dnd-kit/sortable";
import { Button, buttonVariants } from "@dallateas/ui/components/button";
import { Skeleton } from "@dallateas/ui/components/skeleton";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { inferRouterOutputs } from "@trpc/server";
import { ArrowLeft, Copy, QrCode } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { toast } from "sonner";

import { ExportPdf } from "@/components/export-pdf";
import { QrDownload } from "@/components/qr-download";
import { EmptyState } from "@/components/shell/empty-state";
import { PageHeader } from "@/components/shell/page-header";
import { DragHandle, SortableHandleItem, useSortSensors } from "@/components/sortable-item";
import { VinylCard } from "@/components/vinyl-card";
import { useHaptic } from "@/hooks/use-haptic";
import { trpc } from "@/utils/trpc";

import { COLLABORATOR_ROLE_LABELS, FolderSwatch, VisibilityLabel } from "../folder-labels";
import { CollaboratorsPanel } from "./collaborators-panel";
import { SetFlow } from "./set-flow";

type Folder = inferRouterOutputs<AppRouter>["folderGet"];
type FolderRecord = Folder["vinyls"][number];

const PAGE_CLASSES = "mx-auto flex w-full max-w-5xl flex-col gap-6 px-4 py-6 md:px-8 md:py-8";
const GRID_CLASSES = "grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4";

function BackLink() {
  return (
    <Link
      href="/folders"
      className="inline-flex h-11 items-center gap-1.5 self-start text-sm text-muted-foreground transition-colors hover:text-foreground md:h-auto"
    >
      <ArrowLeft aria-hidden="true" className="size-4" />
      Carpetas
    </Link>
  );
}

function RecordCard({ record }: { record: FolderRecord }) {
  return (
    <VinylCard
      id={record.id}
      title={record.title}
      artist={record.artist}
      genre={record.genre}
      style={record.style}
      coverUrl={record.coverUrl}
      href={`/vinyl/${record.id}`}
    />
  );
}

function SortableRecords({ folder }: { folder: Folder }) {
  const queryClient = useQueryClient();
  const haptic = useHaptic();
  const sensors = useSortSensors();
  const folderKey = trpc.folderGet.queryKey({ id: folder.id });

  const reorder = useMutation(
    trpc.folderReorderVinyls.mutationOptions({
      onError: () => {
        void queryClient.invalidateQueries({ queryKey: folderKey });
        toast.error("No se pudo guardar el orden");
      },
    }),
  );

  function handleDragEnd({ active, over }: DragEndEvent) {
    if (!over || active.id === over.id) return;

    const from = folder.vinyls.findIndex(({ id }) => id === active.id);
    const to = folder.vinyls.findIndex(({ id }) => id === over.id);
    if (from === -1 || to === -1) return;

    const reordered = arrayMove(folder.vinyls, from, to);
    haptic.trigger("medium");
    queryClient.setQueryData(folderKey, { ...folder, vinyls: reordered });
    reorder.mutate({ folderId: folder.id, vinylOrder: reordered.map(({ id }) => id) });
  }

  return (
    <DndContext id="folder-records" sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
      <SortableContext items={folder.vinyls.map(({ id }) => id)} strategy={rectSortingStrategy}>
        <div className={GRID_CLASSES}>
          {folder.vinyls.map((record) => (
            <SortableHandleItem key={record.id} id={record.id}>
              {(handleProps) => (
                <>
                  <RecordCard record={record} />
                  <DragHandle
                    label={`Mover ${record.title}`}
                    handleProps={handleProps}
                    className="absolute right-0 top-0 bg-background/90"
                  />
                </>
              )}
            </SortableHandleItem>
          ))}
        </div>
      </SortableContext>
    </DndContext>
  );
}

function publicUrl(folderId: string) {
  return new URL(`/batea/${folderId}`, window.location.origin).href;
}

function FolderContent({ folder }: { folder: Folder }) {
  const [qrUrl, setQrUrl] = useState<string | null>(null);

  const role = folder.collaboratorRole;
  const canReorder = folder.isOwner || role === "EDITOR" || role === "ADMIN";
  const isShared = folder.visibility !== "PRIVATE";
  const isEmpty = folder.vinyls.length === 0;

  async function copyLink() {
    try {
      await navigator.clipboard.writeText(publicUrl(folder.id));
      toast.success("Link copiado");
    } catch {
      toast.error("No se pudo copiar el link");
    }
  }

  return (
    <div className={PAGE_CLASSES}>
      <BackLink />

      <div className="flex flex-col gap-2">
        <PageHeader
          title={folder.name}
          description={folder.description}
          actions={
            <>
              {isShared && (
                <>
                  <Button
                    variant="outline"
                    size="icon"
                    className="size-11 md:size-8"
                    aria-label="Copiar el link público"
                    onClick={() => void copyLink()}
                  >
                    <Copy aria-hidden="true" />
                  </Button>
                  <Button
                    variant="outline"
                    size="icon"
                    className="size-11 md:size-8"
                    aria-label={qrUrl ? "Ocultar el código QR" : "Mostrar el código QR"}
                    aria-expanded={qrUrl !== null}
                    onClick={() => setQrUrl(qrUrl ? null : publicUrl(folder.id))}
                  >
                    <QrCode aria-hidden="true" />
                  </Button>
                </>
              )}
              {!isEmpty && (
                <ExportPdf
                  title={folder.name}
                  vinyls={folder.vinyls.map(({ title, artist, label, genre, year, bpm }) => ({
                    title,
                    artist,
                    label: label ?? undefined,
                    genre: genre ?? undefined,
                    year: year ?? undefined,
                    bpm: bpm ?? undefined,
                  }))}
                />
              )}
            </>
          }
        />
        <p className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[13px] text-muted-foreground">
          <FolderSwatch color={folder.color} />
          <VisibilityLabel visibility={folder.visibility} />
          <span className="tabular">{folder.vinyls.length === 1 ? "1 vinilo" : `${folder.vinyls.length} vinilos`}</span>
          {!folder.isOwner && (
            <span>
              de <span className="font-medium text-foreground">{folder.owner.name}</span>
            </span>
          )}
          {role && (
            <span className="font-medium text-accent-foreground">{COLLABORATOR_ROLE_LABELS[role] ?? role}</span>
          )}
          {canReorder && folder.vinyls.length > 1 && <span>Arrastrá para reordenar</span>}
        </p>
      </div>

      {qrUrl && isShared && (
        <div className="border border-border bg-card p-4">
          <QrDownload url={qrUrl} label={folder.name} />
        </div>
      )}

      {isEmpty ? (
        <EmptyState
          title="Esta carpeta todavía no tiene vinilos"
          description="Agregá vinilos desde el botón + y asignalos a esta carpeta"
        />
      ) : folder.type === "SET" ? (
        <SetFlow
          folderId={folder.id}
          folderName={folder.name}
          canReorder={canReorder}
          canChooseCut={folder.isOwner}
        />
      ) : canReorder ? (
        <SortableRecords folder={folder} />
      ) : (
        <div className={GRID_CLASSES}>
          {folder.vinyls.map((record) => (
            <RecordCard key={record.id} record={record} />
          ))}
        </div>
      )}

      {folder.isOwner && <CollaboratorsPanel folderId={folder.id} />}
    </div>
  );
}

function FolderSkeleton() {
  return (
    <div className={PAGE_CLASSES} aria-hidden="true">
      <Skeleton className="h-4 w-24" />
      <div className="space-y-2">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-4 w-40" />
      </div>
      <div className={GRID_CLASSES}>
        {["first", "second", "third", "fourth"].map((card) => (
          <Skeleton key={card} className="aspect-square w-full" />
        ))}
      </div>
    </div>
  );
}

export default function FolderDetail({ id }: { id: string }) {
  const folderQuery = useQuery(trpc.folderGet.queryOptions({ id }));

  if (folderQuery.isPending) return <FolderSkeleton />;

  if (folderQuery.isError) {
    return (
      <div className={PAGE_CLASSES}>
        <EmptyState
          title="No pudimos abrir esta carpeta"
          description="Puede que ya no exista o que no tengas acceso"
          action={
            <span className="flex flex-wrap gap-2">
              <Button variant="outline" className="h-11 md:h-9" onClick={() => void folderQuery.refetch()}>
                Reintentar
              </Button>
              <Link href="/folders" className={buttonVariants({ variant: "ghost", className: "h-11 md:h-9" })}>
                Volver a carpetas
              </Link>
            </span>
          }
        />
      </div>
    );
  }

  return <FolderContent folder={folderQuery.data} />;
}
