# Iteration 3: Hard Tasks

**Estimated Effort:** 6+ hours each  
**Dependencies:** Complex logic, multiple components

---

## 🎯 Tasks

### 1. Multi-View (2-4 Games Split Screen)
- [ ] Layout manager for 2x1, 2x2 grids
- [ ] Multiple video elements synced
- [ ] Individual audio controls (one active at a time)
- [ ] Click to maximize single view
- [ ] Swap positions drag-and-drop

**Challenges:**
- Performance with multiple streams
- Audio management (only one at a time)
- Responsive grid layout

**Approach:**
```javascript
class MultiViewManager {
  constructor(maxStreams = 4) { }
  addStream(url) { }
  removeStream(index) { }
  setActiveAudio(index) { }
  maximize(index) { }
}
```

---

### 2. Mini Scoreboard Overlay
- [ ] Floating widget during live sports playback
- [ ] Real-time score updates via API
- [ ] Show team logos, score, time
- [ ] Draggable position
- [ ] Minimize/expand toggle

**Challenges:**
- Match current stream to correct API data
- WebSocket or polling for live updates
- Non-intrusive UI

---

### 3. Skip Intro for Series
- [ ] Detect intro segments (manual or heuristic)
- [ ] Show "Skip Intro" button during intro
- [ ] Store skip times per series
- [ ] Optional: auto-skip setting

**Approach Options:**
1. Manual: User marks intro end, save per series
2. Heuristic: Detect audio fingerprint patterns (complex)
3. External: Use skip data from community DBs if available

---

### 4. Highlights Mode (Key Moments)
- [ ] Fetch highlight timestamps from API
- [ ] Timeline markers for goals/key events
- [ ] Jump-to-highlight navigation
- [ ] "Highlights Only" playback mode

**Challenges:**
- Finding reliable highlight/event API
- Syncing timestamps with stream
- Building custom timeline UI

---

### 5. Watch from Start (DVR-Style)
- [ ] Check if stream supports timeshift
- [ ] "Start from Beginning" option
- [ ] Timeline showing available buffer
- [ ] Seek within buffered content

**Challenges:**
- Server must support HLS timeshift (DVR)
- Not all streams have this capability
- Need to detect stream capabilities

---

## Architecture Notes

```
┌─────────────────────────────────────────┐
│           Multi-View Manager            │
├─────────┬─────────┬─────────┬──────────┤
│ Stream 1│ Stream 2│ Stream 3│ Stream 4 │
│ (audio) │ (muted) │ (muted) │ (muted)  │
└─────────┴─────────┴─────────┴──────────┘
         │
         ▼
┌─────────────────────────────────────────┐
│          Mini Scoreboard API            │
│     (polling every 30s for updates)     │
└─────────────────────────────────────────┘
```
