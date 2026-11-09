const DEEZER_API = "https://api.deezer.com";
const ITUNES_SEARCH = "https://itunes.apple.com/search";
const RECCOBEATS_API = "https://api.reccobeats.com/v1";
const RECCOBEATS_PAGE_SIZE = 50;
/** A prolific artist has hundreds of tracks; past this many pages the search gives up. */
const RECCOBEATS_MAX_PAGES = 6;
const REQUEST_TIMEOUT_MS = 6000;
const NO_DATA = 800;
const UNKNOWN_ARTISTS = new Set(["various", "various artists", "unknown artist"]);
const CREDIT_SEPARATOR = /\s*[&,/+]\s*|\s+(?:feat\.?|ft\.?|vs\.?|x|and)\s+/i;

type DeezerError = { error?: { code?: number } };
type DeezerSearch = DeezerError & { data?: { id: number; title: string; preview?: string; artist?: { name: string } }[] };
type ItunesSearch = { results?: { artistName?: string; trackName?: string; previewUrl?: string }[] };
type DeezerTrack = DeezerError & { bpm?: number };
type ReccoTrack = { id: string; trackTitle: string; artists?: { name: string }[] };
type ReccoPage<T> = { content?: T[]; totalPages?: number };
type ReccoFeatures = { tempo?: number };

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

async function recco<T>(path: string): Promise<T | null> {
  try {
    const response = await fetch(`${RECCOBEATS_API}${path}`, {
      headers: { accept: "application/json" },
      signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
    });
    return response.ok ? ((await response.json()) as T) : null;
  } catch {
    return null;
  }
}

function pickTrack(tracks: ReccoTrack[], artist: string, title: string) {
  const candidates = tracks.filter((track) => track.artists?.some((credit) => sameArtist(credit.name, artist)));
  const exactTitle = normalizeName(title);
  return (
    candidates.find((track) => normalizeName(track.trackTitle) === exactTitle) ??
    candidates.find((track) => sameTitle(title, track.trackTitle))
  );
}

/** Every track ReccoBeats lists for artists with exactly this name, up to a few pages each. */
async function artistCatalog(name: string): Promise<ReccoTrack[]> {
  const artists = await recco<ReccoPage<{ id: string; name: string }>>(`/artist/search?searchText=${encodeURIComponent(name)}`);
  const catalog: ReccoTrack[] = [];
  for (const candidate of (artists?.content ?? []).filter((entry) => normalizeName(entry.name) === name)) {
    const page = (number: number) =>
      recco<ReccoPage<ReccoTrack>>(`/artist/${encodeURIComponent(candidate.id)}/track?page=${number}&size=${RECCOBEATS_PAGE_SIZE}`);
    const first = await page(0);
    // The first page says how many there are; the rest are fetched together.
    const pages = Math.min(first?.totalPages ?? 0, RECCOBEATS_MAX_PAGES);
    const rest = await Promise.all(Array.from({ length: Math.max(pages - 1, 0) }, (_, index) => page(index + 1)));
    for (const tracks of [first, ...rest]) catalog.push(...(tracks?.content ?? []));
  }
  return catalog;
}

/**
 * Artist catalogs fetched during one record's lookup. Every track of a record shares the artist,
 * so the catalog is fetched once instead of once per track.
 */
export type ArtistCatalogs = Map<string, Promise<ReccoTrack[]>>;

/** Its search reads titles only, so a common title is looked for among the artist's own tracks. */
async function reccoTrack(artist: string, title: string, catalogs: ArtistCatalogs) {
  const byTitle = await recco<ReccoPage<ReccoTrack>>(
    `/track/search?searchText=${encodeURIComponent(title)}&size=${RECCOBEATS_PAGE_SIZE}`,
  );
  const found = pickTrack(byTitle?.content ?? [], artist, title);
  if (found) return found;

  const name = credits(artist)[0];
  if (!name) return undefined;
  let catalog = catalogs.get(name);
  if (!catalog) {
    catalog = artistCatalog(name);
    catalogs.set(name, catalog);
  }
  return pickTrack(await catalog, artist, title);
}

/**
 * ReccoBeats publishes the tempo Spotify used to, free and without a key. On the DJ's own techno
 * collection it knew few records, but on every one it knew, its tempo matched the measured one and
 * Beatport's to 0.3 BPM. It answers nothing on failure: Deezer's preview remains to measure.
 */
async function reccoTempo(artist: string, title: string, catalogs: ArtistCatalogs): Promise<number | null> {
  const track = await reccoTrack(artist, title, catalogs);
  if (!track) return null;
  const features = await recco<ReccoFeatures>(`/track/${encodeURIComponent(track.id)}/audio-features`);
  const tempo = features?.tempo;
  return tempo && tempo > 0 ? Math.round(tempo * 10) / 10 : null;
}

/**
 * Looks a track up on Deezer, the one free source of BPM without an API key. On a sample of DJ
 * tracks it matched all of them but held a tempo for only half, and on a collection of vinyl-only
 * techno it held none, so ReccoBeats is asked next, and when neither has a tempo the answer carries
 * a preview to measure instead: Deezer's own, or Apple Music's when Deezer does not have the track.
 * Any value is approximate.
 */
export async function lookupTrackBpm(
  artist: string,
  title: string,
  catalogs: ArtistCatalogs = new Map(),
): Promise<LookupResult> {
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

  let deezerPreview: string | null = null;
  if (match) {
    const track = await deezer<DeezerTrack>(`/track/${match.id}`);
    if (track.outcome === "failed") return DEEZER_DOWN;

    const bpm = track.outcome === "ok" ? track.body.bpm : undefined;
    if (bpm && bpm > 0) return { bpm: Math.round(bpm * 10) / 10, unavailable: false, preview: null };
    deezerPreview = previewUrl(match.preview);
  }

  const published = await reccoTempo(artist, title, catalogs);
  if (published) return { bpm: published, unavailable: false, preview: null };

  return { ...NOTHING, preview: deezerPreview ?? (await itunesPreview(artist, title)) };
}
