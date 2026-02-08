# IPTV Pro Player - Desktop App

A premium IPTV player built with Electron.

## 🚀 Quick Start

### Prerequisites
- [Node.js](https://nodejs.org/) (v18 or higher)

### Installation

1. **Install dependencies:**
```bash
npm install
```

2. **Run the app (development):**
```bash
npm start
```

3. **Build Windows installer:**
```bash
npm run build
```

The installer will be in the `dist/` folder.

## 📦 Build Output

After running `npm run build`, you'll find:
- `dist/IPTV Pro Player Setup 1.0.0.exe` - Windows installer

## 🎯 Features

- No CORS issues (desktop app!)
- HLS streaming support
- Live TV, Movies, Series
- Sports with live scores
- Local caching (IndexedDB)
- Export to M3U
- VLC integration
- Beautiful glassmorphism UI

## ⚙️ Configuration

On first launch, click the ⚙️ Settings button and enter:
- IPTV Server URL
- Username
- Password

Your credentials are stored locally and never sent anywhere except your IPTV server.

## 📄 License

MIT
