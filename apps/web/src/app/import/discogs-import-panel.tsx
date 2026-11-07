"use client";

import { Button } from "@dallateas/ui/components/button";
import { Input } from "@dallateas/ui/components/input";
import { cn } from "@dallateas/ui/lib/utils";
import { useMutation } from "@tanstack/react-query";
import { Check, Disc3, FileUp, Loader2 } from "lucide-react";
import { useState, type FormEvent } from "react";
import { toast } from "sonner";

import { Cover } from "@/components/dj/cover";
import { Pagination } from "@/components/pagination";
import { EmptyState } from "@/components/shell/empty-state";

import { useBulkImport } from "./use-bulk-import";

const PAGE_SIZES = [10, 25, 50, 100];
const DEFAULT_PAGE_SIZE = 25;
const FULL_PAGE_SIZE = 100;

type DiscogsRelease = {
  id: number;
  title: string;
  artist: string;
  year: number | null;
  label: string | null;
  genre: string | null;
  coverUrl: string | null;
  discogsId: string;
};

type CollectionPage = {
  releases: DiscogsRelease[];
  pagination: { page: number; pages: number; items: number };
};

async function fetchCollectionPage(username: string, page: number, perPage: number) {
  const params = new URLSearchParams({ username, page: String(page), per_page: String(perPage) });
  const response = await fetch(`/api/discogs/collection?${params}`);
  const body = (await response.json()) as Partial<CollectionPage> & { error?: string };

  if (!response.ok || !body.releases || !body.pagination) {
    throw new Error(body.error ?? "No se pudo leer la colección de Discogs");
  }
  return { releases: body.releases, pagination: body.pagination };
}

function toVinyls(releases: readonly DiscogsRelease[]) {
  return releases
    .filter(({ title, artist }) => title && artist)
    .map(({ title, artist, label, genre, year, discogsId, coverUrl }) => ({
      title,
      artist,
      label: label || undefined,
      genre: genre || undefined,
      year: year || undefined,
      discogsId,
      coverUrl: coverUrl || undefined,
    }));
}

function matchesFilter(release: DiscogsRelease, filter: string) {
  const query = filter.trim().toLowerCase();
  if (!query) return true;
  return [release.title, release.artist, release.label ?? ""].some((field) => field.toLowerCase().includes(query));
}

type ReleaseRowProps = {
  release: DiscogsRelease;
  selected: boolean;
  onToggle: () => void;
};

function ReleaseRow({ release, selected, onToggle }: ReleaseRowProps) {
  return (
    <button
      type="button"
      aria-pressed={selected}
      onClick={onToggle}
      className={cn(
        "flex w-full items-center gap-3 p-2 text-left transition-colors focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-ring",
        selected ? "bg-accent" : "hover:bg-card",
      )}
    >
      <span
        aria-hidden="true"
        className={cn(
          "flex size-5 shrink-0 items-center justify-center rounded-sm border",
          selected ? "border-primary bg-primary text-primary-foreground" : "border-border",
        )}
      >
        {selected && <Check className="size-3.5" />}
      </span>
      <Cover src={release.coverUrl} alt="" sizes="40px" className="size-10 shrink-0" />
      <span className="min-w-0 flex-1">
        <span className="block truncate text-sm font-medium">
          {release.artist} <span className="font-normal text-muted-foreground">{release.title}</span>
        </span>
        <span className="tabular block truncate text-[13px] text-muted-foreground">
          {[release.year || null, release.label, release.genre].filter(Boolean).join(" · ")}
        </span>
      </span>
    </button>
  );
}

