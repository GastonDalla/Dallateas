import { keyAtPitch, keyRelation, parseKey, type CamelotKey, type KeyRelation } from "./camelot";
import { closestTempoOctave, parseDuration, pitchToMatch } from "./tempo";

export type MixableTrack = {
  id: string;
  bpm: number | null;
  key: string | null;
  duration?: string | null;
};

type MixOptions = { pitchRange: number };

export type Transition = {
  /** Fader position for the incoming record, in percent. */
  pitch: number;
  /** 2 or 0.5 when the records only meet at double or half time. */
  tempoFactor: number;
  reachable: boolean;
  /** The key the listener hears once the incoming record is pitched. */
  effectiveKey: CamelotKey | null;
  relation: KeyRelation | null;
};

const RELATION_ORDER: Record<KeyRelation | "unknown", number> = {
  same: 0,
  adjacent: 1,
  relative: 1,
  boost: 2,
  unknown: 3,
  clash: 4,
};

function describeTransition(
  outgoing: { bpm: number; key: string | null },
  incoming: { bpm: number; key: string | null },
  { pitchRange }: MixOptions,
): Transition {
  const { bpm, factor } = closestTempoOctave(incoming.bpm, outgoing.bpm);
  const pitch = pitchToMatch(bpm, outgoing.bpm);

  const outgoingKey = parseKey(outgoing.key);
  const incomingKey = parseKey(incoming.key);
  const effectiveKey = incomingKey ? keyAtPitch(incomingKey, pitch) : null;

  return {
    pitch,
    tempoFactor: factor,
    reachable: Math.abs(pitch) <= pitchRange,
    effectiveKey,
    relation: outgoingKey && effectiveKey ? keyRelation(outgoingKey, effectiveKey) : null,
  };
}

/** Records that can follow a track on this fader, best match first. */
export function rankMixes<T extends MixableTrack>(source: MixableTrack, candidates: readonly T[], options: MixOptions) {
  const { bpm, key } = source;
  if (bpm === null) return [];

  return candidates
    .flatMap((track) => {
      if (track.id === source.id || track.bpm === null) return [];
      const transition = describeTransition({ bpm, key }, { bpm: track.bpm, key: track.key }, options);
      return transition.reachable ? [{ track, ...transition }] : [];
    })
    .toSorted(
      (a, b) =>
        RELATION_ORDER[a.relation ?? "unknown"] - RELATION_ORDER[b.relation ?? "unknown"] ||
        Math.abs(a.pitch) - Math.abs(b.pitch),
    );
}

/** Reads a set in order: running time, tempo range and whether each change can be mixed. */
export function analyzeSet(tracks: readonly MixableTrack[], options: MixOptions) {
  const durations = tracks.map((track) => parseDuration(track.duration));
  const tempos = tracks.flatMap((track) => (track.bpm === null ? [] : [track.bpm]));

  const transitions = tracks.slice(1).map((incoming, index) => {
    const outgoing = tracks[index]!;
    const unknown = { pitch: null, tempoFactor: null, reachable: null, effectiveKey: null, relation: null };

    return {
      fromId: outgoing.id,
      toId: incoming.id,
      ...(outgoing.bpm === null || incoming.bpm === null
        ? unknown
        : describeTransition(
            { bpm: outgoing.bpm, key: outgoing.key },
            { bpm: incoming.bpm, key: incoming.key },
            options,
          )),
    };
  });

  return {
    transitions,
    totalSeconds: durations.reduce<number>((total, seconds) => total + (seconds ?? 0), 0),
    tracksWithoutDuration: durations.filter((seconds) => seconds === null).length,
    minBpm: tempos.length ? Math.min(...tempos) : null,
    maxBpm: tempos.length ? Math.max(...tempos) : null,
  };
}
