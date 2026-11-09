import { describe, expect, test } from "bun:test";

import { agreedTempo, clipTempo, danceTempo, tempoFromReadings, voteTempo } from "../src/clip-tempo";

import { kickLoop, SAMPLE_RATE, steadyNoise } from "./audio";

describe("tempo of a clip, voted across windows", () => {
  test("a steady record gives one tempo that every window agrees on", () => {
    const result = voteTempo(kickLoop(132, 30), SAMPLE_RATE);

    expect(Math.abs(result!.bpm - 132)).toBeLessThan(0.5);
    expect(result!.agreeing).toBe(result!.windows);
  });

  test("a breakdown in the middle does not change the answer", () => {
    const clip = kickLoop(126, 30);
    clip.set(steadyNoise(12).map((value) => value * 0.02), SAMPLE_RATE * 9);

    expect(Math.abs(voteTempo(clip, SAMPLE_RATE)!.bpm - 126)).toBeLessThan(0.5);
  });

  test("a clip with no beat gives nothing", () => {
    expect(voteTempo(steadyNoise(30), SAMPLE_RATE)).toBeNull();
  });

  test("a clip shorter than one window gives nothing", () => {
    expect(voteTempo(kickLoop(128, 10), SAMPLE_RATE)).toBeNull();
  });
});

describe("agreeing on one tempo", () => {
  test("windows that agree are enough even when the rest of a long clip heard nothing", () => {
    expect(agreedTempo(Array.from({ length: 9 }, () => 132), 28)).toBe(132);
    expect(agreedTempo([128, 128, 128, 128, 128, 128, 130], 28)).toBe(128);
  });

  test("a tie between two tempos is not an answer", () => {
    expect(agreedTempo([175, 131, 174, 131], 28)).toBeNull();
  });

  test("one window, or a few out of many, is not enough", () => {
    expect(agreedTempo([96], 4)).toBeNull();
    expect(agreedTempo([130, 130], 28)).toBeNull();
  });
});

describe("tempo of a dance record", () => {
  test("a fast techno record read at half speed is doubled", () => {
    expect(danceTempo(70, ["Techno"])).toBe(140);
    expect(danceTempo(72, ["Acid", "Techno"])).toBe(144);
  });

  test("a reading no four-to-the-floor record sits at is dropped, not guessed", () => {
    expect(danceTempo(97.8, ["Techno"])).toBeNull();
    expect(danceTempo(104.9, ["House"])).toBeNull();
  });

  test("a reading in the dance range is kept", () => {
    expect(danceTempo(128, ["Tech House"])).toBe(128);
    expect(danceTempo(174, ["Drum n Bass"])).toBe(174);
  });

  test("records outside dance styles, or with no style, keep the reading", () => {
    expect(danceTempo(92, ["Hip Hop", "Boom Bap"])).toBe(92);
    expect(danceTempo(70, [])).toBe(70);
  });

  test("a style is matched by name, so a word inside another style does not make it a dance record", () => {
    expect(danceTempo(85, ["Acid Jazz"])).toBe(85);
    expect(danceTempo(85, ["Hardcore", "Punk"])).toBe(85);
    expect(danceTempo(95, ["Electroclash"])).toBe(95);
  });

  test("named variants of house, techno and trance are dance records", () => {
    expect(danceTempo(70, ["Hard Techno"])).toBe(140);
    expect(danceTempo(64, ["Electro House"])).toBe(128);
    expect(danceTempo(69, ["Progressive Trance"])).toBe(138);
  });

  test("each window is corrected before the vote, so the windows that heard the beat win", () => {
    // Michael Newman, Subscan: the video read 105 in most windows and 140 in the rest.
    const readings = [140, 140, 105, 105, 140, 140, 105, 140, 105, 105, 105, 105, 105, 105, 105, 105, 140, 140, 105, 105];

    expect(tempoFromReadings(readings, 28, ["Techno", "Acid"])).toBe(140);
    expect(tempoFromReadings(readings, 28, [])).toBe(105);
  });

  test("a clip of a techno record is voted and then corrected", () => {
    expect(Math.abs(clipTempo(kickLoop(138, 30), SAMPLE_RATE, ["Techno"])! - 138)).toBeLessThan(0.5);
    expect(clipTempo(steadyNoise(30), SAMPLE_RATE, ["Techno"])).toBeNull();
  });
});
