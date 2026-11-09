import { clipTempo } from "@dallateas/dj/clip-tempo";

/** The rate the vote was measured at, and half the work of decoding at 44.1 kHz. */
const ANALYSIS_RATE = 22_050;

/**
 * Downloads a track's 30-second preview and measures its tempo in the browser,
 * or returns null when the clip does not give a clear one.
 */
export async function measurePreview(url: string, styles: readonly string[], signal?: AbortSignal) {
  const response = await fetch(url, { signal, credentials: "omit" });
  if (!response.ok) return null;

  // An offline context decodes without a user gesture and without opening an audio device.
  const context = new OfflineAudioContext(1, 1, ANALYSIS_RATE);
  const audio = await context.decodeAudioData(await response.arrayBuffer());
  return clipTempo(audio.getChannelData(0), audio.sampleRate, styles);
}
