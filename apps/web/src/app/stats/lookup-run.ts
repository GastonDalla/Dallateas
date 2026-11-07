export type LookupProgress = { done: number; found: number; notFound: number };

export type LookupEnd = "finished" | "stopped" | "rate-limited" | "source-down" | "failed";

type LookupResult = { searched: number; found: number; unavailable: boolean };

type RunOptions = {
  signal: AbortSignal;
  onProgress?: (progress: LookupProgress) => void;
};

function errorCode(error: unknown) {
  if (typeof error !== "object" || error === null || !("data" in error)) return undefined;
  const { data } = error;
  return typeof data === "object" && data !== null && "code" in data ? data.code : undefined;
}

/**
 * Looks records up one at a time, because the source limits requests per address.
 * Stops as soon as carrying on would be wasted: the DJ stopped it, the limit was hit or the source went down.
 */
export async function runLookups(
  ids: readonly string[],
  lookup: (id: string) => Promise<LookupResult>,
  { signal, onProgress }: RunOptions,
): Promise<{ end: LookupEnd; progress: LookupProgress }> {
  let progress: LookupProgress = { done: 0, found: 0, notFound: 0 };

  for (const id of ids) {
    if (signal.aborted) return { end: "stopped", progress };

    try {
      const { searched, found, unavailable } = await lookup(id);
      // The cut the source failed on got no answer, which is not the same as having no tempo.
      const answered = unavailable ? searched - 1 : searched;

      progress = {
        done: progress.done + 1,
        found: progress.found + found,
        notFound: progress.notFound + Math.max(0, answered - found),
      };
      onProgress?.(progress);

      if (unavailable) return { end: "source-down", progress };
    } catch (error) {
      const code = errorCode(error);
      if (code === "TOO_MANY_REQUESTS") return { end: "rate-limited", progress };
      if (code !== "NOT_FOUND") return { end: "failed", progress };

      progress = { ...progress, done: progress.done + 1 };
      onProgress?.(progress);
    }
  }

  return { end: signal.aborted ? "stopped" : "finished", progress };
}
