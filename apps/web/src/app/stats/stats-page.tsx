"use client";

import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, Disc3 } from "lucide-react";
import Link from "next/link";

import { trpc } from "@/utils/trpc";

export default function StatsPage() {
  const { data, isLoading } = useQuery(
    trpc.collectionStats.queryOptions(),
  );

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Disc3 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const stats = data;

  return (
    <div className="mx-auto max-w-2xl px-4 py-8 pb-24">
      <Link
        href="/dashboard"
        className="mb-6 inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" />
        Volver al dashboard
      </Link>

      <h1 className="font-heading mb-6 text-2xl font-bold">
        Estadisticas de tu coleccion
      </h1>

      {/* Stat cards */}
      <div className="mb-8 grid grid-cols-2 gap-3">
        <div className="rounded-lg border border-border/60 bg-card p-4 shadow-sm">
          <p className="text-xs text-muted-foreground">Total vinilos</p>
          <p className="font-heading text-2xl font-bold text-primary">
            {stats?.totalVinyls ?? 0}
          </p>
        </div>
        <div className="rounded-lg border border-border/60 bg-card p-4 shadow-sm">
          <p className="text-xs text-muted-foreground">BPM promedio</p>
          <p className="font-heading text-2xl font-bold text-primary">
            {stats?.avgBpm ? Math.round(stats.avgBpm) : "—"}
          </p>
        </div>
        {stats?.totalValue != null && (
          <div className="rounded-lg border border-border/60 bg-card p-4 shadow-sm">
            <p className="text-xs text-muted-foreground">Valor coleccion</p>
            <p className="font-heading text-2xl font-bold text-primary">
              ${stats.totalValue.toLocaleString()}
            </p>
            <p className="text-[10px] text-muted-foreground">
              {stats.pricedCount} de {stats.totalVinyls} con precio
            </p>
          </div>
        )}
        {stats?.avgPrice != null && (
          <div className="rounded-lg border border-border/60 bg-card p-4 shadow-sm">
            <p className="text-xs text-muted-foreground">Precio promedio</p>
            <p className="font-heading text-2xl font-bold text-primary">
              ${stats.avgPrice.toLocaleString()}
            </p>
          </div>
        )}
      </div>

      {/* Top Genres */}
      {stats?.topGenres && stats.topGenres.length > 0 && (
        <section className="mb-8">
          <h2 className="font-heading mb-3 text-lg font-semibold">
            Top generos
          </h2>
          <div className="space-y-2">
            {(() => {
              const maxCount = Math.max(
                ...stats.topGenres.map((g) => g[1]),
              );
              return stats.topGenres.map((genre) => (
                <div key={genre[0]} className="flex items-center gap-3">
                  <span className="w-24 shrink-0 truncate text-sm text-muted-foreground">
                    {genre[0]}
                  </span>
                  <div className="relative h-6 flex-1 overflow-hidden rounded-md bg-card border border-border/60">
                    <div
                      className="h-full rounded-md bg-primary/80 transition-all"
                      style={{
                        width: `${(genre[1] / maxCount) * 100}%`,
                      }}
                    />
                  </div>
                  <span className="w-8 text-right text-xs font-medium text-foreground">
                    {genre[1]}
                  </span>
                </div>
              ));
            })()}
          </div>
        </section>
      )}

      {/* Top Decades */}
      {stats?.topDecades && stats.topDecades.length > 0 && (
        <section className="mb-8">
          <h2 className="font-heading mb-3 text-lg font-semibold">
            Top decadas
          </h2>
          <div className="space-y-2">
            {(() => {
              const maxCount = Math.max(
                ...stats.topDecades.map((d) => d[1]),
              );
              return stats.topDecades.map((decade) => (
                <div key={decade[0]} className="flex items-center gap-3">
                  <span className="w-24 shrink-0 truncate text-sm text-muted-foreground">
                    {decade[0]}
                  </span>
                  <div className="relative h-6 flex-1 overflow-hidden rounded-md bg-card border border-border/60">
                    <div
                      className="h-full rounded-md bg-primary/80 transition-all"
                      style={{
                        width: `${(decade[1] / maxCount) * 100}%`,
                      }}
                    />
                  </div>
                  <span className="w-8 text-right text-xs font-medium text-foreground">
                    {decade[1]}
                  </span>
                </div>
              ));
            })()}
          </div>
        </section>
      )}

      {/* Top Labels */}
      {stats?.topLabels && stats.topLabels.length > 0 && (
        <section className="mb-8">
          <h2 className="font-heading mb-3 text-lg font-semibold">
            Top sellos
          </h2>
          <div className="space-y-2">
            {(() => {
              const maxCount = Math.max(
                ...stats.topLabels.map((l) => l[1]),
              );
              return stats.topLabels.map((label) => (
                <div key={label[0]} className="flex items-center gap-3">
                  <span className="w-24 shrink-0 truncate text-sm text-muted-foreground">
                    {label[0]}
                  </span>
                  <div className="relative h-6 flex-1 overflow-hidden rounded-md bg-card border border-border/60">
                    <div
                      className="h-full rounded-md bg-primary/80 transition-all"
                      style={{
                        width: `${(label[1] / maxCount) * 100}%`,
                      }}
                    />
                  </div>
                  <span className="w-8 text-right text-xs font-medium text-foreground">
                    {label[1]}
                  </span>
                </div>
              ));
            })()}
          </div>
        </section>
      )}

      {!stats?.totalVinyls && (
        <div className="flex flex-col items-center gap-3 py-16 text-center">
          <Disc3 className="h-10 w-10 text-muted-foreground/30" />
          <p className="text-sm text-muted-foreground">
            Aun no tenes vinilos para mostrar estadisticas.
          </p>
        </div>
      )}
    </div>
  );
}
