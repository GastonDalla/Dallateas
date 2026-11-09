/** Client for this app's Discogs routes. Runs in the browser, from handlers and client queries. */

export type DiscogsSearchRelease = {
  id: number;
  title: string;
  year?: number;
  country?: string;
  format?: string[];
  label?: string[];
  genre?: string[];
  style?: string[];
  catno?: string;
  barcode?: string[];
  cover_image?: string;
  thumb?: string;
};

type DiscogsSearchResponse = {
  results?: DiscogsSearchRelease[];
};

type SearchParams = {
  q?: string;
  artist?: string;
  label?: string;
  genre?: string;
  year?: string;
  barcode?: string;
  catno?: string;
  title?: string;
  release_title?: string;
  country?: string;
  format?: string;
  style?: string;
};

export type DiscogsTrack = {
  position: string;
  title: string;
  duration: string;
};

export type DiscogsVideo = {
  title: string;
  uri: string;
  duration: number;
};

export type DiscogsReleaseDetail = {
  tracklist: DiscogsTrack[];
  videos: DiscogsVideo[];
  barcode: string | null;
  discogsUrl: string | null;
};

const NO_DETAIL: DiscogsReleaseDetail = { tracklist: [], videos: [], barcode: null, discogsUrl: null };

/** Videos and tracklists only add to a record, so a failure reads as a release with neither. */
export async function fetchReleaseDetail(releaseId: number | string): Promise<DiscogsReleaseDetail> {
  const res = await fetch(`/api/discogs/release?${new URLSearchParams({ id: String(releaseId) })}`);
  if (!res.ok) return NO_DETAIL;
  return res.json();
}

/** Results of a search, or null when Discogs could not be reached, which is not the same as finding nothing. */
export async function searchReleases(params: string | SearchParams): Promise<DiscogsSearchRelease[] | null> {
  const query = new URLSearchParams();

  if (typeof params === "string") {
    if (!params.trim()) return [];
    query.set("q", params);
  } else {
    for (const [key, value] of Object.entries(params)) {
      if (value?.trim()) query.set(key, value.trim());
    }
  }

  const res = await fetch(`/api/discogs/search?${query}`);
  if (!res.ok) return null;

  const data = (await res.json()) as DiscogsSearchResponse;
  return data.results ?? [];
}
