'use strict';

/* Edge Notes - photo blobs in IndexedDB, downscaled before they are stored. */

const Photos = (() => {
  const DB_NAME = 'edge-notes-photos';
  const STORE = 'photos';
  const MAX_SIDE = 1400;
  const QUALITY = 0.8;
  let dbPromise = null;

  function open() {
    if (dbPromise) return dbPromise;
    dbPromise = new Promise((resolve, reject) => {
      if (!('indexedDB' in window)) { reject(new Error('Photos are not available in this browser.')); return; }
      const request = indexedDB.open(DB_NAME, 1);
      request.onupgradeneeded = () => {
        const db = request.result;
        if (!db.objectStoreNames.contains(STORE)) db.createObjectStore(STORE);
      };
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error || new Error('Could not open photo storage.'));
    });
    return dbPromise;
  }

  function tx(db, mode, work) {
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(STORE, mode);
      const request = work(transaction.objectStore(STORE));
      transaction.oncomplete = () => resolve(request ? request.result : undefined);
      transaction.onerror = () => reject(transaction.error || new Error('Photo storage failed.'));
      transaction.onabort = () => reject(transaction.error || new Error('Photo storage was aborted.'));
    });
  }

  async function put(id, blob) {
    const db = await open();
    return tx(db, 'readwrite', store => store.put(blob, id));
  }

  async function get(id) {
    const db = await open();
    return tx(db, 'readonly', store => store.get(id));
  }

  async function del(id) {
    const db = await open();
    return tx(db, 'readwrite', store => store.delete(id));
  }

  async function keys() {
    const db = await open();
    return tx(db, 'readonly', store => store.getAllKeys());
  }

  async function clear() {
    const db = await open();
    return tx(db, 'readwrite', store => store.clear());
  }

  function bitmap(file) {
    if ('createImageBitmap' in window) {
      return createImageBitmap(file, { imageOrientation: 'from-image' }).catch(() => decodeWithImage(file));
    }
    return decodeWithImage(file);
  }

  function decodeWithImage(file) {
    return new Promise((resolve, reject) => {
      const url = URL.createObjectURL(file);
      const image = new Image();
      image.onload = () => { URL.revokeObjectURL(url); resolve(image); };
      image.onerror = () => { URL.revokeObjectURL(url); reject(new Error('That photo could not be read.')); };
      image.src = url;
    });
  }

  // Downscale to MAX_SIDE and re-encode as JPEG; keeps a library small.
  async function shrink(file, maxSide) {
    const limit = maxSide || MAX_SIDE;
    const source = await bitmap(file);
    const width = source.width, height = source.height;
    const scale = Math.min(1, limit / Math.max(width, height));
    if (scale === 1 && file.size < 400000) {
      if (source.close) source.close();
      return file;
    }
    const canvas = document.createElement('canvas');
    canvas.width = Math.max(1, Math.round(width * scale));
    canvas.height = Math.max(1, Math.round(height * scale));
    const context = canvas.getContext('2d');
    context.imageSmoothingQuality = 'high';
    context.drawImage(source, 0, 0, canvas.width, canvas.height);
    if (source.close) source.close();
    const blob = await new Promise(resolve => canvas.toBlob(resolve, 'image/jpeg', QUALITY));
    return blob || file;
  }

  function toDataUrl(blob) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(String(reader.result));
      reader.onerror = () => reject(reader.error || new Error('Could not read that photo.'));
      reader.readAsDataURL(blob);
    });
  }

  async function fromDataUrl(url) {
    const response = await fetch(url);
    return response.blob();
  }

  async function exportAll() {
    const ids = await keys();
    const out = {};
    for (const id of ids) {
      const blob = await get(id);
      if (blob) out[id] = await toDataUrl(blob);
    }
    return out;
  }

  async function importAll(map) {
    for (const [id, url] of Object.entries(map || {})) {
      const blob = await fromDataUrl(url);
      await put(id, blob);
    }
  }

  return { put, get, del, keys, clear, shrink, toDataUrl, importAll, exportAll, MAX_SIDE };
})();
