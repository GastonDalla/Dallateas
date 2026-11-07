"use client";

import { keyLabel, parseKey } from "@dallateas/dj/camelot";
import { Button } from "@dallateas/ui/components/button";
import { cn } from "@dallateas/ui/lib/utils";
import { useMutation } from "@tanstack/react-query";
import { useId, useState } from "react";
import { toast } from "sonner";

import { Modal } from "@/components/confirm-dialog";
import { BpmSticker } from "@/components/dj/bpm-sticker";
import { MicBpm } from "@/components/dj/mic-bpm";
import { TapTempo } from "@/components/dj/tap-tempo";
import { actionClass, controlClass, Field, textareaClass } from "@/components/vinyl-form/field";
import { Segmented } from "@/components/vinyl-form/segmented";
import {
  ENERGY_LEVELS,
  parseBpm,
  trackFieldsError,
  trackFieldsFrom,
  trackUpdateInput,
  withMeasuredBpm,
  withTypedBpm,
  type BpmSource,
} from "@/components/vinyl-form/track-fields";
import { useHaptic } from "@/hooks/use-haptic";
import { useInvalidateCollection } from "@/hooks/use-invalidate-collection";
import { BPM_SOURCE_LABELS, formatBpm } from "@/lib/format";
import { trpc } from "@/utils/trpc";

type Method = "TAP" | "MIC" | "MANUAL";

const METHODS = [
  { value: "TAP", label: "Tap" },
  { value: "MIC", label: "Micrófono" },
  { value: "MANUAL", label: "A mano" },
] as const satisfies { value: Method; label: string }[];

type TrackMeasureDialogProps = {
  track: {
    id: string;
    side: string;
    title: string;
    bpm: number | null;
    bpmSource: BpmSource | null;
    camelotKey: string | null;
    energy: number | null;
    cueNotes: string | null;
  };
  vinylId: string;
  onClose: () => void;
};

/** One place for everything a DJ writes about a cut. Nothing is stored until Guardar, so a misheard tempo costs nothing. */
export function TrackMeasureDialog({ track, vinylId, onClose }: TrackMeasureDialogProps) {
  const haptic = useHaptic();
  const titleId = useId();
  const invalidate = useInvalidateCollection();
  const [method, setMethod] = useState<Method>("TAP");
  const [fields, setFields] = useState(() => trackFieldsFrom(track));
  const [problem, setProblem] = useState<string | null>(null);

  const save = useMutation(
    trpc.trackUpdate.mutationOptions({
      onSuccess: () => {
        haptic.trigger("success");
        void invalidate(vinylId);
        toast.success("Corte guardado");
        onClose();
      },
      onError: (error) => {
        haptic.trigger("error");
        setProblem(error.message);
      },
    }),
  );

  function submit(event: React.FormEvent) {
    event.preventDefault();
    const error = trackFieldsError(fields);
    setProblem(error);
    if (!error) save.mutate(trackUpdateInput(track, fields));
  }

  const tempo = parseBpm(fields.bpm);
  const key = parseKey(fields.camelotKey);
  const fieldId = (name: string) => `${titleId}-${name}`;

  return (
    <Modal labelledBy={titleId} onClose={onClose} className="max-w-md">
      <form onSubmit={submit} className="flex flex-col gap-4 p-5">
        <header className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <h2 id={titleId} className="font-heading text-xl leading-tight font-semibold">
              Medir {track.side}
            </h2>
            <p className="truncate text-[13px] text-muted-foreground">{track.title}</p>
          </div>
          <div className="flex shrink-0 flex-col items-end gap-1" aria-live="polite">
            {tempo === null ? (
              <span className="text-[13px] text-muted-foreground">Sin BPM</span>
            ) : (
              <BpmSticker tempo={formatBpm(tempo)} approximate={fields.bpmSource === "LOOKUP"} size="md" />
            )}
            {tempo !== null && fields.bpmSource && (
              <span className="text-right text-[13px] text-muted-foreground">{BPM_SOURCE_LABELS[fields.bpmSource]}</span>
            )}
          </div>
        </header>

        <Segmented label="Cómo medir el BPM" options={METHODS} value={method} onChange={setMethod} className="flex" />

        {method === "TAP" && (
          <TapTempo confirmLabel="Usar este BPM" onConfirm={(bpm) => setFields((current) => withMeasuredBpm(current, bpm, "TAP"))} />
        )}
        {method === "MIC" && (
          <MicBpm confirmLabel="Usar este BPM" onConfirm={(bpm) => setFields((current) => withMeasuredBpm(current, bpm, "MIC"))} />
        )}
        {method === "MANUAL" && (
          <Field label="BPM" htmlFor={fieldId("bpm")} hint="Dejalo vacío para borrarlo">
            <input
              id={fieldId("bpm")}
              type="text"
              inputMode="decimal"
              value={fields.bpm}
              onChange={(event) => setFields((current) => withTypedBpm(current, event.target.value))}
              maxLength={6}
              className={cn(controlClass, "tabular")}
            />
          </Field>
        )}

        <div className="grid grid-cols-2 gap-3 border-t border-border pt-4">
          <Field label="Tonalidad" htmlFor={fieldId("key")} hint={key ? `${key} ${keyLabel(key)}` : "8A o Am"}>
            <input
              id={fieldId("key")}
              type="text"
              value={fields.camelotKey}
              onChange={(event) => setFields((current) => ({ ...current, camelotKey: event.target.value }))}
              maxLength={12}
              autoComplete="off"
              className={controlClass}
            />
          </Field>
          <Field label="Energía" htmlFor={fieldId("energy")}>
            <select
              id={fieldId("energy")}
              value={fields.energy ?? ""}
              onChange={(event) => {
                const energy = ENERGY_LEVELS.find((level) => String(level) === event.target.value) ?? null;
                setFields((current) => ({ ...current, energy }));
              }}
              className={controlClass}
            >
              <option value="">Sin indicar</option>
              {ENERGY_LEVELS.map((level) => (
                <option key={level} value={level}>
                  {level} de 5
                </option>
              ))}
            </select>
          </Field>
          <Field label="Notas de cue" htmlFor={fieldId("cue")} className="col-span-2">
            <textarea
              id={fieldId("cue")}
              value={fields.cueNotes}
              onChange={(event) => setFields((current) => ({ ...current, cueNotes: event.target.value }))}
              rows={2}
              maxLength={500}
              placeholder="Entra en el break, sale antes del vocal"
              className={textareaClass}
            />
          </Field>
        </div>

        {problem && (
          <p role="alert" className="text-[13px] font-medium text-clash">
            {problem}
          </p>
        )}

        <div className="flex justify-end gap-2">
          <Button type="button" variant="outline" className={actionClass} onClick={onClose}>
            Cancelar
          </Button>
          <Button type="submit" className={actionClass} disabled={save.isPending}>
            {save.isPending ? "Guardando" : "Guardar"}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
