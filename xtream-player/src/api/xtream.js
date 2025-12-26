// XTREAM API Client with caching and retry logic
class XtreamAPI {
  constructor() {
    this.worker = new Worker('src/workers/parser.worker.js');
    this.requestQueue = [];
    this.requestInProgress = false;
  }

  async testConnection() {
    try {
      const url = CONFIG.getApiUrl('get_live_categories');
      const resp = await fetch(url, { timeout: 5000 });
      return resp.ok;
    } catch (err) {
      console.error('Connection test failed:', err);
      return false;
    }
  }

  async getCategories(type = 'live') {
    const cacheKey = `categories_${type}`;
    const cached = await storage.getCache(cacheKey);
    if (cached) return cached;

    const endpoint = type === 'live' ? 'get_live_categories' : 
                   type === 'movie' ? 'get_movie_categories' : 'get_series_categories';
    
    const url = CONFIG.getApiUrl(endpoint);
    const resp = await fetch(url);
    if (!resp.ok) throw new Error(`API error: ${resp.status}`);
    
    let data = await resp.json();
    data = Array.isArray(data) ? data : [];
    
    await storage.setCache(cacheKey, data);
    return data;
  }

  async getLiveChannels(categoryId = 0) {
    const cacheKey = `channels_live_${categoryId}`;
    const cached = await storage.getCache(cacheKey);
    if (cached) return cached;

    const url = CONFIG.getApiUrl('get_live_streams') + (categoryId ? `&category_id=${categoryId}` : '');
    const resp = await fetch(url);
    if (!resp.ok) throw new Error(`API error: ${resp.status}`);
    
    let data = await resp.json();
    data = Array.isArray(data) ? data : [];

    // Parse with Worker
    const parsed = await this.parseInWorker('parseChannels', data);
    
    // Store in IndexedDB
    await storage.put('channels', parsed);
    await storage.setCache(cacheKey, parsed);
    
    return parsed;
  }

  async getMovies(categoryId = 0, offset = 0, limit = CONFIG.BATCH_LOAD_SIZE) {
    const cacheKey = `movies_${categoryId}_${offset}`;
    const cached = await storage.getCache(cacheKey);
    if (cached) return cached;

    const url = CONFIG.getApiUrl('get_vod_streams') + (categoryId ? `&category_id=${categoryId}` : '');
    const resp = await fetch(url);
    if (!resp.ok) throw new Error(`API error: ${resp.status}`);
    
    let data = await resp.json();
    data = Array.isArray(data) ? data : [];
    const paginated = data.slice(offset, offset + limit);

    const parsed = await this.parseInWorker('parseMovies', paginated);
    await storage.put('movies', parsed);
    await storage.setCache(cacheKey, parsed);
    
    return parsed;
  }

  async getSeries(categoryId = 0, offset = 0, limit = CONFIG.BATCH_LOAD_SIZE) {
    const cacheKey = `series_${categoryId}_${offset}`;
    const cached = await storage.getCache(cacheKey);
    if (cached) return cached;

    const url = CONFIG.getApiUrl('get_series') + (categoryId ? `&category_id=${categoryId}` : '');
    const resp = await fetch(url);
    if (!resp.ok) throw new Error(`API error: ${resp.status}`);
    
    let data = await resp.json();
    data = Array.isArray(data) ? data : [];
    const paginated = data.slice(offset, offset + limit);

    const parsed = await this.parseInWorker('parseMovies', paginated); // reuse for series
    await storage.put('series', parsed);
    await storage.setCache(cacheKey, parsed);
    
    return parsed;
  }

  async getEPG(channelId, startDate = null, endDate = null) {
    const cacheKey = `epg_${channelId}`;
    const cached = await storage.getCache(cacheKey);
    if (cached) return cached;

    let url = CONFIG.getApiUrl('get_epg') + `&epg_id=${channelId}`;
    if (startDate) url += `&starttime=${startDate}`;
    if (endDate) url += `&endtime=${endDate}`;

    const resp = await fetch(url);
    if (!resp.ok) throw new Error(`API error: ${resp.status}`);
    
    const data = await resp.json();
    await storage.setCache(cacheKey, data);
    return data;
  }

  parseInWorker(action, data) {
    return new Promise((resolve, reject) => {
      const handler = (e) => {
        this.worker.removeEventListener('message', handler);
        if (e.data.success) resolve(e.data.result);
        else reject(new Error(e.data.error));
      };
      this.worker.addEventListener('message', handler);
      this.worker.postMessage({ action, data, CONFIG });
    });
  }

  getStreamUrl(streamId, type = 'live') {
    const base = CONFIG.API_BASE_URL.replace(/\/$/, '');
    const ext = type === 'movie' ? 'mkv' : type === 'series' ? 'mkv' : 'ts';
    return `${base}/${type}/${CONFIG.API_USERNAME}/${CONFIG.API_PASSWORD}/${streamId}.${ext}`;
  }

  getMPEGTSUrl(streamId) {
    return this.getStreamUrl(streamId, 'live');
  }

  getM3U8Url(streamId) {
    const base = CONFIG.API_BASE_URL.replace(/\/$/, '');
    return `${base}/live/${CONFIG.API_USERNAME}/${CONFIG.API_PASSWORD}/${streamId}.m3u8`;
  }
}

const api = new XtreamAPI();
