// IndexedDB Storage Manager
class StorageManager {
  constructor() {
    this.db = null;
    this.ready = this.initDB();
  }

  async initDB() {
    return new Promise((resolve, reject) => {
      const req = indexedDB.open(CONFIG.DB_NAME, CONFIG.DB_VERSION);
      req.onerror = () => reject(req.error);
      req.onupgradeneeded = (e) => {
        const db = e.target.result;
        Object.entries(CONFIG.DB_STORES).forEach(([name, config]) => {
          if (!db.objectStoreNames.contains(name)) {
            const store = db.createObjectStore(name, { keyPath: config.keyPath });
            config.indexes?.forEach(idx => store.createIndex(idx, idx));
          }
        });
      };
      req.onsuccess = () => {
        this.db = req.result;
        resolve(this.db);
      };
    });
  }

  async put(storeName, data) {
    const db = await this.ready;
    return new Promise((resolve, reject) => {
      const tx = db.transaction(storeName, 'readwrite');
      const store = tx.objectStore(storeName);
      const req = Array.isArray(data) ? store.clear().then(() => {
        data.forEach(item => store.add(item));
        return Promise.resolve();
      }) : store.put(data);
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  }

  async get(storeName, key) {
    const db = await this.ready;
    return new Promise((resolve, reject) => {
      const tx = db.transaction(storeName, 'readonly');
      const store = tx.objectStore(storeName);
      const req = store.get(key);
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => reject(req.error);
    });
  }

  async getAll(storeName, index = null, value = null) {
    const db = await this.ready;
    return new Promise((resolve, reject) => {
      const tx = db.transaction(storeName, 'readonly');
      let source = tx.objectStore(storeName);
      if (index && value !== null) {
        source = source.index(index);
      }
      const req = index && value !== null ? source.getAll(value) : source.getAll();
      req.onsuccess = () => resolve(req.result || []);
      req.onerror = () => reject(req.error);
    });
  }

  async delete(storeName, key) {
    const db = await this.ready;
    return new Promise((resolve, reject) => {
      const tx = db.transaction(storeName, 'readwrite');
      const store = tx.objectStore(storeName);
      const req = store.delete(key);
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  }

  async clear(storeName) {
    const db = await this.ready;
    return new Promise((resolve, reject) => {
      const tx = db.transaction(storeName, 'readwrite');
      const store = tx.objectStore(storeName);
      const req = store.clear();
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  }

  async getCache(key) {
    const item = await this.get('cache', key);
    if (item && item.expires_at > Date.now()) {
      return item.data;
    }
    if (item) await this.delete('cache', key);
    return null;
  }

  async setCache(key, data, ttlMinutes = CONFIG.CACHE_TTL_MINUTES) {
    const cacheItem = {
      key,
      data,
      expires_at: Date.now() + ttlMinutes * 60000,
      created_at: Date.now()
    };
    await this.put('cache', cacheItem);
  }

  async addFavorite(type, item) {
    const favorite = {
      id: `${type}_${item.id || item.channel_id}`,
      type,
      item,
      added_date: Date.now()
    };
    await this.put('favorites', favorite);
  }

  async removeFavorite(type, itemId) {
    await this.delete('favorites', `${type}_${itemId}`);
  }

  async getFavorites(type = null) {
    if (type) {
      return this.getAll('favorites', 'type', type);
    }
    return this.getAll('favorites');
  }

  async addToHistory(type, item, watchedSeconds = 0) {
    const history = {
      id: `${type}_${item.id || item.channel_id}_${Date.now()}`,
      type,
      item,
      watched_seconds: watchedSeconds,
      watched_date: Date.now()
    };
    await this.put('history', history);
  }

  async getHistory(type = null, limit = 50) {
    const items = type ? await this.getAll('history', 'type', type) : await this.getAll('history');
    return items.sort((a, b) => b.watched_date - a.watched_date).slice(0, limit);
  }

  async clearOldCache(daysOld = 7) {
    const db = await this.ready;
    const cutoff = Date.now() - daysOld * 24 * 60 * 60000;
    const items = await this.getAll('cache');
    for (const item of items.filter(i => i.created_at < cutoff)) {
      await this.delete('cache', item.key);
    }
  }
}

const storage = new StorageManager();
