const BPM = 118;
const CHORDS = [[60, 64, 67], [55, 59, 62], [57, 60, 64], [53, 57, 60]]; // I-V-vi-IV
const mtof = m => 440 * Math.pow(2, (m - 69) / 12);

export class AudioEngine {
  constructor(bus) {
    this.bus = bus; this.ctx = null; this.demoTimer = null;
    this.energy = 0; this.beat = 0; this.avgBass = 0; this.lastBeat = 0; this.prevPh = 0;
  }

  init() {
    if (this.ctx) return;
    const c = this.ctx = new AudioContext();
    this.analyser = c.createAnalyser(); this.analyser.fftSize = 512;
    this.data = new Uint8Array(this.analyser.frequencyBinCount);
    this.master = c.createGain(); this.master.gain.value = 0.6;
    this.master.connect(this.analyser);
    this.analyser.connect(c.destination);
  }

  get demoRunning() { return !!this.demoTimer; }

  startDemo() {
    this.init(); this.ctx.resume(); this.el?.pause();
    if (this.demoTimer) return;
    this.next = this.ctx.currentTime + 0.1; this.step = 0;
    this.demoTimer = setInterval(() => this.schedule(), 25);
    this.bus.emit('audio:state', { demo: true });
  }

  stopDemo() {
    clearInterval(this.demoTimer); this.demoTimer = null;
    this.bus.emit('audio:state', { demo: false });
  }

  playFile(file) {
    this.init(); this.ctx.resume(); this.stopDemo();
    if (!this.el) {
      this.el = new Audio(); this.el.loop = true;
      this.ctx.createMediaElementSource(this.el).connect(this.analyser);
    }
    this.el.src = URL.createObjectURL(file);
    this.el.play();
  }

  // --- Sintetizador del beat demo ---
  env(t, peak, dur) {
    const g = this.ctx.createGain();
    g.gain.setValueAtTime(peak, t);
    g.gain.exponentialRampToValueAtTime(0.001, t + dur);
    g.connect(this.master); return g;
  }
  noise() {
    if (!this.noiseBuf) {
      const c = this.ctx;
      this.noiseBuf = c.createBuffer(1, c.sampleRate, c.sampleRate);
      const d = this.noiseBuf.getChannelData(0);
      for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
    }
    const s = this.ctx.createBufferSource(); s.buffer = this.noiseBuf; return s;
  }
  kick(t) {
    const o = this.ctx.createOscillator();
    o.frequency.setValueAtTime(150, t);
    o.frequency.exponentialRampToValueAtTime(45, t + 0.15);
    o.connect(this.env(t, 1, 0.35)); o.start(t); o.stop(t + 0.4);
  }
  filtered(t, type, freq, peak, dur) {
    const n = this.noise(), f = this.ctx.createBiquadFilter();
    f.type = type; f.frequency.value = freq;
    n.connect(f); f.connect(this.env(t, peak, dur)); n.start(t); n.stop(t + dur + 0.02);
  }
  tone(t, midi, dur, vol, type, cutoff) {
    const o = this.ctx.createOscillator(); o.type = type; o.frequency.value = mtof(midi);
    const f = this.ctx.createBiquadFilter(); f.frequency.value = cutoff;
    o.connect(f); f.connect(this.env(t, vol, dur)); o.start(t); o.stop(t + dur + 0.05);
  }
  schedule() {
    const spb = 60 / BPM / 4;
    while (this.next < this.ctx.currentTime + 0.12) {
      const s = this.step % 16, chord = CHORDS[Math.floor(this.step / 16) % 4], t = this.next;
      if (s % 4 === 0) this.kick(t);
      if (s % 2 === 1) this.filtered(t, 'highpass', 7000, 0.12, 0.05);
      if (s === 4 || s === 12) this.filtered(t, 'bandpass', 1800, 0.4, 0.2);
      if ([0, 3, 6, 8, 11, 14].includes(s)) this.tone(t, chord[0] - 24, spb * 2, 0.25, 'square', 600);
      if (s === 0) chord.forEach(n => this.tone(t, n, spb * 16, 0.06, 'sawtooth', 1500));
      if (s % 2 === 0) this.tone(t, chord[(s / 2) % 3] + 12, spb, 0.05, 'triangle', 3000);
      this.next += spb; this.step++;
    }
  }

  // --- Análisis ---
  update(t, dt) {
    const playing = this.ctx && (this.demoTimer || (this.el && !this.el.paused));
    if (playing) {
      this.analyser.getByteFrequencyData(this.data);
      let b = 0; for (let i = 0; i < 8; i++) b += this.data[i]; b /= 8 * 255;
      let all = 0; for (const v of this.data) all += v; all /= this.data.length * 255;
      this.energy += (Math.min(all * 2.5, 1) - this.energy) * 0.1;
      this.avgBass = this.avgBass * 0.95 + b * 0.05;
      if (b > this.avgBass * 1.12 && b > 0.3 && t - this.lastBeat > 0.28) {
        this.beat = 1; this.lastBeat = t; this.bus.emit('audio:beat');
      }
    } else {
      this.energy += (0.3 - this.energy) * 0.05;
      const ph = (t * 1.5) % 1;
      if (ph < this.prevPh) { this.beat = 0.7; this.bus.emit('audio:beat'); }
      this.prevPh = ph;
    }
    this.beat = Math.max(0, this.beat - dt * 3);
    return { energy: this.energy, beat: this.beat };
  }
}