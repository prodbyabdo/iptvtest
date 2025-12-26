// Main Application Controller
class XtreamApp {
  constructor() {
    this.currentTab = 'live';
    this.currentCategory = null;
    this.currentContentType = 'live';
    this.categories = [];
    this.channels = [];
    this.movies = [];
    this.series = [];
    this.player = null;
    this.categoryList = null;
    this.gridView = null;
    this.playlistList = null;
    this.isLoading = false;

    this.init();
  }

  async init() {
    this.setupEventListeners();
    this.setupTheme();
    this.checkLogin();
  }

  setupEventListeners() {
    // Login
    document.getElementById('loginForm').addEventListener('submit', (e) => this.handleLogin(e));

    // Navigation tabs
    document.querySelectorAll('.nav-tab').forEach(btn => {
      btn.addEventListener('click', (e) => this.switchTab(e.target.dataset.tab));
    });

    // Search
    const searchInput = document.getElementById('searchInput');
    searchInput.addEventListener('input', Utils.debounce((e) => this.handleSearch(e.target.value), CONFIG.SEARCH_DEBOUNCE_MS));

    // Settings
    document.getElementById('themeSelect').addEventListener('change', (e) => Utils.setTheme(e.target.value));
    document.getElementById('languageSelect').addEventListener('change', (e) => Utils.setLanguage(e.target.value));

    // Logout
    document.getElementById('logoutBtn').addEventListener('click', () => this.logout());
    document.getElementById('logoutBtnSettings').addEventListener('click', () => this.logout());

    // Favorites
    document.getElementById('favoriteBtn').addEventListener('click', () => this.toggleFavorite());
  }

  setupTheme() {
    const theme = Utils.getTheme();
    document.documentElement.setAttribute('data-theme', theme);
    document.getElementById('themeSelect').value = theme;
  }

  checkLogin() {
    const url = localStorage.getItem('xtream_api_url');
    const username = localStorage.getItem('xtream_username');
    const password = localStorage.getItem('xtream_password');

    if (url && username && password) {
      CONFIG.setCredentials(url, username, password);
      this.showApp();
      this.loadContent();
    } else {
      this.showLogin();
    }
  }

  showLogin() {
    document.getElementById('loginScreen').classList.remove('hidden');
    document.getElementById('appContainer').classList.add('hidden');
  }

  showApp() {
    document.getElementById('loginScreen').classList.add('hidden');
    document.getElementById('appContainer').classList.remove('hidden');
  }

  async handleLogin(e) {
    e.preventDefault();
    const url = document.getElementById('serverUrl').value.trim();
    const username = document.getElementById('username').value.trim();
    const password = document.getElementById('password').value.trim();

    if (!url || !username || !password) return;

    try {
      CONFIG.setCredentials(url, username, password);

      // Test connection
      const connected = await api.testConnection();
      if (!connected) throw new Error('Connection failed. Check server URL and credentials.');

      this.showApp();
      await this.loadContent();
    } catch (err) {
      document.getElementById('loginError').textContent = `Error: ${err.message}`;
      console.error('Login error:', err);
    }
  }

  async loadContent() {
    try {
      this.setLoading(true);

      // Load categories
      if (this.currentTab === 'live') {
        this.categories = await api.getCategories('live');
        this.renderCategories(this.categories);
        this.channels = await api.getLiveChannels();
        this.renderChannels();
      } else if (this.currentTab === 'movies') {
        this.categories = await api.getCategories('movie');
        this.renderCategories(this.categories);
        this.movies = await api.getMovies();
        this.renderMovies();
      } else if (this.currentTab === 'series') {
        this.categories = await api.getCategories('series');
        this.renderCategories(this.categories);
        this.series = await api.getSeries();
        this.renderSeries();
      }
    } catch (err) {
      console.error('Load content error:', err);
      alert('Failed to load content. Check your connection.');
    } finally {
      this.setLoading(false);
    }
  }

