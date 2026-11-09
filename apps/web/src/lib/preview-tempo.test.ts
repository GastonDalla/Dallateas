import { describe, expect, test } from "bun:test";

import { measurePreviews } from "./preview-tempo";

const previews = [
  { trackId: "a", url: "https://cdnt-preview.dzcdn.net/a.mp3" },
  { trackId: "b", url: "https://cdnt-preview.dzcdn.net/b.mp3" },
  { trackId: "c", url: "https://audio-ssl.itunes.apple.com/c.m4a" },
];

describe("measuring a lookup's previews", () => {
  test("saves every tempo measured and counts only the tracks that took it", async () => {
    const saved: [string, number][] = [];
    const tempos: Record<string, number | null> = { a: 138, b: null, c: 140 };

    const measured = await measurePreviews(
      { previews, styles: ["Techno"] },
      {
        measure: async (url) => tempos[url.split("/").pop()!.split(".")[0]!] ?? null,
        save: async (id, bpm) => {
          saved.push([id, bpm]);
          return id !== "c";
        },
      },
    );

    expect(saved).toEqual([
      ["a", 138],
      ["c", 140],
    ]);
    expect(measured).toBe(1);
  });

  test("a preview that fails to download or decode does not stop the others", async () => {
    const saved: string[] = [];

    const measured = await measurePreviews(
      { previews, styles: [] },
      {
        measure: async (url) => {
          if (url.endsWith("a.mp3")) throw new Error("decode failed");
          return 128;
        },
        save: async (id) => {
          saved.push(id);
          return true;
        },
      },
    );

    expect(saved).toEqual(["b", "c"]);
    expect(measured).toBe(2);
  });

  test("stops when the run is cancelled", async () => {
    const controller = new AbortController();
    const saved: string[] = [];

    await measurePreviews(
      { previews, styles: [] },
      {
        measure: async () => 128,
        save: async (id) => {
          saved.push(id);
          controller.abort();
          return true;
        },
        signal: controller.signal,
      },
    );

    expect(saved).toEqual(["a"]);
  });
});
