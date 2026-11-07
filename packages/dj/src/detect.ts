export type BpmDetection = {
  bpm: number;
  /** How far the winning tempo stands above the rest. Higher means a clearer beat. */
  confidence: number;
};

const MIN_SECONDS = 6;
const MIN_BPM = 70;
const MAX_BPM = 190;
const BPM_STEP = 0.1;
const FRAME_SECONDS = 0.005;
const KICK_CUTOFF_HZ = 200;
const COMB_TEETH = 6;
const PREFERRED_BPM = 125;
const PRIOR_WIDTH_OCTAVES = 1.4;
const MIN_ENERGY = 1e-7;
const MIN_CONFIDENCE = 12;

/** Keeps the kick and bass, where a dance record's pulse lives. */
function lowPass(samples: Float32Array, sampleRate: number) {
  const smoothing = 1 - Math.exp((-2 * Math.PI * KICK_CUTOFF_HZ) / sampleRate);
  const filtered = new Float32Array(samples.length);
  let value = 0;
  for (let index = 0; index < samples.length; index += 1) {
    value += smoothing * (samples[index]! - value);
    filtered[index] = value;
  }
  return filtered;
}

function frameEnergy(samples: Float32Array, frameSize: number) {
  const energy = new Float64Array(Math.floor(samples.length / frameSize));
  for (let frame = 0; frame < energy.length; frame += 1) {
    let sum = 0;
    const start = frame * frameSize;
    for (let index = start; index < start + frameSize; index += 1) sum += samples[index]! ** 2;
    energy[frame] = sum / frameSize;
  }
  return energy;
}

/** Rises in loudness, on a log scale so a quiet room and a loud one read the same. */
function onsetEnvelope(energy: Float64Array) {
  const peak = energy.reduce((max, value) => Math.max(max, value), 0);
  const envelope = new Float64Array(energy.length);
  let previous = 0;
  let sum = 0;

  for (let frame = 0; frame < energy.length; frame += 1) {
    const level = Math.log1p((1000 * energy[frame]!) / peak);
    envelope[frame] = Math.max(0, level - previous);
    sum += envelope[frame]!;
    previous = level;
  }

  const mean = sum / envelope.length;
  return envelope.map((value) => value - mean);
}

function autocorrelate(envelope: Float64Array, maxLag: number) {
  const correlation = new Float64Array(maxLag + 2);
  for (let lag = 0; lag < correlation.length; lag += 1) {
    let sum = 0;
    for (let index = 0; index + lag < envelope.length; index += 1) sum += envelope[index]! * envelope[index + lag]!;
    correlation[lag] = sum / (envelope.length - lag);
  }
  return correlation;
}

function interpolate(values: Float64Array, position: number) {
  const lower = Math.floor(position);
  const fraction = position - lower;
  return values[lower]! * (1 - fraction) + (values[lower + 1] ?? 0) * fraction;
}

function median(values: number[]) {
  const sorted = values.toSorted((a, b) => a - b);
  return sorted[Math.floor(sorted.length / 2)]!;
}

/**
 * Estimates the tempo of a recording, such as a record playing near a phone.
 * Beats repeat, so the envelope correlates with itself at the beat period and its multiples.
 * Scoring several multiples at once gives a far finer reading than the first peak alone.
 */
export function detectBpm(samples: Float32Array, sampleRate: number): BpmDetection | null {
  if (samples.length < sampleRate * MIN_SECONDS) return null;

  const frameSize = Math.round(sampleRate * FRAME_SECONDS);
  const framesPerSecond = sampleRate / frameSize;

  const energy = frameEnergy(lowPass(samples, sampleRate), frameSize);
  if (energy.reduce((max, value) => Math.max(max, value), 0) < MIN_ENERGY) return null;

  const envelope = onsetEnvelope(energy);
  const maxLag = Math.min(
    envelope.length - 2,
    Math.ceil((60 / MIN_BPM) * framesPerSecond * COMB_TEETH),
  );
  const correlation = autocorrelate(envelope, maxLag);

  const scores: { bpm: number; score: number }[] = [];
  for (let bpm = MIN_BPM; bpm <= MAX_BPM; bpm += BPM_STEP) {
    const period = (60 / bpm) * framesPerSecond;
    let score = 0;
    for (let tooth = 1; tooth <= COMB_TEETH; tooth += 1) {
      const lag = period * tooth;
      if (lag < maxLag) score += interpolate(correlation, lag);
    }
    const octavesFromPreferred = Math.log2(bpm / PREFERRED_BPM) / PRIOR_WIDTH_OCTAVES;
    scores.push({ bpm, score: score * Math.exp(-0.5 * octavesFromPreferred ** 2) });
  }

  const best = scores.reduce((top, next) => (next.score > top.score ? next : top));
  const typical = median(scores.map(({ score }) => Math.abs(score)));
  const confidence = typical > 0 ? best.score / typical : 0;

  if (best.score <= 0 || confidence < MIN_CONFIDENCE) return null;

  return { bpm: Math.round(best.bpm * 10) / 10, confidence };
}