  renderCategories(categories) {
    if (!this.categoryList) {
      const container = document.getElementById('categoryList');
      this.categoryList = new VirtualList(container, {
        itemHeight: 44,
        render: (item, index) => {
          const div = document.createElement('div');
          div.className = 'category-item';
          div.textContent = item.category_name || 'All';
          div.addEventListener('click', () => this.selectCategory(item));
          return div;
        }
      });
    }

    // Add "All" option
    const allOption = { category_id: 0, category_name: 'All' };
    this.categoryList.setItems([allOption, ...categories]);
  }

  renderChannels() {
    if (!this.gridView) {
      const container = document.getElementById('gridView');
      this.gridView = new VirtualGrid(container, {
        itemHeight: 260,
        render: (item, index) => {
          const div = document.createElement('div');
          div.className = 'grid-item';
          div.innerHTML = `
            <img data-src="${item.logo}" class="lazy-image" alt="${Utils.escapeHtml(item.name)}">
            <div class="grid-item-title">${Utils.escapeHtml(item.name)}</div>
            <div class="grid-item-meta">${Utils.escapeHtml(item.category_name || '')}</div>
            <div class="grid-item-actions">
              <button class="play-btn">Play</button>
              <button class="favorite-btn">☆</button>
            </div>
          `;

          div.querySelector('.play-btn').addEventListener('click', () => this.playChannel(item));
          div.querySelector('.favorite-btn').addEventListener('click', () => this.toggleFavorite(item, 'live'));
          
          Utils.lazyLoadImage(div.querySelector('img'));
          return div;
        }
      });
    }

    const filtered = this.currentCategory ? this.channels.filter(c => c.category_id == this.currentCategory) : this.channels;
    this.gridView.setItems(filtered);
  }

  renderMovies() {
    if (!this.gridView) {
      this.gridView = new VirtualGrid(document.getElementById('gridView'), {
        itemHeight: 260,
        render: (item, index) => {
          const div = document.createElement('div');
          div.className = 'grid-item';
          div.innerHTML = `
            <img data-src="${item.poster}" class="lazy-image" alt="${Utils.escapeHtml(item.name)}">
            <div class="grid-item-title">${Utils.escapeHtml(item.name)}</div>
            <div class="grid-item-meta">${item.added ? Utils.formatDate(item.added) : ''}</div>
            <div class="grid-item-actions">
              <button class="play-btn">Play</button>
              <button class="favorite-btn">☆</button>
            </div>
          `;

          div.querySelector('.play-btn').addEventListener('click', () => this.playMovie(item));
          div.querySelector('.favorite-btn').addEventListener('click', () => this.toggleFavorite(item, 'movie'));
          
          Utils.lazyLoadImage(div.querySelector('img'));
          return div;
        }
      });
    }

    const filtered = this.currentCategory ? this.movies.filter(m => m.category_id == this.currentCategory) : this.movies;
    this.gridView.setItems(filtered);
  }

  renderSeries() {
    if (!this.gridView) {
      this.gridView = new VirtualGrid(document.getElementById('gridView'), {
        itemHeight: 260,
        render: (item, index) => {
          const div = document.createElement('div');
          div.className = 'grid-item';
          div.innerHTML = `
            <img data-src="${item.poster}" class="lazy-image" alt="${Utils.escapeHtml(item.name)}">
            <div class="grid-item-title">${Utils.escapeHtml(item.name)}</div>
            <div class="grid-item-actions">
              <button class="play-btn">Play</button>
              <button class="favorite-btn">☆</button>
            </div>
          `;

          div.querySelector('.play-btn').addEventListener('click', () => this.playSeries(item));
          div.querySelector('.favorite-btn').addEventListener('click', () => this.toggleFavorite(item, 'series'));
          
          Utils.lazyLoadImage(div.querySelector('img'));
          return div;
        }
      });
    }

    const filtered = this.currentCategory ? this.series.filter(s => s.category_id == this.currentCategory) : this.series;
    this.gridView.setItems(filtered);
  }

