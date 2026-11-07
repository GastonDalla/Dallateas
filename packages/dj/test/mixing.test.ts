import { describe, expect, test } from "bun:test";

import { analyzeSet, rankMixes } from "../src/mixing";

const track = (id: string, bpm: number | null, key: string | null, duration: string | null = "6:00") => ({
  id,
  bpm,
  key,
  duration,
});

describe("finding what mixes with a track", () => {
  test("leaves out records the pitch fader cannot reach", () => {
    const mixes = rankMixes(track("a", 128, "8A"), [track("b", 130, "8A"), track("c", 150, "8A")], { pitchRange: 8 });

    expect(mixes.map((mix) => mix.track.id)).toEqual(["b"]);
  });

  test("a wider fader reaches further", () => {
    const mixes = rankMixes(track("a", 128, "8A"), [track("c", 150, "8A")], { pitchRange: 16 });

    expect(mixes.map((mix) => mix.track.id)).toEqual(["c"]);
  });

  test("ranks a harmonic match above a clash at the same tempo", () => {
    const mixes = rankMixes(track("a", 128, "8A"), [track("clash", 128, "2B"), track("match", 128, "8A")], {
      pitchRange: 8,
    });

    expect(mixes.map((mix) => mix.track.id)).toEqual(["match", "clash"]);
  });

  test("judges the key the listener will hear after pitching", () => {
    // Pitching 120 up to 127.2 raises the record a semitone, so 1A is heard as 8A.
    const [mix] = rankMixes(track("a", 127.2, "8A"), [track("b", 120, "1A")], { pitchRange: 8 });

    expect(mix?.pitch).toBeCloseTo(6, 1);
    expect(mix?.effectiveKey).toBe("8A");
    expect(mix?.relation).toBe("same");
  });

  test("offers half-time and double-time records", () => {
    const [mix] = rankMixes(track("a", 174, "8A"), [track("b", 87, "8A")], { pitchRange: 8 });

    expect(mix?.tempoFactor).toBe(2);
    expect(mix?.pitch).toBeCloseTo(0, 5);
  });

  test("never suggests the track itself or one without a tempo", () => {
    const source = track("a", 128, "8A");

    expect(rankMixes(source, [source, track("b", null, "8A")], { pitchRange: 8 })).toEqual([]);
  });
});

describe("reading a set", () => {
  const set = [track("a", 124, "8A"), track("b", 126, "9A"), track("c", 150, "2B", null), track("d", null, null, "5:00")];
  const flow = analyzeSet(set, { pitchRange: 8 });

  test("adds up the running time and says what it could not count", () => {
    expect(flow.totalSeconds).toBe(6 * 60 + 6 * 60 + 5 * 60);
    expect(flow.tracksWithoutDuration).toBe(1);
  });

  test("describes each transition", () => {
    expect(flow.transitions).toHaveLength(3);
    expect(flow.transitions[0]).toMatchObject({ reachable: true, relation: "adjacent" });
    expect(flow.transitions[0]?.pitch).toBeCloseTo(-1.587, 2);
  });

  test("flags a jump the fader cannot make", () => {
    expect(flow.transitions[1]?.reachable).toBe(false);
  });

  test("leaves a transition unknown when a tempo is missing", () => {
    expect(flow.transitions[2]).toMatchObject({ reachable: null, relation: null, pitch: null });
  });

  test("reports the tempo range", () => {
    expect(flow.minBpm).toBe(124);
    expect(flow.maxBpm).toBe(150);
  });
});
