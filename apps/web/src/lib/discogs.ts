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
  results: DiscogsSearchRelease[];
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

export async function fetchReleaseDetail(
  releaseId: number | string,
): Promise<DiscogsReleaseDetail> {
  if (typeof window === "undefined") return { tracklist: [], videos: [], barcode: null, discogsUrl: null };
  const url = new URL("/api/discogs/release", window.location.origin);
  url.searchParams.set("id", String(releaseId));
  const res = await fetch(url.toString());
  if (!res.ok) return { tracklist: [], videos: [], barcode: null, discogsUrl: null };
  return res.json();
}

export async function searchReleases(
  params: string | SearchParams,
): Promise<DiscogsSearchRelease[]> {
  if (typeof window === "undefined") return [];

  const url = new URL("/api/discogs/search", window.location.origin);

  if (typeof params === "string") {
    if (!params.trim()) return [];
    url.searchParams.set("q", params);
  } else {
    for (const [key, value] of Object.entries(params)) {
      if (value?.trim()) url.searchParams.set(key, value.trim());
    }
  }

  const res = await fetch(url.toString());
  if (!res.ok) return [];

  const data = (await res.json()) as DiscogsSearchResponse;
  return data.results ?? [];
}
