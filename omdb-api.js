/**
 * OMDb API Client
 * Enriches IPTV content with movie/TV metadata, posters, ratings, plots, etc.
 * API Limit: Depends on plan (free has rate limits)
 * Documentation: https://www.omdbapi.com/
 */

class OMDbAPI {
  constructor(apiKey) {
    this.apiKey = apiKey;
    this.baseUrl = 'https://www.omdbapi.com/';
    this.cache = new Map();
    this.cacheDuration = 604800000; // 7 days (metadata doesn't change often)
    this.requestCount = 0;
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
   * Fetch from OMDb API
   */
  async fetch(params = {}) {
    if (!this.apiKey) {
      console.warn('OMDb API key not configured');
      return null;
    }

    const cacheKey = JSON.stringify(params);
    const cached = this.getCache(cacheKey);
    if (cached) return cached;

    try {
      const query = new URLSearchParams({
        apikey: this.apiKey,
        ...params
      }).toString();

      const response = await fetch(`${this.baseUrl}?${query}`, {
        timeout: 10000
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const data = await response.json();
      this.requestCount++;

      if (data.Response === 'False') {
        console.warn('OMDb API error:', data.Error);
        return null;
      }

      this.setCache(cacheKey, data);
      return data;
    } catch (error) {
      console.error('OMDb API fetch error:', error);
      return null;
    }
  }

  /**
   * Search for movies or TV shows by title
   * Returns list of matches
   */
  async search(title, type = null) {
    const params = {
      s: title,
      type: type // 'movie', 'series', or null for both
    };

    const data = await this.fetch(params);
    return data?.Search || [];
  }

  /**
   * Search for movies only
   */
  async searchMovies(title) {
    return this.search(title, 'movie');
  }

  /**
   * Search for TV series only
   */
  async searchSeries(title) {
    return this.search(title, 'series');
  }

  /**
   * Get detailed information about a movie/series by IMDb ID
   */
  async getById(imdbId) {
    const data = await this.fetch({
      i: imdbId,
      type: 'full'
    });
    return data || null;
  }

  /**
   * Get detailed information by title (less accurate, uses search + getById)
   */
  async getByTitle(title, type = null) {
    const results = await this.search(title, type);
    if (results.length === 0) return null;

    // Get the first match's full details
    const firstMatch = results[0];
    return await this.getById(firstMatch.imdbID);
  }

  /**
   * Get season information for a TV series
   */
  async getSeasonInfo(imdbId, season) {
    const data = await this.fetch({
      i: imdbId,
      Season: season
    });
    return data || null;
  }

  /**
   * Get episode information for a TV series
   */
  async getEpisodeInfo(imdbId, season, episode) {
    const data = await this.fetch({
      i: imdbId,
      Season: season,
      Episode: episode
    });
    return data || null;
  }

  /**
   * Enrich a list of IPTV items with OMDb metadata
   * Matches by title/name, adds poster, rating, plot, etc.
   */
  async enrichItems(items, itemType = 'movie') {
    const enriched = [];

    for (const item of items) {
      const title = item.name || item.stream_name || '';
      
      try {
        const metadata = await this.getByTitle(title, itemType === 'series' ? 'series' : 'movie');
        
        enriched.push({
          ...item,
          omdb: metadata ? {
            imdbId: metadata.imdbID,
            title: metadata.Title,
            year: metadata.Year,
            rated: metadata.Rated,
            runtime: metadata.Runtime,
            genre: metadata.Genre,
            director: metadata.Director,
            writers: metadata.Writer,
            actors: metadata.Actors,
            plot: metadata.Plot,
            poster: metadata.Poster !== 'N/A' ? metadata.Poster : null,
            rating: metadata.imdbRating,
            votes: metadata.imdbVotes,
            type: metadata.Type,
            releaseDate: metadata.Released,
            production: metadata.Production,
            boxOffice: metadata.BoxOffice,
            totalSeasons: metadata.totalSeasons, // for series
            seriesEndYear: metadata.seriesEndYear // for series
          } : null
        });
      } catch (error) {
        console.warn(`Failed to enrich "${title}":`, error);
        enriched.push({
          ...item,
          omdb: null
        });
      }

      // Add small delay to avoid rate limiting (100 req/day free tier)
      await new Promise(resolve => setTimeout(resolve, 250));
    }

    return enriched;
  }

  /**
   * Enrich a single item with metadata
   */
  async enrichItem(item, itemType = 'movie') {
    const title = item.name || item.stream_name || '';
    
    try {
      const metadata = await this.getByTitle(title, itemType === 'series' ? 'series' : 'movie');
      
      return {
        ...item,
        omdb: metadata ? {
          imdbId: metadata.imdbID,
          title: metadata.Title,
          year: metadata.Year,
          rated: metadata.Rated,
          runtime: metadata.Runtime,
          genre: metadata.Genre,
          director: metadata.Director,
          writers: metadata.Writer,
          actors: metadata.Actors,
          plot: metadata.Plot,
          poster: metadata.Poster !== 'N/A' ? metadata.Poster : null,
          rating: metadata.imdbRating,
          votes: metadata.imdbVotes,
          type: metadata.Type,
          releaseDate: metadata.Released,
          production: metadata.Production,
          boxOffice: metadata.BoxOffice,
          totalSeasons: metadata.totalSeasons,
          seriesEndYear: metadata.seriesEndYear
        } : null
      };
    } catch (error) {
      console.warn(`Failed to enrich "${title}":`, error);
      return {
        ...item,
        omdb: null
      };
    }
  }

  /**
   * Format metadata for UI display
   */
  formatMetadata(metadata) {
    if (!metadata) return null;

    return {
      imdbId: metadata.imdbID,
      title: metadata.Title || 'Unknown',
      year: metadata.Year || 'N/A',
      rating: metadata.imdbRating || 'N/A',
      votes: metadata.imdbVotes || '0',
      runtime: metadata.Runtime || 'N/A',
      genre: metadata.Genre ? metadata.Genre.split(', ') : [],
      director: metadata.Director || 'N/A',
      actors: metadata.Actors ? metadata.Actors.split(', ').slice(0, 5) : [],
      plot: metadata.Plot || 'No plot available',
      poster: metadata.Poster !== 'N/A' ? metadata.Poster : null,
      contentRating: metadata.Rated || 'N/A',
      releaseDate: metadata.Released || 'N/A',
      production: metadata.Production || 'N/A',
      type: metadata.Type || 'unknown',
      totalSeasons: metadata.totalSeasons || null,
      seriesEndYear: metadata.seriesEndYear || null,
      boxOffice: metadata.BoxOffice && metadata.BoxOffice !== 'N/A' ? metadata.BoxOffice : null
    };
  }

  /**
   * Get rating badge color
   */
  getRatingColor(rating) {
    const rate = parseFloat(rating);
    if (isNaN(rate)) return 'gray';
    if (rate >= 8) return 'gold';
    if (rate >= 7) return 'green';
    if (rate >= 6) return 'yellow';
    if (rate >= 5) return 'orange';
    return 'red';
  }

  /**
   * Get rating emoji
   */
  getRatingEmoji(rating) {
    const rate = parseFloat(rating);
    if (isNaN(rate)) return '⭐';
    if (rate >= 8.5) return '🌟';
    if (rate >= 8) return '⭐⭐⭐';
    if (rate >= 7) return '⭐⭐';
    if (rate >= 6) return '⭐';
    return '✓';
  }

  /**
   * Filter metadata by genre
   */
  static filterByGenre(items, genre) {
    return items.filter(item => 
      item.omdb?.genre?.some(g => g.toLowerCase().includes(genre.toLowerCase()))
    );
  }

  /**
   * Sort by rating
   */
  static sortByRating(items, descending = true) {
    return items.sort((a, b) => {
      const rateA = parseFloat(a.omdb?.rating || 0);
      const rateB = parseFloat(b.omdb?.rating || 0);
      return descending ? rateB - rateA : rateA - rateB;
    });
  }

  /**
   * Sort by year
   */
  static sortByYear(items, descending = true) {
    return items.sort((a, b) => {
      const yearA = parseInt(a.omdb?.year || 0);
      const yearB = parseInt(b.omdb?.year || 0);
      return descending ? yearB - yearA : yearA - yearB;
    });
  }

  /**
   * Get request count
   */
  getRequestCount() {
    return this.requestCount;
  }

  /**
   * Clear cache
   */
  clearCache() {
    this.cache.clear();
  }

  /**
   * Batch search (useful for populating metadata in background)
   */
  async batchSearch(titles, batchSize = 5, delayMs = 300) {
    const results = [];
    
    for (let i = 0; i < titles.length; i += batchSize) {
      const batch = titles.slice(i, i + batchSize);
      const batchResults = await Promise.all(
        batch.map(title => this.getByTitle(title))
      );
      results.push(...batchResults);
      
      // Delay between batches to avoid rate limiting
      if (i + batchSize < titles.length) {
        await new Promise(resolve => setTimeout(resolve, delayMs));
      }
    }
    
    return results;
  }
}

// Export for use
if (typeof module !== 'undefined' && module.exports) {
  module.exports = OMDbAPI;
}