  async selectCategory(category) {
    this.currentCategory = category.category_id;
    document.querySelectorAll('.category-item').forEach(el => el.classList.remove('active'));
    event.target.classList.add('active');

    if (this.currentTab === 'live') this.renderChannels();
    else if (this.currentTab === 'movies') this.renderMovies();
    else if (this.currentTab === 'series') this.renderSeries();
  }

  async switchTab(tab) {
    this.currentTab = tab;
    document.querySelectorAll('.nav-tab').forEach(b => b.classList.remove('active'));
    event.target.classList.add('active');

    if (tab === 'settings') {
      document.getElementById('gridView').classList.add('hidden');
      document.getElementById('settingsPanel').classList.remove('hidden');
      document.getElementById('playerView').classList.add('hidden');
    } else {
      document.getElementById('gridView').classList.remove('hidden');
      document.getElementById('settingsPanel').classList.add('hidden');

      this.currentCategory = null;
      this.currentContentType = tab;

      await this.loadContent();
    }
  }

  playChannel(channel) {
    const streamUrl = api.getStreamUrl(channel.channel_id, 'live');

    if (!this.player) {
      this.player = new VideoPlayer(document.getElementById('videoPlayer'));
    }

    this.player.play(streamUrl, channel.channel_id, 'live');
    document.getElementById('playerTitle').textContent = channel.name;
    document.getElementById('playerView').classList.remove('hidden');
    document.getElementById('gridView').classList.add('hidden');
    document.getElementById('playlistSection').classList.remove('hidden');

    // Add to history
    if (CONFIG.FEATURES.WATCH_HISTORY) {
      storage.addToHistory('live', channel);
    }
  }

  playMovie(movie) {
    const streamUrl = api.getStreamUrl(movie.id, 'movie');

    if (!this.player) {
      this.player = new VideoPlayer(document.getElementById('videoPlayer'));
    }

    this.player.play(streamUrl, movie.id, 'movie');
    document.getElementById('playerTitle').textContent = movie.name;
    document.getElementById('playerView').classList.remove('hidden');
    document.getElementById('gridView').classList.add('hidden');
    document.getElementById('playlistSection').classList.add('hidden');

    if (CONFIG.FEATURES.WATCH_HISTORY) {
      storage.addToHistory('movie', movie);
    }
  }

  playSeries(series) {
    const streamUrl = api.getStreamUrl(series.id, 'series');

    if (!this.player) {
      this.player = new VideoPlayer(document.getElementById('videoPlayer'));
    }

    this.player.play(streamUrl, series.id, 'series');
    document.getElementById('playerTitle').textContent = series.name;
    document.getElementById('playerView').classList.remove('hidden');
    document.getElementById('gridView').classList.add('hidden');

    if (CONFIG.FEATURES.WATCH_HISTORY) {
      storage.addToHistory('series', series);
    }
  }

  async handleSearch(query) {
    if (!query) {
      this.loadContent();
      return;
    }

    try {
      const results = await Utils.search(query, this.currentTab);
      if (this.currentTab === 'live') {
        this.gridView.setItems(results.filter(r => r.contentType === 'live'));
      } else if (this.currentTab === 'movies') {
        this.gridView.setItems(results.filter(r => r.contentType === 'movie'));
      } else if (this.currentTab === 'series') {
        this.gridView.setItems(results.filter(r => r.contentType === 'series'));
      }
    } catch (err) {
      console.error('Search error:', err);
    }
  }

  async toggleFavorite(item = null, type = null) {
    if (item) {
      await storage.addFavorite(type, item);
    }
  }

  async logout() {
    if (confirm('Are you sure you want to logout?')) {
      CONFIG.clearCredentials();
      await storage.clearOldCache(0);
      if (this.player) this.player.stop();
      window.location.reload();
    }
  }

  setLoading(loading) {
    this.isLoading = loading;
  }
}

// Initialize app when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  window.app = new XtreamApp();
});
