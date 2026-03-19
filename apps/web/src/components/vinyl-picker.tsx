"use client";

import { Disc3, Search, Star, X } from "lucide-react";
import { useMemo, useRef, useState } from "react";

import { useDebounce } from "@/hooks/use-debounce";

type VinylOption = {
  id: string;
  title: string;
  artist: string;
  coverUrl?: string | null;
  genre?: string | null;
};

type VinylPickerProps = {
  vinyls: VinylOption[];
  value: string | null;
  onChange: (id: string | null) => void;
};

export function VinylPicker({ vinyls, value, onChange }: VinylPickerProps) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebounce(search, 200);
  const inputRef = useRef<HTMLInputElement>(null);

  const selected = useMemo(
    () => (value ? vinyls.find((v) => v.id === value) : null),
    [vinyls, value],
  );

  const filtered = useMemo(() => {
    if (!debouncedSearch.trim()) return vinyls.slice(0, 50);
    const q = debouncedSearch.toLowerCase();
    return vinyls
      .filter(
        (v) =>
          v.title.toLowerCase().includes(q) ||
          v.artist.toLowerCase().includes(q),
      )
      .slice(0, 50);
  }, [vinyls, debouncedSearch]);

  if (selected) {
    return (
      <div className="flex items-center gap-2 rounded-md border border-border/60 bg-background p-2">
        {selected.coverUrl ? (
          <img
            src={selected.coverUrl}
            alt=""
            className="h-10 w-10 shrink-0 rounded object-cover"
            width={40}
            height={40}
          />
        ) : (
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded bg-muted">
            <Disc3 className="h-5 w-5 text-muted-foreground/30" />
          </div>
        )}
        <div className="min-w-0 flex-1">
          <p className="truncate text-xs font-medium">{selected.title}</p>
          <p className="truncate text-[10px] text-muted-foreground">
            {selected.artist}
          </p>
        </div>
        <button
          type="button"
          onClick={() => onChange(null)}
          className="shrink-0 text-muted-foreground hover:text-destructive"
          aria-label="Quitar vinilo destacado"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    );
  }

  return (
    <div className="relative">
      <div className="flex items-center gap-2 rounded-md border border-border/60 bg-background px-3 py-2">
        <Search className="h-4 w-4 shrink-0 text-muted-foreground" aria-hidden="true" />
        <input
          ref={inputRef}
          type="text"
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          placeholder="Buscar vinilo por titulo o artista..."
          className="w-full bg-transparent text-sm outline-none placeholder:text-muted-foreground"
          aria-label="Buscar vinilo favorito"
        />
        {search && (
          <button
            type="button"
            onClick={() => {
              setSearch("");
              setOpen(false);
            }}
            className="shrink-0 text-muted-foreground hover:text-foreground"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        )}
      </div>

      {open && (
        <div className="absolute left-0 top-full z-50 mt-1 max-h-60 w-full overflow-y-auto overscroll-contain rounded-lg border border-border/60 bg-background shadow-lg">
          {filtered.length === 0 ? (
            <p className="px-3 py-4 text-center text-xs text-muted-foreground">
              {debouncedSearch
                ? "Sin resultados"
                : "Escribe para buscar en tu coleccion"}
            </p>
          ) : (
            <>
              {!debouncedSearch && (
                <p className="border-b border-border/40 px-3 py-1.5 text-[10px] text-muted-foreground">
                  Mostrando los primeros 50 — usa la busqueda para encontrar mas
                </p>
              )}
              {filtered.map((vinyl) => (
                <button
                  key={vinyl.id}
                  type="button"
                  onClick={() => {
                    onChange(vinyl.id);
                    setOpen(false);
                    setSearch("");
                  }}
                  className="flex w-full items-center gap-2.5 px-3 py-2 text-left transition-colors hover:bg-muted"
                >
                  {vinyl.coverUrl ? (
                    <img
                      src={vinyl.coverUrl}
                      alt=""
                      className="h-8 w-8 shrink-0 rounded object-cover"
                      width={32}
                      height={32}
                      loading="lazy"
                      decoding="async"
                    />
                  ) : (
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded bg-muted">
                      <Disc3 className="h-4 w-4 text-muted-foreground/30" />
                    </div>
                  )}
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-xs font-medium">
                      {vinyl.title}
                    </p>
                    <p className="truncate text-[10px] text-muted-foreground">
                      {vinyl.artist}
                      {vinyl.genre && ` · ${vinyl.genre}`}
                    </p>
                  </div>
                  <Star className="h-3.5 w-3.5 shrink-0 text-muted-foreground/30" aria-hidden="true" />
                </button>
              ))}
            </>
          )}
        </div>
      )}

      {/* Backdrop to close */}
      {open && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => {
            setOpen(false);
            setSearch("");
          }}
          aria-hidden="true"
        />
      )}
    </div>
  );
}
