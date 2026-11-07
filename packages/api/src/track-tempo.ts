import { TRPCError } from "@trpc/server";

type BpmSource = "MANUAL" | "TAP" | "MIC" | "LOOKUP";

type TempoInput = { bpm?: number | null; bpmSource?: BpmSource | null };
type StoredTempo = { bpm: number | null; bpmSource: BpmSource | null };

/**
 * What a track's tempo columns become. A source only means something next to a tempo: omitted
 * values keep what is stored, null clears, and a tempo that changed without a source was typed.
 */
export function tempoChange({ bpm, bpmSource }: TempoInput, stored: StoredTempo) {
  if (bpm === undefined) {
    if (bpmSource === undefined) return {};
    if (stored.bpm === null && bpmSource !== null) {
      throw new TRPCError({ code: "BAD_REQUEST", message: "Ese track todavía no tiene BPM" });
    }
    return { bpmSource };
  }

  if (bpm === null) return { bpm: null, bpmSource: null };
  if (bpmSource) return { bpm, bpmSource };
  return { bpm, bpmSource: bpm === stored.bpm ? (stored.bpmSource ?? "MANUAL") : ("MANUAL" as const) };
}
