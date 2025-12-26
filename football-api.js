/**
 * Football API Client
 * Uses api-football-v1.p.rapidapi.com (315+ competitions)
 * Rate limit: 100 requests/day on free plan
 * Documentation: https://rapidapi.com/api-sports/api/api-football
 */

class FootballAPI {
  constructor(apiKey) {
    this.apiKey = apiKey;
    this.baseUrl = 'https://api-football-v1.p.rapidapi.com/v3';
    this.headers = {
      'x-rapidapi-key': apiKey,
      'x-rapidapi-host': 'api-football-v1.p.rapidapi.com'
    };
    this.cache = new Map();
    this.cacheDuration = 1800000; // 30 minutes (to preserve rate limit)
    this.requestCount = 0;
    this.resetTime = Date.now() + 86400000; // 24 hour window
  }

  /**
   * Check if request is cached and still valid
   */
  getCache(key) {
    const cached = this.cache.get(key);
    if (cached && cached.expires > Date.now()) {
      return cached.data;
    }
    this.cache.delete(key);
    return null;
  }

  /**
   * Set cache with expiration
   */
  setCache(key, data) {
    this.cache.set(key, {
      data,
      expires: Date.now() + this.cacheDuration
    });
  }

  /**
   * Fetch from API with error handling and rate limit tracking
   */
  async fetch(endpoint, params = {}) {
    if (!this.apiKey) {
      console.warn('Football API key not configured');
      return null;
    }

    // Check rate limit
    if (Date.now() > this.resetTime) {
      this.requestCount = 0;
      this.resetTime = Date.now() + 86400000;
    }

    if (this.requestCount >= 100) {
      console.warn('Football API rate limit reached (100/day)');
      return null;
    }

    const cacheKey = `${endpoint}_${JSON.stringify(params)}`;
    const cached = this.getCache(cacheKey);
    if (cached) return cached;

    try {
      const queryString = new URLSearchParams(params).toString();
      const url = `${this.baseUrl}${endpoint}${queryString ? '?' + queryString : ''}`;

      const response = await fetch(url, {
        method: 'GET',
        headers: this.headers,
        timeout: 10000
      });

      if (!response.ok) {
        if (response.status === 429) {
          console.error('Football API rate limited');
        }
        throw new Error(`HTTP ${response.status}`);
      }

      const data = await response.json();
      this.requestCount++;

      // Log remaining requests
      const remaining = parseInt(response.headers.get('x-ratelimit-requests-remaining') || '0');
      if (remaining < 10) {
        console.warn(`Football API: ${remaining} requests remaining today`);
      }

      this.setCache(cacheKey, data);
      return data;
    } catch (error) {
      console.error('Football API fetch error:', error);
      return null;
    }
  }

  /**
   * Get all competitions
   * Endpoint: /competitions
   */
  async getCompetitions() {
    const data = await this.fetch('/competitions');
    return data?.response || [];
  }

  /**
   * Get league table/standings
   * Endpoint: /{championship}/table
   * Examples: premierleague, laliga, seriea, ligue1, bundesliga, championsleague
   */
  async getLeagueTable(championship) {
    const data = await this.fetch(`/competitions/${championship}/standings`);
    if (!data?.response || data.response.length === 0) return [];
    
    // Flatten standings from response
    const standings = data.response[0];
    return standings.standings ? standings.standings[0].table : [];
  }

  /**
   * Get team information by name
   * Endpoint: /{championship}/squadname/{squadname}
   */
  async getTeamByName(championship, teamName) {
    const data = await this.fetch(`/competitions/${championship}/teams`, {
      search: teamName
    });
    return data?.response || [];
  }

  /**
   * Get team by position in standings
   * Endpoint: /{championship}/squadposition/{position}
   */
  async getTeamByPosition(championship, position) {
    const table = await this.getLeagueTable(championship);
    if (table.length === 0) return null;
    
    const team = table.find(t => t.rank === parseInt(position));
    return team || null;
  }

  /**
   * Get recent results/fixtures
   * Endpoint: /{championship}/results/
   */
  async getResults(championship, limit = 10) {
    const data = await this.fetch('/fixtures', {
      competition: championship,
      status: 'FT',
      last: limit
    });
    return data?.response || [];
  }

  /**
   * Get upcoming fixtures
   * Endpoint: /{championship}/fixtures/
   */
  async getFixtures(championship, limit = 10) {
    const data = await this.fetch('/fixtures', {
      competition: championship,
      status: 'NS,PST',
      next: limit
    });
    return data?.response || [];
  }

  /**
   * Get live fixtures (happening now)
   */
  async getLiveFixtures() {
    const data = await this.fetch('/fixtures', {
      live: 'all'
    });
    return data?.response || [];
  }

  /**
   * Get news/updates for a championship
   * Endpoint: /{championship}/news/
   * Note: This endpoint requires a separate news API, using fixtures as fallback
   */
  async getNews(championship, limit = 5) {
    // Fallback: return recent matches with results (acts as "news")
    return await this.getResults(championship, limit);
  }

