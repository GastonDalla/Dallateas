export type CamelotKey = `${number}${"A" | "B"}`;

export type KeyRelation = "same" | "adjacent" | "relative" | "boost" | "clash";

const MINOR_NAMES = ["Abm", "Ebm", "Bbm", "Fm", "Cm", "Gm", "Dm", "Am", "Em", "Bm", "F#m", "Dbm"];
const MAJOR_NAMES = ["B", "F#", "Db", "Ab", "Eb", "Bb", "F", "C", "G", "D", "A", "E"];

const NOTE_PITCH: Record<string, number> = { C: 0, D: 2, E: 4, F: 5, G: 7, A: 9, B: 11 };
const FIFTHS_PER_SEMITONE = 7;
const WHEEL_SIZE = 12;

const CAMELOT_PATTERN = /^(1[0-2]|[1-9])([AB])$/;
const MUSICAL_PATTERN = /^([A-G])([#b♯♭]?)\s*(m|min|minor|maj|major)?$/;

/** Every key, for pickers. */
export const CAMELOT_KEYS = Array.from({ length: WHEEL_SIZE }, (_, index) => index + 1).flatMap(
  (number) => [`${number}A`, `${number}B`] as CamelotKey[],
);

function wrap(position: number) {
  return ((position % WHEEL_SIZE) + WHEEL_SIZE) % WHEEL_SIZE;
}

function split(key: CamelotKey) {
  return { number: Number.parseInt(key, 10), mode: key.at(-1) as "A" | "B" };
}

/** Accepts Camelot ("8A") or musical notation ("Am", "F#m", "C major"). */
export function parseKey(input: string | null | undefined): CamelotKey | null {
  const value = input?.trim();
  if (!value) return null;

  const camelot = value.toUpperCase();
  if (CAMELOT_PATTERN.test(camelot)) return camelot as CamelotKey;

  const match = (value[0]!.toUpperCase() + value.slice(1)).match(MUSICAL_PATTERN);
  if (!match) return null;

  const [, note, accidental, mode] = match;
  const sharpen = accidental === "#" || accidental === "♯" ? 1 : accidental === "b" || accidental === "♭" ? -1 : 0;
  const minor = mode === "m" || mode === "min" || mode === "minor";

  // A minor key shares its wheel number with the major key three semitones above it.
  const majorPitch = NOTE_PITCH[note!]! + sharpen + (minor ? 3 : 0);
  const number = wrap(majorPitch * FIFTHS_PER_SEMITONE + 7) + 1;

  return `${number}${minor ? "A" : "B"}`;
}

export function keyLabel(key: CamelotKey) {
  const { number, mode } = split(key);
  return (mode === "A" ? MINOR_NAMES : MAJOR_NAMES)[number - 1]!;
}

export function keyRelation(from: CamelotKey, to: CamelotKey): KeyRelation {
  const a = split(from);
  const b = split(to);

  if (a.mode !== b.mode) return a.number === b.number ? "relative" : "clash";

  const steps = wrap(b.number - a.number);
  if (steps === 0) return "same";
  if (steps === 1 || steps === WHEEL_SIZE - 1) return "adjacent";
  return steps === 2 ? "boost" : "clash";
}

export function semitonesAtPitch(pitchPercent: number) {
  return 12 * Math.log2(1 + pitchPercent / 100);
}

/**
 * A turntable has no key lock: speeding a record up also raises its key.
 * Under half a semitone the ear still reads the original key, so it stays.
 */
export function keyAtPitch(key: CamelotKey, pitchPercent: number): CamelotKey {
  const { number, mode } = split(key);
  const semitones = Math.round(semitonesAtPitch(pitchPercent));
  return `${wrap(number - 1 + semitones * FIFTHS_PER_SEMITONE) + 1}${mode}`;
}
