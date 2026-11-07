const DEEZER_API = "https://api.deezer.com";
const REQUEST_TIMEOUT_MS = 6000;
const UNKNOWN_ARTISTS = new Set(["various", "various artists", "unknown artist"]);

type DeezerSearch = { data?: { id: number; title: string; artist?: { name: string } }[]; error?: unknown };
type DeezerTrack = { bpm?: number; error?: unknown };

export type LookupResult = {
  bpm: number | null;
  /** The source failed, as opposed to answering that it has no tempo. */
  unavailable: boolean;
};

/** Discogs marks homonyms as "Artist (2)", and titles carry punctuation. */
export function normalizeName(value: string) {
  return value
    .toLowerCase()
    .replace(/\(\d+\)/g, " ")
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .replace(/[^\p{L}\p{N}]+/gu, " ")
    .trim();
}

function withoutMixName(value: string) {
  return value.replace(/[([].*?[)\]]/g, " ").replace(/\s-\s.*$/, " ");
}

/** "Minus" and "Minus (Original Mix)" are the same cut. "Plus" and "Plus One" are not. */
export function sameTitle(a: string, b: string) {
  const left = normalizeName(withoutMixName(a));
  return left.length > 0 && left === normalizeName(withoutMixName(b));
}

/** A collaboration names the artist in full, so one shared word is only a coincidence. */
export function sameArtist(a: string, b: string) {
  const left = normalizeName(a);
  const right = normalizeName(b);
  if (!left || !right) return false;
  if (left === right) return true;

  const [shorter, longer] = left.length <= right.length ? [left, right] : [right, left];
  return shorter.includes(" ") && ` ${longer} `.includes(` ${shorter} `);
}

async function deezer<T extends { error?: unknown }>(path: string): Promise<T | null> {
  try {
    const response = await fetch(`${DEEZER_API}${path}`, { signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS) });
    if (!response.ok) return null;
    const body = (await response.json()) as T;
    // Deezer reports quota errors with a 200 status.
    return body.error ? null : body;
  } catch {
    return null;
  }
}

/**
 * Looks a track up on Deezer, the one free source of BPM without an API key.
 * In a sample of DJ tracks it matched all of them but held a tempo for only half,
 * so an empty answer is normal and any value is stored as approximate.
 */
export async function lookupTrackBpm(artist: string, title: string): Promise<LookupResult> {
  if (UNKNOWN_ARTISTS.has(normalizeName(artist))) return { bpm: null, unavailable: false };

  const query = encodeURIComponent(`${artist.replace(/\(\d+\)/g, "")} ${title}`);
  const search = await deezer<DeezerSearch>(`/search?q=${query}&limit=5`);
  if (!search) return { bpm: null, unavailable: true };

  const match = search.data?.find(
    (result) => sameTitle(result.title, title) && result.artist && sameArtist(result.artist.name, artist),
  );
  if (!match) return { bpm: null, unavailable: false };

  const track = await deezer<DeezerTrack>(`/track/${match.id}`);
  if (!track) return { bpm: null, unavailable: true };

  return { bpm: track.bpm && track.bpm > 0 ? Math.round(track.bpm * 10) / 10 : null, unavailable: false };
}