  /**
   * Get transfers for a championship
   * Endpoint: /{championship}/transfers
   */
  async getTransfers(championship, limit = 10) {
    const data = await this.fetch('/transfers', {
      league: championship,
      limit: limit
    });
    return data?.response || [];
  }

  /**
   * Get detailed fixture information
   */
  async getFixtureDetails(fixtureId) {
    const data = await this.fetch('/fixtures', {
      id: fixtureId
    });
    return data?.response?.[0] || null;
  }

  /**
   * Get team details
   */
  async getTeamDetails(teamId) {
    const data = await this.fetch('/teams', {
      id: teamId
    });
    return data?.response?.[0] || null;
  }

  /**
   * Search for specific competition
   */
  async searchCompetition(name) {
    const competitions = await this.getCompetitions();
    return competitions.filter(c => 
      c.name.toLowerCase().includes(name.toLowerCase())
    );
  }

  /**
   * Get common football competitions (pre-configured)
   */
  getPopularCompetitions() {
    return [
      { id: 39, name: 'Premier League', slug: 'premierleague' },
      { id: 140, name: 'La Liga', slug: 'laliga' },
      { id: 135, name: 'Serie A', slug: 'seriea' },
      { id: 61, name: 'Ligue 1', slug: 'ligue1' },
      { id: 78, name: 'Bundesliga', slug: 'bundesliga' },
      { id: 88, name: 'Eredivisie', slug: 'eredivisie' },
      { id: 94, name: 'Primeira Liga', slug: 'campeonatodeportugal' },
      { id: 2, name: 'UEFA Champions League', slug: 'championsleague' },
      { id: 3, name: 'UEFA Europa League', slug: 'europaleague' },
      { id: 848, name: 'UEFA Conference League', slug: 'europaconferenceleague' },
      { id: 16, name: 'FA Cup', slug: 'facup' },
      { id: 25, name: 'DFB Pokal', slug: 'dfbpokal' },
      { id: 34, name: 'Coppa Italia', slug: 'coppaitaliana' },
      { id: 51, name: 'Copa del Rey', slug: 'copadelrey' },
      { id: 1, name: 'FIFA World Cup', slug: 'fifaworldcup' },
      { id: 4, name: 'Copa América', slug: 'copaamérica' },
      { id: 529, name: 'Africa Cup of Nations', slug: 'africacupofnations' },
      { id: 16, name: 'UEFA Euro', slug: 'euro' }
    ];
  }

  /**
   * Format fixture data for UI display
   */
  formatFixture(fixture) {
    const { fixture: f, teams, goals, league, status } = fixture;
    
    return {
      id: f.id,
      date: new Date(f.date),
      status: f.status.short,
      statusLong: f.status.long,
      round: f.round,
      timezone: f.timezone,
      venue: f.venue?.name || 'TBA',
      referee: f.referee || 'TBA',
      home: {
        name: teams.home.name,
        id: teams.home.id,
        logo: teams.home.logo,
        goals: goals.home || 0,
        winner: f.winner === 'home'
      },
      away: {
        name: teams.away.name,
        id: teams.away.id,
        logo: teams.away.logo,
        goals: goals.away || 0,
        winner: f.winner === 'away'
      },
      league: {
        id: league.id,
        name: league.name,
        country: league.country,
        logo: league.logo,
        flag: league.flag,
        season: league.season
      },
      isLive: f.status.short === 'LIVE' || f.status.short === '1H' || f.status.short === '2H',
      isFinished: f.status.short === 'FT'
    };
  }

  /**
   * Format team data for UI display
   */
  formatTeam(team) {
    return {
      id: team.id,
      name: team.name,
      country: team.country,
      founded: team.founded,
      national: team.national,
      logo: team.logo,
      venue: team.venue?.name || 'TBA',
      coach: team.coach?.name || 'TBA'
    };
  }

  /**
   * Get standings with formatted data
   */
  async getFormattedStandings(championship) {
    const table = await this.getLeagueTable(championship);
    return table.map(team => ({
      position: team.rank,
      team: team.team.name,
      teamId: team.team.id,
      teamLogo: team.team.logo,
      played: team.all.played,
      wins: team.all.win,
      draws: team.all.draw,
      losses: team.all.lose,
      goalsFor: team.all.goals.for,
      goalsAgainst: team.all.goals.against,
      goalDifference: team.goalsDiff,
      points: team.points,
      form: team.form ? team.form.split('').map(c => ({
        'W': 'win',
        'D': 'draw',
        'L': 'loss'
      }[c] || 'unknown') : []
    }));
  }

  /**
   * Get all info about a competition
   */
  async getCompetitionInfo(competitionId) {
    const data = await this.fetch('/competitions', {
      id: competitionId
    });
    return data?.response?.[0] || null;
  }

  /**
   * Clear cache (useful for manual refresh)
   */
  clearCache() {
    this.cache.clear();
  }

  /**
   * Get remaining API calls
   */
  getRemainingCalls() {
    return 100 - this.requestCount;
  }

  /**
   * Get request count for today
   */
  getRequestCount() {
    return this.requestCount;
  }
}

// Export for use
if (typeof module !== 'undefined' && module.exports) {
  module.exports = FootballAPI;
}