export function DiscogsImportPanel() {
  const { importVinyls, isImporting } = useBulkImport();

  const [username, setUsername] = useState("");
  const [collection, setCollection] = useState<CollectionPage | null>(null);
  const [perPage, setPerPage] = useState(DEFAULT_PAGE_SIZE);
  const [selected, setSelected] = useState<ReadonlySet<number>>(new Set());
  const [filter, setFilter] = useState("");
  const [fullImportStatus, setFullImportStatus] = useState<string | null>(null);

  const loadPage = useMutation({
    mutationFn: ({ page, size }: { page: number; size: number }) => fetchCollectionPage(username.trim(), page, size),
    onSuccess: (data) => {
      setCollection(data);
      setFilter("");
      setSelected(new Set(data.releases.map(({ id }) => id)));
    },
    onError: (error) => toast.error(error.message),
  });

  const releases = collection?.releases ?? [];
  const total = collection?.pagination.items ?? 0;
  const busy = isImporting || fullImportStatus !== null;
  const pageSelected = releases.length > 0 && releases.every(({ id }) => selected.has(id));

  function handleSearch(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (username.trim()) loadPage.mutate({ page: 1, size: perPage });
  }

  function toggle(id: number) {
    const next = new Set(selected);
    if (!next.delete(id)) next.add(id);
    setSelected(next);
  }

  function togglePage() {
    const next = new Set(selected);
    for (const { id } of releases) {
      if (pageSelected) next.delete(id);
      else next.add(id);
    }
    setSelected(next);
  }

  /** Walks the whole collection at the largest page Discogs serves, so the page count is its own, not the one on screen. */
  async function importEverything() {
    const name = username.trim();
    const all: DiscogsRelease[] = [];
    let pages = 1;

    try {
      for (let page = 1; page <= pages; page += 1) {
        setFullImportStatus(`Leyendo la página ${page} de ${pages}`);
        const data = await fetchCollectionPage(name, page, FULL_PAGE_SIZE);
        pages = data.pagination.pages;
        all.push(...data.releases);
      }
      setFullImportStatus(`Importando ${all.length} vinilos`);
      await importVinyls(toVinyls(all));
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "No se pudo leer la colección de Discogs");
    } finally {
      setFullImportStatus(null);
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <form onSubmit={handleSearch} className="flex max-w-xl flex-col gap-2">
        <label htmlFor="discogs-username" className="text-sm">
          Tu usuario de Discogs
        </label>
        <div className="flex gap-2">
          <Input
            id="discogs-username"
            value={username}
            onChange={(event) => setUsername(event.target.value)}
            autoComplete="off"
            autoCapitalize="none"
            className="h-11 text-sm md:h-9 md:text-sm"
          />
          <Button
            type="submit"
            variant="outline"
            className="h-11 px-4 text-sm md:h-9"
            disabled={loadPage.isPending || !username.trim()}
          >
            {loadPage.isPending ? <Loader2 aria-hidden="true" className="motion-safe:animate-spin" /> : "Buscar"}
          </Button>
        </div>
        <p className="text-[13px] text-muted-foreground">Tu colección tiene que ser pública en Discogs</p>
      </form>

      {collection && releases.length === 0 && (
        <EmptyState
          title="No hay vinilos para importar"
          description="Este usuario no tiene vinilos en su colección de Discogs, o la colección es privada"
        />
      )}

      {releases.length > 0 && (
        <>
          <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-1">
            <p className="tabular text-sm text-muted-foreground">
              {total} vinilos en Discogs, {selected.size} seleccionados
            </p>
            <div className="flex items-center gap-1">
              {selected.size > 0 && (
                <Button variant="ghost" className="h-11 text-[13px] md:h-8" onClick={() => setSelected(new Set())}>
                  Deseleccionar todos
                </Button>
              )}
              <Button variant="ghost" className="h-11 text-[13px] text-link md:h-8" onClick={togglePage}>
                {pageSelected ? "Deseleccionar página" : "Seleccionar página"}
              </Button>
            </div>
          </div>

          <Input
            value={filter}
            onChange={(event) => setFilter(event.target.value)}
            placeholder="Filtrar en esta página"
            aria-label="Filtrar en esta página"
            className="h-11 text-sm md:h-9 md:text-sm"
          />

          <ul className="divide-y divide-border border-y border-border">
            {releases
              .filter((release) => matchesFilter(release, filter))
              .map((release) => (
                <li key={release.id}>
                  <ReleaseRow release={release} selected={selected.has(release.id)} onToggle={() => toggle(release.id)} />
                </li>
              ))}
          </ul>

          <Pagination
            page={collection?.pagination.page ?? 1}
            totalPages={collection?.pagination.pages ?? 1}
            totalItems={total}
            pageSize={perPage}
            onPageChange={(page) => loadPage.mutate({ page, size: perPage })}
            onPageSizeChange={(size) => {
              setPerPage(size);
              loadPage.mutate({ page: 1, size });
            }}
            pageSizeOptions={PAGE_SIZES}
          />

          <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
            <Button
              className="h-11 px-4 text-sm md:h-9"
              onClick={() => void importVinyls(toVinyls(releases.filter(({ id }) => selected.has(id))))}
              disabled={busy || selected.size === 0}
            >
              {isImporting ? <Loader2 aria-hidden="true" className="motion-safe:animate-spin" /> : <FileUp aria-hidden="true" />}
              {isImporting ? "Importando" : `Importar ${selected.size} seleccionados`}
            </Button>
            {total > releases.length && (
              <Button
                variant="outline"
                className="h-11 px-4 text-sm md:h-9"
                onClick={() => void importEverything()}
                disabled={busy}
              >
                {fullImportStatus ? <Loader2 aria-hidden="true" className="motion-safe:animate-spin" /> : <Disc3 aria-hidden="true" />}
                {fullImportStatus ?? `Importar toda la colección (${total})`}
              </Button>
            )}
          </div>
        </>
      )}
    </div>
  );
}
