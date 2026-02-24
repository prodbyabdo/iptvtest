# Iteration 2: Medium Tasks

**Estimated Effort:** 3-5 hours each  
**Dependencies:** Some storage/UI complexity

---

## 🎯 Tasks

### 1. Continue Watching (Resume Playback)
- [ ] Track current position every 10 seconds
- [ ] Save to `iptv_watchHistory` object
- [ ] Show "Resume" button with timestamp
- [ ] Display "Continue Watching" row on home

**Approach:** 
```javascript
// Save format
{
  "movie_123": { position: 1234, duration: 7200, title: "...", updated: Date }
}
```

---

### 2. Subtitle Styling Options
- [ ] Settings panel for subtitle appearance
- [ ] Options: font size, font family, background opacity
- [ ] Preview in settings
- [ ] Apply via CSS custom properties

**Options to include:**
- Font size: Small / Medium / Large
- Background: None / Semi-transparent / Solid
- Color: White / Yellow

---

### 3. Live Now Section (Sports)
- [ ] Filter matches currently in progress
- [ ] Add pulsing "LIVE" badge
- [ ] Sort by sport/league
- [ ] Auto-refresh every 60 seconds

**Approach:** Compare match times with current time, add visual indicators.

---

### 4. Starting Soon Countdown
- [ ] Show matches starting within 30 mins
- [ ] Live countdown timer (mm:ss)
- [ ] Notification when match starts

**Approach:** `setInterval` countdown, clear when match starts.

---

### 5. Lazy Loading for Large Lists
- [ ] Implement virtual scrolling OR
- [ ] Load 50 items at a time
- [ ] "Load More" button or infinite scroll
- [ ] Show loading skeleton

**Approach:** Intersection Observer API for scroll detection.

---

## Storage Used

```javascript
'iptv_watchHistory'   // { movieId: { position, duration, title, updated } }
'iptv_preferences'    // subtitle settings, UI preferences
```
