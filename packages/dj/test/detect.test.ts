import { describe, expect, test } from "bun:test";

import { detectBpm } from "../src/detect";

const SAMPLE_RATE = 44_100;

/** A four-to-the-floor kick with a little noise, like a record picked up by a phone. */
function kickLoop(bpm: number, seconds: number, noise = 0.02) {
  const samples = new Float32Array(SAMPLE_RATE * seconds);
  const beat = (60 / bpm) * SAMPLE_RATE;
  let seed = 7;
  for (let index = 0; index < samples.length; index += 1) {
    seed = (seed * 1_664_525 + 1_013_904_223) % 4_294_967_296;
    samples[index] = (seed / 4_294_967_296 - 0.5) * noise;
  }
  for (let start = 0; start < samples.length; start += beat) {
    const offset = Math.round(start);
    for (let index = 0; index < 6000 && offset + index < samples.length; index += 1) {
      const decay = Math.exp(-index / 1200);
      samples[offset + index]! += Math.sin((2 * Math.PI * 70 * index) / SAMPLE_RATE) * decay;
    }
  }
  return samples;
}

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
    const noise = new Float32Array(SAMPLE_RATE * 10);
    let seed = 11;
    for (let index = 0; index < noise.length; index += 1) {
      seed = (seed * 1_664_525 + 1_013_904_223) % 4_294_967_296;
      noise[index] = seed / 4_294_967_296 - 0.5;
    }

    expect(detectBpm(noise, SAMPLE_RATE)).toBeNull();
  });

  test("returns nothing for a clip too short to measure", () => {
    expect(detectBpm(kickLoop(128, 2), SAMPLE_RATE)).toBeNull();
  });
});
