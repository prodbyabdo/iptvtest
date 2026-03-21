// ========================= XTREAM CLIENT =========================
import { Storage } from "../utils/storage.js";

export class XtreamClient {
  constructor(cacheInstance, onLog = console.log, onError = console.error) {
    this.cache = cacheInstance;
    this.onLog = onLog;
    this.onError = onError;
    this.memCache = new Map();
    
    // Default Config template
    this.config = {
      url: Storage.read("xtream_url"),
      user: Storage.read("xtream_user"),
      pass: Storage.read("xtream_pass"),
      proxyUrl: "http://localhost:8000",
      useProxy: false,
      _proxyChecked: false
    };
  }

  updateConfig(newConfig) {
    this.config = { ...this.config, ...newConfig };
  }

  baseUrl() {
    let url = this.config.url.trim().replace(/\/$/, "");
    if (url.includes('player_api.php')) return url;
    return `${url}/player_api.php`;
  }

  async checkProxy() {
    this.config._proxyChecked = true;
    try {
      const ctrl = new AbortController();
      setTimeout(() => ctrl.abort(), 3000);
      const res = await fetch(`${this.config.proxyUrl}/health`, { mode: 'cors', signal: ctrl.signal });
      if (res.ok) {
        this.config.useProxy = true;
        this.onLog("Local Proxy Server detected! CORS and SSL issues bypassed.", "success");
        return true;
      }
    } catch (e) {
      console.warn("Local Proxy Server not detected.");
    }
    return false;
  }

