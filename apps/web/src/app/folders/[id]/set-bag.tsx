"use client";

import { Button } from "@dallateas/ui/components/button";
import { Printer } from "lucide-react";

import { packingGroups } from "./set-model";
import type { SetRowData } from "./set-row";

type SetBagProps = {
  folderName: string;
  rows: readonly SetRowData[];
};

/** What to pull from the shelves before a gig. `set-bag.css` prints this and nothing else on the page. */
export function SetBag({ folderName, rows }: SetBagProps) {
  const groups = packingGroups(rows);

  return (
    <section id="set-bag" aria-labelledby="set-bag-title" className="border-t border-border pt-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 id="set-bag-title" className="font-heading text-xl font-bold">
            Para la bolsa
          </h2>
          <p className="text-sm text-muted-foreground">
            <span className="hidden print:inline">{folderName}: </span>
            {rows.length === 1 ? "1 disco" : `${rows.length} discos`} por lugar, para juntarlos de una pasada
          </p>
        </div>
        <Button variant="outline" className="h-11 px-3 text-sm md:h-9 print:hidden" onClick={() => window.print()}>
          <Printer aria-hidden="true" />
          Imprimir
        </Button>
      </div>

      <div className="mt-4 gap-8 sm:columns-2">
        {groups.map(({ location, rows: records }) => (
          <div key={location ?? "unplaced"} className="mb-4 break-inside-avoid">
            <h3 className={location ? "text-sm font-medium" : "text-sm font-medium text-muted-foreground"}>
              {location ?? "Sin ubicar"}
            </h3>
            <ul className="mt-1 divide-y divide-border border-y border-border text-sm">
              {records.map((row) => (
                <li key={row.id} className="flex items-baseline gap-2 py-1.5">
                  <span aria-hidden="true" className="hidden size-3 shrink-0 border border-current print:inline-block" />
                  <span className="min-w-0">
                    {row.vinyl.artist} <span className="text-muted-foreground">{row.vinyl.title}</span>
                    <span className="block text-[13px] text-muted-foreground">{row.label}</span>
                  </span>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </section>
  );
}
