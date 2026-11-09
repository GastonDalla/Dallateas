"use client";

import { Button } from "@dallateas/ui/components/button";
import { Loader2, Plus, Trash2 } from "lucide-react";

import { BPM_SOURCE_LABELS } from "@/lib/format";

import { actionClass, controlClass, Field, FormSection, iconActionClass } from "./field";
import { newTrackDraft, type TrackDraft } from "./form-state";
import { ENERGY_LEVELS, withTypedBpm } from "./track-fields";

type TrackEditorProps = {
  track: TrackDraft;
  number: number;
  onChange: (track: TrackDraft) => void;
  onRemove: () => void;
};

function TrackEditor({ track, number, onChange, onRemove }: TrackEditorProps) {
  const fieldId = (name: string) => `${track.key}-${name}`;

  return (
    <li className="flex flex-col gap-2 border-t border-border py-3 first:border-t-0 first:pt-0">
      <div className="grid grid-cols-[4.5rem_minmax(0,1fr)_auto] items-end gap-2">
        <Field label="Lado" htmlFor={fieldId("side")}>
          <input
            id={fieldId("side")}
            type="text"
            value={track.side}
            onChange={(event) => onChange({ ...track, side: event.target.value })}
            placeholder="A1"
            maxLength={10}
            className={controlClass}
          />
        </Field>
        <Field label="Título" htmlFor={fieldId("title")}>
          <input
            id={fieldId("title")}
            type="text"
            value={track.title}
            onChange={(event) => onChange({ ...track, title: event.target.value })}
            maxLength={500}
            className={controlClass}
          />
        </Field>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className={`${iconActionClass} text-muted-foreground hover:text-clash md:size-9`}
          onClick={onRemove}
          aria-label={`Quitar corte ${number}`}
        >
          <Trash2 aria-hidden="true" />
        </Button>
      </div>

      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        <Field label="Duración" htmlFor={fieldId("duration")}>
          <input
            id={fieldId("duration")}
            type="text"
            value={track.duration}
            onChange={(event) => onChange({ ...track, duration: event.target.value })}
            placeholder="6:32"
            maxLength={20}
            className={controlClass}
          />
        </Field>
        <Field label="BPM" htmlFor={fieldId("bpm")}>
          <input
            id={fieldId("bpm")}
            type="text"
            inputMode="decimal"
            value={track.bpm}
            onChange={(event) => onChange(withTypedBpm(track, event.target.value))}
            placeholder="124"
            maxLength={6}
            className={controlClass}
          />
        </Field>
        <Field label="Tonalidad" htmlFor={fieldId("key")}>
          <input
            id={fieldId("key")}
            type="text"
            value={track.camelotKey}
            onChange={(event) => onChange({ ...track, camelotKey: event.target.value })}
            placeholder="8A o Am"
            maxLength={12}
            className={controlClass}
          />
        </Field>
        <Field label="Energía" htmlFor={fieldId("energy")}>
          <select
            id={fieldId("energy")}
            value={track.energy ?? ""}
            onChange={(event) => onChange({ ...track, energy: ENERGY_LEVELS.find((level) => String(level) === event.target.value) ?? null })}
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
      </div>

      {track.bpm.trim() && track.bpmSource && (
        <p className="text-[13px] text-muted-foreground">BPM {BPM_SOURCE_LABELS[track.bpmSource]}</p>
      )}

      <Field label="Notas de cue" htmlFor={fieldId("cue")}>
        <input
          id={fieldId("cue")}
          type="text"
          value={track.cueNotes}
          onChange={(event) => onChange({ ...track, cueNotes: event.target.value })}
          placeholder="Entra en el break, sale antes del vocal"
          maxLength={500}
          className={controlClass}
        />
      </Field>
    </li>
  );
}

type TracksEditorProps = {
  tracks: TrackDraft[];
  isLoading: boolean;
  onChange: (tracks: TrackDraft[]) => void;
};

export function TracksEditor({ tracks, isLoading, onChange }: TracksEditorProps) {
  return (
    <FormSection
      title="Tracklist"
      action={isLoading && <Loader2 role="status" aria-label="Trayendo el tracklist de Discogs" className="size-4 animate-spin text-muted-foreground" />}
    >
      {tracks.length > 0 && (
        <ol className="flex flex-col">
          {tracks.map((track, index) => (
            <TrackEditor
              key={track.key}
              track={track}
              number={index + 1}
              onChange={(changed) => onChange(tracks.map((current) => (current.key === track.key ? changed : current)))}
              onRemove={() => onChange(tracks.filter(({ key }) => key !== track.key))}
            />
          ))}
        </ol>
      )}
      <Button type="button" variant="outline" className={`${actionClass} self-start`} onClick={() => onChange([...tracks, newTrackDraft()])}>
        <Plus aria-hidden="true" />
        Agregar corte
      </Button>
    </FormSection>
  );
}
