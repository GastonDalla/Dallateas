import { describe, expect, test } from "bun:test";

import { runLookups, type LookupProgress } from "./lookup-run";

function trpcError(code: string) {
  return Object.assign(new Error(code), { data: { code } });
}

const HIT = { searched: 3, found: 2, unavailable: false };

describe("runLookups", () => {
  test("adds up found and not found across every record", async () => {
    const { end, progress } = await runLookups(["a", "b"], async () => HIT, { signal: new AbortController().signal });

    expect(end).toBe("finished");
    expect(progress).toEqual({ done: 2, found: 4, notFound: 2 });
  });

  test("asks for one record at a time, never two at once", async () => {
    let running = 0;
    let peak = 0;

    await runLookups(
      ["a", "b", "c"],
      async () => {
        running += 1;
        peak = Math.max(peak, running);
        await Promise.resolve();
        running -= 1;
        return HIT;
      },
      { signal: new AbortController().signal },
    );

    expect(peak).toBe(1);
  });

  test("reports progress after each record", async () => {
    const seen: LookupProgress[] = [];

    await runLookups(["a", "b"], async () => HIT, {
      signal: new AbortController().signal,
      onProgress: (progress) => seen.push(progress),
    });

    expect(seen.map(({ done }) => done)).toEqual([1, 2]);
  });

  test("stops when the DJ asks, keeping what was found", async () => {
    const controller = new AbortController();
    const asked: string[] = [];

    const { end, progress } = await runLookups(
      ["a", "b", "c"],
      async (id) => {
        asked.push(id);
        controller.abort();
        return HIT;
      },
      { signal: controller.signal },
    );

    expect(end).toBe("stopped");
    expect(asked).toEqual(["a"]);
    expect(progress.done).toBe(1);
  });

  test("stops at the rate limit and does not count that record", async () => {
    const lookup = async (id: string) => {
      if (id === "b") throw trpcError("TOO_MANY_REQUESTS");
      return HIT;
    };

    const { end, progress } = await runLookups(["a", "b", "c"], lookup, { signal: new AbortController().signal });

    expect(end).toBe("rate-limited");
    expect(progress).toEqual({ done: 1, found: 2, notFound: 1 });
  });

  test("stops when the source stops answering, counting what it did search", async () => {
    const asked: string[] = [];

    const { end, progress } = await runLookups(
      ["a", "b"],
      async (id) => {
        asked.push(id);
        return { searched: 2, found: 1, unavailable: true };
      },
      { signal: new AbortController().signal },
    );

    expect(end).toBe("source-down");
    expect(asked).toEqual(["a"]);
    // The last cut searched is the one the source failed on, so it is not a real "not found".
    expect(progress).toEqual({ done: 1, found: 1, notFound: 0 });
  });

  test("skips a record that no longer exists and keeps going", async () => {
    const lookup = async (id: string) => {
      if (id === "gone") throw trpcError("NOT_FOUND");
      return HIT;
    };

    const { end, progress } = await runLookups(["gone", "b"], lookup, { signal: new AbortController().signal });

    expect(end).toBe("finished");
    expect(progress).toEqual({ done: 2, found: 2, notFound: 1 });
  });

  test("stops on any other failure and says so", async () => {
    const lookup = async () => {
      throw new Error("Failed to fetch");
    };

    const { end, progress } = await runLookups(["a", "b"], lookup, { signal: new AbortController().signal });

    expect(end).toBe("failed");
    expect(progress.done).toBe(0);
  });
});
