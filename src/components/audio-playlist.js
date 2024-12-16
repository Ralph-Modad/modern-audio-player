// src/components/audio-playlist.js

/**
 * Audio playlist component with drag-and-drop support
 * Manages track list and selection
 */
class AudioPlaylist extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: "open" });
    this.tracks = [];
    this.currentTrackIndex = -1;
    this.draggedItem = null;
  }

  // Previous methods remain the same...

  async createTrackFromFile(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      const audio = new Audio();

      reader.onload = () => {
        audio.src = reader.result;
        audio.onloadedmetadata = () => {
          resolve({
            title: file.name.replace(/\.[^/.]+$/, ""),
            duration: audio.duration,
            src: reader.result,
            file,
          });
        };
        audio.onerror = reject;
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  }

  renderTracks() {
    const trackList = this.shadowRoot.querySelector(".track-list");
    trackList.innerHTML = "";

    if (this.tracks.length === 0) {
      trackList.innerHTML = `
                <div class="empty-message">
                    No tracks added yet
                </div>
            `;
      return;
    }

    this.tracks.forEach((track, index) => {
      const li = document.createElement("li");
      li.className = "track-item";
      li.draggable = true;
      if (index === this.currentTrackIndex) {
        li.classList.add("playing");
      }

      li.innerHTML = `
                <div class="drag-handle">
                    <svg width="16" height="16" viewBox="0 0 16 16">
                        <path d="M4 6h8v2H4zm0 4h8v2H4z" fill="currentColor"/>
                    </svg>
                </div>
                <span class="track-number">${index + 1}</span>
                <div class="track-info">
                    <div class="track-title">${track.title}</div>
                    <div class="track-duration">${this.formatDuration(
                      track.duration
                    )}</div>
                </div>
            `;

      li.addEventListener("click", () => this.playTrack(index));
      trackList.appendChild(li);
    });

    this.dispatchEvent(
      new CustomEvent("playlistUpdate", {
        detail: { tracks: this.tracks },
      })
    );
  }

  formatDuration(seconds) {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  }

  playTrack(index) {
    if (index < 0 || index >= this.tracks.length) return;

    this.currentTrackIndex = index;
    const track = this.tracks[index];

    const audioPlayer = this.closest("audio-player");
    if (audioPlayer) {
      audioPlayer.loadTrack(track.src);
    }

    this.dispatchEvent(
      new CustomEvent("trackSelect", {
        detail: { track, index },
      })
    );

    this.renderTracks();
  }

  playNext() {
    let nextIndex = this.currentTrackIndex + 1;
    if (nextIndex >= this.tracks.length) {
      nextIndex = 0; // Loop back to start
    }
    this.playTrack(nextIndex);
  }

  playPrevious() {
    let prevIndex = this.currentTrackIndex - 1;
    if (prevIndex < 0) {
      prevIndex = this.tracks.length - 1; // Loop to end
    }
    this.playTrack(prevIndex);
  }

  reorderTracks(fromIndex, toIndex) {
    const track = this.tracks[fromIndex];
    this.tracks.splice(fromIndex, 1);
    this.tracks.splice(toIndex, 0, track);

    // Update currentTrackIndex if needed
    if (fromIndex === this.currentTrackIndex) {
      this.currentTrackIndex = toIndex;
    } else if (
      fromIndex < this.currentTrackIndex &&
      toIndex >= this.currentTrackIndex
    ) {
      this.currentTrackIndex--;
    } else if (
      fromIndex > this.currentTrackIndex &&
      toIndex <= this.currentTrackIndex
    ) {
      this.currentTrackIndex++;
    }

    this.renderTracks();
  }

  // Public API methods
  addTrack(track) {
    this.tracks.push(track);
    this.renderTracks();
  }

  removeTrack(index) {
    if (index < 0 || index >= this.tracks.length) return;

    this.tracks.splice(index, 1);

    // Update currentTrackIndex if needed
    if (index === this.currentTrackIndex) {
      this.currentTrackIndex = -1;
    } else if (index < this.currentTrackIndex) {
      this.currentTrackIndex--;
    }

    this.renderTracks();
  }

  clear() {
    this.tracks = [];
    this.currentTrackIndex = -1;
    this.renderTracks();
  }

  getCurrentTrack() {
    return this.currentTrackIndex >= 0
      ? this.tracks[this.currentTrackIndex]
      : null;
  }
}

customElements.define("audio-playlist", AudioPlaylist);
