import { parseKey } from "@dallateas/dj/camelot";

/** Everything that narrows the collection. It lives in the address, so going back to a crate keeps it filtered. */
export type CollectionFilters = {
  search: string;
  barcode?: string;
  folderId?: string;
  genres: string[];
  styles: string[];
  tagIds: string[];
  keys: string[];
  bpmMin?: number;
  bpmMax?: number;
};

export const NO_FILTERS: CollectionFilters = { search: "", genres: [], styles: [], tagIds: [], keys: [] };

// The limits of vinylsList, so a hand-edited link narrows the list instead of failing the page.
const MAX_LIST = 20;
const MAX_SEARCH = 200;
const MAX_TEXT = 100;
const MAX_ID = 30;
const MAX_BARCODE = 50;
const MIN_BPM = 20;
const MAX_BPM = 400;

function readList(params: URLSearchParams, name: string, maxLength: number) {
  return params
    .getAll(name)
    .filter((value) => value.length > 0 && value.length <= maxLength)
    .slice(0, MAX_LIST);
}

function readText(params: URLSearchParams, name: string, maxLength: number) {
  const value = params.get(name);
  return value && value.length <= maxLength ? value : undefined;
}

export function parseBpmFilter(text: string | null) {
  const value = Number(text?.trim().replace(",", ".") || Number.NaN);
  return value >= MIN_BPM && value <= MAX_BPM ? value : undefined;
}

export function parseFilters(params: URLSearchParams): CollectionFilters {
  return {
    search: (params.get("q") ?? "").slice(0, MAX_SEARCH),
    barcode: readText(params, "barcode", MAX_BARCODE),
    folderId: readText(params, "folder", MAX_ID),
    genres: readList(params, "genre", MAX_TEXT),
    styles: readList(params, "style", MAX_TEXT),
    tagIds: readList(params, "tag", MAX_ID),
    keys: params.getAll("key").flatMap((value) => parseKey(value) ?? []).slice(0, MAX_LIST),
    bpmMin: parseBpmFilter(params.get("bpmMin")),
    bpmMax: parseBpmFilter(params.get("bpmMax")),
  };
}

export function serializeFilters(filters: CollectionFilters) {
  const params = new URLSearchParams();
  if (filters.search) params.set("q", filters.search);
  if (filters.barcode) params.set("barcode", filters.barcode);
  if (filters.folderId) params.set("folder", filters.folderId);
  for (const genre of filters.genres) params.append("genre", genre);
  for (const style of filters.styles) params.append("style", style);
  for (const tagId of filters.tagIds) params.append("tag", tagId);
  for (const key of filters.keys) params.append("key", key);
  if (filters.bpmMin !== undefined) params.set("bpmMin", String(filters.bpmMin));
  if (filters.bpmMax !== undefined) params.set("bpmMax", String(filters.bpmMax));
  return params.toString();
}

/** The one input for vinylsList. Server and client share it, so the prefetched page is the one the client reads. */
export function toVinylsListInput(filters: CollectionFilters) {
  const { search, barcode, folderId, genres, styles, tagIds, keys, bpmMin, bpmMax } = filters;
  const backwards = bpmMin !== undefined && bpmMax !== undefined && bpmMin > bpmMax;
  const lowest = backwards ? bpmMax : bpmMin;
  const highest = backwards ? bpmMin : bpmMax;

  return {
    ...(search ? { search } : {}),
    ...(barcode ? { barcode } : {}),
    ...(folderId ? { folderId } : {}),
    ...(genres.length > 0 ? { genres } : {}),
    ...(styles.length > 0 ? { styles } : {}),
    ...(tagIds.length > 0 ? { tagIds } : {}),
    ...(keys.length > 0 ? { keys } : {}),
    ...(lowest !== undefined ? { bpmMin: lowest } : {}),
    ...(highest !== undefined ? { bpmMax: highest } : {}),
  };
}

export function hasFilters(filters: CollectionFilters) {
  return Object.keys(toVinylsListInput(filters)).length > 0;
}

export function paramsFromPage(searchParams: Record<string, string | string[] | undefined>) {
  const params = new URLSearchParams();
  for (const [name, value] of Object.entries(searchParams)) {
    for (const entry of [value ?? []].flat()) params.append(name, entry);
  }
  return params;
}
