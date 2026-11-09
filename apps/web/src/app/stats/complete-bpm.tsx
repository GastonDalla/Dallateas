"use client";

import { Button } from "@dallateas/ui/components/button";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";
import { useEffect, useRef, useState } from "react";

import { useVinylBpmLookup } from "@/hooks/use-vinyl-bpm-lookup";
import { trpc } from "@/utils/trpc";

import { runLookups, type LookupEnd, type LookupProgress } from "./lookup-run";

type RunState =
  | { status: "idle" }
  | { status: "running"; total: number; progress: LookupProgress; stopping: boolean }
  | { status: "ended"; total: number; progress: LookupProgress; end: LookupEnd };

const NO_PROGRESS: LookupProgress = { done: 0, found: 0, notFound: 0 };

const ENDINGS: Record<LookupEnd, string> = {
  finished: "Terminó la búsqueda",
  stopped: "Búsqueda frenada",
  "rate-limited": "Llegaste al límite de búsquedas por hora. Probá de nuevo en un rato",
  "source-down": "Deezer dejó de responder. Probá de nuevo en un rato",
  failed: "Se cortó la búsqueda. Revisá la conexión y probá de nuevo",
};

function recordCount(count: number) {
  return count === 1 ? "1 disco" : `${count} discos`;
}

function Tally({ total, progress }: { total: number; progress: LookupProgress }) {
  return (
    <p className="tabular text-sm text-muted-foreground">
      {progress.done} de {recordCount(total)}: {progress.found} con BPM, {progress.notFound} sin resultado
    </p>
  );
}

/**
 * Fills in tempos from Deezer or ReccoBeats, or measured on a Deezer or Apple Music preview, one record at a time,
 * and says exactly what it found and what it did not.
 */
export function CompleteBpm() {
  const queryClient = useQueryClient();
  const missingQuery = useQuery(trpc.vinylsMissingBpm.queryOptions());
  const lookupVinyl = useVinylBpmLookup();

  const [run, setRun] = useState<RunState>({ status: "idle" });
  const controllerRef = useRef<AbortController | null>(null);

  useEffect(() => () => controllerRef.current?.abort(), []);

  const missing = missingQuery.data ?? [];

  async function start() {
    const ids = missing;
    const controller = new AbortController();
    controllerRef.current = controller;
    setRun({ status: "running", total: ids.length, progress: NO_PROGRESS, stopping: false });

    const { end, progress } = await runLookups(ids, (id) => lookupVinyl(id, controller.signal), {
      signal: controller.signal,
      onProgress: (next) =>
        setRun((current) => ({
          status: "running",
          total: ids.length,
          progress: next,
          stopping: current.status === "running" && current.stopping,
        })),
    });

    setRun({ status: "ended", total: ids.length, progress, end });

    for (const queryKey of [
      trpc.trackStats.queryKey(),
      trpc.vinylsMissingBpm.queryKey(),
      trpc.collectionStats.queryKey(),
      trpc.vinylsList.pathKey(),
    ]) {
      void queryClient.invalidateQueries({ queryKey });
    }
  }

  function stop() {
    controllerRef.current?.abort();
    setRun((current) => (current.status === "running" ? { ...current, stopping: true } : current));
  }

  if (run.status === "running") {
    const percent = run.total === 0 ? 0 : Math.round((run.progress.done / run.total) * 100);

    return (
      <section aria-label="Completar BPM" className="flex flex-col gap-3 border-y border-border py-4">
        <div className="flex flex-wrap items-center justify-between gap-3" aria-live="polite">
          <Tally total={run.total} progress={run.progress} />
          <Button variant="outline" className="h-11 px-4 text-sm md:h-9" disabled={run.stopping} onClick={stop}>
            {run.stopping && <Loader2 aria-hidden="true" className="motion-safe:animate-spin" />}
            {run.stopping ? "Frenando" : "Frenar"}
          </Button>
        </div>
        <div
          role="progressbar"
          aria-label="Avance de la búsqueda"
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={percent}
          className="h-1.5 bg-muted"
        >
          <div className="h-full bg-primary transition-[width]" style={{ width: `${percent}%` }} />
        </div>
      </section>
    );
  }

  if (missing.length === 0 && run.status === "idle") return null;

  return (
    <section
      aria-label="Completar BPM"
      className="flex flex-wrap items-center justify-between gap-x-6 gap-y-3 border-y border-border py-4"
    >
      <div className="min-w-0 max-w-prose" aria-live="polite">
        {run.status === "ended" ? (
          <>
            <p className="text-sm font-medium">{ENDINGS[run.end]}</p>
            <Tally total={run.total} progress={run.progress} />
          </>
        ) : (
          <>
            <p className="text-sm font-medium">{recordCount(missing.length)} con cortes sin BPM</p>
            <p className="text-sm text-pretty text-muted-foreground">
              Se buscan en Deezer, ReccoBeats y Apple Music de a uno y quedan como aproximados, hasta que los midas
            </p>
          </>
        )}
      </div>
      {missing.length > 0 && (
        <Button className="h-11 px-4 text-sm md:h-9" onClick={() => void start()}>
          Completar BPM
        </Button>
      )}
    </section>
  );
}
