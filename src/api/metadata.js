// ========================= METADATA CLIENTS =========================
import { Storage } from "../utils/storage.js";

// --- FOOTBALL API ---
export class FootballClient {
  constructor(getProxyConfig) {
    this.host = "api-football-v1.p.rapidapi.com";
    // getProxyConfig is a callback to read the current state of proxy variables
    this.getProxyConfig = getProxyConfig; 
  }

  async getLive() {
    const fbKey = Storage.read("football_api_key");
    if (!fbKey) return [];
    
    try {
      const cfg = this.getProxyConfig();
      let url = `https://${this.host}/v3/fixtures?live=all`;
      let headers = { "x-rapidapi-key": fbKey, "x-rapidapi-host": this.host };
      
      if (cfg.useProxy) {
        url = `${cfg.proxyUrl}/api/football/fixtures?live=all`;
      }
      
      const res = await fetch(url, { headers });
      const data = await res.json();
      return data.response || [];
    } catch {
      return [];
    }
  }
}

// --- OMDb API ---
export class OmdbClient {
  constructor(getProxyConfig) {
    this.getProxyConfig = getProxyConfig;
  }

  async get(title, year) {
    const omdbKey = Storage.read("omdb_api_key");
    if (!omdbKey) return null;
    
    try {
      const cfg = this.getProxyConfig();
      let url = `https://www.omdbapi.com/?apikey=${omdbKey}&t=${encodeURIComponent(title)}&y=${year || ""}`;
      
      if (cfg.useProxy) url = `${cfg.proxyUrl}/proxy?url=${encodeURIComponent(url)}`;
      
      const res = await fetch(url);
      const data = await res.json();
      return data.Response === "True" ? data : null;
    } catch {
      return null;
    }
  }
}
