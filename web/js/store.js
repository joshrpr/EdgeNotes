'use strict';

/* Edge Notes - metadata lives in localStorage; photos live in IndexedDB. */

const Store = (() => {
  const KEY = 'edge-notes-v1';

  function blank() {
    return { version: 1, knives: [], lastBackupAt: null };
  }

  function load() {
    try {
      const raw = localStorage.getItem(KEY);
      if (!raw) return blank();
      const parsed = JSON.parse(raw);
      if (!parsed || !Array.isArray(parsed.knives)) return blank();
      parsed.version = 1;
      parsed.lastBackupAt = parsed.lastBackupAt || null;
      for (const knife of parsed.knives) {
        if (!Array.isArray(knife.sessions)) knife.sessions = [];
      }
      return parsed;
    } catch (e) {
      // A corrupt record must never take the app down with it.
      const fresh = blank();
      fresh.recovered = true;
      return fresh;
    }
  }

  function save(data) {
    try {
      localStorage.setItem(KEY, JSON.stringify(data));
      return { ok: true };
    } catch (e) {
      return {
        ok: false,
        message: 'Could not save on this phone. Its storage may be full.'
      };
    }
  }

  return { KEY, load, save, blank };
})();

if (typeof module !== 'undefined') module.exports = Store;
