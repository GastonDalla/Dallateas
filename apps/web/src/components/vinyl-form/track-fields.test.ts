import { describe, expect, test } from "bun:test";

import {
  parseBpm,
  toTrackData,
  trackFieldsError,
  trackFieldsFrom,
  trackUpdateInput,
  withMeasuredBpm,
  withTypedBpm,
} from "./track-fields";

const track = { id: "t1", bpm: 124, bpmSource: "LOOKUP", camelotKey: "8A", energy: 3, cueNotes: "Entra en el break" } as const;
const blank = { id: "t2", bpm: null, bpmSource: null, camelotKey: null, energy: null, cueNotes: null } as const;

describe("parseBpm", () => {
  test("reads a whole tempo", () => {
    expect(parseBpm("124")).toBe(124);
  });

  test("reads a decimal written with a comma or a dot", () => {
    expect(parseBpm("124,5")).toBe(124.5);
    expect(parseBpm("124.5")).toBe(124.5);
  });

  test("rejects a tempo outside what the API stores", () => {
    expect(parseBpm("19.9")).toBeNull();
    expect(parseBpm("401")).toBeNull();
  });

  test("rejects text and blanks", () => {
    expect(parseBpm("rápido")).toBeNull();
    expect(parseBpm("  ")).toBeNull();
  });
});

describe("trackFieldsError", () => {
  test("accepts blanks, since every field is optional", () => {
    expect(trackFieldsError(trackFieldsFrom(blank))).toBeNull();
  });

  test("explains a tempo out of range", () => {
    expect(trackFieldsError({ ...trackFieldsFrom(blank), bpm: "900" })).toBe("El BPM tiene que estar entre 20 y 400");
  });

  test("accepts a key in either notation", () => {
    expect(trackFieldsError({ ...trackFieldsFrom(blank), camelotKey: "8A" })).toBeNull();
    expect(trackFieldsError({ ...trackFieldsFrom(blank), camelotKey: "Am" })).toBeNull();
  });

  test("explains a key it cannot read", () => {
    expect(trackFieldsError({ ...trackFieldsFrom(blank), camelotKey: "H" })).toBe("Tonalidad inválida. Probá con 8A o Am");
  });
});

describe("withTypedBpm", () => {
  test("marks a typed tempo as manual, even over a lookup", () => {
    expect(withTypedBpm(trackFieldsFrom(track), "126")).toMatchObject({ bpm: "126", bpmSource: "MANUAL" });
  });

  test("clears the source with the tempo", () => {
    expect(withTypedBpm(trackFieldsFrom(track), "")).toMatchObject({ bpm: "", bpmSource: null });
  });
});

describe("withMeasuredBpm", () => {
  test("keeps one decimal and says how it was measured", () => {
    expect(withMeasuredBpm(trackFieldsFrom(track), 126.27, "MIC")).toMatchObject({ bpm: "126.3", bpmSource: "MIC" });
  });
});

describe("toTrackData", () => {
  test("turns the fields into what the API stores", () => {
    expect(toTrackData({ bpm: "124,5", bpmSource: "MANUAL", camelotKey: "am", energy: 4, cueNotes: " Salida en B " })).toEqual({
      bpm: 124.5,
      bpmSource: "MANUAL",
      camelotKey: "8A",
      energy: 4,
      cueNotes: "Salida en B",
    });
  });

  test("sends nulls for blanks, so a cleared value is really cleared", () => {
    expect(toTrackData({ bpm: "", bpmSource: "TAP", camelotKey: "", energy: null, cueNotes: "  " })).toEqual({
      bpm: null,
      bpmSource: null,
      camelotKey: null,
      energy: null,
      cueNotes: null,
    });
  });
});

describe("trackUpdateInput", () => {
  test("leaves the tempo alone when only the notes changed, so a lookup stays a lookup", () => {
    const input = trackUpdateInput(track, { ...trackFieldsFrom(track), cueNotes: "Otra nota" });
    expect(input).toEqual({ id: "t1", camelotKey: "8A", energy: 3, cueNotes: "Otra nota" });
  });

  test("sends a measured tempo with its source", () => {
    const input = trackUpdateInput(track, withMeasuredBpm(trackFieldsFrom(track), 126, "TAP"));
    expect(input).toMatchObject({ id: "t1", bpm: 126, bpmSource: "TAP" });
  });

  test("sends a typed tempo as manual", () => {
    const input = trackUpdateInput(blank, withTypedBpm(trackFieldsFrom(blank), "130"));
    expect(input).toMatchObject({ bpm: 130, bpmSource: "MANUAL" });
  });

  test("clears the tempo when the DJ empties it", () => {
    const input = trackUpdateInput(track, withTypedBpm(trackFieldsFrom(track), ""));
    expect(input).toMatchObject({ bpm: null, bpmSource: null });
  });

  test("notices a tempo measured to the same value by another method", () => {
    const input = trackUpdateInput(track, withMeasuredBpm(trackFieldsFrom(track), 124, "TAP"));
    expect(input).toMatchObject({ bpm: 124, bpmSource: "TAP" });
  });
});
