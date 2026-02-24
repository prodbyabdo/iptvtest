# API Search Prompt

**Use this prompt with a search engine bot to find free APIs for your IPTV player:**

---

## Context & Scope

I am building a **custom local IPTV Web Player** using **HTML, CSS, and vanilla JavaScript**. The project is a lightweight, client-side application that runs locally (or via a simple Python server for casting).

- **Current Capabilities**: 
  - Plays IPTV streams via **Xtream Codes API**.
  - Fetches basic movie metadata using **OMDB API**.
  - Stores settings/favorites in browser `localStorage`.
- **The Goal**: 
  - Enhance the player by aggregating data from multiple **free sources** to reduce reliance on a single provider.
  - Add live sports scores, rich media metadata (posters, backdrops, cast), and potentially legal free streaming sources.
- **Constraints**:
  - APIs must be **free** (no credit card required) or have a generous free tier.
  - Must return **JSON** data.
  - Preferably **CORS-friendly** for direct client-side requests.

---

## Search Query

> Act as a senior developer and find the best **free, public APIs** to enhance this IPTV Web Player project. I need APIs in the following 3 categories:
> 
> 1. **Live Football/Soccer Data (Priority)**
>    - **Requirement**: Free access to live scores, match schedules, and league tables.
>    - **Nice to have**: Match events (goals, cards), lineups, or highlights links.
>    - **Examples**: API-Football (free tier?), TheSportsDB.
> 
> 2. **Movies & TV Series Metadata & Discovery**
>    - **Requirement**: Better quality images (posters/backdrops), unified search across services, and trending/popular lists.
>    - **Context**: I already use OMDB but want richer visual data and "Similar/Recommended" features.
>    - **Examples**: TMDB (The Movie Database), Trakt.tv.
> 
> 3. **Free & Legal Streaming Sources (Aggregation)**
>    - **Requirement**: APIs that provide links to legal, free-to-watch content (e.g., public domain movies, ad-supported networks, PlutoTV-style M3U lists).
>    - **Goal**: Add a "Free Movies" section to the player that doesn't require an IPTV subscription.
> 
> **For each recommendation, please provide:**
> - **API Name & URL**
> - **Free Tier Limits** (e.g., 1000 requests/day).
> - **CORS Support**: Can I call it directly from browser JS?
> - **Why it fits**: Specific synergy with a JS-based IPTV player.

---

## Exclude

- **Do NOT recommend**: OMDB (already implemented), Xtream Codes (already implemented).
- Avoid APIs that are deprecated or haven't been updated in >2 years.
