import { keyLabel, parseKey } from "@dallateas/dj/camelot";

import { BpmSticker } from "@/components/dj/bpm-sticker";
import { BPM_SOURCE_LABELS, formatBpm, tempoRange } from "@/lib/format";

type BpmSource = keyof typeof BPM_SOURCE_LABELS;

type StickerTrack = {
  bpm: number | null;
  bpmSource: BpmSource | null;
  camelotKey: string | null;
};

/** A record's cover label. Hollow only when nothing on it was measured: one real tempo makes the sticker real. */
export function recordTempo(tracks: readonly StickerTrack[], fallback?: number | null) {
  const tempo = tempoRange(tracks, fallback);
  if (tempo === null) return null;

  const withTempo = tracks.filter(({ bpm }) => bpm !== null);
  return { tempo, approximate: withTempo.length > 0 && withTempo.every(({ bpmSource }) => bpmSource === "LOOKUP") };
}

/** The key a record's cuts share. With several keys there is no one key to print on the cover. */
export function recordKey(tracks: readonly StickerTrack[]) {
  const keys = new Set(tracks.flatMap(({ camelotKey }) => parseKey(camelotKey) ?? []));
  return keys.size === 1 ? [...keys][0]! : null;
}

type RecordStickerProps = {
  tracks: readonly StickerTrack[];
  bpm?: number | null;
  size?: "sm" | "md";
  className?: string;
};

/** The sticker on a cover. An unknown tempo draws nothing, never a zero. */
export function RecordSticker({ tracks, bpm, size, className }: RecordStickerProps) {
  const tempo = recordTempo(tracks, bpm);
  if (!tempo) return null;

  const key = recordKey(tracks);
  return <BpmSticker {...tempo} keyLabel={key} size={size} className={className} />;
}

/** A cut's tempo in a row: its sticker, or the honest answer. */
export function TrackTempo({ bpm, bpmSource }: Pick<StickerTrack, "bpm" | "bpmSource">) {
  if (bpm === null) return <span className="whitespace-nowrap text-[13px] text-muted-foreground">Sin BPM</span>;
  return <BpmSticker tempo={formatBpm(bpm)} approximate={bpmSource === "LOOKUP"} />;
}

/** Where a tempo came from, in words. */
export function bpmSourceLabel({ bpm, bpmSource }: Pick<StickerTrack, "bpm" | "bpmSource">) {
  return bpm !== null && bpmSource ? BPM_SOURCE_LABELS[bpmSource] : null;
}

/** "8A Am", or just the key as typed if it cannot be read. */
export function keyText(value: string | null) {
  const key = parseKey(value);
  return key ? `${key} ${keyLabel(key)}` : null;
}
