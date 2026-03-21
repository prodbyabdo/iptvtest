// ========================= APP ENGINE =========================
import { appState } from "./state.js";
import { XtreamClient } from "../api/xtream-client.js";
import { FootballClient, OmdbClient } from "../api/metadata.js";
import { DataCache, Storage } from "../utils/storage.js";

export class AppEngine {
  constructor() {
    this.cache = new DataCache();
    // Pass config getter to metadata clients
    const getProxyConfig = () => this.api.config;
    
    // Inject cache but omit DOM-based UI logs directly. We can emit events via window for UI to catch.
    this.api = new XtreamClient(
      this.cache,
      (msg, type) => window.dispatchEvent(new CustomEvent('app:log', { detail: { msg, type } })),
      (msg) => window.dispatchEvent(new CustomEvent('app:error', { detail: { msg } }))
    );
    
    this.fb = new FootballClient(getProxyConfig);
    this.omdb = new OmdbClient(getProxyConfig);
  }

  async init() {
    this.migrateFavorites();
    await this.cache.init();
    
    const url = Storage.read("xtream_url");
    const user = Storage.read("xtream_user");
    const pass = Storage.read("xtream_pass");

    if (url && user && pass) {
      appState.data.isLoggedIn = true;
      return true; // proceed to load app
    } else {
      appState.data.isLoggedIn = false;
      return false; // show login
    }
  }

  migrateFavorites() {
    let olderFavs = JSON.parse(Storage.read("favorites") || "[]");
    let currentFavs = JSON.parse(Storage.read("iptv_myList") || "[]");
    if (olderFavs.length > 0 && currentFavs.length === 0) {
      currentFavs = olderFavs;
      Storage.store("iptv_myList", JSON.stringify(currentFavs));
    }
    appState.data.favorites = currentFavs;
  }

  async login(url, user, pass) {
    const res = await XtreamClient.testConnection(
      url, user, pass, 
      this.api.config.proxyUrl, 
      this.api.config.useProxy || await this.api.checkProxy(), 
      (msg, type) => window.dispatchEvent(new CustomEvent('app:log', { detail: { msg, type } }))
    );

    if (res.success) {
      Storage.store("xtream_url", url);
      Storage.store("xtream_user", user);
      Storage.store("xtream_pass", pass);
      appState.data.isLoggedIn = true;
      
      // Update running API instance config
      this.api.updateConfig({ url, user, pass });
    }
    return res;
  }

  logout() {
    localStorage.clear();
    appState.data.isLoggedIn = false;
  }

  // --- Data Loading Logic --- //

  async checkProxy() {
    return await this.api.checkProxy();
  }

  async getCategories(type) {
    return await this.api.getCategories(type);
  }

  async loadContent(tab, catId) {
    appState.data.category = catId;
    let items = await this.api.getStreams(tab === "sports" ? "live" : tab, catId);

    if (tab === "sports") {
      items = items.filter(
        (x) =>
          (x.name || "").toLowerCase().includes("sport") ||
          (x.name || "").toLowerCase().includes("football") ||
          x.category_id == catId,
      );
    }
    appState.data.items = items;
    return items;
  }

  async loadFavorites() {
    appState.data.category = "favorites";
    appState.data.items = appState.data.favorites;
    return appState.data.favorites;
  }

  toggleFavorite(item) {
    const id = item.stream_id || item.series_id;
    const index = appState.data.favorites.findIndex(f => (f.stream_id || f.series_id) == id);
    let isAdded = false;

    if (index > -1) {
      appState.data.favorites.splice(index, 1);
    } else {
      const minItem = {
        stream_id: item.stream_id,
        series_id: item.series_id,
        name: item.name || item.title,
        stream_icon: item.stream_icon || item.cover || item.img || item.logo,
        rating: item.rating,
        year: item.year,
        category_id: item.category_id,
        stream_type: item.stream_type || (item.series_id ? 'series' : 'live')
      };
      appState.data.favorites.push(minItem);
      isAdded = true;
    }
    
    // Trigger reactivity manually if array methods don't naturally catch
    appState.data.favorites = [...appState.data.favorites];
    Storage.store('iptv_myList', JSON.stringify(appState.data.favorites));
    return isAdded;
  }

  searchItems(query) {
    appState.data.searchQuery = query;
  }

  getFilteredItems() {
    if (!appState.data.searchQuery) return appState.data.items;
    const lower = appState.data.searchQuery.toLowerCase();
    return appState.data.items.filter((i) =>
      (i.name || i.title || "").toLowerCase().includes(lower)
    );
  }

  isFavorite(item) {
    const id = item.stream_id || item.series_id;
    return appState.data.favorites.some(f => (f.stream_id || f.series_id) == id);
  }

  async fetchSeriesInfo(series) {
    const info = await this.api.getSeriesInfo(series.series_id);
    appState.data.currentSeries = { series, info };
    return info;
  }

  async fetchLiveFootball() {
    return await this.fb.getLive();
  }
}
