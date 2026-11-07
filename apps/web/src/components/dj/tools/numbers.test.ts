import { describe, expect, test } from "bun:test";

import { formatSemitones, parseTempo } from "./numbers";

describe("parseTempo", () => {
  test("reads whole and decimal tempos, with a point or a comma", () => {
    expect(parseTempo("124")).toBe(124);
    expect(parseTempo(" 124.5 ")).toBe(124.5);
    expect(parseTempo("124,5")).toBe(124.5);
  });

  test("refuses what is not a playable tempo", () => {
    for (const value of ["", "abc", "12a", "0", "-120", "19.9", "400.1"]) {
      expect(parseTempo(value)).toBeNull();
    }
  });

  test("accepts the limits a track can store", () => {
    expect(parseTempo("20")).toBe(20);
    expect(parseTempo("400")).toBe(400);
  });
});

describe("formatSemitones", () => {
  test("signs the shift the way a pitch is signed", () => {
    expect(formatSemitones(0.56)).toBe("+0.6");
    expect(formatSemitones(-1.24)).toBe("−1.2");
  });

  test("prints no sign for no shift", () => {
    expect(formatSemitones(0)).toBe("0");
    expect(formatSemitones(0.04)).toBe("0");
  });
});
