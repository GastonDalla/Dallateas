import { describe, expect, test } from "bun:test";

import { parsePitchRange } from "./pitch-range";

describe("parsePitchRange", () => {
  test("accepts a range a turntable has", () => {
    expect(parsePitchRange("8")).toBe(8);
    expect(parsePitchRange("50")).toBe(50);
  });

  test("rejects anything else", () => {
    expect(parsePitchRange("7")).toBeNull();
    expect(parsePitchRange("abc")).toBeNull();
    expect(parsePitchRange(null)).toBeNull();
  });
});
