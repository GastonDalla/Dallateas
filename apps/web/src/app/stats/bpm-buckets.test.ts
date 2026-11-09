import { describe, expect, test } from "bun:test";

import { BUCKET_SIZE, busiestBucket, fillBpmBuckets } from "./bpm-buckets";

describe("fillBpmBuckets", () => {
  test("draws the empty bins between two tempos as zero, so the axis stays even", () => {
    expect(
      fillBpmBuckets([
        { bucket: 120, count: 2 },
        { bucket: 135, count: 1 },
      ]),
    ).toEqual([
      { bucket: 120, count: 2 },
      { bucket: 125, count: 0 },
      { bucket: 130, count: 0 },
      { bucket: 135, count: 1 },
    ]);
  });

  test("returns nothing for a collection without tempos", () => {
    expect(fillBpmBuckets([])).toEqual([]);
  });

  test("uses the width the API buckets by", () => {
    expect(BUCKET_SIZE).toBe(5);
  });
});

describe("busiestBucket", () => {
  test("finds the index with the most tracks, the lowest on a tie", () => {
    expect(
      busiestBucket([
        { bucket: 120, count: 2 },
        { bucket: 125, count: 7 },
        { bucket: 130, count: 7 },
      ]),
    ).toBe(1);
  });

  test("returns null without buckets", () => {
    expect(busiestBucket([])).toBeNull();
  });
});
