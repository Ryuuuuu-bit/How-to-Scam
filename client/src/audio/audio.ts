type Cue = 'click' | 'cash' | 'bad' | 'level' | 'end';
export interface AudioSettings {
  muted: boolean;
  music: number;
  effects: number;
}
const defaults: AudioSettings = { muted: false, music: 0.25, effects: 0.5 };
function readSettings(): AudioSettings {
  try {
    const data = JSON.parse(localStorage.getItem('hts.audio.v1') ?? 'null');
    if (!data) return defaults;
    return {
      muted: typeof data.muted === 'boolean' ? data.muted : false,
      music: Number.isFinite(data.music) ? Math.max(0, Math.min(1, data.music)) : defaults.music,
      effects: Number.isFinite(data.effects)
        ? Math.max(0, Math.min(1, data.effects))
        : defaults.effects,
    };
  } catch {
    return defaults;
  }
}

// Original synthesized soundtrack; no downloaded tracks or network requests.
class GameAudio {
  settings = readSettings();
  private context: AudioContext | null = null;
  private musicGain: GainNode | null = null;
  private effectsGain: GainNode | null = null;
  private timer: ReturnType<typeof setInterval> | null = null;
  private beat = 0;
  private nextNote = 0;
  private danger = false;
  private enabled = false;
  update(settings: AudioSettings) {
    this.settings = settings;
    try {
      localStorage.setItem('hts.audio.v1', JSON.stringify(settings));
    } catch {
      /* optional storage */
    }
    this.applyVolume();
  }
  private applyVolume() {
    if (!this.context) return;
    const now = this.context.currentTime;
    this.musicGain?.gain.setTargetAtTime(
      this.settings.muted ? 0 : this.settings.music * 0.22,
      now,
      0.08,
    );
    this.effectsGain?.gain.setTargetAtTime(
      this.settings.muted ? 0 : this.settings.effects * 0.3,
      now,
      0.03,
    );
  }
  async unlock() {
    try {
      if (!this.context) {
        this.context = new AudioContext();
        this.musicGain = this.context.createGain();
        this.effectsGain = this.context.createGain();
        const limiter = this.context.createDynamicsCompressor();
        this.musicGain.connect(limiter);
        this.effectsGain.connect(limiter);
        limiter.connect(this.context.destination);
        this.applyVolume();
      }
      this.enabled = true;
      if (document.hidden) return;
      if (this.context.state === 'suspended') await this.context.resume();
      if (!this.timer) {
        this.nextNote = this.context.currentTime + 0.06;
        this.timer = setInterval(() => this.schedule(), 80);
        this.schedule();
      }
    } catch {
      /* Audio is optional; gameplay stays available. */
    }
  }
  setDanger(value: boolean) {
    this.danger = value;
  }
  visibility() {
    if (document.hidden) {
      if (this.timer) clearInterval(this.timer);
      this.timer = null;
      void this.context?.suspend().catch(() => {});
    } else if (this.enabled) void this.unlock();
  }
  stop() {
    if (this.timer) clearInterval(this.timer);
    this.timer = null;
    this.enabled = false;
    void this.context?.suspend().catch(() => {});
  }
  private tone(
    frequency: number,
    time: number,
    length: number,
    volume: number,
    type: OscillatorType,
    target: GainNode,
  ) {
    const ctx = this.context;
    if (!ctx) return;
    const oscillator = ctx.createOscillator();
    const envelope = ctx.createGain();
    oscillator.type = type;
    oscillator.frequency.value = frequency;
    envelope.gain.setValueAtTime(0, time);
    envelope.gain.linearRampToValueAtTime(volume, time + 0.008);
    envelope.gain.exponentialRampToValueAtTime(0.001, time + length);
    oscillator.connect(envelope);
    envelope.connect(target);
    oscillator.start(time);
    oscillator.stop(time + length + 0.02);
    oscillator.onended = () => {
      oscillator.disconnect();
      envelope.disconnect();
    };
  }
  private schedule() {
    if (!this.context || !this.musicGain || this.context.state !== 'running') return;
    if (this.nextNote < this.context.currentTime) this.nextNote = this.context.currentTime + 0.02;
    const bass = [45, 45, 48, 45, 41, 41, 43, 40];
    const melody = [69, 0, 72, 76, 0, 75, 72, 0, 67, 0, 71, 74, 0, 72, 68, 0];
    while (this.nextNote < this.context.currentTime + 0.18) {
      const i = this.beat++;
      const midi = (n: number) => 440 * 2 ** ((n - 69) / 12);
      if (i % 2 === 0)
        this.tone(
          midi(bass[Math.floor(i / 4) % bass.length] ?? 45),
          this.nextNote,
          0.22,
          0.7,
          'triangle',
          this.musicGain,
        );
      const note = melody[i % melody.length] ?? 0;
      if (note)
        this.tone(
          midi(note + (this.danger ? 12 : 0)),
          this.nextNote,
          0.13,
          0.22,
          'sine',
          this.musicGain,
        );
      if (i % 4 === 2)
        this.tone(this.danger ? 180 : 110, this.nextNote, 0.045, 0.22, 'triangle', this.musicGain);
      this.nextNote += this.danger ? 0.17 : 0.215;
    }
  }
  play(cue: Cue) {
    const gain = this.effectsGain;
    if (!this.context || !gain || this.context.state !== 'running') return;
    const notes: Record<Cue, number[]> = {
      click: [600, 850],
      cash: [660, 880, 1320],
      bad: [240, 180, 120],
      level: [523, 659, 784, 1047],
      end: [784, 659, 523, 392],
    };
    const now = this.context.currentTime;
    notes[cue].forEach((frequency, i) =>
      this.tone(
        frequency,
        now + i * (cue === 'click' ? 0.025 : 0.095),
        cue === 'click' ? 0.045 : 0.22,
        cue === 'click' ? 0.28 : 0.55,
        'triangle',
        gain,
      ),
    );
  }
}
export const audio = new GameAudio();
