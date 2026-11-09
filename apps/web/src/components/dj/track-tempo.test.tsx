import { describe, expect, test } from "bun:test";

import { recordKey, recordTempo } from "./track-tempo";

const tap = { bpm: 124, bpmSource: "TAP", camelotKey: "8A" } as const;
const lookup = { bpm: 128, bpmSource: "LOOKUP", camelotKey: "8A" } as const;

describe("recordTempo", () => {
  test("gives nothing for an unknown tempo, so no sticker is drawn", () => {
    expect(recordTempo([], null)).toBeNull();
  });

  test("is measured when any cut was measured", () => {
    expect(recordTempo([tap, lookup], null)).toEqual({ tempo: "124-128", approximate: false });
  });

  test("is approximate when every tempo is a lookup", () => {
    expect(recordTempo([lookup], null)).toEqual({ tempo: "128", approximate: true });
  });

  test("ignores cuts without a tempo", () => {
    expect(recordTempo([lookup, { bpm: null, bpmSource: null, camelotKey: null }], null)?.approximate).toBe(true);
  });

  test("falls back to the record's own tempo as a typed value", () => {
    expect(recordTempo([], 126)).toEqual({ tempo: "126", approximate: false });
  });
});

describe("recordKey", () => {
  test("gives the key every cut shares", () => {
    expect(recordKey([tap, lookup])).toBe("8A");
  });

  test("gives nothing when the cuts differ, instead of picking one", () => {
    expect(recordKey([tap, { ...lookup, camelotKey: "9A" }])).toBeNull();
  });

  test("ignores cuts without a key", () => {
    expect(recordKey([tap, { ...lookup, camelotKey: null }])).toBe("8A");
  });

  test("gives nothing without keys", () => {
    expect(recordKey([])).toBeNull();
  });
});
