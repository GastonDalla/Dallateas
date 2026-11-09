"use client";

import { RPM_SPEEDS, type Rpm } from "@dallateas/dj/tempo";
import { Camera } from "lucide-react";
import { useState } from "react";

import { ScannerButton } from "@/components/barcode-scanner";
import { CameraCapture } from "@/components/camera-capture";
import { RECORD_CONDITIONS } from "@/lib/format";

import { controlClass, Field, FormSection, iconActionClass, textareaClass } from "./field";
import type { RecordCondition, VinylFormValues } from "./form-state";

type RecordFieldsProps = {
  values: VinylFormValues;
  onChange: (changes: Partial<VinylFormValues>) => void;
};

const CONDITIONS = Object.entries(RECORD_CONDITIONS) as [RecordCondition, (typeof RECORD_CONDITIONS)[RecordCondition]][];

type ConditionFieldProps = {
  id: string;
  label: string;
  value: RecordCondition | null;
  onChange: (value: RecordCondition | null) => void;
};

function ConditionField({ id, label, value, onChange }: ConditionFieldProps) {
  return (
    <Field label={label} htmlFor={id}>
      <select
        id={id}
        value={value ?? ""}
        onChange={(event) => onChange(CONDITIONS.find(([key]) => key === event.target.value)?.[0] ?? null)}
        className={controlClass}
      >
        <option value="">Sin indicar</option>
        {CONDITIONS.map(([key, { label: conditionLabel }]) => (
          <option key={key} value={key}>
            {conditionLabel}
          </option>
        ))}
      </select>
    </Field>
  );
}

/** Label, genre and the rest of what a sleeve says. */
export function SleeveFields({ values, onChange }: RecordFieldsProps) {
  return (
    <div className="grid grid-cols-2 gap-3">
      <Field label="Sello" htmlFor="label">
        <input id="label" type="text" value={values.label} onChange={(event) => onChange({ label: event.target.value })} maxLength={500} className={controlClass} />
      </Field>
      <Field label="Género" htmlFor="genre">
        <input id="genre" type="text" value={values.genre} onChange={(event) => onChange({ genre: event.target.value })} maxLength={100} className={controlClass} />
      </Field>
      <Field label="Estilo" htmlFor="style" className="col-span-2">
        <input
          id="style"
          type="text"
          value={values.style}
          onChange={(event) => onChange({ style: event.target.value })}
          maxLength={200}
          placeholder="Techno, House, Minimal"
          className={controlClass}
        />
      </Field>
      <Field label="Año" htmlFor="year">
        <input
          id="year"
          type="number"
          inputMode="numeric"
          value={values.year}
          onChange={(event) => onChange({ year: event.target.value })}
          min={1900}
          max={2100}
          className={controlClass}
        />
      </Field>
      <Field label="Precio pagado" htmlFor="pricePaid">
        <input
          id="pricePaid"
          type="number"
          inputMode="decimal"
          step="0.01"
          value={values.pricePaid}
          onChange={(event) => onChange({ pricePaid: event.target.value })}
          min={0}
          max={999999}
          className={controlClass}
        />
      </Field>
    </div>
  );
}

/** How the record plays and where it lives. */
export function CrateFields({ values, onChange }: RecordFieldsProps) {
  return (
    <div className="grid grid-cols-2 gap-3">
      <Field label="Velocidad" htmlFor="rpm">
        <select
          id="rpm"
          value={values.rpm ?? ""}
          onChange={(event) => {
            const speed: Rpm | undefined = RPM_SPEEDS.find((option) => String(option) === event.target.value);
            onChange({ rpm: speed ?? null });
          }}
          className={controlClass}
        >
          <option value="">Sin indicar</option>
          {RPM_SPEEDS.map((speed) => (
            <option key={speed} value={speed}>
              {speed} RPM
            </option>
          ))}
        </select>
      </Field>
      <Field label="BPM del disco" htmlFor="bpm" hint="Si no medís cada corte">
        <input
          id="bpm"
          type="number"
          inputMode="numeric"
          value={values.bpm}
          onChange={(event) => onChange({ bpm: event.target.value })}
          min={1}
          max={999}
          className={controlClass}
        />
      </Field>
      <ConditionField id="mediaCondition" label="Estado del disco" value={values.mediaCondition} onChange={(mediaCondition) => onChange({ mediaCondition })} />
      <ConditionField id="sleeveCondition" label="Estado de la tapa" value={values.sleeveCondition} onChange={(sleeveCondition) => onChange({ sleeveCondition })} />
      <Field label="Ubicación" htmlFor="location" className="col-span-2">
        <input
          id="location"
          type="text"
          value={values.location}
          onChange={(event) => onChange({ location: event.target.value })}
          maxLength={200}
          placeholder="Estante 2, cajón de warm up"
          className={controlClass}
        />
      </Field>
    </div>
  );
}

/** Barcode and cover, each with its camera. */
export function IdentifierFields({ values, onChange }: RecordFieldsProps) {
  const [showCamera, setShowCamera] = useState(false);

  return (
    <div className="flex flex-col gap-3">
      <Field label="Código de barras" htmlFor="barcode">
        <div className="flex gap-2">
          <input
            id="barcode"
            type="text"
            inputMode="numeric"
            value={values.barcode}
            onChange={(event) => onChange({ barcode: event.target.value })}
            placeholder="EAN o UPC"
            maxLength={50}
            className={controlClass}
          />
          <ScannerButton onScan={(barcode) => onChange({ barcode })} />
        </div>
      </Field>

      <Field label="Portada" htmlFor="coverUrl">
        <div className="flex gap-2">
          <input
            id="coverUrl"
            type={values.coverUrl.startsWith("data:") ? "text" : "url"}
            value={values.coverUrl}
            onChange={(event) => onChange({ coverUrl: event.target.value })}
            placeholder="Link de la imagen o sacale una foto"
            className={controlClass}
          />
          <button
            type="button"
            onClick={() => setShowCamera(true)}
            aria-label="Sacar foto de la portada"
            className={`${iconActionClass} flex shrink-0 items-center justify-center rounded-md border border-input bg-card text-muted-foreground transition-colors duration-[120ms] hover:text-foreground md:size-9`}
          >
            <Camera aria-hidden="true" className="size-4" />
          </button>
        </div>
      </Field>
      {showCamera && <CameraCapture onCapture={(coverUrl) => onChange({ coverUrl })} onClose={() => setShowCamera(false)} />}
    </div>
  );
}

export function NotesFields({ values, onChange }: RecordFieldsProps) {
  return (
    <FormSection title="Notas">
      <Field label="Notas" htmlFor="notes">
        <textarea id="notes" value={values.notes} onChange={(event) => onChange({ notes: event.target.value })} rows={2} maxLength={5000} className={textareaClass} />
      </Field>
      <Field label="Notas de mezcla" htmlFor="mixNotes" hint="Lo que anotarías en la funda">
        <textarea
          id="mixNotes"
          value={values.mixNotes}
          onChange={(event) => onChange({ mixNotes: event.target.value })}
          rows={3}
          maxLength={5000}
          placeholder="Punto de entrada, punto de salida, con qué mezcla bien"
          className={textareaClass}
        />
      </Field>
    </FormSection>
  );
}
