// XTREAM IPTV Player Configuration
const CONFIG = {
  // XTREAM API endpoint (user-configurable via login)
  API_BASE_URL: localStorage.getItem('xtream_api_url') || '',
  API_USERNAME: localStorage.getItem('xtream_username') || '',
  API_PASSWORD: localStorage.getItem('xtream_password') || '',

  // Performance tuning
  VIRTUAL_LIST_ITEM_HEIGHT: 56, // pixels per item in virtual list
  VIRTUAL_LIST_RENDER_AHEAD: 5, // render 5 items before/after visible area
  VIRTUAL_GRID_COLS: 5, // grid columns (responsive)
  VIRTUAL_GRID_ITEM_HEIGHT: 320, // grid item height with poster
  SEARCH_DEBOUNCE_MS: 300,
  SEARCH_MAX_RESULTS: 100,
  CACHE_TTL_MINUTES: 60, // IndexedDB cache TTL
  BATCH_LOAD_SIZE: 500, // items per pagination

  // Database config
  DB_NAME: 'xtream_iptv',
  DB_VERSION: 1,
  DB_STORES: {
    channels: { keyPath: 'channel_id', indexes: ['category_id', 'name'] },
    movies: { keyPath: 'id', indexes: ['category_id', 'name'] },
    series: { keyPath: 'id', indexes: ['category_id', 'name'] },
    epg: { keyPath: 'id', indexes: ['channel_id', 'start_time'] },
    favorites: { keyPath: 'id', indexes: ['type', 'added_date'] },
    history: { keyPath: 'id', indexes: ['watched_date'] },
    cache: { keyPath: 'key', indexes: ['expires_at'] }
  },

  // Video player settings
  HLS_CONFIG: {
    debug: false,
    autoStartLoad: true,
    startPosition: -1,
    maxBufferLength: 30,
    maxMaxBufferLength: 600,
    maxBufferHole: 0.5,
    lowLatencyMode: false,
    capLevelOnFPSDrop: true
  },

  // UI settings
  LANGUAGE: localStorage.getItem('language') || 'en',
  THEME: localStorage.getItem('theme') || 'dark',
  ENABLE_PARENTAL_CONTROL: localStorage.getItem('parental_control') === 'true',
  PARENTAL_PIN: localStorage.getItem('parental_pin') || '',

  // Feature flags
  FEATURES: {
    FAVORITES: true,
    WATCH_HISTORY: true,
    RESUME_PLAYBACK: true,
    EPG: true,
    SEARCH: true,
    MULTI_LANGUAGE: true,
    PARENTAL_CONTROLS: true,
    RESPONSIVE_DESIGN: true
  }
};

// API endpoints helper
CONFIG.getApiUrl = (endpoint) => {
  const base = CONFIG.API_BASE_URL.replace(/\/$/, '');
  return `${base}/player_api.php?username=${encodeURIComponent(CONFIG.API_USERNAME)}&password=${encodeURIComponent(CONFIG.API_PASSWORD)}&action=${endpoint}`;
};

// Save credentials
CONFIG.setCredentials = (url, username, password) => {
  CONFIG.API_BASE_URL = url;
  CONFIG.API_USERNAME = username;
  CONFIG.API_PASSWORD = password;
  localStorage.setItem('xtream_api_url', url);
  localStorage.setItem('xtream_username', username);
  localStorage.setItem('xtream_password', password);
};

// Clear credentials
CONFIG.clearCredentials = () => {
  CONFIG.API_BASE_URL = '';
  CONFIG.API_USERNAME = '';
  CONFIG.API_PASSWORD = '';
  localStorage.removeItem('xtream_api_url');
  localStorage.removeItem('xtream_username');
  localStorage.removeItem('xtream_password');
};
