import { AppEngine } from "./core/app-engine.js";
import { appState } from "./core/state.js";
import { GridRenderer } from "./ui/render-grid.js";
import { UIComponents } from "./ui/components.js";
import { HlsManager } from "./utils/hls-manager.js";

class App {
  constructor() {
    this.engine = new AppEngine();
    
    this.els = {
      loginPage: document.getElementById("loginPage"),
      mainApp: document.getElementById("mainApp"),
      grid: document.getElementById("mediaGrid"),
      sidebar: document.getElementById("sidebarContent"),
      player: document.getElementById("playerModal"),
      video: document.getElementById("videoPlayer"),
      title: document.getElementById("pageTitle"),
      search: document.getElementById("globalSearch"),
      seriesModal: document.getElementById("seriesModal")
    };

    this.gridRenderer = new GridRenderer(this.els.grid, {
      onPlayClick: (item, tab) => this.playItem(item, tab),
      onSeriesClick: (item) => this.openSeriesModal(item),
      onFavoriteClick: (item) => this.engine.toggleFavorite(item),
      onCopyClick: (item, tab) => {
        let id = item.stream_id || item.series_id;
        const url = this.engine.api.constructStreamUrl(id, tab);
        navigator.clipboard.writeText(url).then(() => UIComponents.toast("Link copied!", "success"));
      },
      onDownloadClick: (item, tab) => {
        let id = item.stream_id || item.series_id;
        const url = this.engine.api.constructStreamUrl(id, tab);
        if (tab === "movies" || tab === "series") {
          const a = document.createElement("a");
          a.href = url;
          a.download = (item.name || "video").replace(/[^a-zA-Z0-9]/g, "_") + ".mkv";
          a.target = "_blank";
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);
        } else {
          window.open(url, "_blank");
        }
      }
    });

