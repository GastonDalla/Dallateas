import { describe, expect, test } from "bun:test";

import { formatClock, formatSemitones, parseMinutes, parseTempo } from "./numbers";

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

describe("parseMinutes", () => {
  test("reads whole and decimal minutes, with a point or a comma", () => {
    expect(parseMinutes("120")).toBe(120);
    expect(parseMinutes("5,5")).toBe(5.5);
    expect(parseMinutes(" 6.25 ")).toBe(6.25);
  });

  test("refuses zero, negatives, text and more than twelve hours", () => {
    for (const value of ["", "0", "-5", "abc", "5m", "720.1"]) {
      expect(parseMinutes(value)).toBeNull();
    }
  });
});

describe("formatClock", () => {
  test("prints minutes, seconds and tenths", () => {
    expect(formatClock(15.238)).toBe("0:15.2");
    expect(formatClock(121.9)).toBe("2:01.9");
    expect(formatClock(60)).toBe("1:00.0");
  });

  test("carries a tenth that rounds up to the next minute", () => {
    expect(formatClock(59.97)).toBe("1:00.0");
  });
});
