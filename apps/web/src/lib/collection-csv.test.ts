import { describe, expect, test } from "bun:test";

import { collectionCsv, pdfTrackRow } from "./collection-csv";

const record = {
  artist: "Robert Hood",
  title: "Minimal Nation",
  label: "Axis",
  genre: "Electronic",
  style: "Techno, Minimal",
  year: 1994,
  rpm: 33,
  mediaCondition: "VERY_GOOD_PLUS",
  sleeveCondition: null,
  location: "Estante 2",
  tracks: [],
} as const;

const track = {
  side: "A1",
  title: "Rhythm Of Vision",
  duration: "6:32",
  bpm: 128.5,
  bpmSource: "TAP",
  camelotKey: "8A",
  energy: 4,
} as const;

function lines(csv: string) {
  return csv.replace(/^﻿/, "").trimEnd().split("\r\n");
}

describe("collectionCsv", () => {
  test("starts with a byte order mark so Excel reads the accents", () => {
    expect(collectionCsv([]).startsWith("﻿")).toBe(true);
  });

  test("writes the headers first, with their accents", () => {
    expect(lines(collectionCsv([]))).toEqual([
      "Artista,Título,Sello,Género,Estilo,Año,RPM,Estado del disco,Estado de la tapa,Ubicación,Lado,Corte,Duración,BPM,Origen del BPM,Tonalidad,Energía",
    ]);
  });

  test("writes one row per track", () => {
    const rows = lines(collectionCsv([{ ...record, tracks: [track, { ...track, side: "A2", title: "Museum" }] }]));
    expect(rows).toHaveLength(3);
    expect(rows[1]).toBe(
      'Robert Hood,Minimal Nation,Axis,Electronic,"Techno, Minimal",1994,33,VG+,,Estante 2,A1,Rhythm Of Vision,6:32,128.5,medido con tap,8A,4',
    );
    expect(rows[2]).toContain(",A2,Museum,");
  });

  test("keeps a record without tracks as one row, so it is not lost from the export", () => {
    const rows = lines(collectionCsv([record]));
    expect(rows).toHaveLength(2);
    expect(rows[1]).toBe('Robert Hood,Minimal Nation,Axis,Electronic,"Techno, Minimal",1994,33,VG+,,Estante 2,,,,,,,');
  });

  test("leaves unknown values empty instead of inventing them", () => {
    const empty = { side: "B1", title: "Sin datos", duration: null, bpm: null, bpmSource: null, camelotKey: null, energy: null };
    expect(lines(collectionCsv([{ ...record, tracks: [empty] }]))[1]).toEndWith(",B1,Sin datos,,,,,");
  });

  test("says a looked up tempo is approximate", () => {
    const row = lines(collectionCsv([{ ...record, tracks: [{ ...track, bpmSource: "LOOKUP" }] }]))[1];
    expect(row).toContain('"aproximado, buscado en Deezer"');
  });

  test("escapes quotes, commas and line breaks", () => {
    const csv = collectionCsv([{ ...record, title: 'Say "Yes", now\nplease', tracks: [] }]);
    expect(csv).toContain('"Say ""Yes"", now\nplease"');
  });

  test("neutralizes text a spreadsheet would run as a formula", () => {
    for (const title of ["=HYPERLINK(1)", "+1", "-1", "@SUM(1)"]) {
      expect(collectionCsv([{ ...record, title, tracks: [] }])).toContain(`,'${title},`);
    }
  });

  test("leaves numbers untouched by the formula guard", () => {
    const row = lines(collectionCsv([{ ...record, tracks: [{ ...track, bpm: 124 }] }]))[1];
    expect(row).toContain(",124,medido con tap,");
  });
});

describe("pdfTrackRow", () => {
  test("gives side, title, duration, tempo and key", () => {
    expect(pdfTrackRow(track)).toEqual(["A1", "Rhythm Of Vision", "6:32", "128.5", "8A Am"]);
  });

  test("marks a looked up tempo with a tilde, which the PDF font can draw", () => {
    expect(pdfTrackRow({ ...track, bpmSource: "LOOKUP" })[3]).toBe("~128.5");
  });

  test("leaves unknown values empty", () => {
    expect(pdfTrackRow({ side: "B1", title: "Sin datos", duration: null, bpm: null, bpmSource: null, camelotKey: null })).toEqual([
      "B1",
      "Sin datos",
      "",
      "",
      "",
    ]);
  });
});
