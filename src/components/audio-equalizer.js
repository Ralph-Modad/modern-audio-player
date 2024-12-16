// src/components/audio-equalizer.js

/**
 * Audio equalizer component with 10-band frequency adjustment
 * Provides visual controls for audio frequency manipulation
 */
class AudioEqualizer extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: "open" });
    this.audioContext = null;
    this.bands = [];
  }

  connectedCallback() {
    this.setupDOM();
    this.setupEventListeners();

    // Get reference to audio context from parent
    const audioPlayer = this.closest("audio-player");
    if (audioPlayer) {
      this.audioContext = audioPlayer.audioContext;
      this.setupBands();
    }
  }

  setupDOM() {
    const template = document.createElement("template");
    template.innerHTML = `
            <style>
                :host {
                    display: block;
                    padding: 20px;
                    background: #2a2a2a;
                    border-radius: 8px;
                    color: white;
                }
                .equalizer-container {
                    display: flex;
                    flex-direction: column;
                    gap: 16px;
                }
                .equalizer-header {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                }
                .equalizer-title {
                    font-size: 16px;
                    font-weight: 600;
                    margin: 0;
                }
                .equalizer-controls {
                    display: flex;
                    gap: 8px;
                }
                .equalizer-bands {
                    display: flex;
                    justify-content: space-between;
                    gap: 12px;
                    height: 200px;
                }
                .band {
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    flex: 1;
                }
                .band-slider {
                    writing-mode: bt-lr;
                    -webkit-appearance: slider-vertical;
                    width: 24px;
                    height: 150px;
                    margin: 0;
                }
                .band-label {
                    font-size: 12px;
                    color: #888;
                    margin-top: 8px;
                }
                button {
                    background: #404040;
                    border: none;
                    color: white;
                    padding: 8px 16px;
                    border-radius: 4px;
                    cursor: pointer;
                    font-size: 14px;
                }
                button:hover {
                    background: #505050;
                }
                button.active {
                    background: #1db954;
                }
            </style>
            <div class="equalizer-container">
                <div class="equalizer-header">
                    <h3 class="equalizer-title">Equalizer</h3>
                    <div class="equalizer-controls">
                        <button class="preset-btn" data-preset="flat">Flat</button>
                        <button class="preset-btn" data-preset="rock">Rock</button>
                        <button class="preset-btn" data-preset="pop">Pop</button>
                        <button class="preset-btn" data-preset="jazz">Jazz</button>
                    </div>
                </div>
                <div class="equalizer-bands"></div>
            </div>
        `;
    this.shadowRoot.appendChild(template.content.cloneNode(true));
  }

  setupEventListeners() {
    this.shadowRoot.querySelectorAll(".preset-btn").forEach((btn) => {
      btn.addEventListener("click", () => this.applyPreset(btn.dataset.preset));
    });
  }

  setupBands() {
    if (!this.audioContext) return;

    const bandsContainer = this.shadowRoot.querySelector(".equalizer-bands");
    const frequencies = this.audioContext.getFrequencyBands();

    frequencies.forEach((freq, index) => {
      const band = document.createElement("div");
      band.className = "band";

      const slider = document.createElement("input");
      slider.type = "range";
      slider.className = "band-slider";
      slider.min = -12;
      slider.max = 12;
      slider.value = 0;
      slider.step = 0.1;

      const label = document.createElement("span");
      label.className = "band-label";
      label.textContent = this.formatFrequency(freq);

      slider.addEventListener("input", () => {
        this.updateBand(index, parseFloat(slider.value));
      });

      band.appendChild(slider);
      band.appendChild(label);
      bandsContainer.appendChild(band);
      this.bands.push(slider);
    });
  }

  formatFrequency(freq) {
    if (freq >= 1000) {
      return `${(freq / 1000).toFixed(0)}kHz`;
    }
    return `${freq}Hz`;
  }

  updateBand(index, value) {
    if (this.audioContext) {
      this.audioContext.setEqualizerBand(index, value);
      this.dispatchEvent(
        new CustomEvent("equalizerChange", {
          detail: { band: index, value },
        })
      );
    }
  }

  applyPreset(preset) {
    const presets = {
      flat: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
      rock: [4.5, 3, 2, 0, -0.5, -1, 2, 3, 3.5, 4],
      pop: [-1.5, -1, 0, 2, 4, 4, 2, 0, -1, -1.5],
      jazz: [3, 2, 1, 2, -2, -2, 0, 1, 2, 3],
    };

    const values = presets[preset] || presets.flat;

    // Update sliders and bands
    this.bands.forEach((slider, index) => {
      slider.value = values[index];
      this.updateBand(index, values[index]);
    });

    // Update active preset button
    this.shadowRoot.querySelectorAll(".preset-btn").forEach((btn) => {
      btn.classList.toggle("active", btn.dataset.preset === preset);
    });
  }

  reset() {
    this.applyPreset("flat");
  }
}

customElements.define("audio-equalizer", AudioEqualizer);
