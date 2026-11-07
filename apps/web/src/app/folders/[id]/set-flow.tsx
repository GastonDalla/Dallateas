"use client";

import { closestCenter, DndContext, type DragEndEvent } from "@dnd-kit/core";
import { arrayMove, SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { Button } from "@dallateas/ui/components/button";
import { Skeleton } from "@dallateas/ui/components/skeleton";
import { cn } from "@dallateas/ui/lib/utils";
import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { ReactNode } from "react";
import { toast } from "sonner";

import { PitchRangePicker } from "@/components/dj/tools/pitch-range-picker";
import { EmptyState } from "@/components/shell/empty-state";
import { SortableHandleItem, useSortSensors } from "@/components/sortable-item";
import { useHaptic } from "@/hooks/use-haptic";
import { formatBpm, formatRunningTime } from "@/lib/format";
import { usePitchRange } from "@/lib/pitch-range";
import { trpc } from "@/utils/trpc";

import { SetBag } from "./set-bag";
import { SetRow, type SetTransition } from "./set-row";
import { SetTempoChart } from "./set-tempo-chart";

type SetFlowProps = {
  folderId: string;
  folderName: string;
  canReorder: boolean;
  canChooseCut: boolean;
};

function Figure({ label, note, children }: { label: string; note?: ReactNode; children: ReactNode }) {
  return (
    <div>
      <dt className="text-[13px] text-muted-foreground">{label}</dt>
      <dd>
        <span className="tabular font-heading text-[28px] font-bold leading-tight">{children}</span>
        {note && <span className="block text-[13px] text-muted-foreground">{note}</span>}
      </dd>
    </div>
  );
}

function Missing() {
  return <span className="font-sans text-sm font-normal text-muted-foreground">—</span>;
}

function SetFlowSkeleton() {
  return (
    <div className="flex flex-col gap-6" aria-hidden="true">
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {["time", "tempo", "reach"].map((figure) => (
          <div key={figure} className="space-y-2">
            <Skeleton className="h-3 w-20" />
            <Skeleton className="h-7 w-24" />
          </div>
        ))}
      </div>
      <Skeleton className="h-48 w-full md:h-56" />
      <div className="divide-y divide-border border-y border-border">
        {["first", "second", "third"].map((row) => (
          <div key={row} className="flex items-center gap-3 py-3">
            <Skeleton className="size-12" />
            <Skeleton className="h-4 w-48" />
          </div>
        ))}
      </div>
    </div>
  );
}

function changeKey(fromId: string, toId: string) {
  return `${fromId}>${toId}`;
}

/** Where a DJ prepares a night: the tempo across the set, each change and what to pack. */
export function SetFlow({ folderId, folderName, canReorder, canChooseCut }: SetFlowProps) {
  const queryClient = useQueryClient();
  const haptic = useHaptic();
  const sensors = useSortSensors();
  const [pitchRange, setPitchRange] = usePitchRange();

  const flowQuery = trpc.folderSetFlow.queryOptions({ folderId, pitchRange });
  const flow = useQuery({ ...flowQuery, placeholderData: keepPreviousData });

  function refresh() {
    void queryClient.invalidateQueries({ queryKey: trpc.folderSetFlow.pathKey() });
    void queryClient.invalidateQueries({ queryKey: trpc.folderGet.queryKey({ id: folderId }) });
  }

  const reorder = useMutation(
    trpc.folderReorderVinyls.mutationOptions({
      onError: () => toast.error("No se pudo guardar el orden"),
      onSettled: refresh,
    }),
  );

  const chooseCut = useMutation(
    trpc.folderSetTrack.mutationOptions({
      onSuccess: refresh,
      onError: (error) => toast.error(error.message),
    }),
  );

  if (flow.isPending) return <SetFlowSkeleton />;

  if (flow.isError) {
    return (
      <EmptyState
        title="No se pudo cargar el set"
        action={
          <Button variant="outline" className="h-11 md:h-9" onClick={() => void flow.refetch()}>
            Reintentar
          </Button>
        }
      />
    );
  }

  const { data } = flow;
  const { rows, transitions, totalSeconds, tracksWithoutDuration, minBpm, maxBpm } = data;

  const changes = new Map<string, SetTransition>(
    transitions.map((transition) => [changeKey(transition.fromId, transition.toId), transition]),
  );
  const changeAfter = (position: number) => {
    const next = rows[position + 1];
    if (!next) return undefined;
    return changes.get(changeKey(rows[position]!.id, next.id)) ?? null;
  };

  const unreachable = rows.flatMap((_, position) => (changeAfter(position)?.reachable === false ? [position] : []));

  function handleDragEnd({ active, over }: DragEndEvent) {
    if (!over || active.id === over.id) return;

    const from = rows.findIndex(({ id }) => id === active.id);
    const to = rows.findIndex(({ id }) => id === over.id);
    if (from === -1 || to === -1) return;

    const reordered = arrayMove(rows, from, to);
    haptic.trigger("medium");
    void queryClient.cancelQueries({ queryKey: flowQuery.queryKey });
    queryClient.setQueryData(flowQuery.queryKey, { ...data, rows: reordered });
    reorder.mutate({ folderId, vinylOrder: reordered.map(({ id }) => id) });
  }

  return (
    <div className={cn("flex flex-col gap-8 transition-opacity", flow.isPlaceholderData && "opacity-60")}>
      <dl className="grid grid-cols-2 items-start gap-x-8 gap-y-5 lg:grid-cols-[auto_auto_auto_minmax(0,1fr)]">
        <Figure
          label="Duración"
          note={
            tracksWithoutDuration > 0 &&
            (tracksWithoutDuration === 1 ? "1 disco sin duración" : `${tracksWithoutDuration} discos sin duración`)
          }
        >
          {totalSeconds > 0 ? formatRunningTime(totalSeconds) : <Missing />}
        </Figure>
        <Figure label="Tempo" note="BPM">
          {minBpm === null || maxBpm === null ? (
            <Missing />
          ) : minBpm === maxBpm ? (
            formatBpm(minBpm)
          ) : (
            `${formatBpm(minBpm)}–${formatBpm(maxBpm)}`
          )}
        </Figure>
        <Figure label="Fuera de alcance" note={`de ${transitions.length} cambios, con ±${pitchRange}%`}>
          <span className={unreachable.length > 0 ? "text-clash" : undefined}>{unreachable.length}</span>
        </Figure>
        <div className="col-span-2 lg:col-span-1 lg:justify-self-end">
          <p className="mb-1 text-[13px] text-muted-foreground">Tu fader</p>
          <PitchRangePicker name="set-range" value={pitchRange} onChange={setPitchRange} />
        </div>
      </dl>

      <SetTempoChart
        points={rows.map(({ id, vinyl, bpm }) => ({ id, name: `${vinyl.artist}, ${vinyl.title}`, bpm }))}
        unreachable={unreachable}
        pitchRange={pitchRange}
      />

      <section aria-labelledby="set-order">
        <div className="mb-2 flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
          <h2 id="set-order" className="font-heading text-xl font-bold">
            Orden del set
          </h2>
          <p className="text-[13px] text-muted-foreground">
            La relación entre tonalidades ya cuenta cuánto se corre cada disco al pitchearlo
          </p>
        </div>

        <DndContext id="set-flow" sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
          <SortableContext items={rows.map(({ id }) => id)} strategy={verticalListSortingStrategy}>
            <div role="list" className="divide-y divide-border border-y border-border">
              {rows.map((row, position) => (
                <SortableHandleItem key={row.id} id={row.id} disabled={!canReorder} role="listitem">
                  {(handleProps) => (
                    <SetRow
                      row={row}
                      position={position + 1}
                      approximate={row.bpmSource === "LOOKUP"}
                      transition={changeAfter(position)}
                      pitchRange={pitchRange}
                      handleProps={handleProps}
                      canReorder={canReorder}
                      canChooseCut={canChooseCut}
                      choosing={chooseCut.isPending && chooseCut.variables.vinylId === row.id}
                      onChooseCut={(trackId) => chooseCut.mutate({ folderId, vinylId: row.id, trackId })}
                    />
                  )}
                </SortableHandleItem>
              ))}
            </div>
          </SortableContext>
        </DndContext>
      </section>

      <SetBag folderName={folderName} rows={rows} />
    </div>
  );
}
