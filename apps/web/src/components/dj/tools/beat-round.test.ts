import { describe, expect, test } from "bun:test";

import { pitchToMatch } from "@dallateas/dj/tempo";

import { judgeMatch, newRound } from "./beat-round";

function sequence(...values: number[]) {
  let index = 0;
  return () => values[index++ % values.length]!;
}

describe("a training round", () => {
  test("puts the room between 120 and 130 BPM", () => {
    expect(newRound(sequence(0, 0, 0, 0)).houseBpm).toBe(120);
    expect(newRound(sequence(0.999, 0, 0, 0)).houseBpm).toBe(130);
  });

  test("prints a record the fader must move, but can reach", () => {
    for (let seed = 0; seed < 200; seed += 1) {
      const random = sequence(((seed * 37) % 100) / 100, (seed % 2) / 2 + 0.1, ((seed * 53) % 100) / 100, 0.5);
      const { houseBpm, recordBpm } = newRound(random);
      const pitch = Math.abs(pitchToMatch(recordBpm, houseBpm));

      expect(Number.isInteger(recordBpm)).toBe(true);
      expect(pitch).toBeGreaterThan(1);
      expect(pitch).toBeLessThanOrEqual(6.5);
    }
  });

  test("starts the record a fraction of a beat late", () => {
    expect(newRound(sequence(0.5, 0.5, 0.5, 0)).lateBeats).toBeCloseTo(0.15, 9);
    expect(newRound(sequence(0.5, 0.5, 0.5, 1)).lateBeats).toBeCloseTo(0.45, 9);
  });
});

describe("judging a match", () => {
  test("calls a gap of a twentieth of a BPM locked", () => {
    expect(judgeMatch(126.4, 126.45).verdict).toBe("locked");
  });

  test("calls a quarter of a BPM close and more than that off", () => {
    expect(judgeMatch(126.4, 126.2).verdict).toBe("close");
    expect(judgeMatch(126.4, 127).verdict).toBe("off");
  });

  test("reports the gap, the drift per bar and the pitch still needed", () => {
    const result = judgeMatch(126, 125);

    expect(result.gap).toBe(-1);
    expect(result.driftPerBar).toBeCloseTo(-15.24, 2);
    expect(result.pitchNeeded).toBeCloseTo(0.8, 2);
  });
});
