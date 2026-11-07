const DEEZER_API = "https://api.deezer.com";
const REQUEST_TIMEOUT_MS = 6000;
const NO_DATA = 800;
const UNKNOWN_ARTISTS = new Set(["various", "various artists", "unknown artist"]);
const CREDIT_SEPARATOR = /\s*[&,/+]\s*|\s+(?:feat\.?|ft\.?|vs\.?|x|and)\s+/i;

type DeezerError = { error?: { code?: number } };
type DeezerSearch = DeezerError & { data?: { id: number; title: string; artist?: { name: string } }[] };
type DeezerTrack = DeezerError & { bpm?: number };

type DeezerResponse<T> = { outcome: "ok"; body: T } | { outcome: "missing" } | { outcome: "failed" };

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

/**
 * "Minus" is also Deezer's "Minus (Original Mix)", but "Minus (Dub)" is only itself:
 * a record that names its version must not take another version's tempo.
 */
export function sameTitle(ours: string, theirs: string) {
  const title = normalizeName(ours);
  if (!title) return false;
  if (title === normalizeName(theirs)) return true;
  return withoutMixName(ours).trim() === ours.trim() && title === normalizeName(withoutMixName(theirs));
}

function credits(name: string) {
  return name
    .replace(/\(\d+\)/g, " ")
    .trim()
    .split(CREDIT_SEPARATOR)
    .map(normalizeName)
    .filter(Boolean);
}

/** A collaboration credits the artist in full, so one shared word is only a coincidence. */
export function sameArtist(a: string, b: string) {
  const other = new Set(credits(b));
  return credits(a).some((credit) => other.has(credit));
}

async function deezer<T extends DeezerError>(path: string): Promise<DeezerResponse<T>> {
  try {
    const response = await fetch(`${DEEZER_API}${path}`, { signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS) });
    if (!response.ok) return { outcome: "failed" };

    const body = (await response.json()) as T;
    // Deezer reports errors with a 200 status. Only "no data" is an answer; quota and busy are failures.
    if (body.error) return { outcome: body.error.code === NO_DATA ? "missing" : "failed" };
    return { outcome: "ok", body };
  } catch {
    return { outcome: "failed" };
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
  if (search.outcome === "failed") return { bpm: null, unavailable: true };
  if (search.outcome === "missing") return { bpm: null, unavailable: false };

  const candidates = (search.body.data ?? []).filter(
    (result) => result.artist && sameArtist(result.artist.name, artist),
  );
  const exactTitle = normalizeName(title);
  // A dub and an original share a title but rarely a tempo, so the exact version wins.
  const match =
    candidates.find((result) => normalizeName(result.title) === exactTitle) ??
    candidates.find((result) => sameTitle(result.title, title));
  if (!match) return { bpm: null, unavailable: false };

  const track = await deezer<DeezerTrack>(`/track/${match.id}`);
  if (track.outcome === "failed") return { bpm: null, unavailable: true };
  if (track.outcome === "missing") return { bpm: null, unavailable: false };

  const { bpm } = track.body;
  return { bpm: bpm && bpm > 0 ? Math.round(bpm * 10) / 10 : null, unavailable: false };
}
