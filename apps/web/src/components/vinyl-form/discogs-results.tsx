import { Loader2 } from "lucide-react";

import { Cover } from "@/components/dj/cover";
import type { DiscogsSearchRelease } from "@/lib/discogs";

type DiscogsResultsProps = {
  results: DiscogsSearchRelease[];
  isSearching: boolean;
  failed: boolean;
  foundNothing: boolean;
  onPick: (release: DiscogsSearchRelease) => void;
};

function releaseDetails({ year, label, genre, country, format }: DiscogsSearchRelease) {
  return [year, label?.[0], genre?.[0], country, format?.[0]].filter(Boolean).join(" · ");
}

export function DiscogsResults({ results, isSearching, failed, foundNothing, onPick }: DiscogsResultsProps) {
  if (results.length > 0) {
    return (
      <div className="flex max-h-56 flex-col overflow-y-auto overscroll-contain rounded-md border border-border bg-card">
        <p className="px-3 pt-2 text-[13px] text-muted-foreground">{results.length} resultados de Discogs</p>
        {results.map((release) => (
          <button
            key={release.id}
            type="button"
            onClick={() => onPick(release)}
            className="flex items-center gap-3 px-3 py-2 text-left transition-colors duration-[120ms] hover:bg-muted"
          >
            <Cover src={release.cover_image} alt="" sizes="40px" className="size-10 shrink-0" />
            <span className="min-w-0 flex-1">
              <span className="block truncate text-sm font-medium">{release.title}</span>
              <span className="block truncate text-[13px] text-muted-foreground">{releaseDetails(release)}</span>
            </span>
          </button>
        ))}
      </div>
    );
  }

  if (isSearching) {
    return (
      <p role="status" className="flex items-center gap-2 text-[13px] text-muted-foreground">
        <Loader2 aria-hidden="true" className="size-3.5 animate-spin" />
        Buscando en Discogs
      </p>
    );
  }

  if (failed) return <p role="status" className="text-[13px] text-muted-foreground">Discogs no respondió. Probá de nuevo o cargalo a mano</p>;
  if (foundNothing) return <p role="status" className="text-[13px] text-muted-foreground">Discogs no tiene resultados para eso</p>;
  return null;
}
