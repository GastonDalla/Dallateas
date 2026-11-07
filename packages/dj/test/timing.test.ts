import { describe, expect, test } from "bun:test";

import { beatDriftMs, beatMs, delayTimes, phraseSeconds, planRamp } from "../src/timing";

describe("beat and phrase lengths", () => {
  test("a beat at 120 BPM lasts half a second", () => {
    expect(beatMs(120)).toBe(500);
  });

  test("a 32-bar phrase at 128 BPM lasts exactly one minute", () => {
    expect(phraseSeconds(128, 32)).toBe(60);
  });

  test("a single bar is four beats", () => {
    expect(phraseSeconds(120, 1)).toBe(2);
  });
});

describe("delay times", () => {
  test("lists every note value at a tempo, in milliseconds", () => {
    const times = Object.fromEntries(delayTimes(120).map(({ id, ms }) => [id, ms]));

    expect(times).toEqual({
      bar: 2000,
      half: 1000,
      quarter: 500,
      "dotted-eighth": 375,
      "quarter-triplet": 1000 / 3,
      eighth: 250,
      sixteenth: 125,
    });
  });
});

describe("drift between two records", () => {
  test("is zero when the tempos match", () => {
    expect(beatDriftMs(126, 126, 32)).toBe(0);
  });

  test("grows with every beat and is positive for the faster record", () => {
    const perBar = beatDriftMs(126, 125, 4);

    expect(perBar).toBeCloseTo(15.24, 2);
    expect(beatDriftMs(126, 125, 8)).toBeCloseTo(perBar * 2, 9);
    expect(beatDriftMs(125, 126, 4)).toBeCloseTo(-perBar, 9);
  });
});

describe("set ramp", () => {
  test("spreads the climb evenly over the records a set needs", () => {
    expect(planRamp({ startBpm: 122, endBpm: 130, minutes: 60, minutesPerRecord: 6 })).toEqual({
      records: 10,
      tempos: [122, 122.9, 123.8, 124.7, 125.6, 126.4, 127.3, 128.2, 129.1, 130],
      stepBpm: 8 / 9,
    });
  });

  test("rounds a part-record up, so the set never runs short", () => {
    expect(planRamp({ startBpm: 124, endBpm: 128, minutes: 61, minutesPerRecord: 6 })?.records).toBe(11);
  });

  test("comes down when the end is slower than the start", () => {
    const plan = planRamp({ startBpm: 132, endBpm: 124, minutes: 30, minutesPerRecord: 5 });

    expect(plan?.tempos).toEqual([132, 130.4, 128.8, 127.2, 125.6, 124]);
    expect(plan?.stepBpm).toBeCloseTo(-1.6, 9);
  });

  test("a set of one record has no step", () => {
    expect(planRamp({ startBpm: 124, endBpm: 130, minutes: 4, minutesPerRecord: 6 })).toEqual({
      records: 1,
      tempos: [124],
      stepBpm: 0,
    });
  });

  test("refuses a plan with more records than a night can hold", () => {
    expect(planRamp({ startBpm: 124, endBpm: 128, minutes: 720, minutesPerRecord: 3 })?.records).toBe(240);
    expect(planRamp({ startBpm: 124, endBpm: 128, minutes: 720, minutesPerRecord: 0.01 })).toBeNull();
  });

  test("refuses empty, zero, negative and non-numeric input", () => {
    for (const input of [
      { startBpm: 0, endBpm: 128, minutes: 60, minutesPerRecord: 6 },
      { startBpm: 124, endBpm: -1, minutes: 60, minutesPerRecord: 6 },
      { startBpm: 124, endBpm: 128, minutes: 0, minutesPerRecord: 6 },
      { startBpm: 124, endBpm: 128, minutes: 60, minutesPerRecord: Number.NaN },
    ]) {
      expect(planRamp(input)).toBeNull();
    }
  });
});
