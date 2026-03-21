// ========================= UI UTILITIES =========================

export const UIComponents = {
  esc: (str) => {
    if (!str) return "";
    return String(str).replace(
      /[&<>"']/g,
      (c) =>
        ({
          "&": "&amp;",
          "<": "&lt;",
          ">": "&gt;",
          '"': "&quot;",
          "'": "&#39;",
        })[c],
    );
  },
  
  toast: (msg, type = "info") => {
    const t = document.getElementById("toast");
    if (!t) return;
    t.innerText = msg;
    t.className = `toast ${type} active`;
    setTimeout(() => t.classList.remove("active"), 3000);
  },
  
  debounce: (fn, ms) => {
    let timer;
    return (...args) => {
      clearTimeout(timer);
      timer = setTimeout(() => fn(...args), ms);
    };
  },
  
  log: (msg, type = 'info') => {
    const box = document.getElementById('debugLog');
    if (!box) return;
    box.classList.add('active');
    const time = new Date().toLocaleTimeString();
    const div = document.createElement('div');
    div.className = `log-entry ${type}`;
    div.innerHTML = `<span class="log-time">[${time}]</span> ${msg}`;
    box.appendChild(div);
    box.scrollTop = box.scrollHeight;
  },

  validateImageUrl: (url) => {
    if (!url || typeof url !== "string") return "";
    url = url.trim();

    if (url === "" || url === "null" || url === "undefined" || url.length < 5) return "";
    if (url.startsWith("//")) url = "http:" + url;
    if (!url.startsWith("http://") && !url.startsWith("https://")) return "";

    try {
      new URL(url);
      return url;
    } catch {
      return "";
    }
  }
};
