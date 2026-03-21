// ========================= STORAGE UTILS =========================

export const Storage = {
  store: (k, v) => localStorage.setItem(k, v),
  read: (k) => localStorage.getItem(k) || "",
};

// --- IndexedDB Cache ---
export class DataCache {
  constructor() {
    this.dbName = "IPTV_Cache";
    this.storeName = "responses";
    this.db = null;
  }

  async init() {
    if (this.db) return;
    return new Promise((resolve, reject) => {
      const req = indexedDB.open(this.dbName, 1);
      req.onupgradeneeded = (e) => {
        const db = e.target.result;
        if (!db.objectStoreNames.contains(this.storeName)) {
          db.createObjectStore(this.storeName);
        }
      };
      req.onsuccess = (e) => {
        this.db = e.target.result;
        resolve();
      };
      req.onerror = () => reject("Cache init failed");
    });
  }

  async get(key) {
    await this.init();
    return new Promise((resolve) => {
      const tx = this.db.transaction([this.storeName], "readonly");
      const req = tx.objectStore(this.storeName).get(key);
      req.onsuccess = () => {
        const res = req.result;
        // 24 hour cache
        if (res && Date.now() - res.ts < 86400000) {
          resolve(res.data);
        } else {
          resolve(null);
        }
      };
      req.onerror = () => resolve(null);
    });
  }

  async set(key, data) {
    await this.init();
    const tx = this.db.transaction([this.storeName], "readwrite");
    tx.objectStore(this.storeName).put({ data, ts: Date.now() }, key);
  }

  async clear() {
    await this.init();
    const tx = this.db.transaction([this.storeName], "readwrite");
    tx.objectStore(this.storeName).clear();
    // Dispatch a custom event instead of hardcoding UI logic here
    window.dispatchEvent(new CustomEvent('cache:cleared'));
  }
}
