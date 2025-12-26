# API Integration Cheat Sheet

## Football API (RapidAPI)

### Quick Start
```javascript
// Initialize
const fb = new FootballAPI('YOUR_RAPIDAPI_KEY');

// Get live matches
const liveMatches = await fb.getLiveFixtures();

// Get league table
const standings = await fb.getLeagueTable('premierleague');

// Get fixtures
const fixtures = await fb.getFixtures('laliga');

// Get results
const results = await fb.getResults('seriea');
```

### Popular Competitions
```javascript
const comps = fb.getPopularCompetitions();
// Returns:
// { id: 39, name: 'Premier League', slug: 'premierleague' }
// { id: 140, name: 'La Liga', slug: 'laliga' }
// { id: 135, name: 'Serie A', slug: 'seriea' }
// { id: 61, name: 'Ligue 1', slug: 'ligue1' }
// { id: 78, name: 'Bundesliga', slug: 'bundesliga' }
// { id: 2, name: 'UEFA Champions League', slug: 'championsleague' }
// etc. (315+ total)
```

### Methods
| Method | Parameters | Returns | Rate Limit |
|--------|-----------|---------|-----------|
| `getCompetitions()` | none | Array of all 315+ competitions | 1 call |
| `getLiveFixtures()` | none | Current live matches | 1 call |
| `getFixtures(id)` | competition id | Upcoming fixtures | 1 call |
| `getResults(id)` | competition id | Recent results | 1 call |
| `getLeagueTable(id)` | competition id | League standings | 1 call |
| `getTeamByName(id, name)` | comp id, team name | Team info | 1 call |
| `getTransfers(id)` | competition id | Player transfers | 1 call |
| `getFixtureDetails(id)` | fixture id | Full match details | 1 call |

### Response Format (Formatted)
```javascript
{
  id: 1234567,
  date: Date object,
  status: 'LIVE', // 'LIVE', 'NS', 'PST', 'FT', '1H', '2H'
  statusLong: 'Match Live',
  isLive: true,
  isFinished: false,
  round: 'Regular Season - 1',
  venue: 'Old Trafford',
  referee: 'André Marriner',
  
  home: {
    name: 'Manchester United',
    id: 33,
    logo: 'https://...',
    goals: 2,
    winner: true
  },
  away: {
    name: 'Liverpool',
    id: 40,
    logo: 'https://...',
    goals: 1,
    winner: false
  },
  
  league: {
    id: 39,
    name: 'Premier League',
    country: 'England',
    logo: 'https://...',
    flag: 'https://...',
    season: 2024
  }
}
```

### Rate Limit Management
```javascript
const remaining = fb.getRemainingCalls(); // 100 - used
const used = fb.getRequestCount();         // Number used today
const canCall = remaining > 0;

if (remaining < 10) {
  console.warn(`Only ${remaining} calls left today!`);
}
```

### Caching
- 30-minute cache for all requests
- Automatic cache expiration
- Manual clear: `fb.clearCache()`

---

## OMDb API

### Quick Start
```javascript
// Initialize
const omdb = new OMDbAPI('YOUR_OMDB_KEY');

// Search movies
const movies = await omdb.searchMovies('Inception');

// Get full details
const details = await omdb.getByTitle('Inception', 'movie');

// Search series
const series = await omdb.searchSeries('Breaking Bad');

// Get season info
const season = await omdb.getSeasonInfo('tt0903747', 1);
```

### Methods
| Method | Parameters | Returns | Rate Limit |
|--------|-----------|---------|-----------|
| `search(title, type)` | title, type ('movie'/'series') | Search results array | 1 call |
| `searchMovies(title)` | title | Movie results | 1 call |
| `searchSeries(title)` | title | Series results | 1 call |
| `getByTitle(title, type)` | title, type | Full details | 1 call |
| `getById(imdbId)` | IMDb ID | Full details | 1 call |
| `getSeasonInfo(id, season)` | IMDb ID, season # | Season episodes | 1 call |
| `getEpisodeInfo(id, s, e)` | IMDb ID, season, ep | Episode details | 1 call |
| `enrichItem(item, type)` | IPTV item, type | Item with metadata | 1+ calls |

### Response Format (Full Details)
```javascript
{
  imdbID: 'tt1375666',
  title: 'Inception',
  year: '2010',
  rated: 'PG-13',
  releaseDate: '16 Jul 2010',
  runtime: '148 min',
  genre: 'Action, Sci-Fi, Thriller',
  director: 'Christopher Nolan',
  writers: 'Christopher Nolan',
  actors: 'Leonardo DiCaprio, Marion Cotillard, Ellen Page, Joseph Gordon-Levitt',
  plot: 'A skilled thief who steals corporate secrets...',
  poster: 'https://m.media-amazon.com/images/...',
  rating: '8.8',     // IMDb rating
  votes: '2,234,567', // Number of votes
  production: 'Warner Bros. Pictures',
  boxOffice: '$839,307,756',
  type: 'movie',
  
  // For series:
  totalSeasons: '5',
  seriesEndYear: '2013'
}
```

### Search Results Format
```javascript
[
  {
    title: 'Inception',
    year: '2010',
    imdbID: 'tt1375666',
    type: 'movie',
    poster: 'https://...'
  },
  // ... more results
]
```

### Enrichment (IPTV + OMDb)
```javascript
// Add metadata to a single item
const enriched = await omdb.enrichItem({
  name: 'Inception',
  stream_id: 123,
  stream_icon: 'https://...'
}, 'movie');

// Result:
{
  name: 'Inception',
  stream_id: 123,
  stream_icon: 'https://...',
  omdb: {
    title: 'Inception',
    rating: '8.8',
    poster: 'https://...', // Use instead of stream_icon
    genre: 'Action, Sci-Fi',
    plot: 'A skilled thief...',
    // ... all metadata
  }
}
```

