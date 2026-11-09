/**
 * Web Audio API Sound Synthesizer for RT Subway
 * 100% procedural, zero external audio files, zero 404 risk.
 */

class SoundManager {
  private ctx: AudioContext | null = null;
  private sfxGain: GainNode | null = null;
  private musicGain: GainNode | null = null;
  private isMusicPlaying = false;
  private musicIntervalId: number | null = null;
  private sfxMuted = false;
  private musicMuted = false;
  private sfxVolume = 0.8;
  private musicVolume = 0.5;
  private coinPitchIndex = 0;
  private pentatonicNotes = [523.25, 587.33, 659.25, 783.99, 880.0, 1046.5]; // C5, D5, E5, G5, A5, C6
  private tempo = 126; // BPM

  constructor() {
    // Load persisted sound preferences
    try {
      const saved = localStorage.getItem('rt_subway_audio_settings');
      if (saved) {
        const parsed = JSON.parse(saved);
        this.sfxMuted = !!parsed.sfxMuted;
        this.musicMuted = !!parsed.musicMuted;
        this.sfxVolume = parsed.sfxVolume ?? 0.8;
        this.musicVolume = parsed.musicVolume ?? 0.5;
      }
    } catch {
      // fallback to defaults
    }
  }

  private initContext() {
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      this.ctx = new AudioCtx();

      this.sfxGain = this.ctx.createGain();
      this.sfxGain.gain.value = this.sfxMuted ? 0 : this.sfxVolume;
      this.sfxGain.connect(this.ctx.destination);

      this.musicGain = this.ctx.createGain();
      this.musicGain.gain.value = this.musicMuted ? 0 : this.musicVolume;
      this.musicGain.connect(this.ctx.destination);
    }

