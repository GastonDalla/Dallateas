import { keyLabel, parseKey } from "@dallateas/dj/camelot";

import type { RECORD_CONDITIONS } from "./format";

type RecordCondition = keyof typeof RECORD_CONDITIONS;

export const CSV_FIELDS = [
  "title",
  "artist",
  "label",
  "genre",
  "year",
  "bpm",
  "key",
  "mediaCondition",
  "sleeveCondition",
] as const;

export type CsvField = (typeof CSV_FIELDS)[number];
export type CsvMapping = Record<CsvField, string>;
export type CsvRow = Record<string, string | undefined>;

export const CSV_FIELD_LABELS: Record<CsvField, string> = {
  title: "Título",
  artist: "Artista",
  label: "Sello",
  genre: "Género",
  year: "Año",
  bpm: "BPM",
  key: "Tonalidad",
  mediaCondition: "Estado del disco",
  sleeveCondition: "Estado de la funda",
};

export const EMPTY_CSV_MAPPING: CsvMapping = {
  title: "",
  artist: "",
  label: "",
  genre: "",
  year: "",
  bpm: "",
  key: "",
  mediaCondition: "",
  sleeveCondition: "",
};

/** The most records `vinylBulkCreate` takes in one call. */
export const BULK_IMPORT_LIMIT = 500;

const MAX_TEXT_LENGTH = 500;
const MAX_GENRE_LENGTH = 100;
const MIN_YEAR = 1900;
const MAX_YEAR = 2100;
const MAX_BPM = 999;

const HEADER_NAMES: Record<CsvField, readonly string[]> = {
  title: ["title", "titulo", "nombre", "album", "release"],
  artist: ["artist", "artista", "artists", "interprete"],
  label: ["label", "sello", "discografica"],
  genre: ["genre", "genero"],
  year: ["year", "ano", "anio", "released", "lanzamiento"],
  bpm: ["bpm", "tempo"],
  key: ["key", "initial key", "camelot", "camelot key", "tonalidad", "tono", "clave"],
  mediaCondition: [
    "media condition",
    "collection media condition",
    "vinyl condition",
    "condition",
    "condicion",
    "estado",
    "estado del disco",
    "estado disco",
  ],
  sleeveCondition: [
    "sleeve condition",
    "collection sleeve condition",
    "cover condition",
    "estado de la funda",
    "estado funda",
    "funda",
  ],
};

const CONDITION_NAMES: Record<string, RecordCondition> = {
  m: "MINT",
  mint: "MINT",
  nuevo: "MINT",
  nm: "NEAR_MINT",
  "m-": "NEAR_MINT",
  "near mint": "NEAR_MINT",
  "casi nuevo": "NEAR_MINT",
  "vg+": "VERY_GOOD_PLUS",
  "very good plus": "VERY_GOOD_PLUS",
  "muy bueno+": "VERY_GOOD_PLUS",
  vg: "VERY_GOOD",
  "very good": "VERY_GOOD",
  "muy bueno": "VERY_GOOD",
  "g+": "GOOD_PLUS",
  "good plus": "GOOD_PLUS",
  "bueno+": "GOOD_PLUS",
  g: "GOOD",
  good: "GOOD",
  bueno: "GOOD",
  f: "FAIR",
  fair: "FAIR",
  regular: "FAIR",
  p: "POOR",
  poor: "POOR",
  malo: "POOR",
};

function normalize(value: string) {
  return value
    .replace(/^﻿/, "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .replace(/[\s_]+/g, " ")
    .trim();
}

export function guessCsvMapping(headers: readonly string[]): CsvMapping {
  const normalized = headers.map(normalize);
  const mapping = { ...EMPTY_CSV_MAPPING };

  for (const field of CSV_FIELDS) {
    const index = normalized.findIndex((header) => HEADER_NAMES[field].includes(header));
    if (index >= 0) mapping[field] = headers[index]!;
  }

  return mapping;
}

/** Reads the grades Discogs exports ("Near Mint (NM or M-)"), the short ones and the ones this app shows. */
export function parseCondition(value: string | undefined): RecordCondition | undefined {
  if (!value) return undefined;
  const name = normalize(value.replace(/\(.*?\)/g, " ")).replace(/\s*\+/, "+");
  return CONDITION_NAMES[name];
}

function parseBpm(value: string | undefined) {
  const match = value?.trim().match(/^(\d{1,3}(?:[.,]\d+)?)(?:\s*bpm)?$/i);
  if (!match) return undefined;

  const bpm = Math.round(Number(match[1]!.replace(",", ".")));
  return bpm >= 1 && bpm <= MAX_BPM ? bpm : undefined;
}

function parseYear(value: string | undefined) {
  const match = value?.trim().match(/^(\d{4})(?:\D|$)/);
  if (!match) return undefined;

  const year = Number(match[1]);
  return year >= MIN_YEAR && year <= MAX_YEAR ? year : undefined;
}

/** A key belongs to a cut and a CSV row is a whole record, so it stays in the mix notes where the DJ can read it. */
function keyNote(value: string | undefined) {
  const key = parseKey(value);
  return key ? `Tonalidad: ${key} ${keyLabel(key)}` : undefined;
}

function limited(value: string | undefined, maxLength: number) {
  return value && value.length <= maxLength ? value : undefined;
}

function withoutEmptyFields<T extends object>(value: T) {
  return Object.fromEntries(Object.entries(value).filter(([, field]) => field !== undefined)) as T;
}

/** Turns CSV rows into records. A value that cannot be trusted is dropped, because the API rejects a whole batch over one bad field. */
export function mapCsvRows(rows: readonly CsvRow[], mapping: CsvMapping) {
  const read = (row: CsvRow, field: CsvField) => {
    const column = mapping[field];
    return column ? row[column]?.trim() || undefined : undefined;
  };

  const vinyls = rows.flatMap((row) => {
    const title = limited(read(row, "title"), MAX_TEXT_LENGTH);
    const artist = limited(read(row, "artist"), MAX_TEXT_LENGTH);
    if (!title || !artist) return [];

    return [
      withoutEmptyFields({
        title,
        artist,
        label: limited(read(row, "label"), MAX_TEXT_LENGTH),
        genre: limited(read(row, "genre"), MAX_GENRE_LENGTH),
        year: parseYear(read(row, "year")),
        bpm: parseBpm(read(row, "bpm")),
        mediaCondition: parseCondition(read(row, "mediaCondition")),
        sleeveCondition: parseCondition(read(row, "sleeveCondition")),
        mixNotes: keyNote(read(row, "key")),
      }),
    ];
  });

  return { vinyls, skipped: rows.length - vinyls.length };
}

export function inBatches<T>(items: readonly T[], size = BULK_IMPORT_LIMIT) {
  const batches: T[][] = [];
  for (let start = 0; start < items.length; start += size) batches.push(items.slice(start, start + size));
  return batches;
}
