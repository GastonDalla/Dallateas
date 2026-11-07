/**
 * Two drum machines on one Web Audio clock, standing in for two decks. Each deck asks for its tempo
 * at every beat, so a fader move or a nudge is heard on the next beat.
 */

const LOOKAHEAD_S = 0.12;
const TICK_MS = 25;
const START_DELAY_S = 0.1;
const NOISE_SECONDS = 0.5;

export type DeckVoice = "house" | "record";

export type EngineDeck = {
  voice: DeckVoice;
  /** −1 is hard left, 1 hard right. Each deck on its own side helps tell the two kicks apart. */
  pan: number;
  tempo: () => number;
};

type Clock = { next: number; beat: number };
type Scheduled = { deck: number; beat: number; time: number };

export class BeatEngine {
  private readonly context: AudioContext;
  private readonly master: GainNode;
  private readonly noise: AudioBuffer;
  private readonly clocks: Clock[];
  private readonly pending: Scheduled[] = [];
  private timer: ReturnType<typeof setInterval> | null = null;
  private frame: number | null = null;

  constructor(
    private readonly decks: EngineDeck[],
    private readonly onBeat: (deck: number, beat: number) => void,
  ) {
    this.context = new AudioContext();
    this.master = new GainNode(this.context, { gain: 0.7 });
    this.master.connect(this.context.destination);
    this.noise = this.makeNoise();
    this.clocks = decks.map(() => ({ next: 0, beat: 0 }));
  }

  /** Starts both decks, the second one some beats late, so the DJ has a phase to fix. */
  async start(lateBeats: number) {
    await this.context.resume();
    const now = this.context.currentTime + START_DELAY_S;
    this.clocks.forEach((clock, index) => {
      clock.beat = 0;
      clock.next = index === 0 ? now : now + (60 / this.decks[index]!.tempo()) * lateBeats;
    });
    this.timer = setInterval(() => this.schedule(), TICK_MS);
    this.schedule();
    this.frame = requestAnimationFrame(() => this.report());
  }

  async stop() {
    if (this.timer !== null) clearInterval(this.timer);
    if (this.frame !== null) cancelAnimationFrame(this.frame);
    this.timer = null;
    this.frame = null;
    await this.context.close();
  }

  private schedule() {
    const horizon = this.context.currentTime + LOOKAHEAD_S;
    this.clocks.forEach((clock, index) => {
      const deck = this.decks[index]!;
      while (clock.next < horizon) {
        const beatLength = 60 / deck.tempo();
        this.play(deck, clock.beat, clock.next, beatLength);
        this.pending.push({ deck: index, beat: clock.beat, time: clock.next });
        clock.beat += 1;
        clock.next += beatLength;
      }
    });
  }

  /** Beat lights follow the audio clock, not the scheduler, so they flash when the kick is heard. */
  private report() {
    const now = this.context.currentTime;
    this.pending.sort((a, b) => a.time - b.time);
    while (this.pending.length > 0 && this.pending[0]!.time <= now) {
      const { deck, beat } = this.pending.shift()!;
      this.onBeat(deck, beat);
    }
    this.frame = requestAnimationFrame(() => this.report());
  }

  private play(deck: EngineDeck, beat: number, time: number, beatLength: number) {
    const out = new StereoPannerNode(this.context, { pan: deck.pan });
    out.connect(this.master);

    this.kick(time, out, deck.voice === "house" ? 52 : 58);
    if (deck.voice === "house") {
      this.hat(time + beatLength / 2, out);
    } else if (beat % 2 === 1) {
      this.clap(time, out);
    }
  }

  private kick(time: number, out: AudioNode, floorHz: number) {
    const body = new OscillatorNode(this.context, { type: "sine", frequency: 160 });
    const level = new GainNode(this.context, { gain: 0 });
    body.frequency.setValueAtTime(160, time);
    body.frequency.exponentialRampToValueAtTime(floorHz, time + 0.11);
    level.gain.setValueAtTime(0.95, time);
    level.gain.exponentialRampToValueAtTime(0.001, time + 0.38);
    body.connect(level).connect(out);
    body.start(time);
    body.stop(time + 0.4);
  }

  private hat(time: number, out: AudioNode) {
    this.burst(time, out, new BiquadFilterNode(this.context, { type: "highpass", frequency: 7500 }), 0.22, 0.05);
  }

  private clap(time: number, out: AudioNode) {
    this.burst(time, out, new BiquadFilterNode(this.context, { type: "bandpass", frequency: 1300, Q: 0.9 }), 0.5, 0.16);
  }

  private burst(time: number, out: AudioNode, filter: BiquadFilterNode, peak: number, length: number) {
    const source = new AudioBufferSourceNode(this.context, { buffer: this.noise });
    const level = new GainNode(this.context, { gain: 0 });
    level.gain.setValueAtTime(peak, time);
    level.gain.exponentialRampToValueAtTime(0.001, time + length);
    source.connect(filter).connect(level).connect(out);
    source.start(time);
    source.stop(time + length + 0.02);
  }

  private makeNoise() {
    const buffer = new AudioBuffer({ length: Math.round(this.context.sampleRate * NOISE_SECONDS), sampleRate: this.context.sampleRate });
    const samples = buffer.getChannelData(0);
    for (let index = 0; index < samples.length; index += 1) samples[index] = Math.random() * 2 - 1;
    return buffer;
  }
}
