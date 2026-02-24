# Iteration 1: Easy Tasks

**Estimated Effort:** 1-2 hours each  
**Dependencies:** Minimal

---

## 🎯 Tasks

### 1. Keyboard Shortcuts
- [ ] Space → Play/Pause
- [ ] Left/Right arrows → Seek ±10s
- [ ] Up/Down arrows → Volume
- [ ] F → Fullscreen toggle
- [ ] M → Mute toggle
- [ ] Escape → Exit fullscreen/close modal

**Approach:** Add event listener to `document.keydown`, map keys to player actions.

---

### 2. My List / Favorites
- [ ] Add "♥" button to movie/channel cards
- [ ] Save to `localStorage` as `iptv_myList` array
- [ ] Create "My List" section in UI
- [ ] Toggle add/remove functionality

**Approach:** Simple array in localStorage, filter and display.

---

### 3. Export/Import Settings Backup
- [ ] Export button → download JSON file
- [ ] Import button → file picker → restore settings
- [ ] Include: credentials, favorites, preferences

**Approach:** `JSON.stringify()` + `Blob` download, `FileReader` for import.

---

### 4. Picture-in-Picture Mode
- [ ] Add PiP button to player controls
- [ ] Call `video.requestPictureInPicture()`
- [ ] Handle exit PiP event

**Approach:** Native browser API, 3-5 lines of code.

---

## Storage Used

```javascript
'iptv_myList'       // favorites array
'iptv_preferences'  // user settings
```