    if (this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }
  }

  public userGestureInit() {
    this.initContext();
  }

  public setSfxMuted(muted: boolean) {
    this.sfxMuted = muted;
    if (this.sfxGain) {
      this.sfxGain.gain.value = muted ? 0 : this.sfxVolume;
    }
    this.saveSettings();
  }

  public setMusicMuted(muted: boolean) {
    this.musicMuted = muted;
    if (this.musicGain) {
      this.musicGain.gain.value = muted ? 0 : this.musicVolume;
    }
    this.saveSettings();
  }

  public setSfxVolume(vol: number) {
    this.sfxVolume = Math.max(0, Math.min(1, vol));
    if (this.sfxGain && !this.sfxMuted) {
      this.sfxGain.gain.value = this.sfxVolume;
    }
    this.saveSettings();
  }

  public setMusicVolume(vol: number) {
    this.musicVolume = Math.max(0, Math.min(1, vol));
    if (this.musicGain && !this.musicMuted) {
      this.musicGain.gain.value = this.musicVolume;
    }
    this.saveSettings();
  }

  public getSettings() {
    return {
      sfxMuted: this.sfxMuted,
      musicMuted: this.musicMuted,
      sfxVolume: this.sfxVolume,
      musicVolume: this.musicVolume,
    };
  }

  private saveSettings() {
    try {
      localStorage.setItem(
        'rt_subway_audio_settings',
        JSON.stringify({
          sfxMuted: this.sfxMuted,
          musicMuted: this.musicMuted,
          sfxVolume: this.sfxVolume,
          musicVolume: this.musicVolume,
        })
      );
    } catch {
      // ignore
    }
  }

  // --- SOUND EFFECTS ---

  public playCoin() {
    if (this.sfxMuted) return;
    this.initContext();
    if (!this.ctx || !this.sfxGain) return;

    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    const note = this.pentatonicNotes[this.coinPitchIndex % this.pentatonicNotes.length];
    this.coinPitchIndex++;

    osc.type = 'sine';
    osc.frequency.setValueAtTime(note, t);
    osc.frequency.exponentialRampToValueAtTime(note * 1.5, t + 0.12);

    gain.gain.setValueAtTime(0.25, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.18);

    osc.connect(gain);
    gain.connect(this.sfxGain);

    osc.start(t);
    osc.stop(t + 0.2);
  }

  public resetCoinPitch() {
    this.coinPitchIndex = 0;
  }

  public playJump() {
    if (this.sfxMuted) return;
    this.initContext();
    if (!this.ctx || !this.sfxGain) return;

    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(160, t);
    osc.frequency.exponentialRampToValueAtTime(420, t + 0.18);

    gain.gain.setValueAtTime(0.3, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.22);

    osc.connect(gain);
    gain.connect(this.sfxGain);

    osc.start(t);
    osc.stop(t + 0.25);
  }

  public playSlide() {
    if (this.sfxMuted) return;
    this.initContext();
    if (!this.ctx || !this.sfxGain) return;

    const t = this.ctx.currentTime;
    // White noise buffer for ground swoosh
    const bufferSize = this.ctx.sampleRate * 0.25;
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }

    const noise = this.ctx.createBufferSource();
    noise.buffer = buffer;

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(900, t);
    filter.frequency.exponentialRampToValueAtTime(300, t + 0.22);
    filter.Q.value = 3.0;

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.35, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.25);

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(this.sfxGain);

    noise.start(t);
  }

  public playLaneSwitch() {
    if (this.sfxMuted) return;
    this.initContext();
    if (!this.ctx || !this.sfxGain) return;

    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(320, t);
    osc.frequency.exponentialRampToValueAtTime(540, t + 0.08);

    gain.gain.setValueAtTime(0.18, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.1);

    osc.connect(gain);
    gain.connect(this.sfxGain);

    osc.start(t);
    osc.stop(t + 0.12);
  }

  public playTrainHorn() {
    if (this.sfxMuted) return;
    this.initContext();
    if (!this.ctx || !this.sfxGain) return;

    const t = this.ctx.currentTime;
    const osc1 = this.ctx.createOscillator();
    const osc2 = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    // Commuter two-tone train horn chord (F3 & G#3)
    osc1.type = 'sawtooth';
    osc1.frequency.setValueAtTime(174.61, t);
    osc2.type = 'sawtooth';
    osc2.frequency.setValueAtTime(207.65, t);

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(900, t);

    gain.gain.setValueAtTime(0.01, t);
    gain.gain.linearRampToValueAtTime(0.28, t + 0.1);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.65);

    osc1.connect(filter);
    osc2.connect(filter);
    filter.connect(gain);
    gain.connect(this.sfxGain);

    osc1.start(t);
    osc2.start(t);
    osc1.stop(t + 0.7);
    osc2.stop(t + 0.7);
  }

  public playCrash() {
    if (this.sfxMuted) return;
    this.initContext();
    if (!this.ctx || !this.sfxGain) return;

    const t = this.ctx.currentTime;
    // Low sub thump
    const subOsc = this.ctx.createOscillator();
    const subGain = this.ctx.createGain();
    subOsc.type = 'sine';
    subOsc.frequency.setValueAtTime(120, t);
    subOsc.frequency.exponentialRampToValueAtTime(25, t + 0.45);

    subGain.gain.setValueAtTime(0.5, t);
    subGain.gain.exponentialRampToValueAtTime(0.001, t + 0.45);

    subOsc.connect(subGain);
    subGain.connect(this.sfxGain);
    subOsc.start(t);
    subOsc.stop(t + 0.5);

    // Metal clash noise
    const bufferSize = this.ctx.sampleRate * 0.4;
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (bufferSize * 0.2));
    }
    const noise = this.ctx.createBufferSource();
    noise.buffer = buffer;

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(1200, t);
    filter.Q.value = 4;

    const noiseGain = this.ctx.createGain();
    noiseGain.gain.setValueAtTime(0.4, t);
    noiseGain.gain.exponentialRampToValueAtTime(0.001, t + 0.4);

    noise.connect(filter);
    filter.connect(noiseGain);
    noiseGain.connect(this.sfxGain);

    noise.start(t);
  }

  public playButtonClick() {
    if (this.sfxMuted) return;
    this.initContext();
    if (!this.ctx || !this.sfxGain) return;

    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(680, t);
    osc.frequency.exponentialRampToValueAtTime(920, t + 0.05);

    gain.gain.setValueAtTime(0.15, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.06);

    osc.connect(gain);
    gain.connect(this.sfxGain);

    osc.start(t);
    osc.stop(t + 0.07);
  }

  public playPurchase() {
    if (this.sfxMuted) return;
    this.initContext();
    if (!this.ctx || !this.sfxGain) return;

    const t = this.ctx.currentTime;
    [523.25, 659.25, 783.99, 1046.5].forEach((freq, idx) => {
      if (!this.ctx || !this.sfxGain) return;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, t + idx * 0.07);

      gain.gain.setValueAtTime(0.2, t + idx * 0.07);
      gain.gain.exponentialRampToValueAtTime(0.001, t + idx * 0.07 + 0.2);

      osc.connect(gain);
      gain.connect(this.sfxGain);
      osc.start(t + idx * 0.07);
      osc.stop(t + idx * 0.07 + 0.22);
    });
  }

  // --- PROCEDURAL BACKGROUND SYNTH MUSIC ---
  // Energetic arcade electronic loop: bassline + arpeggiated melodic motifs

  public startMusic() {
    if (this.isMusicPlaying) return;
    this.initContext();
    this.isMusicPlaying = true;

    let step = 0;
    const sixteenth = (60 / this.tempo) / 4; // seconds per 16th note

    // Chord progression in A minor: Am -> F -> C -> G
    const chords = [
      [220.0, 261.63, 329.63], // Am (A3, C4, E4)
      [174.61, 220.0, 261.63], // F (F3, A3, C4)
      [261.63, 329.63, 392.0], // C (C4, E4, G4)
      [196.0, 246.94, 293.66], // G (G3, B3, D4)
    ];

    const bassNotes = [110.0, 87.31, 130.81, 98.0]; // A2, F2, C3, G2

    this.musicIntervalId = window.setInterval(() => {
      if (!this.isMusicPlaying || !this.ctx || !this.musicGain || this.musicMuted) {
        step = (step + 1) % 64;
        return;
      }

      const t = this.ctx.currentTime + 0.02;
      const bar = Math.floor(step / 16) % 4;
      const beat = step % 16;

      // 1. Bassline (running 8th note groove)
      if (beat % 2 === 0) {
        const bassOsc = this.ctx.createOscillator();
        const bassGain = this.ctx.createGain();
        bassOsc.type = 'sawtooth';

        const baseFreq = bassNotes[bar];
        const oct = beat === 4 || beat === 12 ? 1.5 : 1.0;
        bassOsc.frequency.setValueAtTime(baseFreq * oct, t);

        const filter = this.ctx.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(450, t);

        bassGain.gain.setValueAtTime(0.18, t);
        bassGain.gain.exponentialRampToValueAtTime(0.001, t + sixteenth * 1.8);

        bassOsc.connect(filter);
        filter.connect(bassGain);
        bassGain.connect(this.musicGain);

        bassOsc.start(t);
        bassOsc.stop(t + sixteenth * 2);
      }

      // 2. Arpeggio lead
      const currentChord = chords[bar];
      const noteIdx = [0, 1, 2, 1, 2, 0, 1, 2][beat % 8];
      const arpFreq = currentChord[noteIdx] * (beat > 7 ? 2 : 1);

      const leadOsc = this.ctx.createOscillator();
      const leadGain = this.ctx.createGain();
      leadOsc.type = 'square';
      leadOsc.frequency.setValueAtTime(arpFreq, t);

      leadGain.gain.setValueAtTime(0.08, t);
      leadGain.gain.exponentialRampToValueAtTime(0.001, t + sixteenth * 0.9);

      leadOsc.connect(leadGain);
      leadGain.connect(this.musicGain);
      leadOsc.start(t);
      leadOsc.stop(t + sixteenth);

      // 3. Kick drum on beats 0, 4, 8, 12
      if (beat % 4 === 0) {
        const kickOsc = this.ctx.createOscillator();
        const kickGain = this.ctx.createGain();
        kickOsc.type = 'sine';
        kickOsc.frequency.setValueAtTime(140, t);
        kickOsc.frequency.exponentialRampToValueAtTime(45, t + 0.08);

        kickGain.gain.setValueAtTime(0.24, t);
        kickGain.gain.exponentialRampToValueAtTime(0.001, t + 0.09);

        kickOsc.connect(kickGain);
        kickGain.connect(this.musicGain);
        kickOsc.start(t);
        kickOsc.stop(t + 0.1);
      }

      // 4. Snare / Clack on beats 4 and 12
      if (beat === 4 || beat === 12) {
        const snareNoise = this.ctx.createBufferSource();
        const buf = this.ctx.createBuffer(1, Math.floor(this.ctx.sampleRate * 0.08), this.ctx.sampleRate);
        const d = buf.getChannelData(0);
        for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
        snareNoise.buffer = buf;

        const sFilter = this.ctx.createBiquadFilter();
        sFilter.type = 'highpass';
        sFilter.frequency.setValueAtTime(1200, t);

        const sGain = this.ctx.createGain();
        sGain.gain.setValueAtTime(0.12, t);
        sGain.gain.exponentialRampToValueAtTime(0.001, t + 0.08);

        snareNoise.connect(sFilter);
        sFilter.connect(sGain);
        sGain.connect(this.musicGain);
        snareNoise.start(t);
      }

      step = (step + 1) % 64;
    }, sixteenth * 1000);
  }

  public stopMusic() {
    this.isMusicPlaying = false;
    if (this.musicIntervalId !== null) {
      clearInterval(this.musicIntervalId);
      this.musicIntervalId = null;
    }
  }
}

export const soundManager = new SoundManager();
