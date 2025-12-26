// Virtual scrolling implementation
class VirtualList {
  constructor(container, options = {}) {
    this.container = container;
    this.items = [];
    this.itemHeight = options.itemHeight || CONFIG.VIRTUAL_LIST_ITEM_HEIGHT;
    this.renderAhead = options.renderAhead || CONFIG.VIRTUAL_LIST_RENDER_AHEAD;
    this.renderFn = options.render || (() => null);
    this.onScroll = options.onScroll || (() => {});
    
    this.visibleStart = 0;
    this.visibleEnd = 0;
    this.cachedElements = new Map();

    this.setupScroll();
  }

  setupScroll() {
    this.scrollContainer = this.container.querySelector('[data-scroll-container]') || this.container;
    this.scrollContainer.addEventListener('scroll', () => this.onScrollUpdate());
  }

  onScrollUpdate() {
    const scrollTop = this.scrollContainer.scrollTop;
    const containerHeight = this.scrollContainer.clientHeight;

    const itemsPerPage = Math.ceil(containerHeight / this.itemHeight);
    this.visibleStart = Math.max(0, Math.floor(scrollTop / this.itemHeight) - this.renderAhead);
    this.visibleEnd = Math.min(this.items.length, this.visibleStart + itemsPerPage + this.renderAhead * 2);

    this.render();
    this.onScroll({ start: this.visibleStart, end: this.visibleEnd });
  }

  setItems(items) {
    this.items = items;
    this.visibleStart = 0;
    this.visibleEnd = 0;
    this.cachedElements.clear();
    this.updateScroller();
  }

  updateScroller() {
    const scroller = this.container.querySelector('[data-scroll-content]');
    if (scroller) {
      scroller.style.height = `${this.items.length * this.itemHeight}px`;
    }
  }

  render() {
    const content = this.container.querySelector('[data-scroll-content]');
    if (!content) return;

    // Remove items outside visible range
    for (const [index, el] of this.cachedElements) {
      if (index < this.visibleStart || index >= this.visibleEnd) {
        el.remove();
        this.cachedElements.delete(index);
      }
    }

    // Render visible items
    for (let i = this.visibleStart; i < this.visibleEnd; i++) {
      if (this.cachedElements.has(i)) continue;

      const item = this.items[i];
      const el = document.createElement('div');
      el.style.position = 'absolute';
      el.style.top = `${i * this.itemHeight}px`;
      el.style.height = `${this.itemHeight}px`;
      el.style.width = '100%';

      const html = this.renderFn(item, i);
      if (html) {
        if (typeof html === 'string') {
          el.innerHTML = html;
        } else {
          el.appendChild(html);
        }
      }

      content.appendChild(el);
      this.cachedElements.set(i, el);
    }
  }
}

// Virtual grid (responsive grid with virtual scrolling)
class VirtualGrid {
  constructor(container, options = {}) {
    this.container = container;
    this.items = [];
    this.cols = options.cols || CONFIG.VIRTUAL_GRID_COLS;
    this.itemHeight = options.itemHeight || CONFIG.VIRTUAL_GRID_ITEM_HEIGHT;
    this.renderFn = options.render || (() => null);
    this.renderAhead = options.renderAhead || 2;
    
    this.visibleStart = 0;
    this.visibleEnd = 0;
    this.cachedElements = new Map();
    this.scrollContainer = null;

    this.setupScroll();
    this.updateCols();
  }

  setupScroll() {
    this.scrollContainer = this.container.querySelector('[data-scroll-container]') || this.container;
    this.scrollContainer.addEventListener('scroll', () => this.onScrollUpdate());
    window.addEventListener('resize', () => this.updateCols());
  }

  updateCols() {
    const width = this.container.offsetWidth;
    this.cols = width > 1200 ? 5 : width > 900 ? 4 : width > 600 ? 3 : 2;
  }

  onScrollUpdate() {
    const scrollTop = this.scrollContainer.scrollTop;
    const containerHeight = this.scrollContainer.clientHeight;

    const rowsPerPage = Math.ceil(containerHeight / this.itemHeight);
    const visibleStartRow = Math.max(0, Math.floor(scrollTop / this.itemHeight) - this.renderAhead);
    const visibleEndRow = Math.min(Math.ceil(this.items.length / this.cols), visibleStartRow + rowsPerPage + this.renderAhead * 2);

    this.visibleStart = visibleStartRow * this.cols;
    this.visibleEnd = Math.min(this.items.length, visibleEndRow * this.cols);

    this.render();
  }

  setItems(items) {
    this.items = items;
    this.visibleStart = 0;
    this.visibleEnd = 0;
    this.cachedElements.clear();
    this.updateScroller();
  }

  updateScroller() {
    const scroller = this.container.querySelector('[data-scroll-content]');
    if (scroller) {
      const rows = Math.ceil(this.items.length / this.cols);
      scroller.style.height = `${rows * this.itemHeight}px`;
    }
  }

  render() {
    const content = this.container.querySelector('[data-scroll-content]');
    if (!content) return;

    // Clean up
    for (const [index, el] of this.cachedElements) {
      if (index < this.visibleStart || index >= this.visibleEnd) {
        el.remove();
        this.cachedElements.delete(index);
      }
    }

    // Render visible items
    for (let i = this.visibleStart; i < this.visibleEnd; i++) {
      if (this.cachedElements.has(i)) continue;

      const item = this.items[i];
      const row = Math.floor(i / this.cols);
      const col = i % this.cols;
      const itemWidth = 100 / this.cols;

      const el = document.createElement('div');
      el.style.position = 'absolute';
      el.style.top = `${row * this.itemHeight}px`;
      el.style.left = `${col * itemWidth}%`;
      el.style.width = `${itemWidth}%`;
      el.style.height = `${this.itemHeight}px`;

      const html = this.renderFn(item, i);
      if (html) {
        if (typeof html === 'string') {
          el.innerHTML = html;
        } else {
          el.appendChild(html);
        }
      }

      content.appendChild(el);
      this.cachedElements.set(i, el);
    }
  }
}
