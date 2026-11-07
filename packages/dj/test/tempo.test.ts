import { describe, expect, test } from "bun:test";

import {
  appendTap,
  bpmAtPitch,
  bpmFromTaps,
  closestTempoOctave,
  convertRpm,
  parseDuration,
  pitchToMatch,
} from "../src/tempo";

const taps = (bpm: number, count: number, jitterMs = 0) =>
  Array.from({ length: count }, (_, index) => index * (60_000 / bpm) + (index % 2 ? jitterMs : -jitterMs));

describe("tap tempo", () => {
  test("needs at least four taps", () => {
    expect(bpmFromTaps(taps(128, 3))).toBeNull();
  });

  test("reads a steady tempo", () => {
    expect(bpmFromTaps(taps(128, 8))).toBe(128);
  });

  test("tolerates human jitter", () => {
    expect(Math.abs(bpmFromTaps(taps(128, 16, 12))! - 128)).toBeLessThan(1);
  });

  test("ignores one late tap", () => {
    const series = taps(120, 10);
    series[6] = series[6]! + 150;
    expect(Math.abs(bpmFromTaps(series)! - 120)).toBeLessThan(1.5);
  });

  test("a long pause starts a new measurement", () => {
    expect(appendTap([0, 500, 1000], 4000)).toEqual([4000]);
  });

  test("keeps only the most recent taps", () => {
    const series = Array.from({ length: 40 }, (_, index) => index * 400).reduce<number[]>(appendTap, []);
    expect(series).toHaveLength(16);
    expect(series.at(-1)).toBe(39 * 400);
  });
});

describe("pitch", () => {
  test("gives the fader position that matches a tempo", () => {
    expect(pitchToMatch(120, 126)).toBeCloseTo(5, 5);
    expect(pitchToMatch(126, 120)).toBeCloseTo(-4.762, 2);
  });

  test("gives the tempo at a fader position", () => {
    expect(bpmAtPitch(125, 8)).toBeCloseTo(135, 5);
  });

  test("a record played at the wrong speed changes tempo by the speed ratio", () => {
    expect(convertRpm(120, 33, 45)).toBeCloseTo(162, 0);
    expect(convertRpm(162, 45, 33)).toBeCloseTo(120, 0);
  });

  test("treats double time as the same tempo family", () => {
    expect(closestTempoOctave(87, 174)).toEqual({ bpm: 174, factor: 2 });
    expect(closestTempoOctave(174, 87)).toEqual({ bpm: 87, factor: 0.5 });
    expect(closestTempoOctave(128, 130)).toEqual({ bpm: 128, factor: 1 });
  });
});

describe("durations", () => {
  test("reads minutes and hours", () => {
    expect(parseDuration("6:32")).toBe(392);
    expect(parseDuration("1:02:03")).toBe(3723);
  });

  test("returns null for anything else", () => {
    expect(parseDuration("")).toBeNull();
    expect(parseDuration(null)).toBeNull();
    expect(parseDuration("abc")).toBeNull();
  });
});
