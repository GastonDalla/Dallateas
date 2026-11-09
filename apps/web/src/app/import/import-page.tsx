"use client";

import { cn } from "@dallateas/ui/lib/utils";
import { useState } from "react";

import { CsvImportPanel } from "./csv-import-panel";
import { DiscogsImportPanel } from "./discogs-import-panel";

const SOURCES = [
  { id: "csv", label: "Archivo CSV" },
  { id: "discogs", label: "Discogs" },
] as const;

type Source = (typeof SOURCES)[number]["id"];

export default function ImportPage() {
  const [source, setSource] = useState<Source>("csv");

  return (
    <div className="flex flex-col gap-6">
      <div role="tablist" aria-label="Origen de la importación" className="flex gap-6 border-b border-border">
        {SOURCES.map(({ id, label }) => (
          <button
            key={id}
            id={`import-tab-${id}`}
            type="button"
            role="tab"
            aria-selected={source === id}
            aria-controls={`import-panel-${id}`}
            onClick={() => setSource(id)}
            className={cn(
              "-mb-px h-11 border-b-2 text-sm font-medium transition-colors focus-visible:outline-2 focus-visible:outline-ring",
              source === id
                ? "border-primary text-foreground"
                : "border-transparent text-muted-foreground hover:text-foreground",
            )}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Both stay mounted, so switching tabs never throws away a parsed file or a Discogs search. */}
      <div id="import-panel-csv" role="tabpanel" aria-labelledby="import-tab-csv" hidden={source !== "csv"}>
        <CsvImportPanel />
      </div>
      <div id="import-panel-discogs" role="tabpanel" aria-labelledby="import-tab-discogs" hidden={source !== "discogs"}>
        <DiscogsImportPanel />
      </div>
    </div>
  );
}
