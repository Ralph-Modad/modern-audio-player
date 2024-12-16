# Modern Audio Player

A modern audio player implementation using Web Components, featuring an equalizer, audio visualizer with butterchurn integration, and playlist functionality.

## Features

- 🎵 Pure Web Components implementation
- 🎚️ 10-band equalizer with presets
- 📊 Real-time audio visualization (spectrum and waveform)
- 📝 Drag-and-drop playlist management
- 🎨 Modern, responsive design

## Installation

```bash
npm install
npm start
```

## Usage

```html
<!DOCTYPE html>
<html>
<head>
    <title>Audio Player</title>
    <script type="module" src="src/components/audio-player.js"></script>
</head>
<body>
    <audio-player>
        <audio-playlist></audio-playlist>
        <audio-equalizer></audio-equalizer>
        <audio-visualizer></audio-visualizer>
    </audio-player>
</body>
</html>
```

## Components

### AudioPlayer
Core component that orchestrates all child components and manages the AudioContext.

### AudioPlaylist
Manages the track list with drag-and-drop support and file drop zone.

### AudioEqualizer
10-band equalizer for frequency adjustment with preset support.

### AudioVisualizer
Real-time audio visualization with spectrum and waveform modes.

## Development

```bash
# Install dependencies
npm install

# Start development server
npm start

# Run tests
npm test
```

## License

MIT