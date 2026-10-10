/* Local persistence: IndexedDB first, localStorage fallback. No cloud sync. */
(() => {
  const DB_NAME = "deutsch-quest-db";
  const STORE = "player";
  const KEY = "save-v1";
  const defaults = () => ({
    version: 1, xp: 0, coins: 0, unlockedStage: 1, completedStages: [],
    bestScores: {}, mistakes: {}, seenWords: {}, badges: [], streakBest: 0,
    sessions: 0, lastPlayed: null
  });
  let dbPromise;
  function openDB() {
    if (!("indexedDB" in window)) return Promise.reject(new Error("IndexedDB unavailable"));
    if (!dbPromise) dbPromise = new Promise((resolve, reject) => {
      const req = indexedDB.open(DB_NAME, 1);
      req.onupgradeneeded = () => {
        if (!req.result.objectStoreNames.contains(STORE)) req.result.createObjectStore(STORE);
      };
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => reject(req.error || new Error("IndexedDB open failed"));
    });
    return dbPromise;
  }
  async function load() {
    try {
      const db = await openDB();
      const value = await new Promise((resolve, reject) => {
        const tx = db.transaction(STORE, "readonly");
        const req = tx.objectStore(STORE).get(KEY);
        req.onsuccess = () => resolve(req.result);
        req.onerror = () => reject(req.error);
      });
      return value ? normalize(value) : defaults();
    } catch (_) {
      try {
        const raw = localStorage.getItem(KEY);
        return raw ? normalize(JSON.parse(raw)) : defaults();
      } catch (_) { return defaults(); }
    }
  }
  function normalize(value) { return { ...defaults(), ...(value || {}) }; }
  async function save(state) {
    const data = normalize(state);
    try {
      const db = await openDB();
      await new Promise((resolve, reject) => {
        const tx = db.transaction(STORE, "readwrite");
        tx.objectStore(STORE).put(data, KEY);
        tx.oncomplete = resolve;
        tx.onerror = () => reject(tx.error);
        tx.onabort = () => reject(tx.error);
      });
      return "indexedDB";
    } catch (_) {
      try { localStorage.setItem(KEY, JSON.stringify(data)); return "localStorage"; }
      catch (_) { throw new Error("ذخیره‌سازی در مرورگر در دسترس نیست. فضای مرورگر را بررسی کن."); }
    }
  }
  async function exportSave(state) {
    const blob = new Blob([JSON.stringify(normalize(state), null, 2)], {type:"application/json"});
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = "deutsch-quest-backup.json";
    document.body.appendChild(a); a.click(); a.remove(); URL.revokeObjectURL(url);
  }
  async function importSave(file) {
    const text = await file.text();
    const parsed = JSON.parse(text);
    if (!parsed || parsed.version !== 1 || typeof parsed.xp !== "number" || !Array.isArray(parsed.completedStages)) {
      throw new Error("فایل پشتیبان معتبر Deutsch Quest نیست.");
    }
    const state = normalize(parsed);
    await save(state);
    return state;
  }
  window.DQStorage = { load, save, exportSave, importSave, defaults };
})();