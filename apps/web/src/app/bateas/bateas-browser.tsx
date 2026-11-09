"use client";

import { Input } from "@dallateas/ui/components/input";
import { cn } from "@dallateas/ui/lib/utils";
import { useSuspenseQuery } from "@tanstack/react-query";
import { Search } from "lucide-react";
import { Suspense, useDeferredValue, useState } from "react";

import { FilterSelect } from "@/components/filter-select";
import { CrateTile } from "@/components/landing/crate-tile";
import { EmptyState } from "@/components/shell/empty-state";
import { PageHeader } from "@/components/shell/page-header";
import { useDebounce } from "@/hooks/use-debounce";
import { trpc } from "@/utils/trpc";

import { cratesInput, type CrateType } from "./crates-query";

const TYPES: { value: CrateType | undefined; label: string }[] = [
  { value: undefined, label: "Todas" },
  { value: "GENRE", label: "Género" },
  { value: "SET", label: "Set" },
  { value: "OTHER", label: "Otro" },
];

const CRATE_GRID = "grid gap-x-6 gap-y-10 md:grid-cols-2 xl:grid-cols-3";

function GenreFilter({ value, onChange }: { value: string | undefined; onChange: (genre: string | undefined) => void }) {
  const { data: genres } = useSuspenseQuery(trpc.publicGenres.queryOptions());
  if (genres.length === 0) return null;

  return (
    <div className="flex items-center gap-2">
      <FilterSelect
        label="Género"
        options={genres.map((genre) => ({ value: genre, label: genre }))}
        value={value}
        onChange={onChange}
        placeholder="Género"
      />
      {value && (
        <button
          type="button"
          onClick={() => onChange(undefined)}
          className="min-h-11 px-1 text-sm text-muted-foreground transition-colors duration-100 hover:text-foreground md:min-h-0"
        >
          Limpiar
        </button>
      )}
    </div>
  );
}

function CrateResults({ search, type, genre, stale }: {
  search: string;
  type: CrateType | undefined;
  genre: string | undefined;
  stale: boolean;
}) {
  const { data } = useSuspenseQuery(trpc.publicFolders.queryOptions(cratesInput({ search, type, genre })));
  const filtered = Boolean(search || type || genre);

  if (data.items.length === 0) {
    return (
      <EmptyState
        title={filtered ? "No hay bateas con esos filtros" : "Todavía no hay bateas públicas"}
        description={filtered ? "Probá con otra búsqueda o sacá algún filtro." : undefined}
      />
    );
  }

  return (
    <div className={cn(CRATE_GRID, "transition-opacity duration-100", stale && "opacity-60")}>
      {data.items.map((crate, index) => (
        <CrateTile key={crate.id} crate={crate} priority={index === 0} />
      ))}
    </div>
  );
}

function CrateSkeleton() {
  return (
    <div aria-hidden="true" className={CRATE_GRID}>
      {Array.from({ length: 6 }, (_, index) => (
        <div key={index} className="aspect-[4/1.5] bg-muted" />
      ))}
    </div>
  );
}

export default function BateasBrowser() {
  const [search, setSearch] = useState("");
  const [type, setType] = useState<CrateType | undefined>();
  const [genre, setGenre] = useState<string | undefined>();

  const debouncedSearch = useDebounce(search, 300);

  // Deferred so a new filter keeps the current crates on screen until the next ones arrive.
  const shownSearch = useDeferredValue(debouncedSearch);
  const shownType = useDeferredValue(type);
  const shownGenre = useDeferredValue(genre);
  const stale = shownSearch !== debouncedSearch || shownType !== type || shownGenre !== genre;

  return (
    <div className="mx-auto max-w-[75rem] px-4 py-8 md:px-8 md:py-12">
      <PageHeader title="Explorar bateas" description="Colecciones públicas de DJs, con el BPM de cada disco en la tapa" />

      <div role="search" className="mt-6 mb-10 flex flex-col gap-3 md:flex-row md:flex-wrap md:items-center">
        <div className="relative md:w-80">
          <Search aria-hidden="true" className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
          <label htmlFor="crate-search" className="sr-only">
            Buscar por nombre o descripción
          </label>
          <Input
            id="crate-search"
            type="search"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Buscar por nombre o descripción"
            className="h-11 pl-9 text-base md:h-9 md:text-sm"
          />
        </div>

        <div role="group" aria-label="Tipo de batea" className="flex gap-1">
          {TYPES.map((option) => (
            <button
              key={option.label}
              type="button"
              aria-pressed={type === option.value}
              onClick={() => setType(option.value)}
              className={cn(
                "h-11 rounded-md px-3 text-sm font-medium transition-colors duration-100 md:h-9",
                type === option.value ? "bg-accent text-accent-foreground" : "text-muted-foreground hover:text-foreground",
              )}
            >
              {option.label}
            </button>
          ))}
        </div>

        <Suspense fallback={null}>
          <GenreFilter value={genre} onChange={setGenre} />
        </Suspense>
      </div>

      <Suspense fallback={<CrateSkeleton />}>
        <CrateResults search={shownSearch} type={shownType} genre={shownGenre} stale={stale} />
      </Suspense>
    </div>
  );
}
