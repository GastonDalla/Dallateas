"use client";

import { Button } from "@dallateas/ui/components/button";
import { useMutation, useQuery } from "@tanstack/react-query";
import { BarChart3, Upload } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { toast } from "sonner";

import { ConfirmDialog } from "@/components/confirm-dialog";
import { PageHeader } from "@/components/shell/page-header";
import { actionClass } from "@/components/vinyl-form/field";
import { useHaptic } from "@/hooks/use-haptic";
import { useInvalidateCollection } from "@/hooks/use-invalidate-collection";
import { createStoredChoice } from "@/hooks/use-stored-choice";
import { trpc } from "@/utils/trpc";

import { CollectionFilterBar, type CollectionView } from "./collection-filter-bar";
import { CollectionResults } from "./collection-results";
import { ExportCsvButton } from "./export-csv-button";
import { hasFilters, toVinylsListInput } from "./filters";
import { MoveToFoldersDialog } from "./move-to-folders-dialog";
import { RecordActions } from "./record-actions";
import type { ListedVinyl } from "./types";
import { useCollectionFilters } from "./use-collection-filters";
import { useCollectionPages } from "./use-collection-pages";

const collectionView = createStoredChoice<CollectionView>("dallateas:collection-view", "covers", (raw) =>
  raw === "covers" || raw === "list" ? raw : null,
);

function vinylCount(count: number) {
  return `${count.toLocaleString("es-AR")} ${count === 1 ? "vinilo" : "vinilos"}`;
}

export default function Dashboard() {
  const haptic = useHaptic();
  const invalidate = useInvalidateCollection();
  const { filters, update, clear } = useCollectionFilters();
  const [view, setView] = collectionView.useChoice();
  const [moving, setMoving] = useState<ListedVinyl | null>(null);
  const [deleting, setDeleting] = useState<ListedVinyl | null>(null);

  const { data: stats } = useQuery(trpc.collectionStats.queryOptions());
  const pages = useCollectionPages(toVinylsListInput(filters));
  const filtered = hasFilters(filters);

  const deleteVinyl = useMutation(
    trpc.vinylDelete.mutationOptions({
      onSuccess: () => {
        haptic.trigger("success");
        void invalidate();
        setDeleting(null);
        toast.success("Vinilo eliminado");
      },
      onError: (error) => toast.error(error.message),
    }),
  );

  const shown = pages.hasMore ? `Más de ${vinylCount(pages.vinyls.length)}` : vinylCount(pages.vinyls.length);
  const summary = filtered
    ? `${shown} con estos filtros`
    : stats &&
      [
        vinylCount(stats.totalVinyls),
        ...(stats.totalValue === null ? [] : [`$${stats.totalValue.toLocaleString("es-AR")}`]),
      ].join(" · ");

  return (
    <div className="flex flex-col gap-4 px-4 py-6 md:px-8 md:py-8">
      <PageHeader
        title="Colección"
        description={<span className="tabular">{summary}</span>}
        actions={
          <>
            <ExportCsvButton />
            <Button variant="outline" className={actionClass} render={<Link href="/import" />}>
              <Upload aria-hidden="true" />
              Importar
            </Button>
            <Button variant="outline" className={actionClass} render={<Link href="/stats" />}>
              <BarChart3 aria-hidden="true" />
              Estadísticas
            </Button>
          </>
        }
      />

      <CollectionFilterBar filters={filters} view={view} onViewChange={setView} onChange={update} onClear={clear} />

      <CollectionResults
        pages={pages}
        view={view}
        filtered={filtered}
        onClearFilters={clear}
        renderActions={(vinyl) => (
          <RecordActions vinyl={vinyl} onMove={() => setMoving(vinyl)} onDelete={() => setDeleting(vinyl)} />
        )}
      />

      {moving && <MoveToFoldersDialog key={moving.id} vinyl={moving} onClose={() => setMoving(null)} />}

      <ConfirmDialog
        open={deleting !== null}
        title="Eliminar vinilo"
        description={`¿Seguro que querés eliminar "${deleting?.title}"? No se puede deshacer.`}
        isLoading={deleteVinyl.isPending}
        onConfirm={() => deleting && deleteVinyl.mutate({ id: deleting.id })}
        onCancel={() => setDeleting(null)}
      />
    </div>
  );
}