    this.hlsManager = new HlsManager(this.els.video);
    this.init();
  }

  async init() {
    this.bindEvents();
    this.bindState();

    const isLoggedIn = await this.engine.init();
    if (isLoggedIn) {
      this.showApp();
    } else {
      this.showLogin();
    }
  }

  bindState() {
    appState.subscribe(({ key, value, state }) => {
      if (key === "tab") {
        this.els.title.innerText = value.charAt(0).toUpperCase() + value.slice(1);
      }
      if (key === "items" || key === "searchQuery") {
        this.gridRenderer.render(
          this.engine.getFilteredItems(),
          state.tab,
          (item) => this.engine.isFavorite(item)
        );
      }
    });

    // Custom events
    window.addEventListener('app:log', (e) => UIComponents.log(e.detail.msg, e.detail.type || 'info'));
    window.addEventListener('app:error', (e) => UIComponents.toast(e.detail.msg, "error"));
  }

  showLogin() {
    this.els.loginPage.classList.remove("hidden");
    this.els.mainApp.classList.add("hidden");
  }

  async showApp() {
    this.els.loginPage.classList.add("hidden");
    this.els.mainApp.classList.remove("hidden");
    await this.prefetchAll();
  }

  async prefetchAll() {
    const overlay = document.getElementById('loadingOverlay');
    const bar = document.getElementById('loadingBar');
    const title = document.getElementById('loadingTitle');
    const status = document.getElementById('loadingStatus');
    overlay.style.display = 'flex';

    await this.engine.checkProxy();

    // Helper to let browser repaint
    const flush = () => new Promise(r => setTimeout(r, 50));

    const steps = [
      { type: 'live', label: 'Live TV', stepId: 'step-live' },
      { type: 'movies', label: 'Movies', stepId: 'step-movies' },
      { type: 'series', label: 'Series', stepId: 'step-series' },
    ];

    for (let i = 0; i < steps.length; i++) {
      const step = steps[i];
      bar.style.width = Math.round((i / steps.length) * 100) + '%';
      title.textContent = `Downloading ${step.label}...`;
      status.textContent = `Step ${i + 1} of ${steps.length}`;
      const stepEl = document.getElementById(step.stepId);
      stepEl.style.opacity = '1';
      stepEl.style.color = 'var(--success)';
      stepEl.textContent = `◼ ${step.label}`;

      await flush(); // Force UI update before heavy fetch

      try {
        console.log(`[ADVANCED LOG] requesting categories for: ${step.type}`);
        const cats = await this.engine.getCategories(step.type);
        console.log(`[ADVANCED LOG] finished categories for: ${step.type}. Found: ${cats ? cats.length : 0}`);
        stepEl.textContent = `✓ ${step.label}`;
      } catch (e) {
        console.error(`[ADVANCED LOG] error fetching categories for: ${step.type}`, e);
        stepEl.textContent = `✗ ${step.label}`;
        stepEl.style.color = 'var(--error)';
      }
    }

    bar.style.width = '100%';
    title.textContent = 'Ready!';
    status.textContent = 'All playlists loaded.';
    setTimeout(() => overlay.style.display = 'none', 500);

    this.switchTab("live", document.querySelector('.nav-tab[data-tab="live"]'));
  }

  bindEvents() {
    // Login
    document.getElementById("doLogin").onclick = async () => {
      const url = document.getElementById("loginUrl").value.trim();
      const user = document.getElementById("loginUser").value.trim();
      const pass = document.getElementById("loginPass").value.trim();
      if (!url || !user || !pass) return UIComponents.toast("Please fill all fields", "error");
      
      const btn = document.getElementById("doLogin");
      const originalText = btn.innerText;
      btn.innerText = "VERIFYING..."; btn.disabled = true;
      
      const result = await this.engine.login(url, user, pass);
      if (result.success) {
        UIComponents.toast("Connection Successful!", "success");
        setTimeout(() => location.reload(), 500);
      } else {
        btn.innerText = originalText; btn.disabled = false;
        UIComponents.toast(`Connection Failed: ${result.msg}`, "error");
      }
    };

    document.getElementById("logoutBtn").onclick = () => {
      this.engine.logout();
      location.reload();
    };

    // Tabs
    document.querySelectorAll(".nav-tab[data-tab]").forEach((btn) => {
      btn.onclick = (e) => this.switchTab(e.target.dataset.tab, btn);
    });

    // Search
    this.els.search.oninput = UIComponents.debounce((e) => this.engine.searchItems(e.target.value), 300);

    // Settings
    document.getElementById("settingsTrigger").onclick = () => document.getElementById("settingsPanel").classList.add("active");
    document.getElementById("closeSettings").onclick = () => document.getElementById("settingsPanel").classList.remove("active");
    document.getElementById("saveSettings").onclick = () => {
      localStorage.setItem("xtream_url", document.getElementById("set_url").value);
      localStorage.setItem("xtream_user", document.getElementById("set_user").value);
      localStorage.setItem("xtream_pass", document.getElementById("set_pass").value);
      localStorage.setItem("football_api_key", document.getElementById("set_football").value);
      localStorage.setItem("omdb_api_key", document.getElementById("set_omdb").value);
      UIComponents.toast("Settings Saved. Reloading...");
      setTimeout(() => location.reload(), 1000);
    };

    // Keyboard shortcuts
    document.addEventListener("keydown", (e) => {
      if (this.els.player.classList.contains("active")) {
        const video = this.els.video;
        switch (e.key) {
          case " ": case "k": case "K": e.preventDefault(); video.paused ? video.play() : video.pause(); break;
          case "ArrowLeft": e.preventDefault(); video.currentTime -= 10; break;
          case "ArrowRight": e.preventDefault(); video.currentTime += 10; break;
          case "ArrowUp": e.preventDefault(); video.volume = Math.min(1, video.volume + 0.1); break;
          case "ArrowDown": e.preventDefault(); video.volume = Math.max(0, video.volume - 0.1); break;
          case "f": case "F": e.preventDefault(); document.fullscreenElement ? document.exitFullscreen() : video.requestFullscreen(); break;
          case "m": case "M": e.preventDefault(); video.muted = !video.muted; break;
          case "Escape": e.preventDefault(); this.closePlayer(); break;
        }
      } else if (e.key === "Escape") {
        document.getElementById("settingsPanel").classList.remove("active");
        this.els.seriesModal.classList.remove("active");
      }
    });

    // Player Modal
    document.getElementById("closePlayer").onclick = () => this.closePlayer();
    document.getElementById("closeSeriesModal").onclick = () => this.els.seriesModal.classList.remove("active");
  }

  async switchTab(tab, btn) {
    document.querySelectorAll(".nav-tab").forEach(b => b.classList.remove("active"));
    if (btn) btn.classList.add("active");
    
    appState.data.tab = tab;
    if (tab === "sports") {
       window.open('sports-center.html', '_blank');
       return; 
    }

    const isVod = tab === "movies" || tab === "series";
    document.getElementById("mainApp").classList.toggle("no-sidebar", isVod);
    const vodNav = document.getElementById("vodCategoryNav");
    
    if (isVod) {
      vodNav.classList.remove("hidden");
    } else {
      vodNav.classList.add("hidden");
    }

    if (tab === 'favorites') {
      await this.engine.loadFavorites();
      this.els.sidebar.innerHTML = `<div class="category-btn active"><span>My List</span><span class="category-count">${appState.data.favorites.length}</span></div>`;
    } else {
      await this.loadCategoriesUI(tab);
    }
  }

  async loadCategoriesUI(type) {
    const isVod = type === "movies" || type === "series";
    const container = isVod ? document.getElementById("vodCategoryNav") : this.els.sidebar;
    
    container.innerHTML = '<div style="padding:20px">Loading...</div>';
    const cats = await this.engine.getCategories(type);
    container.innerHTML = "";
    
    const createBtn = (cat, isActive) => {
      const btn = document.createElement("button");
      if (isVod) {
        btn.className = `vod-category-pill ${isActive ? "active" : ""}`;
        btn.innerHTML = UIComponents.esc(cat.category_name);
      } else {
        btn.className = `category-btn ${isActive ? "active" : ""}`;
        btn.innerHTML = `<span>${UIComponents.esc(cat.category_name)}</span>`;
      }
      
      btn.onclick = async () => {
        container.querySelectorAll(isVod ? ".vod-category-pill" : ".category-btn").forEach(b => b.classList.remove("active"));
        btn.classList.add("active");
        this.els.grid.innerHTML = '<div style="color:white; padding:20px;">Loading content...</div>';
        await this.engine.loadContent(type, cat.category_id);
      };
      return btn;
    };

    const allBtn = createBtn({ category_name: "All Categories", category_id: 0 }, true);
    container.appendChild(allBtn);
    cats.forEach(cat => container.appendChild(createBtn(cat, false)));
    
    // Auto load first list
    await this.engine.loadContent(type, 0);
  }

  playItem(item, tab) {
    const id = item.stream_id || item.series_id;
    const url = this.engine.api.constructStreamUrl(id, tab);
    document.getElementById("playerTitle").innerText = item.name || item.title || "Unknown";
    this.els.player.classList.add("active");
    this.hlsManager.play(url);
  }

  closePlayer() {
    this.els.player.classList.remove("active");
    this.hlsManager.destroy();
  }

  async openSeriesModal(series) {
    this.els.seriesModal.classList.add("active");
    document.getElementById("seriesTitle").textContent = series.name || "Loading...";
    document.getElementById("seriesPlot").textContent = "Loading series info...";
    
    let posterUrl = UIComponents.validateImageUrl(series.cover || series.stream_icon);
    document.getElementById("seriesPoster").src = posterUrl || `https://placehold.co/300x450/0a0a0a/525252?text=No+Cover`;

    const info = await this.engine.fetchSeriesInfo(series);
    if (!info) {
      document.getElementById("seriesPlot").textContent = "Failed to load series info.";
      return;
    }

    const seriesInfo = info.info || {};
    document.getElementById("seriesTitle").textContent = seriesInfo.name || series.name;
    document.getElementById("seriesPlot").textContent = seriesInfo.plot || seriesInfo.description || "No description.";

    // Render seasons and episodes
    const tabsEl = document.getElementById("seasonsTabs");
    const gridEl = document.getElementById("episodesGrid");
    
    const episodes = info.episodes || {};
    const seasons = Object.keys(episodes).sort((a,b) => parseInt(a) - parseInt(b));
    
    tabsEl.innerHTML = "";
    seasons.forEach((seasonNum, idx) => {
      const tab = document.createElement("button");
      tab.className = `season-tab ${idx === 0 ? "active" : ""}`;
      tab.textContent = `Season ${seasonNum}`;
      tab.onclick = () => {
        tabsEl.querySelectorAll(".season-tab").forEach(t => t.classList.remove("active"));
        tab.classList.add("active");
        this.renderEpisodes(episodes[seasonNum]);
      };
      tabsEl.appendChild(tab);
    });

    if (seasons.length > 0) this.renderEpisodes(episodes[seasons[0]]);
  }

  renderEpisodes(epList) {
    const gridEl = document.getElementById("episodesGrid");
    gridEl.innerHTML = "";
    if(!epList) return;

    epList.forEach(ep => {
      const card = document.createElement("div");
      card.className = "episode-card";
      let thumbUrl = UIComponents.validateImageUrl(ep.info?.movie_image || ep.info?.cover);
      
      card.innerHTML = `
        <img class="episode-thumb" src="${thumbUrl || "https://placehold.co/160x90/0a0a0a/525252?text=E"}" onerror="this.src='https://placehold.co/160x90/0a0a0a/525252?text=E'">
        <div class="episode-info">
          <div class="episode-num">Episode ${ep.episode_num}</div>
          <div class="episode-title">${UIComponents.esc(ep.title || ep.info?.name)}</div>
        </div>
      `;
      card.onclick = () => {
        this.els.seriesModal.classList.remove("active");
        const url = this.engine.api.constructEpisodeUrl(ep.id, ep.container_extension || "mkv");
        document.getElementById("playerTitle").innerText = ep.title || `Episode ${ep.episode_num}`;
        this.els.player.classList.add("active");
        this.hlsManager.play(url);
      };
      gridEl.appendChild(card);
    });
  }
}

// Bootstrap
window.addEventListener("DOMContentLoaded", () => {
  window.app = new App();
});
