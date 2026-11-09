"use client";

import { keepPreviousData, useQueries, useQuery } from "@tanstack/react-query";
import { useState } from "react";

import { trpc } from "@/utils/trpc";

import type { toVinylsListInput } from "./filters";

type ListInput = ReturnType<typeof toVinylsListInput>;

/** The collection in pages. Each page is its own query, so the first is the one the server prefetched. */
export function useCollectionPages(input: ListInput) {
  const inputKey = JSON.stringify(input);
  const [paging, setPaging] = useState<{ inputKey: string; cursors: string[] }>({ inputKey, cursors: [] });
  const cursors = paging.inputKey === inputKey ? paging.cursors : [];

  const first = useQuery({ ...trpc.vinylsList.queryOptions(input), placeholderData: keepPreviousData });
  const later = useQueries({
    queries: cursors.map((cursor) => trpc.vinylsList.queryOptions({ ...input, cursor })),
  });

  const pages = [first.data, ...later.map(({ data }) => data)];
  const nextCursor = pages.at(-1)?.nextCursor;

  return {
    vinyls: pages.flatMap((page) => page?.items ?? []),
    isLoading: first.isLoading,
    isError: first.isError,
    isStale: first.isPlaceholderData,
    isLoadingMore: later.some(({ isLoading }) => isLoading),
    hasMore: nextCursor !== undefined,
    refetch: first.refetch,
    loadMore() {
      if (nextCursor) setPaging({ inputKey, cursors: [...cursors, nextCursor] });
    },
  };
}
