import { clipTempo } from "@dallateas/dj/clip-tempo";

/** The rate the vote was measured at, and half the work of decoding at 44.1 kHz. */
const ANALYSIS_RATE = 22_050;
/** A 30-second preview is under a megabyte. One that takes longer is stuck, and the queue waits on it. */
const DOWNLOAD_TIMEOUT_MS = 15_000;

/**
 * Downloads a track's 30-second preview and measures its tempo in the browser,
 * or returns null when the clip does not give a clear one.
 */
export async function measurePreview(url: string, styles: readonly string[], signal?: AbortSignal) {
  const timeout = AbortSignal.timeout(DOWNLOAD_TIMEOUT_MS);
  const response = await fetch(url, {
    signal: signal ? AbortSignal.any([signal, timeout]) : timeout,
    credentials: "omit",
  });
  if (!response.ok) return null;

  // An offline context decodes without a user gesture and without opening an audio device.
  const context = new OfflineAudioContext(1, 1, ANALYSIS_RATE);
  const audio = await context.decodeAudioData(await response.arrayBuffer());
  return clipTempo(audio.getChannelData(0), audio.sampleRate, styles);
}

type Previews = {
  previews: readonly { trackId: string; url: string }[];
  styles: readonly string[];
};

type MeasureOptions = {
  /** Stores a measured tempo and says whether the track took it: one measured meanwhile keeps its own. */
  save: (trackId: string, bpm: number) => Promise<boolean>;
  measure?: (url: string, styles: readonly string[], signal?: AbortSignal) => Promise<number | null>;
  signal?: AbortSignal;
};

/** Measures a lookup's previews one at a time and returns how many tracks got a tempo. */
export async function measurePreviews({ previews, styles }: Previews, { save, measure = measurePreview, signal }: MeasureOptions) {
  let measured = 0;

  for (const { trackId, url } of previews) {
    if (signal?.aborted) break;
    try {
      const bpm = await measure(url, styles, signal);
      if (bpm !== null && (await save(trackId, bpm))) measured += 1;
    } catch {
      // A preview that will not download or decode is one track without a tempo, not a failed lookup.
    }
  }

  return measured;
}
