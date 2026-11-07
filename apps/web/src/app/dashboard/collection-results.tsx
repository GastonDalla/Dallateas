"use client";

import { Button } from "@dallateas/ui/components/button";
import { cn } from "@dallateas/ui/lib/utils";
import { Loader2 } from "lucide-react";
import Link from "next/link";
import type { ReactNode } from "react";

import { useAddVinyl } from "@/components/add-vinyl-context";
import { EmptyState } from "@/components/shell/empty-state";
import { VinylCard } from "@/components/vinyl-card";
import { actionClass } from "@/components/vinyl-form/field";

import { CollectionTable } from "./collection-table";
import type { CollectionView } from "./collection-filter-bar";
import type { useCollectionPages } from "./use-collection-pages";
import type { ListedVinyl } from "./types";

const PRIORITY_COVERS = 6;

type CollectionResultsProps = {
  pages: ReturnType<typeof useCollectionPages>;
  view: CollectionView;
  filtered: boolean;
  onClearFilters: () => void;
  renderActions: (vinyl: ListedVinyl) => ReactNode;
};

export function CollectionResults({ pages, view, filtered, onClearFilters, renderActions }: CollectionResultsProps) {
  const { openDrawer } = useAddVinyl();
  const { vinyls } = pages;

  if (pages.isLoading) {
    return (
      <div role="status" aria-label="Cargando la colección" className="flex justify-center py-16">
        <Loader2 aria-hidden="true" className="size-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (pages.isError) {
    return (
      <EmptyState
        title="No pudimos cargar la colección"
        action={
          <Button type="button" variant="outline" className={actionClass} onClick={() => pages.refetch()}>
            Reintentar
          </Button>
        }
      />
    );
  }

  if (vinyls.length === 0) {
    return filtered ? (
      <EmptyState
        title="Ningún disco con esos filtros"
        description="Abrí el rango de BPM o sacá alguna tonalidad"
        action={
          <Button type="button" variant="outline" className={actionClass} onClick={onClearFilters}>
            Limpiar filtros
          </Button>
        }
      />
    ) : (
      <EmptyState
        title="Todavía no tenés vinilos"
        description="Cargá tu primer disco o traé tu colección desde Discogs o un CSV"
        action={
          <div className="flex flex-wrap gap-2">
            <Button type="button" className={actionClass} onClick={() => openDrawer()}>
              Agregar vinilo
            </Button>
            <Button variant="outline" className={actionClass} render={<Link href="/import" />}>
              Importar
            </Button>
          </div>
        }
      />
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <div aria-busy={pages.isStale} className={cn("transition-opacity duration-[120ms]", pages.isStale && "opacity-60")}>
        {view === "list" ? (
          <CollectionTable vinyls={vinyls} renderActions={renderActions} />
        ) : (
          <div className="grid grid-cols-2 gap-x-3 gap-y-5 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
            {vinyls.map((vinyl, index) => (
              <VinylCard
                key={vinyl.id}
                title={vinyl.title}
                artist={vinyl.artist}
                genre={vinyl.genre}
                style={vinyl.style}
                coverUrl={vinyl.coverUrl}
                href={`/vinyl/${vinyl.id}`}
                tracks={vinyl.tracks}
                bpm={vinyl.bpm}
                condition={vinyl.mediaCondition}
                priority={index < PRIORITY_COVERS}
                actions={renderActions(vinyl)}
              />
            ))}
          </div>
        )}
      </div>

      {pages.hasMore && (
        <Button
          type="button"
          variant="outline"
          className={cn(actionClass, "self-center")}
          disabled={pages.isLoadingMore}
          onClick={pages.loadMore}
        >
          {pages.isLoadingMore && <Loader2 aria-hidden="true" className="animate-spin" />}
          Mostrar más
        </Button>
      )}
    </div>
  );
}
