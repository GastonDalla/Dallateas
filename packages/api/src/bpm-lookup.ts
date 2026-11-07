const DEEZER_API = "https://api.deezer.com";
const REQUEST_TIMEOUT_MS = 6000;
const UNKNOWN_ARTISTS = new Set(["various", "various artists", "unknown artist"]);

type DeezerSearch = { data?: { id: number; title: string; artist?: { name: string } }[] };
type DeezerTrack = { bpm?: number };

/** Discogs marks homonyms as "Artist (2)", and titles carry mix names and punctuation. */
export function normalizeName(value: string) {
  return value
    .toLowerCase()
    .replace(/\(\d+\)/g, " ")
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .replace(/[^\p{L}\p{N}]+/gu, " ")
    .trim();
}

function sameName(a: string, b: string) {
  const left = normalizeName(a);
  const right = normalizeName(b);
  return left.length > 0 && right.length > 0 && (left === right || left.includes(right) || right.includes(left));
}

async function deezer<T>(path: string): Promise<T | null> {
  try {
    const response = await fetch(`${DEEZER_API}${path}`, { signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS) });
    return response.ok ? ((await response.json()) as T) : null;
  } catch {
    return null;
  }
}

/**
 * Looks a track up on Deezer, the one free source of BPM without an API key.
 * In a sample of DJ tracks it matched all of them but held a tempo for only half,
 * so an empty answer is normal and any value is stored as approximate.
 */
export async function lookupTrackBpm(artist: string, title: string): Promise<number | null> {
  if (UNKNOWN_ARTISTS.has(normalizeName(artist))) return null;

  const query = encodeURIComponent(`${artist.replace(/\(\d+\)/g, "")} ${title}`);
  const search = await deezer<DeezerSearch>(`/search?q=${query}&limit=5`);
  const match = search?.data?.find(
    (result) => sameName(result.title, title) && result.artist && sameName(result.artist.name, artist),
  );
  if (!match) return null;

  const track = await deezer<DeezerTrack>(`/track/${match.id}`);
  return track?.bpm && track.bpm > 0 ? Math.round(track.bpm * 10) / 10 : null;
}
