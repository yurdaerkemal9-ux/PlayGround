// A small procedural score and ambience engine built on the Web Audio API.
// Everything is synthesized at runtime: rain, wind, a slow string-like pad,
// piano notes, door creaks, footsteps and soft UI chimes.

export class AudioEngine {
  constructor(settings = {}) {
    this.settings = settings;
    this.ctx = null;
    this.ready = false;
    this.started = false;
    this.musicVolume = settings.music ?? 0.7;
    this.sfxVolume = settings.sfx ?? 0.8;
    this.motifTimer = 7 + Math.random() * 8;
    this.chordTimer = 0;
    this.chordIndex = 0;
    this.thunderTimer = 22 + Math.random() * 25;
    this.indoor = 1;
    this.musicDuck = 1;
    this._lastThunder = 0;
    this._motifStep = 0;
    this.chords = [
      [110.0, 164.81, 220.0, 261.63],
      [98.0, 146.83, 196.0, 246.94],
      [87.31, 130.81, 174.61, 220.0],
      [82.41, 123.47, 164.81, 207.65],
    ];
  }

  _makeNoise(seconds = 3) {
    const ctx = this.ctx;
    const len = Math.floor(ctx.sampleRate * seconds);
    const buffer = ctx.createBuffer(1, len, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    let last = 0;
    for (let i = 0; i < len; i++) {
      const white = Math.random() * 2 - 1;
      last = (last + 0.02 * white) / 1.02;
      data[i] = white * 0.55 + last * 2.2;
    }
    return buffer;
  }

  init() {
    if (this.ctx) {
      if (this.ctx.state === 'suspended') this.ctx.resume();
      return;
    }
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return;
    try {
      this.ctx = new AC();
    } catch (e) {
      this.ctx = null;
      return;
    }
    const ctx = this.ctx;
    this.master = ctx.createGain();
    this.master.gain.value = 0.9;
    this.master.connect(ctx.destination);

    this.musicBus = ctx.createGain();
    this.musicBus.gain.value = this.musicVolume * 0.62;
    this.musicBus.connect(this.master);

    this.sfxBus = ctx.createGain();
    this.sfxBus.gain.value = this.sfxVolume * 0.9;
    this.sfxBus.connect(this.master);

    // rain bed
    this.rainGain = ctx.createGain();
    this.rainGain.gain.value = 0.0;
    const rainFilter = ctx.createBiquadFilter();
    rainFilter.type = 'highpass';
    rainFilter.frequency.value = 900;
    rainFilter.Q.value = 0.4;
    const rainFilter2 = ctx.createBiquadFilter();
    rainFilter2.type = 'lowpass';
    rainFilter2.frequency.value = 7200;
    this.rainGain.connect(rainFilter);
    rainFilter.connect(rainFilter2);
    rainFilter2.connect(this.sfxBus);
    const rainSrc = ctx.createBufferSource();
    rainSrc.buffer = this._makeNoise(4.2);
    rainSrc.loop = true;
    rainSrc.connect(this.rainGain);
    rainSrc.start();

    // wind / house tone
    this.windGain = ctx.createGain();
    this.windGain.gain.value = 0.055;
    const windFilter = ctx.createBiquadFilter();
    windFilter.type = 'lowpass';
    windFilter.frequency.value = 330;
    windFilter.Q.value = 0.7;
    this.windGain.connect(windFilter);
    windFilter.connect(this.sfxBus);
    const windSrc = ctx.createBufferSource();
    windSrc.buffer = this._makeNoise(3.7);
    windSrc.loop = true;
    windSrc.connect(this.windGain);
    windSrc.playbackRate.value = 0.75;
    windSrc.start();

    // pad oscillators
    this.padGain = ctx.createGain();
    this.padGain.gain.value = 0.0;
    const padFilter = ctx.createBiquadFilter();
    padFilter.type = 'lowpass';
    padFilter.frequency.value = 780;
    padFilter.Q.value = 0.5;
    this.padFilter = padFilter;
    this.padGain.connect(padFilter);
    padFilter.connect(this.musicBus);
    this.padOsc = [];
    const chord = this.chords[0];
    for (let i = 0; i < chord.length; i++) {
      for (const detune of [-4, 4]) {
        const o = ctx.createOscillator();
        o.type = i === 0 ? 'sine' : 'triangle';
        o.frequency.value = chord[i];
        o.detune.value = detune;
        const g = ctx.createGain();
        g.gain.value = i === 0 ? 0.055 : 0.032;
        // slow breathing on each voice
        const lfo = ctx.createOscillator();
        lfo.type = 'sine';
        lfo.frequency.value = 0.045 + Math.random() * 0.07;
        const lfoGain = ctx.createGain();
        lfoGain.gain.value = 0.016;
        lfo.connect(lfoGain);
        lfoGain.connect(g.gain);
        lfo.start();
        o.connect(g);
        g.connect(this.padGain);
        o.start();
        this.padOsc.push({ osc: o, gain: g, note: chord[i], index: i });
      }
    }
    // airy shimmer
    const shimmer = ctx.createOscillator();
    shimmer.type = 'sine';
    shimmer.frequency.value = 1046.5;
    const shimmerGain = ctx.createGain();
    shimmerGain.gain.value = 0.008;
    const shimmerLfo = ctx.createOscillator();
    shimmerLfo.frequency.value = 0.08;
    const shimmerLfoGain = ctx.createGain();
    shimmerLfoGain.gain.value = 0.006;
    shimmerLfo.connect(shimmerLfoGain);
    shimmerLfoGain.connect(shimmerGain.gain);
    shimmerLfo.start();
    shimmer.connect(shimmerGain);
    shimmerGain.connect(this.musicBus);
    shimmer.start();
    this.shimmer = shimmer;

    this.ready = true;
  }

  start() {
    this.init();
    if (!this.ctx) return;
    if (this.started) return;
    this.started = true;
    const t = this.ctx.currentTime;
    this.padGain.gain.cancelScheduledValues(t);
    this.padGain.gain.setValueAtTime(0.0001, t);
    this.padGain.gain.exponentialRampToValueAtTime(0.5, t + 4.5);
    this.rainGain.gain.setValueAtTime(0.0001, t);
    this.rainGain.gain.exponentialRampToValueAtTime(0.08, t + 3.2);
  }

  setMusicVolume(v) {
    this.musicVolume = v;
    if (!this.ctx) return;
    const t = this.ctx.currentTime;
    this.musicBus.gain.cancelScheduledValues(t);
    this.musicBus.gain.setTargetAtTime(Math.max(0.0001, v * 0.62 * this.musicDuck), t, 0.25);
  }

  setSfxVolume(v) {
    this.sfxVolume = v;
    if (!this.ctx) return;
    this.sfxBus.gain.setTargetAtTime(Math.max(0.0001, v * 0.9), this.ctx.currentTime, 0.2);
  }

  duck(amount = 0.35) {
    this.musicDuck = amount;
    if (!this.ctx) return;
    this.musicBus.gain.setTargetAtTime(Math.max(0.0001, this.musicVolume * 0.62 * amount), this.ctx.currentTime, 0.3);
  }

  unduck() {
    this.musicDuck = 1;
    if (!this.ctx) return;
    this.musicBus.gain.setTargetAtTime(Math.max(0.0001, this.musicVolume * 0.62), this.ctx.currentTime, 0.7);
  }

  _tone(freq, dur = 0.45, type = 'sine', gain = 0.1, when = 0, dest = null, glide = null) {
    if (!this.ctx) return;
    const ctx = this.ctx;
    const t = ctx.currentTime + when;
    const o = ctx.createOscillator();
    o.type = type;
    o.frequency.setValueAtTime(freq, t);
    if (glide) o.frequency.exponentialRampToValueAtTime(Math.max(20, glide), t + dur);
    const g = ctx.createGain();
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(Math.max(0.0002, gain), t + 0.012);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.connect(g);
    g.connect(dest || this.sfxBus);
    o.start(t);
    o.stop(t + dur + 0.04);
  }

  _noise(dur = 0.2, cutoff = 1200, gain = 0.08, when = 0, type = 'lowpass') {
    if (!this.ctx) return;
    const ctx = this.ctx;
    const t = ctx.currentTime + when;
    const src = ctx.createBufferSource();
    src.buffer = this._makeNoise(Math.max(0.08, dur + 0.1));
    const f = ctx.createBiquadFilter();
    f.type = type;
    f.frequency.value = cutoff;
    const g = ctx.createGain();
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(Math.max(0.0002, gain), t + 0.01);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    src.connect(f);
    f.connect(g);
    g.connect(this.sfxBus);
    src.start(t);
    src.stop(t + dur + 0.08);
  }

  step(surface = 'wood', running = false) {
    if (!this.ctx) return;
    const gain = (running ? 0.055 : 0.035) * (surface === 'stone' ? 1.5 : 1);
    this._noise(0.09, surface === 'stone' ? 1500 : 650, gain);
    this._tone(surface === 'stone' ? 92 : 68, 0.1, 'sine', gain * 0.7);
  }

  jump() {
    this._tone(330, 0.16, 'sine', 0.04, 0, this.sfxBus, 520);
  }

  land() {
    this._noise(0.12, 420, 0.05);
    this._tone(72, 0.16, 'sine', 0.055);
  }

  door(open = true) {
    if (!this.ctx) return;
    const base = open ? 160 : 130;
    this._tone(base, 0.7, 'sawtooth', 0.012, 0, this.sfxBus, base * 0.72);
    this._noise(0.5, open ? 900 : 600, 0.022, 0.04);
    this._tone(open ? 520 : 410, 0.3, 'sine', 0.025, 0.5);
    this._noise(0.06, 2000, 0.03, 0.53);
  }

  key() {
    this._tone(880, 0.16, 'triangle', 0.06);
    this._tone(1320, 0.32, 'triangle', 0.045, 0.08);
    this._tone(1760, 0.3, 'sine', 0.03, 0.17);
  }

  unlock() {
    if (!this.ctx) return;
    this._noise(0.18, 2400, 0.045);
    this._tone(220, 0.2, 'triangle', 0.04, 0.04);
    this._tone(330, 0.4, 'triangle', 0.05, 0.15);
    this._tone(660, 0.5, 'sine', 0.035, 0.28);
  }

  chime(index = 0) {
    if (!this.ctx) return;
    const scale = [523.25, 587.33, 659.25, 783.99, 880.0, 987.77, 1046.5];
    const root = scale[index % scale.length];
    this._tone(root, 1.6, 'sine', 0.055, 0, this.sfxBus);
    this._tone(root * 1.5, 1.9, 'sine', 0.03, 0.12);
    this._tone(root * 2, 2.2, 'triangle', 0.022, 0.26);
    this._tone(root * 0.5, 2.4, 'sine', 0.02, 0.05);
  }

  memory(index = 0) {
    this.chime(index);
    const base = [392, 440, 493.88, 523.25, 587.33, 659.25, 698.46][index % 7];
    this._tone(base, 1.4, 'triangle', 0.045, 0.25);
    this._tone(base * 1.25, 1.7, 'sine', 0.035, 0.42);
    this._tone(base * 1.5, 2.0, 'sine', 0.03, 0.62);
  }

  success() {
    const notes = [523.25, 659.25, 783.99, 1046.5];
    notes.forEach((n, i) => this._tone(n, 0.9, 'triangle', 0.05, i * 0.11));
  }

  wrong() {
    this._tone(196, 0.35, 'triangle', 0.04);
    this._tone(185, 0.45, 'triangle', 0.035, 0.12);
  }

  page() {
    this._noise(0.18, 3200, 0.018, 0, 'highpass');
  }

  ui() {
    this._tone(740, 0.12, 'sine', 0.022);
  }

  pianoNote(i = 0) {
    const notes = [261.63, 329.63, 392.0, 523.25, 659.25, 783.99];
    const f = notes[i % notes.length];
    this._tone(f, 1.5, 'triangle', 0.07);
    this._tone(f * 2, 1.1, 'sine', 0.022);
    this._tone(f * 0.5, 1.7, 'sine', 0.018);
  }

  musicBox() {
    const notes = [1046.5, 1318.5, 1568.0, 2093.0, 1568.0, 1318.5];
    notes.forEach((n, i) => this._tone(n, 0.8, 'sine', 0.03, i * 0.22));
  }

  gramophone() {
    if (!this.ctx) return;
    this._noise(0.9, 1700, 0.02);
    this._tone(220, 0.6, 'sawtooth', 0.01, 0.04, this.sfxBus, 196);
    const seq = [261.63, 329.63, 392.0, 523.25];
    seq.forEach((n, i) => this._tone(n, 1.0, 'triangle', 0.035, 0.2 + i * 0.24));
    this._noise(0.8, 900, 0.02, 1.2);
  }

  thunder() {
    if (!this.ctx) return;
    this._noise(2.6, 240, 0.12, 0);
    this._tone(44, 2.4, 'sine', 0.08, 0.08, this.sfxBus, 30);
    this._noise(1.2, 900, 0.03, 0.04, 'highpass');
  }

  heartbeat() {
    this._tone(52, 0.18, 'sine', 0.07);
    this._tone(46, 0.24, 'sine', 0.05, 0.24);
  }

  update(dt, info = {}) {
    if (!this.ctx || !this.ready) return;
    const indoor = info.indoor ?? 1;
    this.indoor = indoor;
    const t = this.ctx.currentTime;
    const targetRain = this.musicVolume <= 0 ? 0.0001 : (0.028 + (1 - indoor) * 0.13);
    this.rainGain.gain.setTargetAtTime(targetRain, t, 1.4);

    // section changes every so often
    this.motifTimer -= dt;
    if (this.motifTimer <= 0) {
      this.motifTimer = 13 + Math.random() * 16;
      this._playMotif(info.mood || 'house');
    }
    this.chordTimer -= dt;
    if (this.chordTimer <= 0) {
      this.chordTimer = 18 + Math.random() * 8;
      this.chordIndex = (this.chordIndex + 1) % this.chords.length;
      const chord = this.chords[this.chordIndex];
      this.padOsc.forEach(v => {
        const note = chord[v.index];
        v.osc.frequency.setTargetAtTime(note, t, 3.5);
      });
    }
    this.thunderTimer -= dt;
    if (this.thunderTimer <= 0 && indoor < 0.5) {
      this.thunderTimer = 35 + Math.random() * 50;
      this.thunder();
    }
  }

  _playMotif(mood) {
    if (!this.ctx) return;
    // A sparse, wistful piano phrase in a minor-ish mode.
    const phrases = [
      [329.63, 392.0, 493.88, 440.0, 392.0, 329.63],
      [293.66, 349.23, 440.0, 392.0, 349.23, 293.66],
      [261.63, 329.63, 392.0, 349.23, 329.63, 261.63],
    ];
    const phrase = phrases[(this._motifStep++) % phrases.length];
    const vib = mood === 'basement' ? 0.62 : 1;
    phrase.forEach((f, i) => {
      const when = 0.4 + i * 0.74 + (i === 3 ? 0.35 : 0);
      this._tone(f * (mood === 'attic' ? 0.5 : 1), 2.6, 'triangle', 0.028 * vib, when);
      this._tone(f * 2, 1.8, 'sine', 0.011 * vib, when + 0.02);
    });
  }

  outdoor(on) {
    // handled through update(info.indoor)
  }
}
