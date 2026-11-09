"use client";

import { Button } from "@dallateas/ui/components/button";
import { FileUp, Loader2, Upload } from "lucide-react";
import Papa from "papaparse";
import { useState, type ChangeEvent } from "react";
import { toast } from "sonner";

import { CustomSelect } from "@/components/custom-select";
import {
  CSV_FIELD_LABELS,
  CSV_FIELDS,
  EMPTY_CSV_MAPPING,
  guessCsvMapping,
  mapCsvRows,
  type CsvMapping,
  type CsvRow,
} from "@/lib/csv-import";

import { useBulkImport } from "./use-bulk-import";

const UNMAPPED = "Sin mapear";

type ParsedCsv = { fileName: string; headers: string[]; rows: CsvRow[] };

function ImportSummary({ vinyls, skipped }: ReturnType<typeof mapCsvRows>) {
  const withBpm = vinyls.filter(({ bpm }) => bpm !== undefined).length;
  const withKey = vinyls.filter(({ mixNotes }) => mixNotes !== undefined).length;
  const withCondition = vinyls.filter(
    ({ mediaCondition, sleeveCondition }) => mediaCondition !== undefined || sleeveCondition !== undefined,
  ).length;

  return (
    <dl className="tabular divide-y divide-border border-y border-border text-sm">
      {[
        { label: "Con BPM", value: withBpm },
        { label: "Con tonalidad", value: withKey },
        { label: "Con estado", value: withCondition },
        { label: "Filas sin título o artista, quedan afuera", value: skipped },
      ].map(({ label, value }) => (
        <div key={label} className="flex items-baseline justify-between gap-4 py-2">
          <dt className="text-muted-foreground">{label}</dt>
          <dd className="font-medium">{value}</dd>
        </div>
      ))}
    </dl>
  );
}

export function CsvImportPanel() {
  const { importVinyls, isImporting } = useBulkImport();

  const [csv, setCsv] = useState<ParsedCsv | null>(null);
  const [mapping, setMapping] = useState<CsvMapping>(EMPTY_CSV_MAPPING);

  const mapped = mapCsvRows(csv?.rows ?? [], mapping);

  function handleFile(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;

    Papa.parse<CsvRow>(file, {
      header: true,
      skipEmptyLines: "greedy",
      complete: ({ data, meta }) => {
        const headers = meta.fields ?? [];
        setCsv({ fileName: file.name, headers, rows: data });
        setMapping(guessCsvMapping(headers));
      },
      error: () => toast.error("No se pudo leer el archivo"),
    });
  }

  async function handleImport() {
    const imported = await importVinyls(mapped.vinyls);
    if (imported === mapped.vinyls.length) setCsv(null);
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <input id="csv-upload" type="file" accept=".csv,text/csv" onChange={handleFile} className="peer sr-only" />
        <label
          htmlFor="csv-upload"
          className="flex cursor-pointer flex-col items-center gap-2 border border-dashed border-border px-6 py-10 text-center transition-colors peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-ring hover:bg-card"
        >
          <Upload aria-hidden="true" className="size-6 text-muted-foreground" />
          <span className="text-sm font-medium">{csv?.fileName ?? "Elegí un archivo CSV"}</span>
          <span className="text-[13px] text-pretty text-muted-foreground">
            Sirve el export de Discogs. Si trae BPM, tonalidad o estado, también se leen
          </span>
        </label>
      </div>

      {csv && (
        <section aria-labelledby="csv-mapping" className="flex flex-col gap-4">
          <h2 id="csv-mapping" className="font-heading text-xl font-bold">
            Columnas del archivo
          </h2>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {CSV_FIELDS.map((field) => (
              <div key={field} className="flex flex-col gap-1">
                <span className="text-[13px] text-muted-foreground">
                  {CSV_FIELD_LABELS[field]}
                  {(field === "title" || field === "artist") && <span className="text-clash"> (obligatorio)</span>}
                </span>
                <CustomSelect
                  value={mapping[field]}
                  onChange={(column) => setMapping((current) => ({ ...current, [field]: column }))}
                  options={[{ value: "", label: UNMAPPED }, ...csv.headers.map((header) => ({ value: header, label: header }))]}
                  placeholder={UNMAPPED}
                  label={CSV_FIELD_LABELS[field]}
                />
              </div>
            ))}
          </div>

          <ImportSummary {...mapped} />

          {mapped.vinyls.some(({ mixNotes }) => mixNotes !== undefined) && (
            <p className="max-w-prose text-[13px] text-pretty text-muted-foreground">
              La tonalidad va por corte y una fila del CSV es un disco entero, así que queda en las notas de mezcla
            </p>
          )}

          <div>
            <Button
              className="h-11 px-4 text-sm md:h-9"
              onClick={() => void handleImport()}
              disabled={isImporting || mapped.vinyls.length === 0}
            >
              {isImporting ? <Loader2 aria-hidden="true" className="motion-safe:animate-spin" /> : <FileUp aria-hidden="true" />}
              {mapped.vinyls.length === 0
                ? "Elegí las columnas de título y artista"
                : isImporting
                  ? "Importando"
                  : `Importar ${mapped.vinyls.length} vinilos`}
            </Button>
          </div>
        </section>
      )}
    </div>
  );
}
