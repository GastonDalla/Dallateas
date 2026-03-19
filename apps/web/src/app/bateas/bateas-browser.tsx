"use client";

import { useState } from "react";

import { useQuery } from "@tanstack/react-query";
import { Disc3, Lock, Search } from "lucide-react";
import Link from "next/link";

import { FilterSelect } from "@/components/filter-select";
import { useDebounce } from "@/hooks/use-debounce";
import { trpc } from "@/utils/trpc";

const TYPES = [
  { value: undefined, label: "Todas" },
  { value: "GENRE" as const, label: "Genero" },
  { value: "SET" as const, label: "Set" },
  { value: "OTHER" as const, label: "Otro" },
];

export default function BateasBrowser() {
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState<"GENRE" | "SET" | "OTHER" | undefined>();
  const [genreFilter, setGenreFilter] = useState<string | undefined>();
  const debouncedSearch = useDebounce(search, 300);

  const genresQuery = useQuery(trpc.publicGenres.queryOptions());
  const genres = genresQuery.data ?? [];

  const bateasQuery = useQuery(
    trpc.publicFolders.queryOptions({
      limit: 50,
      search: debouncedSearch || undefined,
      type: typeFilter,
      genre: genreFilter,
    }),
  );

  const folders = bateasQuery.data?.items ?? [];

  return (
    <div className="mx-auto max-w-4xl px-4 py-8 pb-20">
      <div className="mb-8 space-y-2">
        <h1 className="font-heading text-3xl font-bold">Explorar bateas</h1>
        <p className="text-sm text-muted-foreground">
          Descubri colecciones publicas de la comunidad.
        </p>
      </div>

      {/* Search + Filters */}
      <div className="mb-6 space-y-3">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar por nombre o descripcion..."
            className="w-full rounded-md border border-border/60 bg-card py-2.5 pl-10 pr-3 text-sm shadow-sm outline-none transition-colors placeholder:text-muted-foreground focus-visible:border-primary focus-visible:ring-2 focus-visible:ring-primary/20"
          />
        </div>

        {/* Type filter */}
        <div className="flex gap-2">
          {TYPES.map((t) => (
            <button
              key={t.label}
              type="button"
              onClick={() => setTypeFilter(t.value)}
              className={`rounded-full px-3.5 py-1.5 text-xs font-medium transition-colors ${
                typeFilter === t.value
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "bg-card text-muted-foreground shadow-sm hover:text-foreground"
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* Genre filter */}
        {genres.length > 0 && (
          <div className="flex items-center gap-2">
            <FilterSelect
              label="Genero"
              options={genres.map((g) => ({ value: g, label: g }))}
              value={genreFilter}
              onChange={setGenreFilter}
              placeholder="Genero"
            />
            {genreFilter && (
              <button
                type="button"
                onClick={() => setGenreFilter(undefined)}
                className="text-[11px] text-muted-foreground hover:text-foreground"
              >
                Limpiar
              </button>
            )}
          </div>
        )}
      </div>

      {/* Results */}
      {bateasQuery.isLoading ? (
        <div className="flex items-center justify-center py-20">
          <Disc3 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : folders.length === 0 ? (
        <div className="flex flex-col items-center gap-3 py-20 text-center">
          <Disc3 className="h-10 w-10 text-muted-foreground/30" />
          <p className="text-sm text-muted-foreground">
            {debouncedSearch || typeFilter || genreFilter
              ? "No se encontraron bateas con esos filtros."
              : "Todavia no hay bateas publicas."}
          </p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {folders.map((folder: any) => (
            <Link
              key={folder.id}
              href={`/batea/${folder.id}` as any}
              className="group flex flex-col gap-3 rounded-lg border border-border/60 bg-card p-4 shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {folder.color && (
                    <div className="h-3 w-3 rounded-full" style={{ backgroundColor: folder.color }} />
                  )}
                  <h3 className="font-heading font-semibold">{folder.name}</h3>
                  {folder.hasPassword && <Lock className="h-3 w-3 text-muted-foreground" />}
                </div>
                <span className="text-xs text-muted-foreground">{folder.vinylCount} vinilos</span>
              </div>
              {folder.description && (
                <p className="line-clamp-2 text-xs text-muted-foreground">{folder.description}</p>
              )}
              {folder.vinyls?.length > 0 && (
                <div className="grid grid-cols-4 gap-1.5">
                  {folder.vinyls.slice(0, 4).map((vinyl: any) => (
                    <div key={vinyl.id} className="aspect-square overflow-hidden rounded-md bg-muted">
                      {vinyl.coverUrl ? (
                        <img src={vinyl.coverUrl} alt={vinyl.title} loading="lazy" decoding="async" width={80} height={80} className="h-full w-full object-cover" />
                      ) : (
                        <div className="flex h-full items-center justify-center">
                          <Disc3 className="h-4 w-4 text-muted-foreground/40" />
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
              <p className="text-xs text-muted-foreground">
                por {folder.owner?.name}
                {folder.viewCount > 0 && <span> · {folder.viewCount} vistas</span>}
              </p>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
