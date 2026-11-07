"use client";

import { useQueryClient } from "@tanstack/react-query";

import { trpc } from "@/utils/trpc";

/**
 * Everything a change to a record can leave stale. Only what is on screen refetches.
 * Pass the record's id when it still exists: refetching a deleted one would fail.
 */
export function useInvalidateCollection() {
  const queryClient = useQueryClient();

  return (vinylId?: string) => {
    const queryKeys = [
      trpc.vinylsList.pathKey(),
      trpc.collectionStats.pathKey(),
      trpc.trackStats.pathKey(),
      trpc.vinylsMissingBpm.pathKey(),
      trpc.trackMixCandidates.pathKey(),
      trpc.folderSetFlow.pathKey(),
      trpc.foldersList.pathKey(),
      trpc.folderGet.pathKey(),
      trpc.userGenres.pathKey(),
      trpc.userStyles.pathKey(),
      trpc.tagsList.pathKey(),
      ...(vinylId ? [trpc.vinylGet.queryKey({ id: vinylId })] : []),
    ];

    return Promise.all(queryKeys.map((queryKey) => queryClient.invalidateQueries({ queryKey })));
  };
}
