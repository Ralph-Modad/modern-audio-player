// src/components/audio-visualizer.js

/**
 * Audio visualizer component with multiple visualization modes
 * Includes spectrum analyzer and waveform display
 */
class AudioVisualizer extends HTMLElement {
  static get observedAttributes() {
    return ["type"];
  }

  constructor() {
    super();
    this.attachShadow({ mode: "open" });
    this.audioContext = null;
    this.animationFrame = null;
    this.canvas = null;
    this.ctx = null;
    this.visualizationType = "spectrum"; // or 'waveform'
    this.gradientColors = [
      "rgba(29, 185, 84, 0.8)", // Spotify green
      "rgba(29, 185, 84, 0.5)",
      "rgba(29, 185, 84, 0.3)",
      "rgba(29, 185, 84, 0.1)",
    ];
  }

  connectedCallback() {
    this.setupDOM();
    this.setupCanvas();

    // Get reference to audio context from parent
    const audioPlayer = this.closest("audio-player");
    if (audioPlayer) {
      this.audioContext = audioPlayer.audioContext;
      this.startVisualization();
    }
  }

  disconnectedCallback() {
    this.stopVisualization();
  }

  setupDOM() {
    const template = document.createElement("template");
    template.innerHTML = `
            <style>
                :host {
                    display: block;
                    width: 100%;
                    background: #1a1a1a;
                    border-radius: 8px;
                    overflow: hidden;
                }
                .visualizer-container {
                    position: relative;
                    width: 100%;
                    height: 200px;
                }
                canvas {
                    width: 100%;
                    height: 100%;
                    display: block;
                }
                .controls {
                    position: absolute;
                    top: 10px;
                    right: 10px;
                    display: flex;
                    gap: 8px;
                    background: rgba(0, 0, 0, 0.5);
                    padding: 8px;
                    border-radius: 4px;
                }
                button {
                    background: none;
                    border: 1px solid rgba(255, 255, 255, 0.3);
                    color: white;
                    padding: 4px 8px;
                    border-radius: 4px;
                    cursor: pointer;
                    font-size: 12px;
                }
                button:hover {
                    background: rgba(255, 255, 255, 0.1);
                }
                button.active {
                    background: #1db954;
                    border-color: #1db954;
                }
            </style>
            <div class="visualizer-container">
                <canvas></canvas>
                <div class="controls">
                    <button class="type-btn" data-type="spectrum">Spectrum</button>
                    <button class="type-btn" data-type="waveform">Waveform</button>
                </div>
            </div>
        `;
    this.shadowRoot.appendChild(template.content.cloneNode(true));

    // Setup visualization type buttons
    this.shadowRoot.querySelectorAll(".type-btn").forEach((btn) => {
      btn.addEventListener("click", () =>
        this.setVisualizationType(btn.dataset.type)
      );
    });
  }

  setupCanvas() {
    this.canvas = this.shadowRoot.querySelector("canvas");
    this.ctx = this.canvas.getContext("2d");

    // Set canvas size with device pixel ratio for sharp rendering
    const updateCanvasSize = () => {
      const container = this.canvas.parentElement;
      const dpr = window.devicePixelRatio || 1;
      const rect = container.getBoundingClientRect();

      this.canvas.width = rect.width * dpr;
      this.canvas.height = rect.height * dpr;
      this.ctx.scale(dpr, dpr);

      // Create gradient
      this.gradient = this.ctx.createLinearGradient(0, 0, 0, rect.height);
      this.gradientColors.forEach((color, index) => {
        this.gradient.addColorStop(
          index / (this.gradientColors.length - 1),
          color
        );
      });
    };

    // Handle resize
    const resizeObserver = new ResizeObserver(updateCanvasSize);
    resizeObserver.observe(this.canvas.parentElement);
    updateCanvasSize();
  }

  startVisualization() {
    const draw = () => {
      if (!this.audioContext) return;

      const data =
        this.visualizationType === "spectrum"
          ? this.audioContext.getFrequencyData()
          : this.audioContext.getWaveformData();

      if (!data) return;

      this.clearCanvas();

      if (this.visualizationType === "spectrum") {
        this.drawSpectrum(data);
      } else {
        this.drawWaveform(data);
      }

      this.animationFrame = requestAnimationFrame(draw);
    };

    draw();
  }

  stopVisualization() {
    if (this.animationFrame) {
      cancelAnimationFrame(this.animationFrame);
    }
  }

  clearCanvas() {
    const { width, height } = this.canvas;
    this.ctx.clearRect(
      0,
      0,
      width / window.devicePixelRatio,
      height / window.devicePixelRatio
    );
  }

  drawSpectrum(data) {
    const width = this.canvas.width / window.devicePixelRatio;
    const height = this.canvas.height / window.devicePixelRatio;
    const barWidth = (width / data.length) * 2.5;
    const barSpacing = 1;

    this.ctx.fillStyle = this.gradient;

    for (let i = 0; i < data.length; i++) {
      const value = data[i];
      const percent = value / 255;
      const barHeight = height * percent;
      const x = i * (barWidth + barSpacing);
      const y = height - barHeight;

      this.ctx.fillRect(x, y, barWidth, barHeight);
    }
  }

  drawWaveform(data) {
    const width = this.canvas.width / window.devicePixelRatio;
    const height = this.canvas.height / window.devicePixelRatio;
    const sliceWidth = width / data.length;
    let x = 0;

    this.ctx.strokeStyle = this.gradientColors[0];
    this.ctx.lineWidth = 2;
    this.ctx.beginPath();
    this.ctx.moveTo(0, height / 2);

    for (let i = 0; i < data.length; i++) {
      const value = data[i];
      const y = (value / 255) * height;

      if (i === 0) {
        this.ctx.moveTo(x, y);
      } else {
        this.ctx.lineTo(x, y);
      }

      x += sliceWidth;
    }

    this.ctx.stroke();
  }

  setVisualizationType(type) {
    this.visualizationType = type;

    // Update button states
    this.shadowRoot.querySelectorAll(".type-btn").forEach((btn) => {
      btn.classList.toggle("active", btn.dataset.type === type);
    });
  }

  attributeChangedCallback(name, oldValue, newValue) {
    if (name === "type") {
      this.setVisualizationType(newValue);
    }
  }
}

customElements.define("audio-visualizer", AudioVisualizer);
