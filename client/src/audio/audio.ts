const effects = {
  hire: [294, 370, 440],
  paper: [523, 659, 587],
  click: [600, 850],
  cash: [660, 880, 1320],
  bad: [240, 180, 120],
  level: [523, 659, 784, 1047],
  end: [784, 659, 523, 392],
  phone: [440, 660, 0, 440, 660],
  hangup: [200, 380, 0, 380],
  siren: [460, 720, 460, 720],
  jail: [130, 82, 220],
  escape: [330, 494, 740, 988],
  wash: [587, 880, 1175],
  event: [196, 392, 523],
  news: [392, 523, 659, 523, 784],
} as const;
type Cue = keyof typeof effects;

const recordedEffects = new Set(['sfx_click', 'sfx_cash', 'sfx_coins', 'sfx_card_flip', 'sfx_sale', 'sfx_spotted', 'sfx_chase']);
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
  private marketTrack: AudioBuffer | null = null;
  private marketNode: AudioBufferSourceNode | null = null;
  /** ไฟล์เสียงจาก ElevenLabs ที่โหลดแล้ว (null = ไม่มีไฟล์) */
  private buffers = new Map<string, Promise<AudioBuffer | null>>();
  private voiceNode: AudioBufferSourceNode | null = null;
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
        void this.load('bgm_market').then(buffer => { this.marketTrack = buffer; });
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
    if (this.marketTrack && !this.danger) {
      if (!this.marketNode) {
        this.marketNode = this.context.createBufferSource();
        this.marketNode.buffer = this.marketTrack;
        this.marketNode.loop = true;
        this.marketNode.connect(this.musicGain);
        this.marketNode.start();
      }
      return;
    }
    if (this.marketNode) {
      this.marketNode.stop();
      this.marketNode.disconnect();
      this.marketNode = null;
    }
    if (this.nextNote < this.context.currentTime) this.nextNote = this.context.currentTime + 0.02;
    const bus = this.musicGain;
    // Eight-bar street-cafe progression. Alternate phrases leave space between UI cues.
    const chords = [
      [50, 57, 60, 64],
      [55, 59, 62, 65],
      [48, 55, 59, 64],
      [45, 52, 55, 60],
      [50, 57, 60, 65],
      [55, 59, 62, 64],
      [48, 55, 59, 62],
      [45, 52, 55, 61],
    ];
    const midi = (n: number) => 440 * 2 ** ((n - 69) / 12);
    while (this.nextNote < this.context.currentTime + 0.18) {
      const index = this.beat++,
        bar = Math.floor(index / 8),
        slot = index % 8;
      const chord = chords[bar % 8] ?? [48, 55, 59, 64];
      const root = chord[0] ?? 48;
      const eighth = 30 / (this.danger ? 94 : 82);
      const time = this.nextNote + (slot % 2 ? eighth * 0.12 : 0);
      if (slot === 0 || slot === 4)
        this.tone(midi(root - 12 + (slot === 4 ? 7 : 0)), time, 0.52, 0.46, 'sine', this.musicGain);
      if (slot === 1 || (slot === 5 && bar % 2 === 0)) {
        chord
          .slice(1)
          .forEach((n, k) => this.tone(midi(n), time + k * 0.018, 0.62, 0.14, 'triangle', bus));
      }
      const phrase = bar % 4;
      if (
        (phrase === 0 && (slot === 3 || slot === 6)) ||
        (phrase === 1 && slot === 2) ||
        (phrase === 2 && slot === 5)
      ) {
        const note = chord[((slot + Math.floor(bar / 8)) % 3) + 1] ?? 60;
        this.tone(midi(note + 12), time, 0.46, 0.18, 'sine', this.musicGain);
      }
      if (slot === 2 || slot === 6)
        this.tone(this.danger ? 170 : 140, time, 0.045, 0.14, 'triangle', this.musicGain);
      if (this.danger && slot === 7)
        this.tone(midi(root), time, 0.13, 0.19, 'triangle', this.musicGain);
      this.nextNote += eighth;
    }
  }
  private load(id: string): Promise<AudioBuffer | null> {
    let p = this.buffers.get(id);
    if (!p) {
      const ctx = this.context;
      p = ctx
        ? fetch(`/audio/${id}.mp3`)
            .then((r) => (r.ok ? r.arrayBuffer() : Promise.reject(new Error('missing'))))
            .then((b) => ctx.decodeAudioData(b))
            .catch(() => null)
        : Promise.resolve(null);
      if (ctx) this.buffers.set(id, p);
    }
    return p;
  }

  /** เล่นไฟล์เสียง ถ้าไม่มีไฟล์ใช้เสียงสังเคราะห์ fallback แทน */
  sfx(id: string, fallback?: Cue) {
    const gain = this.effectsGain;
    const ctx = this.context;
    if (!ctx || !gain || ctx.state !== 'running' || this.settings.muted) return;
    if (!recordedEffects.has(id)) {
      if (fallback) this.play(fallback);
      return;
    }
    void this.load(id).then((buf) => {
      if (ctx.state !== 'running' || this.settings.muted) return;
      if (!buf) {
        if (fallback) this.play(fallback);
        return;
      }
      const src = ctx.createBufferSource();
      src.buffer = buf;
      src.connect(gain);
      src.start();
      src.onended = () => src.disconnect();
    });
  }

  /** เสียงพากย์: เล่นทีละประโยค ประโยคใหม่ตัดประโยคเก่า */
  voice(id: string, delay = 0) {
    const gain = this.effectsGain;
    const ctx = this.context;
    if (!ctx || !gain || ctx.state !== 'running' || this.settings.muted) return;
    void this.load(id).then((buf) => {
      if (!buf) return;
      try {
        this.voiceNode?.stop();
      } catch {
        /* เล่นจบไปแล้ว */
      }
      const src = ctx.createBufferSource();
      src.buffer = buf;
      // เสียงพากย์ดังกว่าเอฟเฟกต์นิดหน่อย
      const boost = ctx.createGain();
      boost.gain.value = 2.2;
      src.connect(boost).connect(gain);
      src.start(ctx.currentTime + delay);
      this.voiceNode = src;
    });
  }

  play(cue: Cue) {
    const gain = this.effectsGain;
    if (!this.context || !gain || this.context.state !== 'running' || this.settings.muted) return;
    const now = this.context.currentTime;
    const spacing = cue === 'click' ? 0.025 : cue === 'siren' ? 0.17 : 0.095;
    effects[cue].forEach((frequency, i) => {
      if (frequency)
        this.tone(
          frequency,
          now + i * spacing,
          cue === 'click' ? 0.045 : 0.22,
          cue === 'click' ? 0.2 : 0.38,
          cue === 'paper' || cue === 'hire' ? 'sine' : 'triangle',
          gain,
        );
    });
  }
}
export const audio = new GameAudio();
