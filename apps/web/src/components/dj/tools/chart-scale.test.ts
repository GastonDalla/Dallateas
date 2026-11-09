import { describe, expect, test } from "bun:test";

import { labelIndexes, niceScale } from "./chart-scale";

describe("niceScale", () => {
  test("uses even round steps with the top tick above the maximum", () => {
    expect(niceScale(0, 64)).toEqual({ min: 0, max: 80, ticks: [0, 20, 40, 60, 80] });
  });

  test("never draws a fractional tick on a count", () => {
    expect(niceScale(0, 3)).toEqual({ min: 0, max: 4, ticks: [0, 1, 2, 3, 4] });
  });

  test("leaves room when the maximum lands on a step", () => {
    expect(niceScale(0, 40).max).toBeGreaterThan(40);
  });

  test("hugs a tempo range instead of starting at zero", () => {
    expect(niceScale(122, 130)).toEqual({ min: 120, max: 132, ticks: [120, 124, 128, 132] });
  });

  test("gives one value a scale of its own", () => {
    const { min, max } = niceScale(128, 128);

    expect(min).toBeLessThan(128);
    expect(max).toBeGreaterThan(128);
  });
});

describe("labelIndexes", () => {
  test("labels everything when it fits", () => {
    expect(labelIndexes(5)).toEqual([0, 1, 2, 3, 4]);
  });

  test("keeps one step all the way and at most seven labels", () => {
    expect(labelIndexes(20)).toEqual([0, 3, 6, 9, 12, 15, 18]);
  });

  test("returns nothing for an empty chart", () => {
    expect(labelIndexes(0)).toEqual([]);
  });
});
