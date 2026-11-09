"use client";

import { useQuery } from "@tanstack/react-query";
import { useState } from "react";

import { useDebounce } from "@/hooks/use-debounce";
import { searchReleases } from "@/lib/discogs";

export type SearchMode = "title" | "barcode";

const MIN_TITLE_LENGTH = 3;
const SEARCH_CACHE_MS = 5 * 60_000;

/** Discogs results for what the DJ typed. Filling the form from a result does not search again, only typing does. */
export function useDiscogsSearch() {
  const [mode, setMode] = useState<SearchMode>("title");
  const [title, setTitle] = useState("");
  const [barcode, setBarcode] = useState("");
  const debouncedTitle = useDebounce(title.trim(), 400);

  const term = mode === "barcode" ? barcode : title ? debouncedTitle : "";
  const enabled = mode === "barcode" ? term.length > 0 : term.length >= MIN_TITLE_LENGTH;

  const { data, isFetching } = useQuery({
    queryKey: ["discogs-search", mode, term],
    queryFn: () => searchReleases(mode === "barcode" ? { barcode: term } : term),
    enabled,
    staleTime: SEARCH_CACHE_MS,
  });

  return {
    mode,
    results: enabled ? (data ?? []) : [],
    isSearching: enabled && isFetching,
    failed: enabled && data === null,
    foundNothing: enabled && !isFetching && data?.length === 0,
    changeMode(next: SearchMode) {
      setMode(next);
      setTitle("");
      setBarcode("");
    },
    searchTitle: setTitle,
    searchBarcode(code: string) {
      setMode("barcode");
      setBarcode(code.trim());
    },
    clear() {
      setTitle("");
      setBarcode("");
    },
  };
}
