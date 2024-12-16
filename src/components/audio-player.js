// src/components/audio-player.js
import { AudioContextManager } from "../utils/audio-context.js";

/**
 * Main audio player web component that orchestrates playback and manages child components.
 * Handles audio context initialization, playback controls, and communication between components.
 */
class AudioPlayer extends HTMLElement {
  static get observedAttributes() {
    return ["src", "playing", "volume", "current-time"];
  }

  constructor() {
    super();
    this.attachShadow({ mode: "open" });
    this.audioContext = new AudioContextManager();
    this.isReady = false;
    this.initializeState();
  }

  initializeState() {
    this.state = {
      src: "",
      playing: false,
      volume: 1.0,
      currentTime: 0,
      duration: 0,
    };
  }

  connectedCallback() {
    this.setupDOM();
    this.setupAudioElement();
    this.setupEventListeners();
    this.isReady = true;
  }

  setupDOM() {
    const template = document.createElement("template");
    template.innerHTML = `
            <style>
                :host {
                    display: block;
                    width: 100%;
                    max-width: 800px;
                    margin: 0 auto;
                    font-family: system-ui, -apple-system, sans-serif;
                }
                .player-container {
                    background: #1a1a1a;
                    border-radius: 8px;
                    padding: 20px;
                    color: white;
                }
                .controls {
                    display: flex;
                    align-items: center;
                    gap: 16px;
                    margin-bottom: 16px;
                }
                .progress-bar {
                    width: 100%;
                    height: 4px;
                    background: #333;
                    border-radius: 2px;
                    cursor: pointer;
                }
                .progress-fill {
                    height: 100%;
                    background: #1db954;
                    border-radius: 2px;
                    width: 0%;
                    transition: width 0.1s linear;
                }
                button {
                    background: none;
                    border: none;
                    color: white;
                    cursor: pointer;
                    padding: 8px;
                    border-radius: 50%;
                    width: 40px;
                    height: 40px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                }
                button:hover {
                    background: rgba(255, 255, 255, 0.1);
                }
                .volume-control {
                    display: flex;
                    align-items: center;
                    gap: 8px;
                }
                input[type="range"] {
                    width: 100px;
                }
                .time-display {
                    font-size: 14px;
                    color: #888;
                }
            </style>
            <div class="player-container">
                <div class="controls">
                    <button class="play-pause" aria-label="Play">
                        <svg width="24" height="24" viewBox="0 0 24 24">
                            <path d="M8 5v14l11-7z" fill="currentColor"/>
                        </svg>
                    </button>
                    <div class="volume-control">
                        <button class="mute" aria-label="Mute">
                            <svg width="24" height="24" viewBox="0 0 24 24">
                                <path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02z" fill="currentColor"/>
                            </svg>
                        </button>
                        <input type="range" class="volume" min="0" max="1" step="0.01" value="1">
                    </div>
                    <div class="time-display">
                        <span class="current">0:00</span> / <span class="duration">0:00</span>
                    </div>
                </div>
                <div class="progress-container">
                    <div class="progress-bar">
                        <div class="progress-fill"></div>
                    </div>
                </div>
                <slot></slot>
            </div>
        `;
    this.shadowRoot.appendChild(template.content.cloneNode(true));

    // Cache DOM elements
    this.elements = {
      playPauseBtn: this.shadowRoot.querySelector(".play-pause"),
      muteBtn: this.shadowRoot.querySelector(".mute"),
      volumeSlider: this.shadowRoot.querySelector(".volume"),
      progressBar: this.shadowRoot.querySelector(".progress-bar"),
      progressFill: this.shadowRoot.querySelector(".progress-fill"),
      currentTime: this.shadowRoot.querySelector(".current"),
      duration: this.shadowRoot.querySelector(".duration"),
      audioElement: document.createElement("audio"),
    };
  }

  setupAudioElement() {
    const audio = this.elements.audioElement;
    audio.crossOrigin = "anonymous";
    this.audioContext.initialize(audio);
  }

  setupEventListeners() {
    // Playback controls
    this.elements.playPauseBtn.addEventListener("click", () =>
      this.togglePlay()
    );
    this.elements.muteBtn.addEventListener("click", () => this.toggleMute());
    this.elements.volumeSlider.addEventListener("input", (e) =>
      this.setVolume(e.target.value)
    );

    // Progress bar
    this.elements.progressBar.addEventListener("click", (e) => this.seek(e));

    // Audio element events
    const audio = this.elements.audioElement;
    audio.addEventListener("timeupdate", () => this.updateProgress());
    audio.addEventListener("loadedmetadata", () => this.handleMetadata());
    audio.addEventListener("ended", () => this.handleEnded());
    audio.addEventListener("error", (e) => this.handleError(e));
  }

