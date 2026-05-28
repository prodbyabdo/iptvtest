# GOAL — Fix 3 Critical Issues in IPTV Pro Player

> **Date:** May 28, 2026  
> **Status:** Planning — awaiting approval  
> **Priority:** P0 — App is non-functional for end user

---

## The 3 Issues

### 1. Two Useless Error Popups
Every app load shows two different error UI elements that mean nothing to the user:
- **Debug log panel** (`#debugLog`) becomes visible showing developer messages like `"404 on attempt 1, trying fallback..."`
- **Error toast** shows `"Connection Failed. Check URL or CORS."` or `"API Error: HTTP Error: 500"` — not actionable

### 2. Xtream API Not Working  
No channels, movies, or series load. Grid stays empty.

**Real root cause** (from [errors.md](file:///c:/Users/abdel/OneDrive/Desktop/IPTV%20PLAYER/context/errors.md)):  
The IPTV server `vipxtv.net` has **intermittent DNS resolution failures** and **drops connections mid-stream** (`WinError 10053`). The proxy server (`server.py`) has **zero retry logic** — one DNS blip = instant 500 error. But the logs prove the server DOES work on retry (lines 37-39, 82-84 show 200 OK with valid JSON after earlier failures). Additionally, when chunked transfers fail mid-stream, the error handler crashes itself, causing Python tracebacks.

### 3. Credentials Not Persisting
User has to re-enter server URL, username, and password every time. Root causes:
- Settings panel fields start empty — clicking "Save" overwrites saved credentials with blanks
- Login page never pre-fills from localStorage
- `logout()` calls `localStorage.clear()` — nukes favorites and API keys too

---

## Success Criteria

1. ✅ `server.py` retries failed requests (3x with backoff) — makes `vipxtv.net` work reliably
2. ✅ No debug panel visible during normal use
3. ✅ At most 1 summary error toast, not 3 individual ones
4. ✅ Login page and settings panel pre-fill from saved credentials
5. ✅ Logout only clears session credentials, preserves favorites/API keys
6. ✅ Credentials in error logs gitignored

---

## Plan

See [implementation_plan.md](file:///C:/Users/abdel/.gemini/antigravity-ide/brain/f082f207-9415-4798-bfc9-ca6b5a6e4052/implementation_plan.md) for the full technical plan.

**6 files to modify**: `server.py`, `xtream-client.js`, `components.js`, `src/main.js`, `app-engine.js`, `.gitignore`
