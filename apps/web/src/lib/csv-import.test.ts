import { describe, expect, test } from "bun:test";

import { BULK_IMPORT_LIMIT, guessCsvMapping, inBatches, mapCsvRows, parseCondition, type CsvMapping } from "./csv-import";

const MAPPING: CsvMapping = {
  title: "Title",
  artist: "Artist",
  label: "Label",
  genre: "Genre",
  year: "Year",
  bpm: "BPM",
  key: "Key",
  mediaCondition: "Media",
  sleeveCondition: "Sleeve",
};

const ROW = {
  Title: "Minus",
  Artist: "Robert Hood",
  Label: "M-Plant",
  Genre: "Electronic",
  Year: "1994",
  BPM: "136",
  Key: "8A",
  Media: "VG+",
  Sleeve: "Generic",
};

function mapOne(overrides: Partial<typeof ROW>) {
  return mapCsvRows([{ ...ROW, ...overrides }], MAPPING).vinyls[0]!;
}

describe("guessCsvMapping", () => {
  test("reads a Discogs collection export", () => {
    const mapping = guessCsvMapping([
      "Catalog#",
      "Artist",
      "Title",
      "Label",
      "Format",
      "Rating",
      "Released",
      "release_id",
      "CollectionFolder",
      "Date Added",
      "Collection Media Condition",
      "Collection Sleeve Condition",
      "Collection Notes",
    ]);

    expect(mapping).toEqual({
      title: "Title",
      artist: "Artist",
      label: "Label",
      genre: "",
      year: "Released",
      bpm: "",
      key: "",
      mediaCondition: "Collection Media Condition",
      sleeveCondition: "Collection Sleeve Condition",
    });
  });

  test("ignores case, accents and spacing in Spanish headers", () => {
    const mapping = guessCsvMapping([" Título ", "ARTISTA", "Sello", "Género", "AÑO", "tempo", "Tonalidad", "Estado del disco", "Estado de la funda"]);

    expect(mapping).toEqual({
      title: " Título ",
      artist: "ARTISTA",
      label: "Sello",
      genre: "Género",
      year: "AÑO",
      bpm: "tempo",
      key: "Tonalidad",
      mediaCondition: "Estado del disco",
      sleeveCondition: "Estado de la funda",
    });
  });

  test("reads the key columns DJ software exports", () => {
    expect(guessCsvMapping(["Initial Key"]).key).toBe("Initial Key");
    expect(guessCsvMapping(["camelot"]).key).toBe("camelot");
  });

  test("leaves a field empty when no header matches", () => {
    expect(guessCsvMapping(["Foo", "Bar"]).title).toBe("");
  });
});

