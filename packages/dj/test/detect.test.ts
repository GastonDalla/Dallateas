import { describe, expect, test } from "bun:test";

import { detectBpm } from "../src/detect";

import { kickLoop, SAMPLE_RATE, steadyNoise } from "./audio";

describe("detecting tempo from audio", () => {
  for (const bpm of [86, 95, 100, 120, 124, 128, 133.3, 140, 174, 178, 185]) {
    test(`finds ${bpm} BPM`, () => {
      const result = detectBpm(kickLoop(bpm, 15), SAMPLE_RATE);

      expect(result).not.toBeNull();
      expect(Math.abs(result!.bpm - bpm)).toBeLessThan(0.75);
    });
  }

  test("survives a noisy room", () => {
    const result = detectBpm(kickLoop(128, 15, 0.3), SAMPLE_RATE);

    expect(Math.abs(result!.bpm - 128)).toBeLessThan(1);
  });

  test("returns nothing for silence", () => {
    expect(detectBpm(new Float32Array(SAMPLE_RATE * 10), SAMPLE_RATE)).toBeNull();
  });

  test("returns nothing for steady noise, which has no beat to report", () => {
    expect(detectBpm(steadyNoise(10), SAMPLE_RATE)).toBeNull();
  });

  test("returns nothing for a clip too short to measure", () => {
    expect(detectBpm(kickLoop(128, 2), SAMPLE_RATE)).toBeNull();
  });
});
