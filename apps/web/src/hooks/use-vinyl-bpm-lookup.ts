"use client";

import { useMutation } from "@tanstack/react-query";

import { measurePreviews } from "@/lib/preview-tempo";
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
    const measured = await measurePreviews(
      { previews, styles },
      { save: async (trackId, bpm) => (await save.mutateAsync({ id: trackId, bpm })).saved, signal },
    );

    return { ...result, found: result.found + measured };
  };
}
