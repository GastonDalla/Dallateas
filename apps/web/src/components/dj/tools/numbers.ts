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
