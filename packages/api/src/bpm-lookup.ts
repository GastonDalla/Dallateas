const DEEZER_API = "https://api.deezer.com";
const ITUNES_SEARCH = "https://itunes.apple.com/search";
const REQUEST_TIMEOUT_MS = 6000;
const NO_DATA = 800;
const UNKNOWN_ARTISTS = new Set(["various", "various artists", "unknown artist"]);
const CREDIT_SEPARATOR = /\s*[&,/+]\s*|\s+(?:feat\.?|ft\.?|vs\.?|x|and)\s+/i;

type DeezerError = { error?: { code?: number } };
type DeezerSearch = DeezerError & { data?: { id: number; title: string; preview?: string; artist?: { name: string } }[] };
type ItunesSearch = { results?: { artistName?: string; trackName?: string; previewUrl?: string }[] };
type DeezerTrack = DeezerError & { bpm?: number };

type DeezerResponse<T> = { outcome: "ok"; body: T } | { outcome: "missing" } | { outcome: "failed" };

export type LookupResult = {
  bpm: number | null;
  /** The source failed, as opposed to answering that it has no tempo. */
  unavailable: boolean;
  /** A 30-second clip of the track, for the browser to measure when no tempo is published. */
  preview: string | null;
};

const NOTHING: LookupResult = { bpm: null, unavailable: false, preview: null };
const DEEZER_DOWN: LookupResult = { bpm: null, unavailable: true, preview: null };

/** The CDNs Deezer and Apple Music serve previews from, which the page's CSP lets it fetch. */
const PREVIEW_HOSTS = [/\.dzcdn\.net$/, /\.itunes\.apple\.com$/];

/** A preview URL is handed to the browser to fetch, so only these hosts over HTTPS pass. */
export function previewUrl(value: unknown): string | null {
  if (typeof value !== "string") return null;
  try {
    const url = new URL(value);
    return url.protocol === "https:" && PREVIEW_HOSTS.some((host) => host.test(url.hostname)) ? url.href : null;
  } catch {
    return null;
  }
}

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

/** Apple Music has many records Deezer lacks. It publishes no tempo, only a preview to measure. */
async function itunesPreview(artist: string, title: string): Promise<string | null> {
  const query = encodeURIComponent(`${artist.replace(/\(\d+\)/g, "")} ${title}`);
  try {
    const response = await fetch(`${ITUNES_SEARCH}?term=${query}&media=music&entity=song&limit=10`, {
      signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
    });
    // It limits requests per address and says so with a 403. A preview is a bonus, so that is not a failure.
    if (!response.ok) return null;

    const { results = [] } = (await response.json()) as ItunesSearch;
    const candidates = results.filter((result) => result.artistName && sameArtist(result.artistName, artist));
    const exactTitle = normalizeName(title);
    const match =
      candidates.find((result) => normalizeName(result.trackName ?? "") === exactTitle) ??
      candidates.find((result) => result.trackName && sameTitle(title, result.trackName));
    return previewUrl(match?.previewUrl);
  } catch {
    return null;
  }
}

/**
 * Looks a track up on Deezer, the one free source of BPM without an API key. On a sample of DJ
 * tracks it matched all of them but held a tempo for only half, and on a collection of vinyl-only
 * techno it held none, so when there is no tempo the answer carries a preview to measure instead:
 * Deezer's own, or Apple Music's when Deezer does not have the track. Any value is approximate.
 */
export async function lookupTrackBpm(artist: string, title: string): Promise<LookupResult> {
  if (UNKNOWN_ARTISTS.has(normalizeName(artist))) return NOTHING;

  const query = encodeURIComponent(`${artist.replace(/\(\d+\)/g, "")} ${title}`);
  const search = await deezer<DeezerSearch>(`/search?q=${query}&limit=5`);
  if (search.outcome === "failed") return DEEZER_DOWN;

  const candidates =
    search.outcome === "ok"
      ? (search.body.data ?? []).filter((result) => result.artist && sameArtist(result.artist.name, artist))
      : [];
  const exactTitle = normalizeName(title);
  // A dub and an original share a title but rarely a tempo, so the exact version wins.
  const match =
    candidates.find((result) => normalizeName(result.title) === exactTitle) ??
    candidates.find((result) => sameTitle(title, result.title));

  if (match) {
    const track = await deezer<DeezerTrack>(`/track/${match.id}`);
    if (track.outcome === "failed") return DEEZER_DOWN;

    const bpm = track.outcome === "ok" ? track.body.bpm : undefined;
    if (bpm && bpm > 0) return { bpm: Math.round(bpm * 10) / 10, unavailable: false, preview: null };

    const preview = previewUrl(match.preview);
    if (preview) return { ...NOTHING, preview };
  }

  return { ...NOTHING, preview: await itunesPreview(artist, title) };
}
