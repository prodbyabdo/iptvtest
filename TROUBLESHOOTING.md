# IPTV Pro Player - Troubleshooting Guide

## 🔴 Common Issues & Solutions

### Issue 1: No Channels/Movies Loading
**Symptom:** Grid stays empty or shows loading spinner forever  
**Severity:** 🔴 Critical

#### Diagnosis
```javascript
// Open browser console (F12) and paste:
console.log('XTREAM URL:', CONFIG.XTREAM_URL);
console.log('User:', CONFIG.XTREAM_USER);
console.log('Pass:', CONFIG.XTREAM_PASS ? '***' : 'NOT SET');
```

#### Solutions

**1. Check Credentials**
- Go to Settings (⚙️)
- Verify XTREAM Server URL is correct
  - Format: `http://server.example.com:port`
  - Example: `http://vipxtv.net:80` (note: must include port)
- Verify Username and Password match your IPTV provider
- Click "Save Settings" and refresh page

**2. Test Server Connection**
- Open new browser tab
- Type your server URL directly: `http://your-server:port`
- You should see a page or API response
- If blank or error, server is unreachable

**3. Check Server Status**
- Contact your IPTV provider
- Ask if server is online
- Check if your IP is whitelisted
- Verify subscription is active and not expired

**4. Try Different Provider**
- If you have multiple IPTV accounts, try another
- Some providers have better uptime
- Compare: vipxtv.net, other premium providers

**5. Clear Cache**
```javascript
// In console:
localStorage.clear();
location.reload();
```

---

### Issue 2: Playback Fails (Black Screen/Error)
**Symptom:** Click play, video doesn't start or shows error  
**Severity:** 🔴 Critical

#### Diagnosis
```javascript
// Check player status:
const player = document.getElementById('videoPlayer');
console.log('Video source:', player.src);
console.log('HLS.js:', typeof Hls);
```

#### Solutions

**1. Use VLC Player**
- Click playing video → 📺 **VLC** button
- This uses external player (often more compatible)
- Works for MKV, TS, MPEG-TS formats
- Requires VLC installed on your computer

**2. Check Stream Format**
- IPTV provides streams in different formats:
  - `.m3u8` (HLS) - Browser compatible ✓
  - `.mp4` (MPEG-4) - Browser compatible ✓
  - `.mkv` (Matroska) - Requires VLC
  - `.ts` (Transport Stream) - Requires VLC
- If MKV/TS, must use VLC player

**3. Check Network**
- Internet connection working? ✓
- Speed sufficient? (1Mbps+)
- Try different channel/movie
- Some streams might be offline

**4. Try Different Browser**
- Chrome or Firefox recommended
- Some streams work better in certain browsers
- Clear cache (Settings → Network → Clear browser cache)

**5. Disable VPN/Proxy**
- Some IPTV servers block VPN traffic
- Try connecting without VPN
- Check IPTV provider for VPN support

---

### Issue 3: Football Matches Not Showing
**Symptom:** Sports tab empty or shows error  
**Severity:** 🟠 High

#### Diagnosis
```javascript
// Check Football API:
console.log('API Key:', CONFIG.FOOTBALL_API_KEY ? 'SET' : 'MISSING');
console.log('FB Object:', typeof STATE.footballAPI);
if (STATE.footballAPI) {
  console.log('Remaining calls:', STATE.footballAPI.getRemainingCalls());
}
```

#### Solutions

**1. Verify API Key**
- Go to Settings (⚙️)
- Check Football API Key is entered
- Copy/paste from RapidAPI dashboard (exact match required)
- Save settings and refresh page

**2. Check RapidAPI Subscription**
- Go to https://rapidapi.com
- Log in to your account
- Find "api-football-v1" subscription
- Verify status is "Active"
- If expired, re-subscribe (free tier available)

**3. Check Daily Limit**
- Sports tab shows "API Requests: X/100"
- Free plan has 100 calls/day
- If at 100, wait until next day (UTC)
- Or upgrade to paid RapidAPI plan

**4. Check No Live Matches**
- If shows "No matches available"
- This might be accurate (no major matches at that moment)
- Try again in a few hours
- Or wait for upcoming fixture dates

**5. Verify Competition Selection**
- Some competitions might have no scheduled matches
- Try different competition from sidebar
- Popular ones: Premier League, La Liga, Champions League

**6. Clear API Cache**
```javascript
// In console:
STATE.footballAPI.clearCache();
// Then reload Sports tab
```

---

### Issue 4: OMDb Posters/Ratings Not Showing
**Symptom:** Movies show no images or ratings in grid  
**Severity:** 🟡 Medium

#### Diagnosis
```javascript
// Check OMDb API:
console.log('OMDb Key:', CONFIG.OMDB_API_KEY ? 'SET' : 'MISSING');
console.log('OMDb Object:', typeof STATE.omdbAPI);
console.log('Enriched items:', STATE.enrichedItems.size);
```

#### Solutions

