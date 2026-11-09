type TempoTrack = { bpm: number | null };

export function formatBpm(bpm: number) {
  return Number.isInteger(bpm) ? String(bpm) : bpm.toFixed(1);
}

/** A record's tempo for a compact label: "124", or "124-128" when its cuts differ. */
export function tempoRange(tracks: readonly TempoTrack[], fallback?: number | null) {
  const tempos = tracks.flatMap(({ bpm }) => (bpm === null ? [] : [bpm]));
  if (tempos.length === 0) return fallback ? formatBpm(fallback) : null;

  const lowest = Math.round(Math.min(...tempos));
  const highest = Math.round(Math.max(...tempos));
  return lowest === highest ? String(lowest) : `${lowest}-${highest}`;
}

export function formatPitch(pitch: number) {
  const rounded = Math.round(pitch * 10) / 10;
  if (rounded === 0) return "0%";
  return `${rounded > 0 ? "+" : "−"}${Math.abs(rounded).toFixed(1)}%`;
}

export function formatRunningTime(totalSeconds: number) {
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.round((totalSeconds % 3600) / 60);
  return hours > 0 ? `${hours} h ${minutes} min` : `${minutes} min`;
}

export const RECORD_CONDITIONS = {
  MINT: { short: "M", label: "Nuevo (M)" },
  NEAR_MINT: { short: "NM", label: "Casi nuevo (NM)" },
  VERY_GOOD_PLUS: { short: "VG+", label: "Muy bueno + (VG+)" },
  VERY_GOOD: { short: "VG", label: "Muy bueno (VG)" },
  GOOD_PLUS: { short: "G+", label: "Bueno + (G+)" },
  GOOD: { short: "G", label: "Bueno (G)" },
  FAIR: { short: "F", label: "Regular (F)" },
  POOR: { short: "P", label: "Malo (P)" },
} as const;

export const BPM_SOURCE_LABELS = {
  MANUAL: "cargado a mano",
  TAP: "medido con tap",
  MIC: "medido con el micrófono",
  LOOKUP: "aproximado, buscado en internet",
} as const;
