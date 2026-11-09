"use client";

import { cn } from "@dallateas/ui/lib/utils";
import { Check, ChevronDown, Search, X } from "lucide-react";
import { useRef, useState } from "react";

import { useAnchoredPopover } from "@/hooks/use-anchored-popover";

type FilterOption = {
  value: string;
  label: string;
  count?: number;
};

type SharedProps = {
  label: string;
  options: FilterOption[];
  placeholder?: string;
  searchThreshold?: number;
};

type FilterSelectSingleProps = SharedProps & {
  value: string | undefined;
  onChange: (value: string | undefined) => void;
  multi?: false;
  values?: never;
  onChangeMulti?: never;
};

type FilterSelectMultiProps = SharedProps & {
  multi: true;
  values: string[];
  onChangeMulti: (values: string[]) => void;
  value?: never;
  onChange?: never;
};

type FilterSelectProps = FilterSelectSingleProps | FilterSelectMultiProps;

function triggerLabel(props: FilterSelectProps) {
  const fallback = props.placeholder ?? props.label;
  if (props.multi) return props.values.length > 0 ? `${fallback}: ${props.values.length}` : fallback;
  return props.options.find((option) => option.value === props.value)?.label ?? fallback;
}

export function FilterSelect(props: FilterSelectProps) {
  const { label, options, searchThreshold = 6 } = props;
  const [search, setSearch] = useState("");
  const searchRef = useRef<HTMLInputElement>(null);
  const popover = useAnchoredPopover({
    onOpen: () => searchRef.current?.focus(),
    onClose: () => setSearch(""),
  });

  const selected = props.multi ? props.values : props.value ? [props.value] : [];
  const hasSelection = selected.length > 0;
  const showSearch = options.length > searchThreshold;
  const query = search.trim().toLowerCase();
  const filtered = query ? options.filter((option) => option.label.toLowerCase().includes(query)) : options;
  const total = options.reduce((sum, option) => sum + (option.count ?? 0), 0);

  function clear() {
    if (props.multi) props.onChangeMulti([]);
    else props.onChange(undefined);
  }

  function choose(value: string) {
    if (props.multi) {
      const next = props.values.includes(value)
        ? props.values.filter((current) => current !== value)
        : [...props.values, value];
      props.onChangeMulti(next);
      return;
    }
    props.onChange(value);
    popover.close();
  }

  if (options.length === 0) return null;

  return (
    <div
      className={cn(
        "flex h-11 shrink-0 items-center rounded-md border text-[13px] transition-colors duration-[120ms] md:h-9",
        hasSelection ? "border-transparent bg-accent text-accent-foreground" : "border-input bg-card text-muted-foreground",
      )}
    >
      <button
        {...popover.triggerProps}
        type="button"
        aria-haspopup="listbox"
        aria-label={label}
        className={cn(
          "flex h-full items-center gap-1.5 rounded-md pl-3 font-medium transition-colors duration-[120ms] hover:text-foreground focus-visible:outline-2 focus-visible:outline-ring",
          hasSelection ? "pr-1 hover:text-accent-foreground" : "pr-2.5",
        )}
      >
        <span className="max-w-32 truncate">{triggerLabel(props)}</span>
        {!hasSelection && <ChevronDown aria-hidden="true" className="size-3.5 shrink-0" />}
      </button>
      {hasSelection && (
        <button
          type="button"
          onClick={clear}
          aria-label={`Limpiar filtro ${label}`}
          className="flex h-full w-8 items-center justify-center rounded-md focus-visible:outline-2 focus-visible:outline-ring"
        >
          <X aria-hidden="true" className="size-3.5" />
        </button>
      )}

      <div
        {...popover.panelProps}
        className="fixed inset-auto m-0 w-60 overflow-hidden rounded-xl border border-border bg-popover text-popover-foreground shadow-md"
      >
        {showSearch && (
          <div className="flex items-center gap-2 border-b border-border px-3">
            <Search aria-hidden="true" className="size-3.5 shrink-0 text-muted-foreground" />
            <input
              ref={searchRef}
              type="text"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder={`Buscar ${label.toLowerCase()}`}
              aria-label={`Buscar ${label.toLowerCase()}`}
              className="h-11 w-full bg-transparent text-base placeholder:text-muted-foreground focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-ring md:h-9 md:text-[13px]"
            />
          </div>
        )}

        <div
          role="listbox"
          aria-label={label}
          aria-multiselectable={props.multi}
          className="max-h-56 overflow-y-auto overscroll-contain p-1"
        >
          <FilterOptionButton active={!hasSelection} onClick={clear} label="Todos" count={total || undefined} />
          {filtered.length === 0 ? (
            <p className="px-2.5 py-3 text-[13px] text-muted-foreground">Sin resultados</p>
          ) : (
            filtered.map((option) => (
              <FilterOptionButton
                key={option.value}
                active={selected.includes(option.value)}
                onClick={() => choose(option.value)}
                label={option.label}
                count={option.count}
              />
            ))
          )}
        </div>
      </div>
    </div>
  );
}

type FilterOptionButtonProps = {
  active: boolean;
  onClick: () => void;
  label: string;
  count?: number;
};

function FilterOptionButton({ active, onClick, label, count }: FilterOptionButtonProps) {
  return (
    <button
      type="button"
      role="option"
      aria-selected={active}
      onClick={onClick}
      className={cn(
        "flex min-h-11 w-full items-center gap-2 rounded-md px-2.5 py-1.5 text-left text-[13px] transition-colors duration-[120ms] md:min-h-9",
        active ? "bg-accent font-medium text-accent-foreground" : "hover:bg-muted",
      )}
    >
      <span className="flex-1 truncate">{label}</span>
      {count !== undefined && <span className="tabular shrink-0 text-muted-foreground">{count}</span>}
      {active && <Check aria-hidden="true" className="size-3.5 shrink-0" />}
    </button>
  );
}
