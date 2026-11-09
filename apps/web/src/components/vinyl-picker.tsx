"use client";

import { X } from "lucide-react";
import { useState } from "react";

import { Cover } from "@/components/dj/cover";
import { controlClass } from "@/components/vinyl-form/field";
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

const MAX_RESULTS = 50;

export function VinylPicker({ vinyls, value, onChange }: VinylPickerProps) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const query = useDebounce(search, 200).trim().toLowerCase();

  const selected = value ? vinyls.find(({ id }) => id === value) : undefined;
  const matches = query
    ? vinyls.filter(({ title, artist }) => title.toLowerCase().includes(query) || artist.toLowerCase().includes(query))
    : vinyls;
  const visible = matches.slice(0, MAX_RESULTS);

  function close() {
    setOpen(false);
    setSearch("");
  }

  if (selected) {
    return (
      <div className="flex items-center gap-3 rounded-md border border-input bg-card p-2">
        <Cover src={selected.coverUrl} alt="" sizes="40px" className="size-10 shrink-0" />
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-medium">{selected.title}</p>
          <p className="truncate text-[13px] text-muted-foreground">{selected.artist}</p>
        </div>
        <button
          type="button"
          onClick={() => onChange(null)}
          aria-label="Quitar vinilo destacado"
          className="flex size-11 shrink-0 items-center justify-center rounded-md text-muted-foreground transition-colors duration-[120ms] hover:text-clash md:size-8"
        >
          <X aria-hidden="true" className="size-4" />
        </button>
      </div>
    );
  }

  return (
    <div className="relative">
      <input
        type="search"
        value={search}
        onChange={(event) => {
          setSearch(event.target.value);
          setOpen(true);
        }}
        onFocus={() => setOpen(true)}
        onKeyDown={(event) => {
          if (event.key === "Escape") close();
        }}
        placeholder="Buscá por título o artista"
        aria-label="Buscar vinilo destacado"
        className={controlClass}
      />

      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={close} aria-hidden="true" />
          <div className="absolute top-full left-0 z-50 mt-1 max-h-60 w-full overflow-y-auto overscroll-contain rounded-xl border border-border bg-popover text-popover-foreground shadow-md">
            {visible.length === 0 ? (
              <p className="px-3 py-4 text-[13px] text-muted-foreground">
                {query ? "Sin resultados" : "Escribí para buscar en tu colección"}
              </p>
            ) : (
              <>
                {matches.length > MAX_RESULTS && (
                  <p className="border-b border-border px-3 py-1.5 text-[13px] text-muted-foreground">
                    Mostrando los primeros {MAX_RESULTS}. Buscá para encontrar más
                  </p>
                )}
                {visible.map((vinyl) => (
                  <button
                    key={vinyl.id}
                    type="button"
                    onClick={() => {
                      onChange(vinyl.id);
                      close();
                    }}
                    className="flex w-full items-center gap-3 px-3 py-2 text-left transition-colors duration-[120ms] hover:bg-muted"
                  >
                    <Cover src={vinyl.coverUrl} alt="" sizes="32px" className="size-8 shrink-0" />
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-medium">{vinyl.title}</span>
                      <span className="block truncate text-[13px] text-muted-foreground">
                        {vinyl.artist}
                        {vinyl.genre && ` · ${vinyl.genre}`}
                      </span>
                    </span>
                  </button>
                ))}
              </>
            )}
          </div>
        </>
      )}
    </div>
  );
}
