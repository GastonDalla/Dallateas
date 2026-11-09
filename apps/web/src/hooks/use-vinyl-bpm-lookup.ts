"use client";

import { useMutation } from "@tanstack/react-query";

import { measurePreview } from "@/lib/preview-tempo";
import { trpc } from "@/utils/trpc";

export type VinylBpmLookup = {
  searched: number;
  /** Tracks that got a tempo, published by Deezer or measured on a preview. */
  found: number;
  unavailable: boolean;
  remaining: number;
};

/**
 * Looks a record's empty tracks up, then measures in the browser the previews of those with no
 * published tempo. The server cannot decode audio, the browser can, and the previews allow it.
 */
export function useVinylBpmLookup() {
  const lookup = useMutation(trpc.vinylLookupBpm.mutationOptions());
  const save = useMutation(trpc.trackSavePreviewBpm.mutationOptions());

  return async function lookupVinyl(id: string, signal?: AbortSignal): Promise<VinylBpmLookup> {
    const { previews, styles, ...result } = await lookup.mutateAsync({ id });

    let measured = 0;
    for (const { trackId, url } of previews) {
      if (signal?.aborted) break;
      try {
        const bpm = await measurePreview(url, styles, signal);
        if (bpm !== null && (await save.mutateAsync({ id: trackId, bpm })).saved) measured += 1;
      } catch {
        // A preview that will not download or decode is one track without a tempo, not a failed lookup.
      }
    }

    return { ...result, found: result.found + measured };
  };
}
