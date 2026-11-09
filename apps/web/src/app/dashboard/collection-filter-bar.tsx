"use client";

import { CAMELOT_KEYS, keyLabel } from "@dallateas/dj/camelot";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@dallateas/ui/components/button";
import { cn } from "@dallateas/ui/lib/utils";
import { LayoutGrid, List, X } from "lucide-react";

import { ScannerButton } from "@/components/barcode-scanner";
import { FilterSelect } from "@/components/filter-select";
import { actionClass, controlClass } from "@/components/vinyl-form/field";
import { Segmented } from "@/components/vinyl-form/segmented";
import { useDebouncedField } from "@/hooks/use-debounced-field";
import { trpc } from "@/utils/trpc";

import { hasFilters, parseBpmFilter, type CollectionFilters } from "./filters";

export type CollectionView = "covers" | "list";

const VIEWS = [
  { value: "covers", label: <LayoutGrid aria-hidden="true" className="size-4" />, ariaLabel: "Ver tapas" },
  { value: "list", label: <List aria-hidden="true" className="size-4" />, ariaLabel: "Ver lista" },
] as const;

const KEY_OPTIONS = CAMELOT_KEYS.map((key) => ({ value: key, label: `${key} ${keyLabel(key)}` }));

type BpmInputProps = {
  label: string;
  placeholder: string;
  value: number | undefined;
  onCommit: (bpm: number | undefined) => void;
};

/** Half typed tempos are left alone: "12" on the way to "126" must not filter by anything. */
function BpmInput({ label, placeholder, value, onCommit }: BpmInputProps) {
  const [text, setText] = useDebouncedField(value === undefined ? "" : String(value), (next) => {
    const bpm = parseBpmFilter(next);
    if (bpm !== undefined || !next.trim()) onCommit(bpm);
  });
  const invalid = text.trim() !== "" && parseBpmFilter(text) === undefined;

  return (
    <input
      type="text"
      inputMode="decimal"
      value={text}
      onChange={(event) => setText(event.target.value)}
      aria-label={label}
      aria-invalid={invalid}
      title={invalid ? "Entre 20 y 400" : undefined}
      placeholder={placeholder}
      maxLength={6}
      className={cn(controlClass, "tabular w-16 px-2 text-center")}
    />
  );
}

type CollectionFilterBarProps = {
  filters: CollectionFilters;
  view: CollectionView;
  onViewChange: (view: CollectionView) => void;
  onChange: (changes: Partial<CollectionFilters>) => void;
  onClear: () => void;
};

export function CollectionFilterBar({ filters, view, onViewChange, onChange, onClear }: CollectionFilterBarProps) {
  const { data: folders = [] } = useQuery(trpc.foldersList.queryOptions());
  const { data: genres = [] } = useQuery(trpc.userGenres.queryOptions());
  const { data: styles = [] } = useQuery(trpc.userStyles.queryOptions());
  const { data: tags = [] } = useQuery(trpc.tagsList.queryOptions());

  const [search, setSearch] = useDebouncedField(filters.search, (text) => onChange({ search: text, barcode: undefined }));

  return (
    <div className="flex flex-col gap-2">
      <div className="flex gap-2">
        <input
          type="search"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Buscá por título, artista o sello"
          aria-label="Buscar en la colección"
          maxLength={200}
          className={controlClass}
        />
        <ScannerButton onScan={(barcode) => onChange({ barcode, search: "" })} />
        <Segmented label="Vista de la colección" options={VIEWS} value={view} onChange={onViewChange} className="shrink-0" />
      </div>

      {filters.barcode && (
        <p className="flex items-center gap-1 self-start rounded-sm bg-accent pl-2.5 text-[13px] text-accent-foreground">
          Código <span className="tabular font-medium">{filters.barcode}</span>
          <button
            type="button"
            onClick={() => onChange({ barcode: undefined })}
            aria-label="Quitar el código de barras"
            className="flex size-11 items-center justify-center md:size-8"
          >
            <X aria-hidden="true" className="size-3.5" />
          </button>
        </p>
      )}

      <div className="no-scrollbar -mx-4 flex items-center gap-2 overflow-x-auto px-4 md:mx-0 md:flex-wrap md:overflow-visible md:px-0">
        <div role="group" aria-label="BPM" className="flex shrink-0 items-center gap-1.5 text-[13px] text-muted-foreground">
          <span aria-hidden="true">BPM</span>
          <BpmInput label="BPM desde" placeholder="desde" value={filters.bpmMin} onCommit={(bpmMin) => onChange({ bpmMin })} />
          <BpmInput label="BPM hasta" placeholder="hasta" value={filters.bpmMax} onCommit={(bpmMax) => onChange({ bpmMax })} />
        </div>
        <FilterSelect
          label="Tonalidad"
          options={KEY_OPTIONS}
          multi
          values={filters.keys}
          onChangeMulti={(keys) => onChange({ keys })}
        />
        <FilterSelect
          label="Carpeta"
          options={folders.map(({ id, name, _count }) => ({ value: id, label: name, count: _count.vinyls }))}
          value={filters.folderId}
          onChange={(folderId) => onChange({ folderId })}
        />
        <FilterSelect
          label="Género"
          options={genres.map((genre) => ({ value: genre, label: genre }))}
          multi
          values={filters.genres}
          onChangeMulti={(next) => onChange({ genres: next })}
        />
        <FilterSelect
          label="Estilo"
          options={styles.map((style) => ({ value: style, label: style }))}
          multi
          values={filters.styles}
          onChangeMulti={(next) => onChange({ styles: next })}
        />
        <FilterSelect
          label="Tag"
          options={tags.map(({ id, name, _count }) => ({ value: id, label: name, count: _count.vinyls }))}
          multi
          values={filters.tagIds}
          onChangeMulti={(tagIds) => onChange({ tagIds })}
        />
        {hasFilters(filters) && (
          <Button type="button" variant="ghost" className={cn(actionClass, "md:h-9")} onClick={onClear}>
            Limpiar filtros
          </Button>
        )}
      </div>
    </div>
  );
}