  // Public API methods
  async play() {
    if (!this.state.src) return;

    try {
      await this.audioContext.resume();
      await this.elements.audioElement.play();
      this.state.playing = true;
      this.updatePlayButton();
      this.dispatchEvent(
        new CustomEvent("playbackStateChange", {
          detail: { playing: true },
        })
      );
    } catch (error) {
      console.error("Playback failed:", error);
      this.handleError(error);
    }
  }

  pause() {
    this.elements.audioElement.pause();
    this.state.playing = false;
    this.updatePlayButton();
    this.dispatchEvent(
      new CustomEvent("playbackStateChange", {
        detail: { playing: false },
      })
    );
  }

  async loadTrack(uri) {
    if (!uri) return;

    try {
      this.state.src = uri;
      this.elements.audioElement.src = uri;
      await this.elements.audioElement.load();

      this.dispatchEvent(
        new CustomEvent("trackChange", {
          detail: { src: uri },
        })
      );

      if (this.state.playing) {
        await this.play();
      }
    } catch (error) {
      console.error("Failed to load track:", error);
      this.handleError(error);
    }
  }

  // Private helper methods
  togglePlay() {
    if (this.state.playing) {
      this.pause();
    } else {
      this.play();
    }
  }

  toggleMute() {
    const audio = this.elements.audioElement;
    audio.muted = !audio.muted;
    this.elements.muteBtn.innerHTML = audio.muted
      ? '<svg width="24" height="24" viewBox="0 0 24 24"><path d="M16.5 12c0-1.77-1.02-3.29-2.5-4.03v2.21l2.45 2.45c.03-.2.05-.41.05-.63zm2.5 0c0 .94-.2 1.82-.54 2.64l1.51 1.51C20.63 14.91 21 13.5 21 12c0-4.28-2.99-7.86-7-8.77v2.06c2.89.86 5 3.54 5 6.71zM4.27 3L3 4.27 7.73 9H3v6h4l5 5v-6.73l4.25 4.25c-.67.52-1.42.93-2.25 1.18v2.06c1.38-.31 2.63-.95 3.69-1.81L19.73 21 21 19.73l-9-9L4.27 3zM12 4L9.91 6.09 12 8.18V4z" fill="currentColor"/></svg>'
      : '<svg width="24" height="24" viewBox="0 0 24 24"><path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02z" fill="currentColor"/></svg>';
  }

  setVolume(value) {
    const volume = parseFloat(value);
    if (isNaN(volume)) return;

    this.state.volume = volume;
    this.elements.audioElement.volume = volume;
    this.audioContext.setVolume(volume);

    // Update mute button state
    if (volume === 0) {
      this.elements.audioElement.muted = true;
    } else if (this.elements.audioElement.muted) {
      this.elements.audioElement.muted = false;
    }
  }

  seek(event) {
    const rect = this.elements.progressBar.getBoundingClientRect();
    const pos = (event.clientX - rect.left) / rect.width;
    const time = pos * this.elements.audioElement.duration;

    if (isNaN(time)) return;

    this.elements.audioElement.currentTime = time;
    this.updateProgress();
  }

  updateProgress() {
    const audio = this.elements.audioElement;
    if (!audio.duration) return;

    const progress = (audio.currentTime / audio.duration) * 100;
    this.elements.progressFill.style.width = `${progress}%`;
    this.elements.currentTime.textContent = this.formatTime(audio.currentTime);
  }

  updatePlayButton() {
    this.elements.playPauseBtn.innerHTML = this.state.playing
      ? '<svg width="24" height="24" viewBox="0 0 24 24"><path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z" fill="currentColor"/></svg>'
      : '<svg width="24" height="24" viewBox="0 0 24 24"><path d="M8 5v14l11-7z" fill="currentColor"/></svg>';
  }

  handleMetadata() {
    const audio = this.elements.audioElement;
    this.state.duration = audio.duration;
    this.elements.duration.textContent = this.formatTime(audio.duration);
  }

  handleEnded() {
    this.state.playing = false;
    this.updatePlayButton();
    this.dispatchEvent(new CustomEvent("trackEnded"));
  }

  handleError(error) {
    console.error("Audio player error:", error);
    this.dispatchEvent(
      new CustomEvent("playerError", {
        detail: { error },
      })
    );
  }

  formatTime(seconds) {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  }

  // Attribute handling
  attributeChangedCallback(name, oldValue, newValue) {
    if (!this.isReady) return;

    switch (name) {
      case "src":
        this.loadTrack(newValue);
        break;
      case "playing":
        this.togglePlay();
        break;
      case "volume":
        this.setVolume(newValue);
        break;
      case "current-time":
        this.elements.audioElement.currentTime = parseFloat(newValue);
        break;
    }
  }
}

customElements.define("audio-player", AudioPlayer);
