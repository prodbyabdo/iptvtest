// ========================= REACTIVE STATE =========================

export class State {
  constructor(initialState = {}) {
    this.listeners = [];
    this.data = new Proxy(initialState, {
      set: (target, key, value) => {
        target[key] = value;
        this.notify({ key, value, state: target });
        return true;
      }
    });
  }

  subscribe(listener) {
    this.listeners.push(listener);
    // Return unsubscribe function
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener);
    };
  }

  notify(change) {
    this.listeners.forEach(listener => listener(change));
  }
}

// Instantiate global state singleton
export const appState = new State({
  tab: "live",
  category: null,
  items: [],
  favorites: [],
  isLoggedIn: false,
  isPlayerActive: false,
  isSettingsActive: false,
  currentSeries: null,
  activeItem: null,
  searchQuery: ""
});
