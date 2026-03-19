"use client";

import { ChevronDown, Search, X } from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";

type FilterOption = {
  value: string;
  label: string;
  count?: number;
};

type FilterSelectSingleProps = {
  label: string;
  options: FilterOption[];
  value: string | undefined;
  onChange: (value: string | undefined) => void;
  placeholder?: string;
  searchThreshold?: number;
  multi?: false;
  values?: never;
  onChangeMulti?: never;
};

type FilterSelectMultiProps = {
  label: string;
  options: FilterOption[];
  multi: true;
  values: string[];
  onChangeMulti: (values: string[]) => void;
  placeholder?: string;
  searchThreshold?: number;
  value?: never;
  onChange?: never;
};

type FilterSelectProps = FilterSelectSingleProps | FilterSelectMultiProps;

export function FilterSelect(props: FilterSelectProps) {
  const {
    label,
    options,
    placeholder,
    searchThreshold = 6,
  } = props;
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [dropdownPos, setDropdownPos] = useState({ top: 0, left: 0 });
  const triggerRef = useRef<HTMLButtonElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);

  const isMulti = props.multi === true;
  const value = isMulti ? undefined : props.value;
  const values = isMulti ? props.values : [];

  const selectedOption = useMemo(
    () => (isMulti ? null : options.find((o) => o.value === value)),
    [options, value, isMulti],
  );

  const filtered = useMemo(() => {
    if (!search.trim()) return options;
    const q = search.toLowerCase();
    return options.filter((o) => o.label.toLowerCase().includes(q));
  }, [options, search]);

  const showSearch = options.length > searchThreshold;

  useEffect(() => {
    if (!open || !triggerRef.current) return;
    const update = () => {
      if (!triggerRef.current) return;
      const rect = triggerRef.current.getBoundingClientRect();
      setDropdownPos({ top: rect.bottom + 4, left: rect.left });
    };
    update();
    window.addEventListener("scroll", update, true);
    window.addEventListener("resize", update);
    return () => {
      window.removeEventListener("scroll", update, true);
      window.removeEventListener("resize", update);
    };
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      const target = e.target as Node;
      if (
        triggerRef.current && !triggerRef.current.contains(target) &&
        dropdownRef.current && !dropdownRef.current.contains(target)
      ) {
        setOpen(false);
        setSearch("");
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setOpen(false);
        setSearch("");
      }
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [open]);

  useEffect(() => {
    if (open && showSearch) {
      requestAnimationFrame(() => searchRef.current?.focus());
    }
  }, [open, showSearch]);

  const select = useCallback(
    (val: string | undefined) => {
      if (isMulti && props.onChangeMulti) {
        if (!val) {
          props.onChangeMulti([]);
        } else {
          const current = props.values ?? [];
          props.onChangeMulti(
            current.includes(val) ? current.filter((v) => v !== val) : [...current, val],
          );
        }
        return;
      }
      if (!isMulti && props.onChange) {
        props.onChange(val);
      }
      setOpen(false);
      setSearch("");
    },
    [isMulti, props],
  );

  const hasSelection = isMulti ? values.length > 0 : !!value;
  const triggerLabel = isMulti
    ? values.length > 0
      ? `${values.length} seleccionado${values.length > 1 ? "s" : ""}`
      : placeholder ?? label
    : selectedOption ? selectedOption.label : placeholder ?? label;

  if (options.length === 0) return null;

  const dropdown = open && typeof document !== "undefined"
    ? createPortal(
        <div
          ref={dropdownRef}
          className="fixed z-9999 w-56 overflow-hidden rounded-lg border border-border/60 bg-background shadow-lg animate-in fade-in-0 zoom-in-95"
          style={{ top: dropdownPos.top, left: dropdownPos.left }}
          role="listbox"
          aria-label={label}
        >
          {showSearch && (
            <div className="border-b border-border/40 p-2">
              <div className="flex items-center gap-2 rounded-md bg-muted px-2.5 py-1.5">
                <Search className="h-3.5 w-3.5 shrink-0 text-muted-foreground" aria-hidden="true" />
                <input
                  ref={searchRef}
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder={`Buscar ${label.toLowerCase()}...`}
                  className="w-full bg-transparent text-xs outline-none placeholder:text-muted-foreground/60"
                  aria-label={`Buscar ${label.toLowerCase()}`}
                />
              </div>
            </div>
          )}

          <div className="max-h-52 overflow-y-auto overscroll-contain p-1">
            <button
              type="button"
              onClick={() => select(undefined)}
              role="option"
              aria-selected={!hasSelection}
              className={`flex w-full items-center gap-2 rounded-md px-2.5 py-2 text-left text-xs transition-colors ${
                !hasSelection
                  ? "bg-primary/10 font-medium text-primary"
                  : "text-foreground hover:bg-muted"
              }`}
            >
              <span className="flex-1">Todos</span>
              <span className="text-[10px] text-muted-foreground">
                {options.reduce((sum, o) => sum + (o.count ?? 0), 0) || ""}
              </span>
            </button>

            {filtered.length === 0 ? (
              <p className="px-2.5 py-3 text-center text-[11px] text-muted-foreground">
                Sin resultados
              </p>
            ) : (
              filtered.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => select(option.value)}
                  role="option"
                  aria-selected={isMulti ? values.includes(option.value) : value === option.value}
                  className={`flex w-full items-center gap-2 rounded-md px-2.5 py-2 text-left text-xs transition-colors ${
                    (isMulti ? values.includes(option.value) : value === option.value)
                      ? "bg-primary/10 font-medium text-primary"
                      : "text-foreground hover:bg-muted"
                  }`}
                >
                  {isMulti && (
                    <div className={`flex h-3.5 w-3.5 shrink-0 items-center justify-center rounded border ${values.includes(option.value) ? "border-primary bg-primary text-primary-foreground" : "border-border/60"}`}>
                      {values.includes(option.value) && <span className="text-[8px]">✓</span>}
                    </div>
                  )}
                  <span className="flex-1 truncate">{option.label}</span>
                  {option.count != null && (
                    <span className="shrink-0 text-[10px] text-muted-foreground">
                      {option.count}
                    </span>
                  )}
                </button>
              ))
            )}
          </div>
        </div>,
        document.body,
      )
    : null;

  return (
    <div className="relative">
      <button
        ref={triggerRef}
        type="button"
        onClick={() => setOpen(!open)}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label={label}
        className={`flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-medium transition-all ${
          hasSelection
            ? "border-primary/30 bg-primary/10 text-primary"
            : "border-border/60 bg-card text-muted-foreground hover:border-border hover:text-foreground"
        }`}
      >
        <span className="max-w-30 truncate">
          {triggerLabel}
        </span>
        {hasSelection ? (
          <X
            className="h-3 w-3 shrink-0 opacity-60 hover:opacity-100"
            onClick={(e) => {
              e.stopPropagation();
              select(undefined);
            }}
            aria-label={`Limpiar filtro ${label}`}
          />
        ) : (
          <ChevronDown
            className={`h-3 w-3 shrink-0 transition-transform ${open ? "rotate-180" : ""}`}
            aria-hidden="true"
          />
        )}
      </button>
      {dropdown}
    </div>
  );
}
