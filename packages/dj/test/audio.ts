export const SAMPLE_RATE = 44_100;

function seededNoise(samples: Float32Array, level: number, seed: number) {
  let state = seed;
  for (let index = 0; index < samples.length; index += 1) {
    state = (state * 1_664_525 + 1_013_904_223) % 4_294_967_296;
    samples[index] = (state / 4_294_967_296 - 0.5) * level;
  }
  return samples;
}

/** A four-to-the-floor kick with a little noise, like a record picked up by a phone. */
export function kickLoop(bpm: number, seconds: number, noise = 0.02) {
  const samples = seededNoise(new Float32Array(SAMPLE_RATE * seconds), noise, 7);
  const beat = (60 / bpm) * SAMPLE_RATE;
  for (let start = 0; start < samples.length; start += beat) {
    const offset = Math.round(start);
    for (let index = 0; index < 6000 && offset + index < samples.length; index += 1) {
      const decay = Math.exp(-index / 1200);
      samples[offset + index]! += Math.sin((2 * Math.PI * 70 * index) / SAMPLE_RATE) * decay;
    }
  }
  return samples;
}

/** Noise with no beat in it at all. */
export function steadyNoise(seconds: number) {
  return seededNoise(new Float32Array(SAMPLE_RATE * seconds), 1, 11);
}