  async fetchApi(action, params = {}, cacheKey = null) {
    if (!this.config.url || !this.config.user) return null;

    // Check proxy once
    if (!this.config.useProxy && !this.config._proxyChecked) await this.checkProxy();

    // Try memory cache first for instant load
    if (cacheKey && this.memCache.has(cacheKey)) {
      console.log("Memory Cache hit:", cacheKey);
      return this.memCache.get(cacheKey);
    }

    // Try DB cache next
    if (cacheKey && this.cache) {
      const cached = await this.cache.get(cacheKey);
      if (cached) {
        console.log("DB Cache hit:", cacheKey);
        this.memCache.set(cacheKey, cached); // Populate RAM
        return cached;
      }
    }

    const q = new URLSearchParams({
      username: this.config.user,
      password: this.config.pass,
      action,
      ...params,
    });

    let baseUrl = this.baseUrl();
    if (!baseUrl.startsWith("http")) baseUrl = "http://" + baseUrl;

    // Build URL list: primary + HTTP fallback if HTTPS
    const urlsToTry = [`${baseUrl}?${q}`];
    if (baseUrl.startsWith("https://")) {
      const httpUrl = baseUrl.replace("https://", "http://");
      const hasPort = httpUrl.split('/')[2].includes(':');
      if (!hasPort) urlsToTry.push(`${httpUrl.replace('/player_api.php', ':80/player_api.php')}?${q}`);
      urlsToTry.push(`${httpUrl}?${q}`);
    }

    for (let i = 0; i < urlsToTry.length; i++) {
      let rawUrl = urlsToTry[i];
      let fetchUrl = this.config.useProxy
        ? `${this.config.proxyUrl}/proxy?url=${encodeURIComponent(rawUrl)}`
        : rawUrl;

      // Log exactly what is being fetched, to assist debugging
      console.log(`Fetching (attempt ${i + 1}/${urlsToTry.length}):`, fetchUrl);

      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 15000); // 15 seconds max
        const res = await fetch(fetchUrl, { signal: controller.signal });
        clearTimeout(timeoutId);
        if (!res.ok) {
          if (res.status === 404 && i < urlsToTry.length - 1) {
            this.onLog(`404 on attempt ${i + 1}, trying fallback...`, 'warning');
            continue;
          }
          throw new Error(`HTTP Error: ${res.status}`);
        }
        console.log(`[ADVANCED LOG] network response OK. Parsing JSON...`);
        const data = await res.json();
        console.log(`[ADVANCED LOG] parsed JSON successfully. Result is Array?`, Array.isArray(data), `Length:`, data.length || 0);

        // If fallback worked, save the working URL
        if (i > 0) {
          const workedUrl = rawUrl.split('/player_api.php')[0];
          this.onLog(`Switching to working URL: ${workedUrl}`, 'success');
          this.config.url = workedUrl;
          Storage.store('xtream_url', workedUrl);
        }

        if (cacheKey && Array.isArray(data) && data.length > 0) {
          this.memCache.set(cacheKey, data);
          if (this.cache) await this.cache.set(cacheKey, data);
          console.log("Cached:", cacheKey);
        }
        return data;
      } catch (e) {
        if (i < urlsToTry.length - 1) { continue; }
        console.error(e);
        if (e.name === "AbortError") {
          this.onError("Request timed out after 15s. Check network or proxy.");
        } else if (e.message?.includes("Failed to fetch")) {
          this.onError("Connection Failed. Check URL or CORS.");
        } else {
          this.onError("API Error: " + (e.message || "Unknown error"));
        }
        return null;
      }
    }
  }

  async getCategories(type = "live") {
    const map = {
      live: "get_live_categories",
      movies: "get_vod_categories",
      series: "get_series_categories",
    };
    const key = `categories_${type}`;
    return (await this.fetchApi(map[type], {}, key)) || [];
  }

  async getStreams(type, catId) {
    const map = {
      live: "get_live_streams",
      movies: "get_vod_streams",
      series: "get_series",
    };
    const key = `streams_${type}_${catId}`;
    return (await this.fetchApi(map[type], { category_id: catId }, key)) || [];
  }

  async getSeriesInfo(seriesId) {
    const key = `series_info_${seriesId}`;
    return await this.fetchApi("get_series_info", { series_id: seriesId }, key);
  }

  constructEpisodeUrl(episodeId, ext = "mkv") {
    let base = this.config.url.replace(/\/$/, "");
    if (!base.startsWith("http")) base = "http://" + base;
    let url = `${base}/series/${this.config.user}/${this.config.pass}/${episodeId}.${ext}`;
    if (this.config.useProxy) url = `${this.config.proxyUrl}/proxy?url=${encodeURIComponent(url)}`;
    return url;
  }

  constructStreamUrl(id, type) {
    let base = this.config.url.replace(/\/$/, "");
    if (!base.startsWith("http")) base = "http://" + base;
    let url;
    if (type === "live") url = `${base}/live/${this.config.user}/${this.config.pass}/${id}.m3u8`;
    else if (type === "movies") url = `${base}/movie/${this.config.user}/${this.config.pass}/${id}.mkv`;
    else url = `${base}/series/${this.config.user}/${this.config.pass}/${id}.mkv`;
    
    if (this.config.useProxy) url = `${this.config.proxyUrl}/proxy?url=${encodeURIComponent(url)}`;
    return url;
  }

  static async testConnection(url, user, pass, proxyUrl = "http://localhost:8000", useProxy = false, onLog = console.log) {
    let cleanUrl = url.replace(/\/$/, "");
    if (!cleanUrl.startsWith("http")) cleanUrl = "http://" + cleanUrl;

    const q = new URLSearchParams({
      username: user,
      password: pass,
      action: "get_live_categories",
    });

    let fetchUrl = `${cleanUrl}/player_api.php?${q}`;
    if (useProxy) fetchUrl = `${proxyUrl}/proxy?url=${encodeURIComponent(fetchUrl)}`;

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000);
      const res = await fetch(fetchUrl, { signal: controller.signal });
      clearTimeout(timeoutId);
      if (!res.ok) {
        onLog(`HTTP Error: ${res.status} ${res.statusText}`, 'error');
        return { success: false, msg: `HTTP ${res.status}` };
      }
      onLog('API Response received. Parsing JSON...');
      await res.json();
      onLog('Connection Verified!', 'success');
      return { success: true };
    } catch (e) {
      if (e.name === "AbortError") return { success: false, msg: "Timeout" };
      return { success: false, msg: e.message };
    }
  }
}
