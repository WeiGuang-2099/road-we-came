const LEVEL = 0.05;
const FADE_SECONDS = 0.4;

/**
 * Wind over a low drone, synthesized with WebAudio so the game ships without
 * audio files. Sound is optional: if anything fails the game stays silent.
 */
export class Ambience {
  private context: AudioContext | null = null;
  private output: GainNode | null = null;
  private muted: boolean;

  constructor(muted: boolean) {
    this.muted = muted;
  }

  isMuted(): boolean {
    return this.muted;
  }

  /** Call from a click or key handler; browsers block audio before that. */
  start(): void {
    if (this.context) {
      void this.context.resume();
      return;
    }
    try {
      const context = new AudioContext();
      const output = context.createGain();
      output.gain.value = this.muted ? 0 : LEVEL;
      output.connect(context.destination);
      addWind(context, output);
      addDrone(context, output);
      document.addEventListener('visibilitychange', () => {
        void (document.hidden ? context.suspend() : context.resume());
      });
      this.context = context;
      this.output = output;
    } catch {
      // No WebAudio here. Play on without sound.
    }
  }

  setMuted(muted: boolean): void {
    this.muted = muted;
    if (this.context && this.output) {
      this.output.gain.setTargetAtTime(
        muted ? 0 : LEVEL,
        this.context.currentTime,
        FADE_SECONDS,
      );
    }
  }
}

function addWind(context: AudioContext, output: AudioNode): void {
  const buffer = context.createBuffer(
    1,
    context.sampleRate * 4,
    context.sampleRate,
  );
  const data = buffer.getChannelData(0);
  // Integrated (brown) noise sits low and soft instead of hissing.
  let last = 0;
  for (let i = 0; i < data.length; i++) {
    last = (last + 0.02 * (Math.random() * 2 - 1)) / 1.02;
    data[i] = last * 3.5;
  }
  const noise = context.createBufferSource();
  noise.buffer = buffer;
  noise.loop = true;

  const filter = context.createBiquadFilter();
  filter.type = 'lowpass';
  filter.frequency.value = 520;

  // A slow wobble on the cutoff reads as gusts.
  const gust = context.createOscillator();
  gust.frequency.value = 0.07;
  const gustDepth = context.createGain();
  gustDepth.gain.value = 260;
  gust.connect(gustDepth).connect(filter.frequency);

  noise.connect(filter).connect(output);
  noise.start();
  gust.start();
}

function addDrone(context: AudioContext, output: AudioNode): void {
  const level = context.createGain();
  level.gain.value = 0.15;
  level.connect(output);
  for (const frequency of [98, 147]) {
    const tone = context.createOscillator();
    tone.frequency.value = frequency;
    tone.connect(level);
    tone.start();
  }
}
