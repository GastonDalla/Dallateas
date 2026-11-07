"use client";

import { useSearchParams } from "next/navigation";

import { NO_FILTERS, parseFilters, serializeFilters, type CollectionFilters } from "./filters";

function writeFilters(filters: CollectionFilters) {
  const query = serializeFilters(filters);
  // Replaces the address without a server round trip; useSearchParams still follows it.
  window.history.replaceState(null, "", query ? `?${query}` : window.location.pathname);
}

/** Filters kept in the address. Updates read the address itself, so a delayed one cannot undo a newer change. */
export function useCollectionFilters() {
  const params = useSearchParams();

  return {
    filters: parseFilters(params),
    update(changes: Partial<CollectionFilters>) {
      writeFilters({ ...parseFilters(new URLSearchParams(window.location.search)), ...changes });
    },
    clear() {
      writeFilters(NO_FILTERS);
    },
  };
}
