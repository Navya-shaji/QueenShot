class AudioService {
  private ctx: AudioContext | null = null;

  private init() {
    if (!this.ctx) {
      // Create audio context on first user interaction
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioContextClass) {
        this.ctx = new AudioContextClass();
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  /**
   * Synthesizes a wood clacking sound when two pucks collide.
   * @param intensity Value between 0 and 1 representing collision force
   */
  public playClick(intensity: number) {
    try {
      this.init();
      if (!this.ctx) return;

      const clampedIntensity = Math.min(Math.max(intensity, 0.05), 1.0);
      const now = this.ctx.currentTime;

      // 1. Oscillator for primary impact body
      const osc = this.ctx.createOscillator();
      const gainNode = this.ctx.createGain();

      osc.type = 'sine';
      // High frequency pitch for wood-on-wood impact (e.g. 1000Hz - 1600Hz)
      const baseFreq = 1200 + Math.random() * 400;
      osc.frequency.setValueAtTime(baseFreq, now);
      // Sweeping frequency down quickly creates the "click" texture
      osc.frequency.exponentialRampToValueAtTime(100, now + 0.04);

      // Volume decays extremely rapidly (fraction of a second)
      gainNode.gain.setValueAtTime(clampedIntensity * 0.3, now);
      gainNode.gain.exponentialRampToValueAtTime(0.0001, now + 0.05);

      osc.connect(gainNode);
      gainNode.connect(this.ctx.destination);

      osc.start(now);
      osc.stop(now + 0.06);

      // 2. Highpass-filtered white noise for a bit of wooden surface friction texture (subtle)
      if (clampedIntensity > 0.3) {
        const bufferSize = this.ctx.sampleRate * 0.02; // Very short burst
        const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
        const data = buffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) {
          data[i] = Math.random() * 2 - 1;
        }

        const noise = this.ctx.createBufferSource();
        noise.buffer = buffer;

        const noiseFilter = this.ctx.createBiquadFilter();
        noiseFilter.type = 'highpass';
        noiseFilter.frequency.setValueAtTime(2000, now);

        const noiseGain = this.ctx.createGain();
        noiseGain.gain.setValueAtTime(clampedIntensity * 0.05, now);
        noiseGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.02);

        noise.connect(noiseFilter);
        noiseFilter.connect(noiseGain);
        noiseGain.connect(this.ctx.destination);

        noise.start(now);
        noise.stop(now + 0.03);
      }
    } catch (err) {
      console.warn('Audio Service playClick failed:', err);
    }
  }

  /**
   * Synthesizes a heavy wood thud sound when a puck hits the outer boundary bumper.
   * @param intensity Value between 0 and 1 representing border impact force
   */
  public playThud(intensity: number) {
    try {
      this.init();
      if (!this.ctx) return;

      const clampedIntensity = Math.min(Math.max(intensity, 0.05), 1.0);
      const now = this.ctx.currentTime;

      // Lower pitch triangle wave oscillator for hollow bumper bounce sound
      const osc = this.ctx.createOscillator();
      const gainNode = this.ctx.createGain();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(140 + Math.random() * 30, now);
      osc.frequency.exponentialRampToValueAtTime(40, now + 0.12);

      // Slower decay envelope than click
      gainNode.gain.setValueAtTime(clampedIntensity * 0.25, now);
      gainNode.gain.exponentialRampToValueAtTime(0.0001, now + 0.15);

      // Add a lowpass filter to remove high frequencies and make it sound "solid" and dampened
      const filter = this.ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(300, now);

      osc.connect(filter);
      filter.connect(gainNode);
      gainNode.connect(this.ctx.destination);

      osc.start(now);
      osc.stop(now + 0.16);
    } catch (err) {
      console.warn('Audio Service playThud failed:', err);
    }
  }
}

export const audio = new AudioService();
