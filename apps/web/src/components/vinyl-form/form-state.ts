import type { AppRouter } from "@dallateas/api/routers/index";
import { RPM_SPEEDS, type Rpm } from "@dallateas/dj/tempo";
import type { inferRouterInputs, inferRouterOutputs } from "@trpc/server";

import type { DiscogsSearchRelease, DiscogsTrack } from "@/lib/discogs";
import type { RECORD_CONDITIONS } from "@/lib/format";

import { toTrackData, trackFieldsError, trackFieldsFrom, type TrackFields } from "./track-fields";

type Inputs = inferRouterInputs<AppRouter>;
type Outputs = inferRouterOutputs<AppRouter>;

export type RecordCondition = keyof typeof RECORD_CONDITIONS;

type StoredTrack = Pick<
  Outputs["vinylGet"]["tracks"][number],
  "id" | "side" | "position" | "title" | "duration" | "bpm" | "bpmSource" | "camelotKey" | "energy" | "cueNotes"
>;

/** The parts of a record the form reads, so tests do not have to build a whole database row. */
export type VinylToEdit = Pick<
  Outputs["vinylGet"],
  | "id"
  | "title"
  | "artist"
  | "label"
  | "genre"
  | "style"
  | "bpm"
  | "year"
  | "notes"
  | "mixNotes"
  | "pricePaid"
  | "discogsId"
  | "barcode"
  | "coverUrl"
  | "rpm"
  | "mediaCondition"
  | "sleeveCondition"
  | "location"
> & {
  folders: { folder: { id: string } }[];
  tags: { tag: { name: string } }[];
  tracks: StoredTrack[];
};

export type TrackDraft = TrackFields & {
  /** Stable across edits, so React keeps each row's inputs when another row goes away. */
  key: string;
  id?: string;
  side: string;
  title: string;
  duration: string;
};

export type VinylFormValues = {
  title: string;
  artist: string;
  label: string;
  genre: string;
  style: string;
  bpm: string;
  year: string;
  notes: string;
  mixNotes: string;
  pricePaid: string;
  discogsId: string;
  barcode: string;
  coverUrl: string;
  rpm: Rpm | null;
  mediaCondition: RecordCondition | null;
  sleeveCondition: RecordCondition | null;
  location: string;
  folderIds: string[];
  tagNames: string[];
  tracks: TrackDraft[];
};

export function emptyFormValues(): VinylFormValues {
  return {
    title: "",
    artist: "",
    label: "",
    genre: "",
    style: "",
    bpm: "",
    year: "",
    notes: "",
    mixNotes: "",
    pricePaid: "",
    discogsId: "",
    barcode: "",
    coverUrl: "",
    rpm: null,
    mediaCondition: null,
    sleeveCondition: null,
    location: "",
    folderIds: [],
    tagNames: [],
    tracks: [],
  };
}

export function formValuesFromVinyl(vinyl: VinylToEdit): VinylFormValues {
  return {
    title: vinyl.title,
    artist: vinyl.artist,
    label: vinyl.label ?? "",
    genre: vinyl.genre ?? "",
    style: vinyl.style ?? "",
    bpm: vinyl.bpm ? String(vinyl.bpm) : "",
    year: vinyl.year ? String(vinyl.year) : "",
    notes: vinyl.notes ?? "",
    mixNotes: vinyl.mixNotes ?? "",
    pricePaid: vinyl.pricePaid === null ? "" : String(vinyl.pricePaid),
    discogsId: vinyl.discogsId ?? "",
    barcode: vinyl.barcode ?? "",
    coverUrl: vinyl.coverUrl ?? "",
    rpm: RPM_SPEEDS.find((speed) => speed === vinyl.rpm) ?? null,
    mediaCondition: vinyl.mediaCondition,
    sleeveCondition: vinyl.sleeveCondition,
    location: vinyl.location ?? "",
    folderIds: vinyl.folders.map(({ folder }) => folder.id),
    tagNames: vinyl.tags.map(({ tag }) => tag.name),
    tracks: vinyl.tracks.map((track) => ({
      ...trackFieldsFrom(track),
      key: track.id,
      id: track.id,
      side: track.side,
      title: track.title,
      duration: track.duration ?? "",
    })),
  };
}

let draftCount = 0;

