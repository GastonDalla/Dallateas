import { keyLabel, parseKey } from "@dallateas/dj/camelot";

import { BPM_SOURCE_LABELS, formatBpm, RECORD_CONDITIONS } from "@/lib/format";

type BpmSource = keyof typeof BPM_SOURCE_LABELS;
type Condition = keyof typeof RECORD_CONDITIONS;

type ExportTrack = {
  side: string;
  title: string;
  duration: string | null;
  bpm: number | null;
  bpmSource: BpmSource | null;
  camelotKey: string | null;
  energy?: number | null;
};

type ExportRecord = {
  artist: string;
  title: string;
  label: string | null;
  genre: string | null;
  style: string | null;
  year: number | null;
  rpm: number | null;
  mediaCondition: Condition | null;
  sleeveCondition: Condition | null;
  location: string | null;
  tracks: readonly ExportTrack[];
};

const HEADERS = [
  "Artista",
  "Título",
  "Sello",
  "Género",
  "Estilo",
  "Año",
  "RPM",
  "Estado del disco",
  "Estado de la tapa",
  "Ubicación",
  "Lado",
  "Corte",
  "Duración",
  "BPM",
  "Origen del BPM",
  "Tonalidad",
  "Energía",
];

const NEEDS_QUOTES = /[",\r\n]/;
// A spreadsheet runs a cell that starts with one of these, and titles come from outside: Discogs, imports.
const FORMULA_START = /^[=+\-@\t\r]/;

type Cell = string | number | null | undefined;

function csvCell(value: Cell) {
  if (value === null || value === undefined) return "";
  if (typeof value === "number") return String(value);

  const text = FORMULA_START.test(value) ? `'${value}` : value;
  return NEEDS_QUOTES.test(text) ? `"${text.replaceAll('"', '""')}"` : text;
}

function conditionCell(condition: Condition | null) {
  return condition ? RECORD_CONDITIONS[condition].short : null;
}

function recordCells(record: ExportRecord): Cell[] {
  return [
    record.artist,
    record.title,
    record.label,
    record.genre,
    record.style,
    record.year,
    record.rpm,
    conditionCell(record.mediaCondition),
    conditionCell(record.sleeveCondition),
    record.location,
  ];
}

function trackCells(track: ExportTrack): Cell[] {
  return [
    track.side,
    track.title,
    track.duration,
    track.bpm,
    track.bpmSource ? BPM_SOURCE_LABELS[track.bpmSource] : null,
    track.camelotKey,
    track.energy,
  ];
}

const NO_TRACK: Cell[] = Array.from({ length: 7 }, () => null);

function csvRow(cells: Cell[]) {
  return cells.map(csvCell).join(",");
}

/** The collection as a spreadsheet, one row per track, so every cut can be sorted and filtered on its own. */
export function collectionCsv(records: readonly ExportRecord[]) {
  const rows = records.flatMap((record) => {
    const shared = recordCells(record);
    if (record.tracks.length === 0) return [csvRow([...shared, ...NO_TRACK])];
    return record.tracks.map((track) => csvRow([...shared, ...trackCells(track)]));
  });

  return `﻿${[csvRow(HEADERS), ...rows].join("\r\n")}\r\n`;
}

/** A track as printed in a PDF. The tilde stands in for ≈, which the PDF's built-in font cannot draw. */
export function pdfTrackRow(track: ExportTrack) {
  const key = parseKey(track.camelotKey);
  const tempo = track.bpm === null ? "" : formatBpm(track.bpm);

  return [
    track.side,
    track.title,
    track.duration ?? "",
    track.bpmSource === "LOOKUP" && tempo ? `~${tempo}` : tempo,
    key ? `${key} ${keyLabel(key)}` : "",
  ];
}
