/* StudyQuest RPG - Web Audio Sound Engine & Ambient Generators */

class SoundEngine {
  constructor() {
    this.ctx = null;
    this.ambientNodes = {};
    this.isMuted = false;
    this.setupGestureUnlock();
  }

  setupGestureUnlock() {
    const unlock = () => {
      this.init();
      window.removeEventListener('click', unlock);
      window.removeEventListener('touchstart', unlock);
      window.removeEventListener('keydown', unlock);
    };
    window.addEventListener('click', unlock, { once: true });
    window.addEventListener('touchstart', unlock, { once: true });
    window.addEventListener('keydown', unlock, { once: true });
  }

  init() {
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      this.ctx = new AudioCtx();
    }
    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  // --- Sound Effects (SFX) Synthesizers ---
  playClick() {
    if (this.isMuted) return;
    this.init();
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    
    osc.type = 'sine';
    osc.frequency.setValueAtTime(600, this.ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(200, this.ctx.currentTime + 0.05);
    
    gain.gain.setValueAtTime(0.15, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.05);
    
    osc.connect(gain);
    gain.connect(this.ctx.destination);
    
    osc.start();
    osc.stop(this.ctx.currentTime + 0.05);
  }

  playAttack() {
    if (this.isMuted) return;
    this.init();
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(300, this.ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(80, this.ctx.currentTime + 0.15);
    
    gain.gain.setValueAtTime(0.25, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.15);
    
    osc.connect(gain);
    gain.connect(this.ctx.destination);
    
    osc.start();
    osc.stop(this.ctx.currentTime + 0.15);
  }

  playLevelUp() {
    if (this.isMuted) return;
    this.init();
    const now = this.ctx.currentTime;
    const notes = [440, 554.37, 659.25, 880]; // A4, C#5, E5, A5
    
    notes.forEach((freq, idx) => {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, now + idx * 0.1);
      
      gain.gain.setValueAtTime(0, now + idx * 0.1);
      gain.gain.linearRampToValueAtTime(0.3, now + idx * 0.1 + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.1 + 0.3);
      
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      
      osc.start(now + idx * 0.1);
      osc.stop(now + idx * 0.1 + 0.35);
    });
  }

  playVictory() {
    if (this.isMuted) return;
    this.init();
    const now = this.ctx.currentTime;
    const chords = [523.25, 659.25, 783.99, 1046.50]; // C5, E5, G5, C6
    
    chords.forEach((freq) => {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, now);
      
      gain.gain.setValueAtTime(0.2, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.8);
      
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      
      osc.start(now);
      osc.stop(now + 0.8);
    });
  }

  // --- Ambient Soundscape Synthesizers ---
  setAmbientVolume(type, val) { // val between 0 and 1
    this.init();
    if (!this.ambientNodes[type]) {
      if (val > 0) this.startAmbientTrack(type);
      else return;
    }
    
    if (this.ambientNodes[type]) {
      const gainNode = this.ambientNodes[type].gain;
      gainNode.gain.setValueAtTime(val * 0.25, this.ctx.currentTime);
    }
  }

  startAmbientTrack(type) {
    if (type === 'rain') {
      // White noise buffer filtered for rain effect
      const bufferSize = 2 * this.ctx.sampleRate;
      const noiseBuffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
      const output = noiseBuffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        output[i] = Math.random() * 2 - 1;
      }

      const whiteNoise = this.ctx.createBufferSource();
      whiteNoise.buffer = noiseBuffer;
      whiteNoise.loop = true;

      const filter = this.ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.value = 1000;

      const gain = this.ctx.createGain();
      gain.gain.value = 0;

      whiteNoise.connect(filter);
      filter.connect(gain);
      gain.connect(this.ctx.destination);
      whiteNoise.start();

      this.ambientNodes['rain'] = { source: whiteNoise, gain: gain };
    } 
    else if (type === 'binaural') {
      // Alpha waves 10Hz difference (Left 200Hz, Right 210Hz)
      const oscL = this.ctx.createOscillator();
      const oscR = this.ctx.createOscillator();
      
      oscL.frequency.value = 200;
      oscR.frequency.value = 210;

      const merger = this.ctx.createChannelMerger(2);
      oscL.connect(merger, 0, 0); // left
      oscR.connect(merger, 0, 1); // right

      const gain = this.ctx.createGain();
      gain.gain.value = 0;

      merger.connect(gain);
      gain.connect(this.ctx.destination);

      oscL.start();
      oscR.start();

      this.ambientNodes['binaural'] = { sourceL: oscL, sourceR: oscR, gain: gain };
    }
    else if (type === 'space') {
      // Deep lo-fi synth drone
      const osc = this.ctx.createOscillator();
      osc.type = 'triangle';
      osc.frequency.value = 65.41; // C2 deep pitch

      const filter = this.ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.value = 350;

      const gain = this.ctx.createGain();
      gain.gain.value = 0;

      osc.connect(filter);
      filter.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start();

      this.ambientNodes['space'] = { source: osc, gain: gain };
    }
  }
}

window.soundEngine = new SoundEngine();
