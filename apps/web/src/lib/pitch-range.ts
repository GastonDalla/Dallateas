import { DEFAULT_PITCH_RANGE, PITCH_RANGES } from "@dallateas/dj/tempo";

import { createStoredChoice } from "@/hooks/use-stored-choice";

export function parsePitchRange(raw: string | null): number | null {
  const range = Number(raw);
  return PITCH_RANGES.some((option) => option === range) ? range : null;
}

const pitchRange = createStoredChoice<number>("dallateas:pitch-range", DEFAULT_PITCH_RANGE, parsePitchRange);

/** The pitch range of this DJ's decks. A fader does not change between sessions, so it is remembered per browser. */
export const usePitchRange = pitchRange.useChoice;
