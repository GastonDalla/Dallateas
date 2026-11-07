const MIN_TAPS = 4;
const MAX_TAPS = 16;
const RESET_AFTER_MS = 2000;
const OUTLIER_TOLERANCE = 0.2;

/** The pitch ranges found on DJ turntables: Technics SL-1200 at ±8, PLX and MK7 models up to ±16 and ±50. */
export const PITCH_RANGES = [6, 8, 10, 16, 50] as const;
export const DEFAULT_PITCH_RANGE = 8;

export const RPM_SPEEDS = [33, 45, 78] as const;
export type Rpm = (typeof RPM_SPEEDS)[number];

const ACTUAL_SPEED: Record<Rpm, number> = { 33: 100 / 3, 45: 45, 78: 78 };

function roundBpm(bpm: number) {
  return Math.round(bpm * 10) / 10;
}

function median(values: readonly number[]) {
  const sorted = values.toSorted((a, b) => a - b);
  const middle = Math.floor(sorted.length / 2);
  return sorted.length % 2 ? sorted[middle]! : (sorted[middle - 1]! + sorted[middle]!) / 2;
}

/** Adds a tap. A long pause means the DJ started over, so earlier taps stop counting. */
export function appendTap(taps: readonly number[], now: number): number[] {
  const last = taps.at(-1);
  if (last !== undefined && now - last > RESET_AFTER_MS) return [now];
  return [...taps, now].slice(-MAX_TAPS);
}

/** Tempo from tap timestamps in milliseconds. A mistimed tap is dropped instead of skewing the average. */
export function bpmFromTaps(taps: readonly number[]): number | null {
  if (taps.length < MIN_TAPS) return null;

  const intervals = taps.slice(1).map((tap, index) => tap - taps[index]!);
  const typical = median(intervals);
  const steady = intervals.filter((interval) => Math.abs(interval - typical) <= typical * OUTLIER_TOLERANCE);
  const average = steady.reduce((sum, interval) => sum + interval, 0) / steady.length;

  return average > 0 ? roundBpm(60_000 / average) : null;
}

/** Fader position, in percent, that takes a record from its own tempo to the target. */
export function pitchToMatch(trackBpm: number, targetBpm: number) {
  return (targetBpm / trackBpm - 1) * 100;
}

export function bpmAtPitch(bpm: number, pitchPercent: number) {
  return bpm * (1 + pitchPercent / 100);
}

/** Tempo of a record played at another speed, like a 45 played at 33. */
export function convertRpm(bpm: number, from: Rpm, to: Rpm) {
  return bpm * (ACTUAL_SPEED[to] / ACTUAL_SPEED[from]);
}

/** Half-time and double-time records beat-match, so 87 BPM counts as 174 next to a 174 BPM track. */
export function closestTempoOctave(trackBpm: number, targetBpm: number) {
  const distance = (factor: number) => Math.abs(trackBpm * factor - targetBpm);
  const factor = [1, 2, 0.5].reduce((best, next) => (distance(next) < distance(best) ? next : best));
  return { bpm: trackBpm * factor, factor };
}

/** Reads Discogs durations such as "6:32" or "1:02:03" into seconds. */
export function parseDuration(value: string | null | undefined): number | null {
  if (!value || !/^\d+(:\d{1,2}){1,2}$/.test(value.trim())) return null;
  return value
    .trim()
    .split(":")
    .reduce((total, part) => total * 60 + Number(part), 0);
}
