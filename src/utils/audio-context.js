// src/utils/audio-context.js

/**
 * Manages Web Audio API context and audio processing nodes
 * Handles initialization, connection management, and audio processing setup
 */
export class AudioContextManager {
  constructor() {
    this.context = null;
    this.sourceNode = null;
    this.analyserNode = null;
    this.gainNode = null;
    this.equalizerNodes = [];
    this.frequencyBands = [
      60, 170, 310, 600, 1000, 3000, 6000, 12000, 14000, 16000,
    ];
    this.initialized = false;
  }

  async initialize(audioElement) {
    if (this.initialized) return;

    try {
      this.context = new (window.AudioContext || window.webkitAudioContext)();
      await this.context.resume();

      // Create and configure nodes
      this.sourceNode = this.context.createMediaElementSource(audioElement);
      this.analyserNode = this.context.createAnalyser();
      this.gainNode = this.context.createGain();

      // Configure analyser
      this.analyserNode.fftSize = 2048;
      this.analyserNode.smoothingTimeConstant = 0.8;

      // Create equalizer bands
      this.setupEqualizer();

      // Connect the audio graph
      this.connectNodes();

      this.initialized = true;
    } catch (error) {
      console.error("Failed to initialize AudioContext:", error);
      throw error;
    }
  }

  setupEqualizer() {
    // Create filters for each frequency band
    this.equalizerNodes = this.frequencyBands.map((frequency) => {
      const filter = this.context.createBiquadFilter();
      filter.type = "peaking";
      filter.frequency.value = frequency;
      filter.Q.value = 1;
      filter.gain.value = 0;
      return filter;
    });
  }

  connectNodes() {
    // Connect source to first equalizer node
    this.sourceNode.connect(this.equalizerNodes[0]);

    // Connect equalizer nodes in series
    this.equalizerNodes.reduce((prev, curr) => {
      prev.connect(curr);
      return curr;
    });

    // Connect last equalizer to analyser and gain
    const lastEqualizer = this.equalizerNodes[this.equalizerNodes.length - 1];
    lastEqualizer.connect(this.analyserNode);
    this.analyserNode.connect(this.gainNode);
    this.gainNode.connect(this.context.destination);
  }

  async resume() {
    if (this.context?.state === "suspended") {
      await this.context.resume();
    }
  }

  setVolume(value) {
    if (this.gainNode) {
      this.gainNode.gain.value = Math.max(0, Math.min(1, value));
    }
  }

  setEqualizerBand(index, value) {
    if (index >= 0 && index < this.equalizerNodes.length) {
      this.equalizerNodes[index].gain.value = value;
    }
  }

  getFrequencyData() {
    if (!this.analyserNode) return null;

    const dataArray = new Uint8Array(this.analyserNode.frequencyBinCount);
    this.analyserNode.getByteFrequencyData(dataArray);
    return dataArray;
  }

  getWaveformData() {
    if (!this.analyserNode) return null;

    const dataArray = new Uint8Array(this.analyserNode.frequencyBinCount);
    this.analyserNode.getByteTimeDomainData(dataArray);
    return dataArray;
  }

  disconnect() {
    if (this.sourceNode) {
      this.sourceNode.disconnect();
    }
    if (this.gainNode) {
      this.gainNode.disconnect();
    }
    this.equalizerNodes.forEach((node) => node.disconnect());
    if (this.analyserNode) {
      this.analyserNode.disconnect();
    }
  }

  getFrequencyBands() {
    return this.frequencyBands;
  }
}