**1. Verify API Key**
- Go to Settings (⚙️)
- Check OMDb API Key is entered
- Get key from https://www.omdbapi.com (free signup)
- Save settings and refresh

**2. Check OMDb Account Status**
- Go to https://www.omdbapi.com
- Log in
- Verify your account is active
- Check if key needs reactivation

**3. Check Title Matching**
- OMDb requires exact title match
- Some IPTV titles differ from OMDb database
- Example: "The Matrix" vs "Matrix, The"
- Not all titles in OMDb database

**4. Wait for Enrichment**
- Enrichment takes time (150ms per title to avoid rate limit)
- Movies tab might take 30-60 seconds to load
- Watch console for progress
- Don't navigate away during enrichment

**5. Check Daily Limit**
- OMDb free plan: 1000 requests/day
- With 50 movies × 10 calls each = 500 requests
- Usually not a limit issue unless enriching many times
- Check OMDb dashboard for usage stats

**6. Clear OMDb Cache**
```javascript
// In console:
STATE.omdbAPI.clearCache();
STATE.enrichedItems.clear();
// Then reload Movies tab
```

---

### Issue 5: Settings Not Saving
**Symptom:** Credentials disappear after refresh  
**Severity:** 🟡 Medium

#### Diagnosis
```javascript
// Check localStorage:
console.log('Saved URL:', localStorage.getItem('xtream_url'));
console.log('Saved User:', localStorage.getItem('xtream_user'));
console.log('Saved Pass:', localStorage.getItem('xtream_pass') ? '***' : 'MISSING');
```

#### Solutions

**1. Verify Save Button**
- Click Settings (⚙️)
- Enter credentials in all fields
- Click **💾 Save Settings** button explicitly
- Should say "Settings saved!"

**2. Check Browser Settings**
- Incognito/Private mode blocks localStorage
- Close incognito window and try normal mode
- Allow cookies for this site in browser settings
- Check browser hasn't cleared data on close

**3. Check Storage Space**
- Open DevTools (F12)
- Application tab → LocalStorage
- Check if data exists
- If full, clear browser cache (Settings → Clear browsing data)

**4. Try Different Browser**
- Chrome: Known to work well
- Firefox: Also reliable
- Safari: May have privacy restrictions
- Edge: Generally works

**5. Manual Entry Each Session**
- If localStorage doesn't work
- You can enter credentials each session
- Player will work until you close browser
- Contact support if issue persists

---

### Issue 6: Player Crashes or Freezes
**Symptom:** App becomes unresponsive, clicking doesn't work  
**Severity:** 🔴 Critical

#### Diagnosis
```javascript
// Check for errors:
// Open Console (F12) and look for red error messages
// Note the error text and code line number
```

#### Solutions

**1. Reload Page**
- Press Ctrl+Shift+R (hard refresh)
- This clears cache and reloads fully
- Fixed in 80% of cases

**2. Clear Cache**
```javascript
// In console:
localStorage.clear();
location.reload();
```

**3. Close Other Tabs**
- Close background tabs to free RAM
- Close browser completely and reopen
- Reduces memory usage

**4. Check Memory Usage**
- Task Manager (Ctrl+Shift+Esc on Windows)
- Check if browser using >1GB RAM
- Close other applications

**5. Restart Computer**
- Sometimes helps if RAM fragmented
- Power cycle often resolves issues

**6. Try Incognito Mode**
- Ctrl+Shift+N
- Opens without extensions/cache
- If works, extension is conflicting
- Disable browser extensions

---

### Issue 7: Slow Loading / High Memory Usage
**Symptom:** Page takes 30+ seconds to load, fans loud  
**Severity:** 🟡 Medium

#### Diagnosis
```javascript
// Check memory:
console.log('Cache size:', STATE.cache.size);
console.log('Enriched items:', STATE.enrichedItems.size);
console.log('All items loaded:', STATE.allItems.length);
```

#### Solutions

**1. Clear Cache**
- Settings (⚙️)
- (Future: "Clear Cache" button)
- Temporary: Console command:
  ```javascript
  STATE.cache.clear();
  STATE.enrichedItems.clear();
  location.reload();
  ```

**2. Reduce Loaded Items**
- Don't load all 35k items at once
- Use search to find specific content
- Browse by category (loads ~500 items)
- Scroll gradually instead of "view all"

**3. Disable OMDb Enrichment (Temporarily)**
- Clear OMDb API key in Settings
- Save and reload
- Movies load faster without enrichment
- Re-enable once performance improves

**4. Use Virtual Scrolling**
- Already implemented
- But avoid rapidly scrolling huge lists
- Let images lazy-load naturally

**5. Close Other Applications**
- Free up system RAM
- Chrome uses 300MB+ per tab
- Close unnecessary browser tabs
- Restart browser if slow

**6. Check Internet Speed**
- Run speed test: speedtest.net
- Less than 5Mbps? Downloads will be slow
- Contact ISP if consistently slow

---

