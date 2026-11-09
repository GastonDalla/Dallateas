import { detectBpm } from "./detect";

const WINDOW_SECONDS = 15;
const HOP_SECONDS = 5;
/** Two readings within 1.5% are the same tempo heard twice. */
const SAME_TEMPO = 0.015;
const MIN_AGREEING = 2;
/** At least one window in six must hear the agreed tempo, so two lucky windows in a long rip do not decide. */
const MIN_SHARE_OF_WINDOWS = 6;

/**
 * Discogs styles of records mixed on a steady four-to-the-floor or broken 4/4 beat, where a reading
 * far below the floor's tempo is a misread and not the record. Matched by whole name: "Acid Jazz"
 * and punk "Hardcore" share a word with dance styles and are not dance records.
 */
const DANCE_STYLES = new Set(["acid", "electro", "minimal", "makina", "hardstyle", "schranz", "gabber", "happy hardcore"]);
/** Discogs files both punk and the electronic dance style as "Hardcore"; the record's genre tells them apart. */
const ELECTRONIC_ONLY_STYLES = new Set(["hardcore"]);
/** Any named kind of house, techno or trance, such as "Hard Techno", "Electro House" or "Progressive Trance". */
const DANCE_FAMILY = /\b(?:house|techno|trance)\b/i;
/** Below this a dance record was heard at half its speed. */
const HALF_SPEED_BELOW = 90;
/**
 * Between the half-speed line and this, readings were three quarters of the real tempo (105 for 140,
 * 109 for 145), never the record itself. No house or techno record with a published tempo in the
 * measurements sat below 117.
 */
const DANCE_FLOOR = 110;
const MAX_BPM = 190;

export type ClipTempo = {
  bpm: number;
  windows: number;
  agreeing: number;
};

function windowReadings(samples: Float32Array, sampleRate: number) {
  const windowLength = Math.round(sampleRate * WINDOW_SECONDS);
  const hop = Math.round(sampleRate * HOP_SECONDS);

  const readings: number[] = [];
  let windows = 0;
  for (let start = 0; start + windowLength <= samples.length; start += hop) {
    windows += 1;
    const reading = detectBpm(samples.subarray(start, start + windowLength), sampleRate);
    if (reading) readings.push(reading.bpm);
  }
  return { readings, windows };
}

/**
 * The tempo most windows agree on. Enough windows must have heard it, and most of those that heard
 * a beat at all must agree: a tie or a lone reading is no answer. Windows that heard nothing, like a
 * breakdown or the start of a rip, neither help nor hurt.
 */
export function agreedTempo(readings: readonly number[], windows: number): number | null {
  let agreeing: number[] = [];
  for (const reading of readings) {
    const near = readings.filter((other) => Math.abs(other - reading) <= reading * SAME_TEMPO);
    if (near.length > agreeing.length) agreeing = near;
  }

  const enough = agreeing.length >= MIN_AGREEING && agreeing.length * MIN_SHARE_OF_WINDOWS >= windows;
  if (!enough || agreeing.length * 2 <= readings.length) return null;

  const sorted = agreeing.toSorted((a, b) => a - b);
  return Math.round(sorted[Math.floor(sorted.length / 2)]! * 10) / 10;
}

/**
 * Measures a clip several times, in overlapping windows, and keeps the tempo they agree on.
 * A preview or a rip can open on a breakdown, which one reading over the whole clip may follow.
 * Measured on 38 Deezer previews of house and techno with a published tempo: one reading over the
 * clip was right to 1% on 34 and wrong on 4; the vote was right on 33, wrong on 1 and silent on 4.
 */
export function voteTempo(samples: Float32Array, sampleRate: number): ClipTempo | null {
  const { readings, windows } = windowReadings(samples, sampleRate);
  const bpm = agreedTempo(readings, windows);
  if (bpm === null) return null;

  return { bpm, windows, agreeing: readings.filter((reading) => Math.abs(reading - bpm) <= bpm * SAME_TEMPO).length };
}

/** Takes the record's Discogs styles and genres together. */
function isDanceRecord(styles: readonly string[]) {
  const names = styles.map((style) => style.trim().toLowerCase());
  const electronic = names.includes("electronic");
  return names.some(
    (name) => DANCE_STYLES.has(name) || DANCE_FAMILY.test(name) || (electronic && ELECTRONIC_ONLY_STYLES.has(name)),
  );
}

/**
 * Corrects a reading with what the record is. On fast techno the detector can lock onto every other
 * kick and read 70 for 140; on the DJ's own collection those readings came from records whose other
 * tracks measured 140 to 145. A reading a dance record never sits at is dropped instead of guessed.
 */
export function danceTempo(bpm: number, styles: readonly string[]): number | null {
  if (!isDanceRecord(styles)) return bpm;
  if (bpm < HALF_SPEED_BELOW) return bpm * 2 <= MAX_BPM ? bpm * 2 : null;
  if (bpm < DANCE_FLOOR) return null;
  return bpm;
}

/**
 * Corrects every window's reading with what the record is, then votes. On a dance record a window
 * that read half or three quarters of the tempo drops out, and the windows that heard the beat decide.
 * On the 38 Deezer previews, read as house and techno: 33 right to 1%, 5 with no answer, none wrong.
 */
export function tempoFromReadings(readings: readonly number[], windows: number, styles: readonly string[]) {
  const corrected = readings.map((reading) => danceTempo(reading, styles)).filter((bpm) => bpm !== null);
  return agreedTempo(corrected, windows);
}

/** The tempo of a clip of a record, or null when the clip does not say it clearly. */
export function clipTempo(samples: Float32Array, sampleRate: number, styles: readonly string[]): number | null {
  const { readings, windows } = windowReadings(samples, sampleRate);
  return tempoFromReadings(readings, windows, styles);
}
