// ========================= GRID RENDERER =========================
import { UIComponents } from "./components.js";

export class GridRenderer {
  constructor(gridElement, callbacks = {}) {
    this.grid = gridElement;
    this.callbacks = callbacks;
  }

  render(items, currentTab, favoritesCheckFn) {
    this.grid.innerHTML = "";

    if (!items || items.length === 0) {
      this.grid.innerHTML = '<div style="color:var(--text-muted); padding:20px;">No content found.</div>';
      return;
    }

    // Perf limit to prevent freezing
    const displayItems = items.slice(0, 200);

    displayItems.forEach((item) => {
      const card = document.createElement("div");
      const isLandscape = currentTab === "live" || currentTab === "sports";
      card.className = `media-card ${isLandscape ? "landscape" : ""}`;

      let imgUrl = item.stream_icon || item.cover || item.logo || item.poster || item.img || item.screenshot || "";
      imgUrl = UIComponents.validateImageUrl(imgUrl);

      if (!imgUrl) {
        const typeArr = isLandscape ? "300x169" : "300x450";
        const placeholderText = encodeURIComponent((item.name || "No Image").substring(0, 15));
        imgUrl = `https://placehold.co/${typeArr}/0a0a0a/525252?text=${placeholderText}`;
      }

      const isFav = favoritesCheckFn ? favoritesCheckFn(item) : false;

      card.innerHTML = `
        <div class="item-actions">
          <button class="item-btn ${isFav ? 'favorite-active' : ''}" data-action="fav" title="Add to My List">
            ${isFav ? '❤️' : '🤍'}
          </button>
          <button class="item-btn" data-action="copy" title="Copy Link">📋</button>
          <button class="item-btn" data-action="download" title="Download">⬇️</button>
        </div>
        <img class="media-poster" src="${UIComponents.esc(imgUrl)}" loading="lazy" onerror="this.onerror=null; this.src='https://placehold.co/300x450/0a0a0a/525252?text=No+Image'">
        <div class="media-overlay">
          <div class="media-title">${UIComponents.esc(item.name || item.title)}</div>
          <div class="media-meta">
            <span>${UIComponents.esc(item.year || "")}</span>
            <span class="rating-badge">★ ${UIComponents.esc(item.rating || "")}</span>
          </div>
        </div>
      `;

      const isSeries = currentTab === "series";

      // Click Actions
      const onClick = () => {
        if (isSeries && this.callbacks.onSeriesClick) {
          this.callbacks.onSeriesClick(item);
        } else if (!isSeries && this.callbacks.onPlayClick) {
          this.callbacks.onPlayClick(item, currentTab);
        }
      };

      card.querySelector(".media-poster").onclick = onClick;
      card.querySelector(".media-overlay").onclick = onClick;

      card.querySelector('[data-action="fav"]').onclick = (e) => {
        e.preventDefault(); e.stopPropagation(); e.stopImmediatePropagation();
        if (this.callbacks.onFavoriteClick) {
          const isNowFav = this.callbacks.onFavoriteClick(item);
          const btn = e.currentTarget;
          if (isNowFav) {
             btn.classList.add('favorite-active');
             btn.innerHTML = '❤️';
          } else {
             btn.classList.remove('favorite-active');
             btn.innerHTML = '🤍';
          }
        }
      };

      card.querySelector('[data-action="copy"]').onclick = (e) => {
        e.preventDefault(); e.stopPropagation(); e.stopImmediatePropagation();
        if (this.callbacks.onCopyClick) {
          this.callbacks.onCopyClick(item, currentTab);
        }
      };

      card.querySelector('[data-action="download"]').onclick = (e) => {
        e.preventDefault(); e.stopPropagation(); e.stopImmediatePropagation();
        if (this.callbacks.onDownloadClick) {
          this.callbacks.onDownloadClick(item, currentTab);
        }
      };

      this.grid.appendChild(card);
    });
  }
}