### Issue 8: CORS/Stream Blocked
**Symptom:** Error about "CORS", "blocked", or "cross-origin"  
**Severity:** 🟡 Medium

#### Solutions

**1. Use VLC Player**
- Click 📺 **VLC** button while playing
- External players bypass browser CORS
- Best solution for blocked streams

**2. Browser Extension**
- CORS extension: "Allow CORS: Access-Control-Allow-Origin"
- Available for Chrome/Firefox
- Enable for site and reload
- Not recommended for security reasons

**3. Try Different Stream**
- Some streams blocked, others not
- Switch to alternative channel/movie
- Different providers have different restrictions

**4. Contact IPTV Provider**
- Ask if streams are CORS-enabled
- They might provide workaround
- Some providers offer CORS-safe links

---

## ✅ Verification Checklist

### Before Using App

- [ ] All 3 files in same directory (HTML + 2 JS files)
- [ ] Browser is Chrome, Firefox, Safari, or Edge (latest)
- [ ] JavaScript enabled in browser
- [ ] Cookies/Storage allowed for this site
- [ ] Internet connection stable

### After Installing

- [ ] Page loads in 3-5 seconds
- [ ] Settings panel opens (⚙️ button)
- [ ] Can save settings and refresh
- [ ] Credentials show in Settings after save
- [ ] Categories load and show items

### When Playing Content

- [ ] Video starts within 5-10 seconds
- [ ] Sound works (check volume slider)
- [ ] Can pause/seek in video
- [ ] Fullscreen button works
- [ ] VLC button launches (if click)

### When Using Sports

- [ ] Sports tab loads in <10 seconds
- [ ] Shows "API Requests: X/100" counter
- [ ] Displays at least one match (if any happening)
- [ ] Competition names visible

### When Using Movies

- [ ] Movies load with grid view
- [ ] Posters visible (with OMDb enabled)
- [ ] Ratings show below posters
- [ ] Can click play on any movie
- [ ] Search works for titles

---

## 🔧 Advanced Debugging

### Enable Debug Mode
```javascript
// In console:
window.DEBUG = true;

// All API calls will log to console
// Shows requests, responses, timings
// Helps identify what's failing
```

### View Network Requests
- Open DevTools (F12)
- Network tab
- Reload page
- Look for requests to:
  - Your XTREAM server (stream URLs)
  - api-football-v1.p.rapidapi.com (football)
  - omdbapi.com (movie metadata)
- Check Status column (200 = success, 4xx/5xx = error)

### Monitor IndexedDB
- DevTools (F12)
- Application tab
- IndexedDB → (database name)
- Browse cached data
- Check expiration times

### Check Error Stack
- DevTools (F12)
- Console tab
- Look for red "Error" messages
- Click error to expand
- Stack trace shows which function failed
- Share with support if needed

---

## 📞 When to Contact Support

### Gather Information First
1. Browser name and version
2. Operating system
3. Screenshot of error
4. Console error message (copy-paste)
5. Steps to reproduce
6. Network speed (speedtest result)

### Common Support Requests

**"IPTV not working"**
- Which provider? (vipxtv, premium-iptv, etc.)
- How many channels show? (0, blank grid)
- Can you reach server manually? (test URL in browser)
- Are credentials correct?
- Is subscription active?

**"Football API not working"**
- Do you have RapidAPI account?
- Is subscription still active?
- Did you reach request limit? (check widget)
- Are you in RapidAPI dashboard?
- Did you copy exact API key?

**"App crashing"**
- What browser? (Chrome, Firefox, Safari)
- Does hard refresh help? (Ctrl+Shift+R)
- What tab were you in? (Live, Movies, Sports)
- What error in console? (share screenshot)
- Does it happen in incognito mode?

---

## 📊 Performance Optimization Tips

### Speed Up Playback
1. Clear browser cache (Ctrl+Shift+Delete)
2. Close other tabs and apps
3. Use VLC for fallback streams
4. Check internet speed (speedtest.net)
5. Lower video quality if available

### Reduce Memory Usage
1. Don't load all 35k items (use search)
2. Disable OMDb enrichment temporarily
3. Clear cache regularly
4. Don't keep app open for hours
5. Restart browser periodically

### Improve Search Speed
1. Search is already optimized (300ms debounce)
2. Use specific keywords (not just "a")
3. First search might be slow (indexing)
4. Subsequent searches use cache
5. Try category filter if search slow

### Network Optimization
1. Use 5GHz WiFi instead of 2.4GHz
2. Position router closer
3. Close bandwidth-heavy applications
4. Check for WiFi interference
5. Use Ethernet cable if possible

---

## 🆘 Emergency Contact

If unable to solve problem:

1. **Browser Console Error** → Copy exact error message
2. **Screenshot** → Share what you see
3. **Reproduction Steps** → Exactly how to trigger issue
4. **System Info** → Windows/Mac, browser, RAM
5. **API Status** → Which APIs you configured

Share above and we can help troubleshoot.

---

**Last Updated:** December 2025  
**Maintained By:** Development Team
