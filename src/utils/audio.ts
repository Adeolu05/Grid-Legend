/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

class SoundEngine {
  private ctx: AudioContext | null = null;
  private engineOsc: OscillatorNode | null = null;
  private engineGain: GainNode | null = null;
  private currentFrequency: number = 80;
  private isEnginePlaying: boolean = false;

  private init() {
    if (this.ctx) return;
    try {
      this.ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
    } catch (e) {
      console.warn("Web Audio not supported or blocked in this context:", e);
    }
  }

  resume() {
    this.init();
    if (this.ctx && this.ctx.state === "suspended") {
      this.ctx.resume();
    }
  }

  // --- UI Sounds ---
  playHover() {
    this.init();
    if (!this.ctx) return;
    this.resume();

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.type = "sine";
    osc.frequency.setValueAtTime(600, this.ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(1200, this.ctx.currentTime + 0.08);

    gain.gain.setValueAtTime(0.02, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.0001, this.ctx.currentTime + 0.08);

    osc.start();
    osc.stop(this.ctx.currentTime + 0.08);
  }

  playClick() {
    this.init();
    if (!this.ctx) return;
    this.resume();

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.type = "sawtooth";
    osc.frequency.setValueAtTime(200, this.ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(900, this.ctx.currentTime + 0.15);

    gain.gain.setValueAtTime(0.05, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.0001, this.ctx.currentTime + 0.15);

    osc.start();
    osc.stop(this.ctx.currentTime + 0.15);
  }

  playSelect() {
    this.init();
    if (!this.ctx) return;
    this.resume();

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.type = "triangle";
    osc.frequency.setValueAtTime(350, this.ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(700, this.ctx.currentTime + 0.25);

    gain.gain.setValueAtTime(0.08, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.0001, this.ctx.currentTime + 0.25);

    osc.start();
    osc.stop(this.ctx.currentTime + 0.25);
  }

  // --- Gameplay Sounds ---
  startEngine() {
    this.init();
    if (!this.ctx || this.isEnginePlaying) return;
    this.resume();

    try {
      this.engineOsc = this.ctx.createOscillator();
      this.engineGain = this.ctx.createGain();

      this.engineOsc.type = "sawtooth";
      this.engineOsc.frequency.setValueAtTime(this.currentFrequency, this.ctx.currentTime);

      this.engineGain.gain.setValueAtTime(0.03, this.ctx.currentTime);

      // Simple low pass filter to make it sound rumblingly beefy
      const filter = this.ctx.createBiquadFilter();
      filter.type = "lowpass";
      filter.frequency.setValueAtTime(180, this.ctx.currentTime);

      this.engineOsc.connect(filter);
      filter.connect(this.engineGain);
      this.engineGain.connect(this.ctx.destination);

      this.engineOsc.start();
      this.isEnginePlaying = true;
    } catch (e) {
      console.warn("Engine audio init failed:", e);
    }
  }

  setEngineSpeed(speedRatio: number, isBoosting: boolean) {
    if (!this.ctx || !this.isEnginePlaying || !this.engineOsc) return;
    
    // Normalize speed ratio (0 to 1) to (60Hz to 280Hz)
    const baseFreq = 60 + speedRatio * 180 + (isBoosting ? 120 : 0);
    this.engineOsc.frequency.setTargetAtTime(baseFreq, this.ctx.currentTime, 0.1);
    
    if (this.engineGain) {
      const vol = 0.02 + speedRatio * 0.03 + (isBoosting ? 0.03 : 0);
      this.engineGain.gain.setTargetAtTime(vol, this.ctx.currentTime, 0.1);
    }
  }

  stopEngine() {
    if (this.engineOsc) {
      try {
        this.engineOsc.stop();
        this.engineOsc.disconnect();
      } catch (e) {}
      this.engineOsc = null;
    }
    if (this.engineGain) {
      try { this.engineGain.disconnect(); } catch (e) {}
      this.engineGain = null;
    }
    this.isEnginePlaying = false;
  }

  playBoost() {
    this.init();
    if (!this.ctx) return;
    this.resume();

    // High frequency rising synth for massive speed activation
    const osc1 = this.ctx.createOscillator();
    const osc2 = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc1.type = "sine";
    osc1.frequency.setValueAtTime(400, this.ctx.currentTime);
    osc1.frequency.exponentialRampToValueAtTime(2200, this.ctx.currentTime + 0.8);

    osc2.type = "sawtooth";
    osc2.frequency.setValueAtTime(200, this.ctx.currentTime);
    osc2.frequency.exponentialRampToValueAtTime(1100, this.ctx.currentTime + 0.8);

    gain.gain.setValueAtTime(0.08, this.ctx.currentTime);
    gain.gain.linearRampToValueAtTime(0.04, this.ctx.currentTime + 0.3);
    gain.gain.exponentialRampToValueAtTime(0.0001, this.ctx.currentTime + 0.8);

    const filter = this.ctx.createBiquadFilter();
    filter.type = "highpass";
    filter.frequency.setValueAtTime(300, this.ctx.currentTime);

    osc1.connect(filter);
    osc2.connect(filter);
    filter.connect(gain);
    gain.connect(this.ctx.destination);

    osc1.start();
    osc2.start();
    osc1.stop(this.ctx.currentTime + 0.8);
    osc2.stop(this.ctx.currentTime + 0.8);
  }

  playCrash() {
    this.init();
    if (!this.ctx) return;
    this.resume();

    // Sudden explosion noise sequence
    const bufferSize = this.ctx.sampleRate * 0.4; // 0.4s buffer
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }

    const noise = this.ctx.createBufferSource();
    noise.buffer = buffer;

    const filter = this.ctx.createBiquadFilter();
    filter.type = "lowpass";
    filter.frequency.setValueAtTime(800, this.ctx.currentTime);
    filter.frequency.exponentialRampToValueAtTime(80, this.ctx.currentTime + 0.4);

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.15, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.0001, this.ctx.currentTime + 0.4);

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(this.ctx.destination);

    noise.start();
    noise.stop(this.ctx.currentTime + 0.4);
  }

  playVictory() {
    this.init();
    if (!this.ctx) return;
    this.resume();

    const notes = [261.63, 329.63, 392.00, 523.25, 659.25, 783.99, 1046.50]; // C major chord arpeggio
    notes.forEach((freq, idx) => {
      if (!this.ctx) return;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = "sine";
      osc.frequency.setValueAtTime(freq, this.ctx.currentTime + idx * 0.08);

      gain.gain.setValueAtTime(0.0, this.ctx.currentTime);
      gain.gain.linearRampToValueAtTime(0.05, this.ctx.currentTime + idx * 0.08 + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0001, this.ctx.currentTime + idx * 0.08 + 0.6);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(this.ctx.currentTime + idx * 0.08);
      osc.stop(this.ctx.currentTime + idx * 0.08 + 0.6);
    });
  }

  playDefeat() {
    this.init();
    if (!this.ctx) return;
    this.resume();

    const notes = [392.00, 349.23, 311.13, 261.63]; // Descending moody progression
    notes.forEach((freq, idx) => {
      if (!this.ctx) return;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = "triangle";
      osc.frequency.setValueAtTime(freq, this.ctx.currentTime + idx * 0.15);

      gain.gain.setValueAtTime(0.0, this.ctx.currentTime);
      gain.gain.linearRampToValueAtTime(0.06, this.ctx.currentTime + idx * 0.15 + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0001, this.ctx.currentTime + idx * 0.15 + 0.8);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(this.ctx.currentTime + idx * 0.15);
      osc.stop(this.ctx.currentTime + idx * 0.15 + 0.8);
    });
  }
}

export const audio = new SoundEngine();
