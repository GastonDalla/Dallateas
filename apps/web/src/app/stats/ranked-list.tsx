"use client";

import { Button } from "@dallateas/ui/components/button";
import { useState, type ReactNode } from "react";

export type RankedItem = { id: string; label: ReactNode; count: number };

type RankedListProps = {
  title: string;
  items: readonly RankedItem[];
  /** How many rows show before asking. */
  limit?: number;
  className?: string;
};

const DEFAULT_LIMIT = 8;

/** Who ranks, as a list with thin bars. Smaller and quieter than the main chart on purpose. */
export function RankedList({ title, items, limit = DEFAULT_LIMIT, className }: RankedListProps) {
  const [expanded, setExpanded] = useState(false);

  const shown = expanded ? items : items.slice(0, limit);
  const highest = Math.max(...items.map(({ count }) => count), 1);

  return (
    <section className={className}>
      <h2 className="text-sm font-medium">{title}</h2>
      {items.length === 0 ? (
        <p className="mt-2 text-sm text-muted-foreground">Sin datos todavía</p>
      ) : (
        <ol className="mt-2 flex flex-col gap-2.5">
          {shown.map(({ id, label, count }) => (
            <li key={id}>
              <div className="flex items-baseline justify-between gap-3 text-sm">
                <span className="min-w-0 truncate">{label}</span>
                <span className="tabular shrink-0 text-muted-foreground">{count}</span>
              </div>
              <div aria-hidden="true" className="mt-1 h-1 bg-muted">
                <div className="h-full bg-foreground/50" style={{ width: `${(count / highest) * 100}%` }} />
              </div>
            </li>
          ))}
        </ol>
      )}
      {items.length > limit && (
        <Button
          variant="ghost"
          className="mt-2 h-11 px-0 text-sm text-link hover:bg-transparent md:h-8"
          onClick={() => setExpanded(!expanded)}
        >
          {expanded ? "Ver menos" : `Ver las ${items.length}`}
        </Button>
      )}
    </section>
  );
}
