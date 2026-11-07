const BEATS_PER_BAR = 4;

/** Milliseconds between two beats. */
export function beatMs(bpm: number) {
  return 60_000 / bpm;
}

/** Electronic records move in phrases of 8, 16 and 32 bars, which is where a mix should start or land. */
export const PHRASE_BARS = [1, 8, 16, 32, 64] as const;

/** Seconds a phrase of whole bars lasts at a tempo. */
export function phraseSeconds(bpm: number, bars: number) {
  return (bars * BEATS_PER_BAR * 60) / bpm;
}

/** Note values a mixer's beat effects and a delay pedal are set in, measured in beats. */
export const NOTE_VALUES = [
  { id: "bar", beats: 4 },
  { id: "half", beats: 2 },
  { id: "quarter", beats: 1 },
  { id: "dotted-eighth", beats: 0.75 },
  { id: "quarter-triplet", beats: 2 / 3 },
  { id: "eighth", beats: 0.5 },
  { id: "sixteenth", beats: 0.25 },
] as const;

export type NoteValue = (typeof NOTE_VALUES)[number]["id"];

/** Delay and echo times, in milliseconds, for every note value at a tempo. */
export function delayTimes(bpm: number): { id: NoteValue; ms: number }[] {
  return NOTE_VALUES.map(({ id, beats }) => ({ id, ms: beatMs(bpm) * beats }));
}

/**
 * How far two records drift apart over some beats, in milliseconds. A positive value means the
 * first one runs ahead. Past about 20 ms the kicks stop sounding as one.
 */
export function beatDriftMs(bpm: number, otherBpm: number, beats: number) {
  return (beatMs(otherBpm) - beatMs(bpm)) * beats;
}

export type RampInput = {
  startBpm: number;
  endBpm: number;
  /** Length of the set. */
  minutes: number;
  /** How long each record plays before the next one is in, on average. */
  minutesPerRecord: number;
};

export type RampPlan = {
  records: number;
  /** The tempo each record should play at, first to last, to one decimal. */
  tempos: number[];
  /** Tempo change at every mix. Negative when the set comes down. */
  stepBpm: number;
};

/** Spreads a tempo change evenly over a set, so no single mix has to carry it. */
export function planRamp({ startBpm, endBpm, minutes, minutesPerRecord }: RampInput): RampPlan | null {
  const valid = [startBpm, endBpm, minutes, minutesPerRecord].every((value) => Number.isFinite(value) && value > 0);
  if (!valid) return null;

  const records = Math.max(1, Math.ceil(minutes / minutesPerRecord));
  const stepBpm = records > 1 ? (endBpm - startBpm) / (records - 1) : 0;
  const tempos = Array.from({ length: records }, (_, index) => Math.round((startBpm + stepBpm * index) * 10) / 10);

  return { records, tempos, stepBpm };
}