### Caching
- 7-day cache for all requests
- Automatic cache expiration
- Manual clear: `omdb.clearCache()`

### Batch Operations
```javascript
// Enrich multiple items (respects rate limits)
const items = [...arrayOfIPTVItems];
const enriched = await omdb.enrichItems(items, 'movie');

// Or with batch control
const results = await omdb.batchSearch(
  ['Inception', 'Dark Knight', 'Interstellar'],
  5,      // batch size
  300     // delay between batches (ms)
);
```

---

## XTREAM API

### Quick Start
```javascript
// Available methods in IPTV object (built into player)
const liveCategories = await IPTV.getLiveCategories();
const liveStreams = await IPTV.getLiveStreams(categoryId);
const movies = await IPTV.getMovies(categoryId);
const series = await IPTV.getSeries(categoryId);
const streamUrl = IPTV.getStreamUrl(streamId, 'live');
```

### Stream URL Format
```javascript
// Live TV: m3u8 (HLS stream)
http://server:port/live/username/password/channelId.m3u8

// Movies: various formats (mkv, mp4, ts)
http://server:port/movie/username/password/movieId.mkv

// Series: episode streaming
http://server:port/series/username/password/seriesId.mkv
```

### Common Response Structure
```javascript
// Live Channel
{
  num: 1,
  name: 'Channel Name',
  stream_type: 'live',
  stream_id: 12345,
  stream_icon: 'https://...',
  category_name: 'Sports',
  category_id: 5
}

// Movie
{
  num: 1,
  name: 'Movie Title',
  stream_type: 'movie',
  stream_id: 54321,
  stream_icon: 'https://...',
  category_name: 'Action',
  category_id: 3,
  rating: 8.5,          // Usually from provider
  duration: '120 min'   // Some providers include
}

// Series
{
  series_id: 98765,
  name: 'Series Name',
  cover: 'https://...',
  category_name: 'Drama',
  category_id: 2,
  seasons: 5,
  episodes: [...]
}
```

---

## Integration Example: Complete IPTV + Football + OMDb

```javascript
// 1. Initialize all APIs
const fb = new FootballAPI(footballKey);
const omdb = new OMDbAPI(omdbKey);

// 2. Load IPTV content
const channels = await IPTV.getLiveStreams();
const movies = await IPTV.getMovies();

// 3. Enrich movies with OMDb
const enriched = await omdb.enrichItems(movies, 'movie');

// 4. Get live football matches
const liveMatches = await fb.getLiveFixtures();

// 5. Display everything
displayChannels(channels);
displayMovies(enriched);  // Now with posters and ratings!
displayMatches(liveMatches);

// 6. Handle playback
function playItem(item) {
  if (item.omdb) {
    console.log(`Playing: ${item.omdb.title}`);
    console.log(`Rating: ${item.omdb.rating}/10`);
    console.log(`Genre: ${item.omdb.genre}`);
  }
  const url = IPTV.getStreamUrl(item.stream_id, 'movie');
  playHLS(url);
}
```

---

## Error Handling

### Football API
```javascript
const fb = new FootballAPI(key);

try {
  const matches = await fb.getLiveFixtures();
  if (!matches || matches.length === 0) {
    console.log('No live matches right now');
  }
} catch (err) {
  console.error('Football API error:', err);
}

// Check rate limit before calling
if (fb.getRemainingCalls() === 0) {
  console.warn('Rate limit reached! Try again tomorrow.');
}
```

### OMDb API
```javascript
const omdb = new OMDbAPI(key);

try {
  const movie = await omdb.getByTitle('Inception', 'movie');
  if (!movie) {
    console.log('Movie not found in OMDb database');
  }
} catch (err) {
  console.error('OMDb API error:', err);
}
```

### XTREAM API
```javascript
try {
  const channels = await IPTV.getLiveStreams();
  if (!channels || channels.length === 0) {
    console.error('No channels loaded - check credentials');
  }
} catch (err) {
  console.error('XTREAM error:', err);
}
```

---

## Performance Tips

### Reduce API Calls
```javascript
// ❌ Bad: Calling 100x without caching
for (let i = 0; i < 100; i++) {
  await fb.getFixtures(i); // Wastes API calls!
}

// ✅ Good: Use built-in caching
const matches = await fb.getFixtures();
const cached = fb.getCache('fixtures_data');
```

### Batch Processing
```javascript
// ❌ Bad: Sequential calls (slow)
for (const title of titles) {
  await omdb.getByTitle(title);
}

// ✅ Good: Batch with delay
const results = await omdb.batchSearch(titles, 10, 300);
```

### Selective Enrichment
```javascript
// ❌ Bad: Enrich all 10,000 movies (100 API calls)
const allEnriched = await omdb.enrichItems(allMovies);

// ✅ Good: Enrich only displayed items (5 API calls)
const visibleItems = movies.slice(0, 50);
const enriched = await omdb.enrichItems(visibleItems);
```

---

## Debugging

### View API Usage
```javascript
// Football API
console.log(`Used: ${fb.getRequestCount()}/100`);
console.log(`Remaining: ${fb.getRemainingCalls()}`);

// OMDb API
console.log(`API calls made: ${omdb.getRequestCount()}`);
```

### Check Cache
```javascript
// Clear cache and retry
fb.clearCache();
const fresh = await fb.getLiveFixtures();

omdb.clearCache();
const freshMetadata = await omdb.getByTitle('Movie');
```

### Network Monitoring
1. Open DevTools (F12)
2. Go to Network tab
3. Reload page
4. Filter by "api-football" or "omdbapi"
5. Check response times and sizes

---

**Last Updated:** December 2025
