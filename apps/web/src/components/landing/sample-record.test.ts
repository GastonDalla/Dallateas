import { describe, expect, test } from "bun:test";

import { cutAtPitch } from "./sample-record";

const cut = { bpm: 124, key: "9A" } as const;

describe("cutAtPitch", () => {
  test("leaves a centred fader as printed", () => {
    expect(cutAtPitch(cut, 0)).toEqual({ tempo: "124", key: "9A", keyMoved: false });
  });

  test("moves the tempo with the fader, to one decimal", () => {
    expect(cutAtPitch(cut, 1.5).tempo).toBe("125.9");
  });

  test("drops the decimal when the rounded tempo is whole", () => {
    expect(cutAtPitch(cut, 1.6).tempo).toBe("126");
  });

  test("keeps the key while the pitch stays under half a semitone", () => {
    expect(cutAtPitch(cut, 2.5)).toMatchObject({ key: "9A", keyMoved: false });
  });

  test("moves the key up once the pitch passes half a semitone", () => {
    expect(cutAtPitch(cut, 3)).toMatchObject({ key: "4A", keyMoved: true });
  });

  test("moves the key down when the pitch goes the other way", () => {
    expect(cutAtPitch(cut, -3)).toMatchObject({ key: "2A", keyMoved: true });
  });
});
