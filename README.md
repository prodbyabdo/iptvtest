# IPTV Pro Player

A lightweight desktop IPTV client built with Electron. This player sidesteps common browser-based CORS issues and provides a native Windows environment for HLS streams.
[IMPORTANT]
This application does not provide any content or streaming channels. Users must provide their own service credentials or use public repositories like [iptv-org](https://github.com/iptv-org/iptv) for free-to-air content.
## Quick Start

### Setup
* **Node.js**: v18.x or higher required.
* **Install**: `npm install`
* **Dev Mode**: `npm start`

### Windows Build
To package the application into a portable installer:
```bash
npm run build
```
The output `.exe` will be generated in the `dist/` directory.

## Core Logic & Features
* **CORS-Free Architecture**: Since this runs on Electron’s main process, it bypasses the `Access-Control-Allow-Origin` restrictions found in web-based players.
* **Streaming**: Full HLS (.m3u8) support.
* **Persistence**: Uses IndexedDB for local caching of playlists and EPG data to keep the UI snappy.
* **VLC Bridge**: Includes the ability to hand off streams to a local VLC installation for advanced playback.
* **UI**: Minimalist glassmorphism theme with a focus on high-density channel lists.

## Initial Config
Launch the app and hit the **Settings** icon to link your provider. You’ll need:
1.  Server URL (XC API or M3U)
2.  Username/Password

*Note: All credentials are saved locally via Electron-store and are never transmitted to external third-party servers.*

## License
MIT
