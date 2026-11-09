"use client";

import { Button, buttonVariants } from "@dallateas/ui/components/button";
import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import type { ReactNode } from "react";

import { KeyTag } from "@/components/dj/key-tag";
import { EmptyState } from "@/components/shell/empty-state";
import { PageHeader } from "@/components/shell/page-header";
import { formatBpm } from "@/lib/format";
import { trpc } from "@/utils/trpc";

import { BpmHistogram } from "./bpm-histogram";
import { CompleteBpm } from "./complete-bpm";
import { RankedList, type RankedItem } from "./ranked-list";
import { StatsSkeleton } from "./stats-skeleton";

const PAGE_CLASSES = "mx-auto flex w-full max-w-6xl flex-col gap-8 px-4 py-6 md:px-8 md:py-8";

const money = new Intl.NumberFormat("es-AR", { maximumFractionDigits: 2 });

type Coverage = { totalTracks: number; tracksWithBpm: number; approximateBpm: number };

function coverage({ totalTracks, tracksWithBpm, approximateBpm }: Coverage) {
  if (totalTracks === 0) return "Todavía no hay tracks cargados";

  const measured = `${tracksWithBpm} de ${totalTracks} tracks con BPM`;
  if (approximateBpm === 0) return measured;
  return `${measured}, ${approximateBpm === 1 ? "1 aproximado" : `${approximateBpm} aproximados`}`;
}

function Figure({ label, note, children }: { label: string; note?: string; children: ReactNode }) {
  return (
    <div>
      <dt className="text-[13px] text-muted-foreground">{label}</dt>
      <dd>
        <span className="tabular font-heading text-[28px] font-bold leading-tight">{children}</span>
        {note && <span className="block text-[13px] text-muted-foreground">{note}</span>}
      </dd>
    </div>
  );
}

function asRanking(entries: readonly (readonly [string, number])[]): RankedItem[] {
  return entries.map(([name, count]) => ({ id: name, label: name, count }));
}

export default function StatsPage() {
  const collectionQuery = useQuery(trpc.collectionStats.queryOptions());
  const tracksQuery = useQuery(trpc.trackStats.queryOptions());

  if (collectionQuery.isPending || tracksQuery.isPending) return <StatsSkeleton />;

  if (collectionQuery.isError || tracksQuery.isError) {
    return (
      <div className={PAGE_CLASSES}>
        <PageHeader title="Estadísticas" />
        <EmptyState
          title="No se pudieron cargar las estadísticas"
          action={
            <Button
              variant="outline"
              className="h-11 md:h-9"
              onClick={() => {
                void collectionQuery.refetch();
                void tracksQuery.refetch();
              }}
            >
              Reintentar
            </Button>
          }
        />
      </div>
    );
  }

  const collection = collectionQuery.data;
  const tracks = tracksQuery.data;

  if (collection.totalVinyls === 0) {
    return (
      <div className={PAGE_CLASSES}>
        <PageHeader title="Estadísticas" />
        <EmptyState
          title="Todavía no tenés vinilos"
          description="Cuando cargues tu colección, acá vas a ver en qué tempos y tonalidades estás parado"
          action={
            <Link href="/import" className={buttonVariants({ className: "h-11 px-4 text-sm md:h-9" })}>
              Importar vinilos
            </Link>
          }
        />
      </div>
    );
  }

  const averageBpm = tracks.averageBpm ?? collection.avgBpm;

  return (
    <div className={PAGE_CLASSES}>
      <PageHeader title="Estadísticas" description={coverage(tracks)} />

      <dl className="grid grid-cols-2 gap-x-8 gap-y-5 sm:grid-cols-4">
        <Figure label="Discos">{collection.totalVinyls}</Figure>
        <Figure label="BPM promedio">
          {averageBpm === null ? (
            <span className="font-sans text-sm font-normal text-muted-foreground">—</span>
          ) : (
            formatBpm(Math.round(averageBpm))
          )}
        </Figure>
        {collection.totalValue !== null && (
          <Figure label="Valor de la colección" note={`${collection.pricedCount} de ${collection.totalVinyls} con precio`}>
            ${money.format(collection.totalValue)}
          </Figure>
        )}
        {collection.avgPrice !== null && <Figure label="Precio promedio">${money.format(collection.avgPrice)}</Figure>}
      </dl>

      <CompleteBpm />

      <div className="grid gap-x-12 gap-y-8 lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
        <BpmHistogram buckets={tracks.bpmHistogram} />
        <RankedList
          title="Tonalidades"
          items={tracks.keys.map(({ key, count }) => ({ id: key, label: <KeyTag value={key} />, count }))}
        />
      </div>

      <div className="grid gap-x-12 gap-y-8 border-t border-border pt-6 md:grid-cols-[minmax(0,3fr)_minmax(0,2fr)_minmax(0,3fr)]">
        <RankedList title="Géneros" items={asRanking(collection.topGenres)} />
        <RankedList title="Décadas" items={asRanking(collection.topDecades)} />
        <RankedList title="Sellos" items={asRanking(collection.topLabels)} />
      </div>
    </div>
  );
}
