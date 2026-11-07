import { parseKey } from "@dallateas/dj/camelot";

export type BpmSource = "MANUAL" | "TAP" | "MIC" | "LOOKUP";

/** What a DJ writes about one cut, as typed, so a field can be half written. */
export type TrackFields = {
  bpm: string;
  bpmSource: BpmSource | null;
  camelotKey: string;
  energy: number | null;
  cueNotes: string;
};

type StoredTrackFields = {
  bpm: number | null;
  bpmSource: BpmSource | null;
  camelotKey: string | null;
  energy: number | null;
  cueNotes: string | null;
};

const MIN_BPM = 20;
const MAX_BPM = 400;

export const ENERGY_LEVELS = [1, 2, 3, 4, 5] as const;

/** Reads a typed tempo. In Argentina the decimal is usually a comma. */
export function parseBpm(text: string) {
  const trimmed = text.trim();
  if (!trimmed) return null;
  const bpm = Number(trimmed.replace(",", "."));
  return Number.isFinite(bpm) && bpm >= MIN_BPM && bpm <= MAX_BPM ? bpm : null;
}

export function trackFieldsFrom(track: StoredTrackFields): TrackFields {
  return {
    bpm: track.bpm === null ? "" : String(track.bpm),
    bpmSource: track.bpmSource,
    camelotKey: track.camelotKey ?? "",
    energy: track.energy,
    cueNotes: track.cueNotes ?? "",
  };
}

export function trackFieldsError(fields: TrackFields) {
  if (fields.bpm.trim() && parseBpm(fields.bpm) === null) {
    return `El BPM tiene que estar entre ${MIN_BPM} y ${MAX_BPM}`;
  }
  if (fields.camelotKey.trim() && !parseKey(fields.camelotKey)) return "Tonalidad inválida. Probá con 8A o Am";
  return null;
}

/** A tempo typed by hand is the DJ's word, whatever the field held before. */
export function withTypedBpm<T extends TrackFields>(fields: T, text: string): T {
  return { ...fields, bpm: text, bpmSource: text.trim() ? "MANUAL" : null };
}

export function withMeasuredBpm<T extends TrackFields>(fields: T, bpm: number, source: "TAP" | "MIC"): T {
  return { ...fields, bpm: String(Math.round(bpm * 10) / 10), bpmSource: source };
}

export function toTrackData(fields: TrackFields): StoredTrackFields {
  const bpm = parseBpm(fields.bpm);
  return {
    bpm,
    bpmSource: bpm === null ? null : fields.bpmSource,
    camelotKey: parseKey(fields.camelotKey),
    energy: fields.energy,
    cueNotes: fields.cueNotes.trim() || null,
  };
}

/** The tempo goes out only if it changed, so editing a note never turns a lookup into something else. */
export function trackUpdateInput(track: StoredTrackFields & { id: string }, fields: TrackFields) {
  const { bpm, bpmSource, ...rest } = toTrackData(fields);
  const sameTempo = bpm === track.bpm && bpmSource === track.bpmSource;
  return { id: track.id, ...rest, ...(sameTempo ? {} : { bpm, bpmSource }) };
}
