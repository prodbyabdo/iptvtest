// Utility functions
class Utils {
  static debounce(func, ms = 300) {
    let timeout;
    return (...args) => {
      clearTimeout(timeout);
      timeout = setTimeout(() => func(...args), ms);
    };
  }

  static throttle(func, ms = 300) {
    let last = 0;
    return (...args) => {
      const now = Date.now();
      if (now - last >= ms) {
        last = now;
        func(...args);
      }
    };
  }

  static async search(query, type = 'all') {
    const q = query.toLowerCase();
    let items = [];

    if (type === 'live' || type === 'all') {
      const channels = await storage.getAll('channels');
      items = items.concat(channels.map(c => ({ ...c, contentType: 'live' })));
    }
    if (type === 'movie' || type === 'all') {
      const movies = await storage.getAll('movies');
      items = items.concat(movies.map(m => ({ ...m, contentType: 'movie' })));
    }
    if (type === 'series' || type === 'all') {
      const series = await storage.getAll('series');
      items = items.concat(series.map(s => ({ ...s, contentType: 'series' })));
    }

    return items.filter(item => {
      const text = (item.name || item.title || '').toLowerCase();
      return text.includes(q);
    }).slice(0, CONFIG.SEARCH_MAX_RESULTS);
  }

  static formatDate(timestamp) {
    const date = new Date(timestamp * 1000);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
  }

  static formatDuration(seconds) {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    if (hours > 0) return `${hours}h ${minutes}m`;
    return `${minutes}m`;
  }

  static getLanguage() {
    return CONFIG.LANGUAGE || 'en';
  }

  static setLanguage(lang) {
    CONFIG.LANGUAGE = lang;
    localStorage.setItem('language', lang);
    window.dispatchEvent(new CustomEvent('languageChanged', { detail: { lang } }));
  }

  static getTheme() {
    return CONFIG.THEME || 'dark';
  }

  static setTheme(theme) {
    CONFIG.THEME = theme;
    localStorage.setItem('theme', theme);
    document.documentElement.setAttribute('data-theme', theme);
    window.dispatchEvent(new CustomEvent('themeChanged', { detail: { theme } }));
  }

  static lazy lazyLoadImage(img) {
    if (!('IntersectionObserver' in window)) {
      img.src = img.dataset.src;
      return;
    }

    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const image = entry.target;
          image.src = image.dataset.src;
          image.addEventListener('load', () => image.classList.add('loaded'));
          image.addEventListener('error', () => image.classList.add('error'));
          observer.unobserve(image);
        }
      });
    }, { rootMargin: '50px' });

    observer.observe(img);
  }

  static escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  static parseStreamUrl(url) {
    return {
      isM3U8: url.endsWith('.m3u8'),
      isMKV: url.endsWith('.mkv'),
      isMP4: url.endsWith('.mp4'),
      isTS: url.endsWith('.ts')
    };
  }
}

// Polyfills
if (!Array.prototype.flat) {
  Array.prototype.flat = function(depth = 1) {
    return this.reduce((flat, toFlatten) => {
      return flat.concat(Array.isArray(toFlatten) && depth > 1 ? toFlatten.flat(depth - 1) : toFlatten);
    }, []);
  };
}