describe("mapCsvRows", () => {
  test("maps every column of a complete row", () => {
    const { vinyls, skipped } = mapCsvRows([{ ...ROW, Sleeve: "NM" }], MAPPING);

    expect(skipped).toBe(0);
    expect(vinyls).toEqual([
      {
        title: "Minus",
        artist: "Robert Hood",
        label: "M-Plant",
        genre: "Electronic",
        year: 1994,
        bpm: 136,
        mediaCondition: "VERY_GOOD_PLUS",
        sleeveCondition: "NEAR_MINT",
        mixNotes: "Tonalidad: 8A Am",
      },
    ]);
  });

  test("skips rows without a title or an artist and counts them", () => {
    const { vinyls, skipped } = mapCsvRows([ROW, { ...ROW, Title: "  " }, { ...ROW, Artist: "" }], MAPPING);

    expect(vinyls).toHaveLength(1);
    expect(skipped).toBe(2);
  });

  test("returns nothing until title and artist are mapped", () => {
    expect(mapCsvRows([ROW], { ...MAPPING, title: "" })).toEqual({ vinyls: [], skipped: 1 });
  });

  test("ignores a column left unmapped", () => {
    const vinyl = mapCsvRows([ROW], { ...MAPPING, bpm: "", key: "", mediaCondition: "" }).vinyls[0]!;

    expect(vinyl.bpm).toBeUndefined();
    expect(vinyl.mixNotes).toBeUndefined();
    expect(vinyl.mediaCondition).toBeUndefined();
  });

  test("rounds a decimal tempo because a record stores whole BPM", () => {
    expect(mapOne({ BPM: "124.5" }).bpm).toBe(125);
    expect(mapOne({ BPM: "124,5" }).bpm).toBe(125);
    expect(mapOne({ BPM: "128 BPM" }).bpm).toBe(128);
  });

  test("drops a tempo it cannot trust instead of guessing one", () => {
    for (const BPM of ["0", "abc", "124-128", "1200", ""]) {
      expect(mapOne({ BPM }).bpm).toBeUndefined();
    }
  });

  test("keeps the key in the mix notes, in both notations", () => {
    expect(mapOne({ Key: "8a" }).mixNotes).toBe("Tonalidad: 8A Am");
    expect(mapOne({ Key: "C" }).mixNotes).toBe("Tonalidad: 8B C");
  });

  test("drops a key it cannot read", () => {
    expect(mapOne({ Key: "H#" }).mixNotes).toBeUndefined();
    expect(mapOne({ Key: "" }).mixNotes).toBeUndefined();
  });

  test("reads the year from a date and drops an impossible one", () => {
    expect(mapOne({ Year: "1998-03-01" }).year).toBe(1998);
    expect(mapOne({ Year: "0" }).year).toBeUndefined();
    expect(mapOne({ Year: "3000" }).year).toBeUndefined();
  });

  test("drops text the API would reject, so one row cannot fail the whole import", () => {
    expect(mapOne({ Genre: "x".repeat(101) }).genre).toBeUndefined();
    expect(mapOne({ Label: "x".repeat(501) }).label).toBeUndefined();
    expect(mapCsvRows([{ ...ROW, Title: "x".repeat(501) }], MAPPING)).toEqual({ vinyls: [], skipped: 1 });
  });
});

describe("parseCondition", () => {
  test("reads Discogs grades", () => {
    expect(parseCondition("Mint (M)")).toBe("MINT");
    expect(parseCondition("Near Mint (NM or M-)")).toBe("NEAR_MINT");
    expect(parseCondition("Very Good Plus (VG+)")).toBe("VERY_GOOD_PLUS");
    expect(parseCondition("Very Good (VG)")).toBe("VERY_GOOD");
    expect(parseCondition("Good Plus (G+)")).toBe("GOOD_PLUS");
    expect(parseCondition("Good (G)")).toBe("GOOD");
    expect(parseCondition("Fair (F)")).toBe("FAIR");
    expect(parseCondition("Poor (P)")).toBe("POOR");
  });

  test("reads short grades and the labels this app shows", () => {
    expect(parseCondition("m-")).toBe("NEAR_MINT");
    expect(parseCondition(" VG + ")).toBe("VERY_GOOD_PLUS");
    expect(parseCondition("Casi nuevo (NM)")).toBe("NEAR_MINT");
    expect(parseCondition("Muy bueno + (VG+)")).toBe("VERY_GOOD_PLUS");
    expect(parseCondition("NEAR_MINT")).toBe("NEAR_MINT");
  });

  test("does not grade what is not a grade", () => {
    expect(parseCondition("Generic")).toBeUndefined();
    expect(parseCondition("Not Graded")).toBeUndefined();
    expect(parseCondition("")).toBeUndefined();
    expect(parseCondition(undefined)).toBeUndefined();
  });
});

describe("inBatches", () => {
  test("splits at the API limit and keeps the order", () => {
    const batches = inBatches(Array.from({ length: BULK_IMPORT_LIMIT * 2 + 1 }, (_, index) => index));

    expect(batches.map((batch) => batch.length)).toEqual([BULK_IMPORT_LIMIT, BULK_IMPORT_LIMIT, 1]);
    expect(batches[1]![0]).toBe(BULK_IMPORT_LIMIT);
  });

  test("returns no batch for an empty list", () => {
    expect(inBatches([])).toEqual([]);
  });
});
