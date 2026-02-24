# Sports API Integration Guide

Based on research, the best strategy is to use **two complementary APIs**:

| API | Role | Free Limit | CORS |
|-----|------|------------|------|
| **Football-Data.org** | Logic (fixtures, scores, tables) | 10 req/min | ❌ No (needs proxy) |
| **TheSportsDB** | UI (team badges, fanart, logos) | 30 req/min | ✅ Yes |

> **Strategy**: Use Football-Data for schedules/scores, then map team names to TheSportsDB for high-res images.

---

## 1. Football-Data.org (Match Data)

### Setup
1. Register at [football-data.org](https://www.football-data.org/client/register)
2. Get your free API key (Tier 0: 10 requests/min)
3. **Requires a proxy** - cannot call directly from browser JS

### Key Endpoints

```
Base URL: https://api.football-data.org/v4
Header: X-Auth-Token: YOUR_API_KEY
```

| Endpoint | Description |
|----------|-------------|
| `/competitions` | List all available competitions |
| `/competitions/{code}/matches` | Matches for a competition (e.g., `PL` for Premier League) |
| `/competitions/{code}/standings` | League table |
| `/teams/{id}` | Team details |
| `/matches` | Today's matches across all competitions |

### Free Tier Competitions
- `PL` - Premier League
- `BL1` - Bundesliga
- `SA` - Serie A
- `PD` - La Liga
- `FL1` - Ligue 1
- `CL` - Champions League
- `WC` - World Cup
- `EC` - European Championship

### Example: Get Today's Matches

```javascript
// MUST be called via server proxy (Python server.py)
async function getTodaysMatches() {
    const response = await fetch('/api/football/matches', {
        headers: { 'X-Auth-Token': 'YOUR_KEY' }
    });
    const data = await response.json();
    return data.matches;
}
```

### Match Object Structure
```json
{
    "id": 327117,
    "competition": { "name": "Premier League", "code": "PL" },
    "homeTeam": { "id": 64, "name": "Liverpool FC", "crest": "..." },
    "awayTeam": { "id": 65, "name": "Manchester City FC" },
    "utcDate": "2024-01-14T16:30:00Z",
    "status": "FINISHED",
    "score": {
        "fullTime": { "home": 1, "away": 0 }
    }
}
```

---

## 2. TheSportsDB (Team Images & Fanart)

### Setup
- **Free API Key**: `3` (use in URL, limited features)
- **Test Key**: `123` (more features, but rate limited)
- No registration required for basic use

### Key Endpoints

```
Base URL: https://www.thesportsdb.com/api/v1/json/{API_KEY}
```

| Endpoint | Description |
|----------|-------------|
| `/searchteams.php?t={name}` | Search team by name |
| `/lookupteam.php?id={id}` | Get team details by ID |
| `/lookupleague.php?id={id}` | Get league details |
| `/all_leagues.php` | List all leagues |

### Example: Get Team Badge

```javascript
async function getTeamBadge(teamName) {
    const url = `https://www.thesportsdb.com/api/v1/json/3/searchteams.php?t=${encodeURIComponent(teamName)}`;
    const response = await fetch(url);
    const data = await response.json();
    
    if (data.teams && data.teams[0]) {
        return {
            badge: data.teams[0].strBadge,           // Team logo
            jersey: data.teams[0].strEquipment,      // Jersey image
            stadium: data.teams[0].strStadiumThumb,  // Stadium photo
            fanart: data.teams[0].strFanart1         // Fanart background
        };
    }
    return null;
}
```

### Image Sizes
Append to any image URL:
- `/medium` - 500px
- `/small` - 250px
- `/tiny` - 50px

```javascript
const badgeUrl = team.strBadge + '/small';  // Get 250px version
```

---

## 3. Combined Integration Strategy

### Mapping Between APIs

```javascript
class SportsDataService {
    constructor() {
        this.imageCache = new Map();
    }
    
    async getMatchWithImages(match) {
        // 1. Get match data from Football-Data.org
        const homeImages = await this.getTeamImages(match.homeTeam.name);
        const awayImages = await this.getTeamImages(match.awayTeam.name);
        
        return {
            ...match,
            homeTeam: { ...match.homeTeam, ...homeImages },
            awayTeam: { ...match.awayTeam, ...awayImages }
        };
    }
    
    async getTeamImages(teamName) {
        // Check cache first
        if (this.imageCache.has(teamName)) {
            return this.imageCache.get(teamName);
        }
        
        // Fetch from TheSportsDB
        const url = `https://www.thesportsdb.com/api/v1/json/3/searchteams.php?t=${encodeURIComponent(teamName)}`;
        const response = await fetch(url);
        const data = await response.json();
        
        if (data.teams && data.teams[0]) {
            const images = {
                badge: data.teams[0].strBadge + '/small',
                fanart: data.teams[0].strFanart1
            };
            this.imageCache.set(teamName, images);
            return images;
        }
        
        return { badge: null, fanart: null };
    }
}
```

---

## 4. Simple Proxy for Football-Data.org

Since Football-Data.org doesn't support CORS, add to your `server.py`:

```python
@app.route('/api/football/<path:endpoint>')
def proxy_football(endpoint):
    url = f'https://api.football-data.org/v4/{endpoint}'
    headers = {'X-Auth-Token': 'YOUR_FOOTBALL_DATA_API_KEY'}
    
    response = requests.get(url, headers=headers)
    return jsonify(response.json())
```

---

## 5. Rate Limit Management

```javascript
class RateLimiter {
    constructor(maxRequests, perMinutes) {
        this.maxRequests = maxRequests;
        this.perMinutes = perMinutes;
        this.requests = [];
    }
    
    async throttle() {
        const now = Date.now();
        const windowStart = now - (this.perMinutes * 60 * 1000);
        
        // Remove old requests
        this.requests = this.requests.filter(t => t > windowStart);
        
        if (this.requests.length >= this.maxRequests) {
            const waitTime = this.requests[0] - windowStart;
            await new Promise(resolve => setTimeout(resolve, waitTime));
        }
        
        this.requests.push(now);
    }
}

// Usage
const footballDataLimiter = new RateLimiter(10, 1);  // 10 per minute
const sportsDbLimiter = new RateLimiter(30, 1);      // 30 per minute
```

---

## Next Steps

1. [ ] Register for Football-Data.org API key
2. [ ] Add proxy endpoint to `server.py`
3. [ ] Create `SportsDataClient` class in IPTV player
4. [ ] Build team name → badge cache
5. [ ] Integrate with "Live Sports" section
