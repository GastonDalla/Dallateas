import { beatDriftMs } from "@dallateas/dj/timing";
import { pitchToMatch } from "@dallateas/dj/tempo";

const HOUSE_LOW = 120;
const HOUSE_HIGH = 130;
/** Far enough that the fader has to move, close enough for a ±8 fader with room to spare. */
const MIN_PITCH = 1.5;
const MAX_PITCH = 6;
const MIN_LATE_BEATS = 0.15;
const MAX_LATE_BEATS = 0.45;

export type BeatRound = {
  /** The tempo playing in the room, hidden until the DJ asks. */
  houseBpm: number;
  /** The tempo printed on the DJ's record, at 0 on the fader. */
  recordBpm: number;
  /** How far behind the record starts, in beats. */
  lateBeats: number;
};

/** The first round is fixed, so the page renders the same on the server and in the browser. */
export const FIRST_ROUND: BeatRound = { houseBpm: 126.4, recordBpm: 123, lateBeats: 0.3 };

/** A new round from a random source in [0, 1), the way Math.random gives it. */
export function newRound(random: () => number): BeatRound {
  const houseBpm = Math.round((HOUSE_LOW + random() * (HOUSE_HIGH - HOUSE_LOW)) * 10) / 10;
  const direction = random() < 0.5 ? -1 : 1;
  const pitch = MIN_PITCH + random() * (MAX_PITCH - MIN_PITCH);
  const recordBpm = Math.round(houseBpm / (1 + (direction * pitch) / 100));
  const lateBeats = MIN_LATE_BEATS + random() * (MAX_LATE_BEATS - MIN_LATE_BEATS);
  return { houseBpm, recordBpm, lateBeats };
}

export type BeatVerdict = "locked" | "close" | "off";

/** How the DJ did: the tempo gap, how fast the kicks part, and a verdict a DJ would give. */
export function judgeMatch(houseBpm: number, deckBpm: number) {
  const gap = deckBpm - houseBpm;
  const driftPerBar = beatDriftMs(deckBpm, houseBpm, 4);
  const verdict: BeatVerdict = Math.abs(gap) <= 0.05 ? "locked" : Math.abs(gap) <= 0.25 ? "close" : "off";
  return { gap, driftPerBar, verdict, pitchNeeded: pitchToMatch(deckBpm, houseBpm) };
}
