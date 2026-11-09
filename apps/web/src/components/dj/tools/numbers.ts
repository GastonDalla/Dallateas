const MIN_TEMPO = 20;
const MAX_TEMPO = 400;

/** Reads a typed tempo. Phones set to Spanish offer a comma, so both separators count. */
export function parseTempo(value: string): number | null {
  const normalized = value.trim().replace(",", ".");
  if (!/^\d+(\.\d+)?$/.test(normalized)) return null;

  const tempo = Number(normalized);
  return tempo >= MIN_TEMPO && tempo <= MAX_TEMPO ? tempo : null;
}

export function formatSemitones(semitones: number) {
  const rounded = Math.round(semitones * 10) / 10;
  if (rounded === 0) return "0";
  return `${rounded > 0 ? "+" : "−"}${Math.abs(rounded).toFixed(1)}`;
}

const MIN_MINUTES = 1;
const MAX_MINUTES = 720;

/** Reads a length in minutes, such as a set or the time a record plays, with a point or a comma. */
export function parseMinutes(value: string): number | null {
  const normalized = value.trim().replace(",", ".");
  if (!/^\d+(\.\d+)?$/.test(normalized)) return null;

  const minutes = Number(normalized);
  return minutes >= MIN_MINUTES && minutes <= MAX_MINUTES ? minutes : null;
}

/** Seconds as a clock to a tenth, "0:15.2" or "2:01.9", the way a CDJ shows time. */
export function formatClock(totalSeconds: number) {
  const tenths = Math.round(totalSeconds * 10);
  const minutes = Math.floor(tenths / 600);
  const seconds = (tenths % 600) / 10;
  return `${minutes}:${seconds.toFixed(1).padStart(4, "0")}`;
}