export function newTrackDraft(): TrackDraft {
  draftCount += 1;
  return {
    key: `draft-${draftCount}`,
    side: "",
    title: "",
    duration: "",
    bpm: "",
    bpmSource: null,
    camelotKey: "",
    energy: null,
    cueNotes: "",
  };
}

export function formError(values: VinylFormValues) {
  if (!values.title.trim() || !values.artist.trim()) return "Título y artista son obligatorios";

  for (const [index, track] of values.tracks.entries()) {
    if (!track.title.trim()) return `Al corte ${index + 1} le falta el título`;
    const error = trackFieldsError(track);
    if (error) return `Corte ${index + 1}: ${error}`;
  }
  return null;
}

function toTrackInput(track: TrackDraft, index: number) {
  return {
    id: track.id,
    side: track.side.trim() || String(index + 1),
    position: index,
    title: track.title.trim(),
    duration: track.duration.trim() || null,
    ...toTrackData(track),
  };
}

function optionalNumber(text: string) {
  return text.trim() ? Number(text) : undefined;
}

function recordInput(values: VinylFormValues, text: (value: string) => string | undefined) {
  return {
    title: values.title.trim(),
    artist: values.artist.trim(),
    label: text(values.label),
    genre: text(values.genre),
    style: text(values.style),
    bpm: values.bpm.trim() ? Math.round(Number(values.bpm)) : undefined,
    year: optionalNumber(values.year),
    notes: text(values.notes),
    mixNotes: text(values.mixNotes),
    pricePaid: optionalNumber(values.pricePaid),
    discogsId: text(values.discogsId),
    barcode: text(values.barcode),
    coverUrl: values.coverUrl.trim() || undefined,
    rpm: values.rpm,
    mediaCondition: values.mediaCondition,
    sleeveCondition: values.sleeveCondition,
    location: text(values.location),
    folderIds: values.folderIds,
  };
}

export function toCreateInput(values: VinylFormValues): Inputs["vinylCreate"] {
  return {
    ...recordInput(values, (value) => value.trim() || undefined),
    tagNames: values.tagNames.length > 0 ? values.tagNames : undefined,
    tracks: values.tracks.length > 0 ? values.tracks.map(toTrackInput) : undefined,
  };
}

/** Sends every list and every text, even empty: an omitted value is one the API leaves as it was. */
export function toUpdateInput(values: VinylFormValues, id: string): Inputs["vinylUpdate"] {
  return {
    ...recordInput(values, (value) => value.trim()),
    id,
    tagNames: values.tagNames,
    tracks: values.tracks.map(toTrackInput),
  };
}

export function valuesFromRelease(release: DiscogsSearchRelease): Partial<VinylFormValues> {
  const [artist, ...title] = release.title.split(" - ");

  return {
    ...(title.length > 0 ? { artist: artist?.trim(), title: title.join(" - ").trim() } : { title: release.title }),
    ...(release.year ? { year: String(release.year) } : {}),
    ...(release.cover_image ? { coverUrl: release.cover_image } : {}),
    ...(release.label?.[0] ? { label: release.label[0] } : {}),
    ...(release.genre?.[0] ? { genre: release.genre[0] } : {}),
    ...(release.style?.length ? { style: release.style.join(", ") } : {}),
    discogsId: String(release.id),
  };
}

function sameTitle(a: string, b: string) {
  return a.trim().toLowerCase() === b.trim().toLowerCase();
}

function holdsDjData(track: TrackDraft) {
  return Boolean(track.bpm.trim() || track.camelotKey.trim() || track.energy !== null || track.cueNotes.trim());
}

/**
 * Takes a tracklist from Discogs without losing what the DJ measured. Tracks match by title only:
 * a shared side like "A1" can be another song on another pressing, and that tempo would be false.
 * A track Discogs does not list stays when it holds the DJ's data, so nothing measured is thrown away.
 */
export function mergeDiscogsTracks(current: readonly TrackDraft[], tracklist: readonly DiscogsTrack[]): TrackDraft[] {
  const unclaimed = [...current];

  const merged = tracklist.map((entry, index) => {
    const match = unclaimed.findIndex((track) => sameTitle(track.title, entry.title));
    const [existing] = match >= 0 ? unclaimed.splice(match, 1) : [];

    return {
      ...(existing ?? newTrackDraft()),
      side: entry.position || String(index + 1),
      title: entry.title,
      duration: entry.duration || existing?.duration || "",
    };
  });

  return [...merged, ...unclaimed.filter(holdsDjData)];
}
