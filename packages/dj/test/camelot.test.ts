import { describe, expect, test } from "bun:test";

import { keyAtPitch, keyLabel, keyRelation, parseKey, semitonesAtPitch } from "../src/camelot";

describe("reading keys", () => {
  test("accepts Camelot and musical notation", () => {
    expect(parseKey("8A")).toBe("8A");
    expect(parseKey("8a")).toBe("8A");
    expect(parseKey("Am")).toBe("8A");
    expect(parseKey("A minor")).toBe("8A");
    expect(parseKey("C")).toBe("8B");
    expect(parseKey("C major")).toBe("8B");
    expect(parseKey("F#m")).toBe("11A");
    expect(parseKey("Gbm")).toBe("11A");
    expect(parseKey("Db")).toBe("3B");
    expect(parseKey("C#")).toBe("3B");
  });

  test("ignores the case of the mode", () => {
    expect(parseKey("A Minor")).toBe("8A");
    expect(parseKey("C Major")).toBe("8B");
    expect(parseKey("AMIN")).toBe("8A");
    expect(parseKey("a minor")).toBe("8A");
  });

  test("keeps a flat apart from the note B", () => {
    expect(parseKey("Bb")).toBe("6B");
    expect(parseKey("bb")).toBe("6B");
    expect(parseKey("Bbm")).toBe("3A");
  });

  test("rejects anything else", () => {
    expect(parseKey("13A")).toBeNull();
    expect(parseKey("H")).toBeNull();
    expect(parseKey("")).toBeNull();
  });

  test("names a key", () => {
    expect(keyLabel("8A")).toBe("Am");
    expect(keyLabel("8B")).toBe("C");
  });
});

describe("harmonic relations", () => {
  test("the same key mixes perfectly", () => {
    expect(keyRelation("8A", "8A")).toBe("same");
  });

  test("neighbours on the wheel are compatible, including across 12 and 1", () => {
    expect(keyRelation("8A", "9A")).toBe("adjacent");
    expect(keyRelation("8A", "7A")).toBe("adjacent");
    expect(keyRelation("12B", "1B")).toBe("adjacent");
  });

  test("relative major and minor are compatible", () => {
    expect(keyRelation("8A", "8B")).toBe("relative");
  });

  test("two steps up is an energy boost", () => {
    expect(keyRelation("8A", "10A")).toBe("boost");
  });

  test("anything else clashes", () => {
    expect(keyRelation("8A", "2B")).toBe("clash");
  });
});

describe("a turntable has no key lock", () => {
  test("small pitch moves leave the key alone", () => {
    expect(keyAtPitch("8A", 2)).toBe("8A");
    expect(keyAtPitch("8A", -2)).toBe("8A");
  });

  test("one semitone up moves seven steps on the wheel", () => {
    expect(keyAtPitch("8A", 6)).toBe("3A");
  });

  test("one semitone down moves five steps on the wheel", () => {
    expect(keyAtPitch("8A", -6)).toBe("1A");
  });

  test("a pitch with no meaning leaves the key alone", () => {
    expect(keyAtPitch("8A", Number.POSITIVE_INFINITY)).toBe("8A");
    expect(keyAtPitch("8A", -100)).toBe("8A");
  });

  test("reports the shift in semitones", () => {
    expect(semitonesAtPitch(5.946)).toBeCloseTo(1, 2);
    expect(semitonesAtPitch(0)).toBe(0);
  });
});
