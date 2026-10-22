'use strict';

/* Edge Notes - the Capacitor bridge. Every call has a browser fallback so the
   same files run in a desktop browser for testing and inside the Android app. */

const Native = (() => {
  const cap = window.Capacitor;
  const isApp = !!(cap && cap.isNativePlatform && cap.isNativePlatform());
  const P = isApp ? (cap.Plugins || {}) : {};
  const REPO = 'joshrpr/EdgeNotes';
  const API = 'https://api.github.com/repos/' + REPO + '/releases/latest';
  const APK = 'https://github.com/' + REPO + '/releases/latest/download/edge-notes.apk';
  let cachedInfo = null;

  function vibrate(ms) {
    try { if (navigator.vibrate) navigator.vibrate(ms); } catch (e) { /* unsupported */ }
  }

  // Three moments: a knife is picked out of the library, a sharpening is
  // recorded, and the record lands on the page. Each is a short tap, never a
  // pattern, so it stays discreet on the hundredth sharpening.
  function haptic(kind) {
    const H = isApp && P.Haptics;
    if (H) {
      let call = null;
      try {
        if (kind === 'select' && typeof H.selectionChanged === 'function') call = H.selectionChanged();
        else if (typeof H.impact === 'function') call = H.impact({ style: kind === 'save' ? 'MEDIUM' : 'LIGHT' });
      } catch (e) { /* no haptic hardware */ }
      if (call && typeof call.catch === 'function') call.catch(() => {});
      return;
    }
    vibrate(kind === 'save' ? 14 : kind === 'land' ? 9 : 6);
  }

  async function appInfo() {
    if (!isApp || !P.App) return { build: 0, version: 'web' };
    if (cachedInfo) return cachedInfo;
    try { cachedInfo = await P.App.getInfo(); }
    catch (e) { cachedInfo = { build: 0, version: 'app' }; }
    return cachedInfo;
  }

  // takePhoto resolves to one media result; chooseFromGallery resolves to { results: [...] }.
  function mediaItem(result) {
    const photo = result && Array.isArray(result.results) ? result.results[0] : result;
    if (!photo || !(photo.uri || photo.webPath || photo.path)) {
      throw new Error('No photo was returned.');
    }
    return photo;
  }

  async function photoBlob(result) {
    const photo = mediaItem(result);
    const uri = photo.uri || photo.webPath || photo.path;
    if (uri.startsWith('data:') || uri.startsWith('blob:')) return (await fetch(uri)).blob();
    if (P.Filesystem && !/^[a-z][a-z0-9+.-]*:/i.test(uri)) {
      try {
        const file = await P.Filesystem.readFile({ path: uri });
        const bytes = Uint8Array.from(atob(file.data), c => c.charCodeAt(0));
        return new Blob([bytes], { type: 'image/jpeg' });
      } catch (e) {
        if (!photo.webPath) throw e;
      }
    }
    return (await fetch(photo.webPath || uri)).blob();
  }

  async function cameraPhoto(source) {
    const Camera = P.Camera;
    if (!Camera) throw new Error('camera-unavailable');
    if (source === 'gallery' && typeof Camera.chooseFromGallery === 'function') {
      return photoBlob(await Camera.chooseFromGallery({ quality: 85 }));
    }
    if (source !== 'gallery' && typeof Camera.takePhoto === 'function') {
      return photoBlob(await Camera.takePhoto({ quality: 85 }));
    }
    return photoBlob(await Camera.getPhoto({
      quality: 85,
      resultType: 'uri',
      source: source === 'gallery' ? 'PHOTOS' : 'CAMERA'
    }));
  }

  function fileInput(source) {
    return new Promise((resolve, reject) => {
      const input = document.getElementById(source === 'gallery' ? 'file-gallery' : 'file-camera');
      if (!input) { reject(new Error('No photo picker available.')); return; }
      const onChange = () => {
        input.removeEventListener('change', onChange);
        const file = input.files && input.files[0];
        input.value = '';
        if (file) resolve(file); else reject(new Error('cancelled'));
      };
      input.addEventListener('change', onChange);
      input.click();
    });
  }

  async function pickImage(source) {
    if (!isApp) return fileInput(source);
    try {
      return await cameraPhoto(source);
    } catch (e) {
      if (/cancel/i.test(String((e && e.message) || ''))) throw e;
      return fileInput(source);
    }
  }

  async function saveFile(name, text, type) {
    if (!isApp) {
      const url = URL.createObjectURL(new Blob([text], { type }));
      const link = document.createElement('a');
      link.href = url;
      link.download = name;
      document.body.appendChild(link);
      link.click();
      link.remove();
      setTimeout(() => URL.revokeObjectURL(url), 1000);
      return;
    }
    const { uri } = await P.Filesystem.writeFile({
      path: name, data: text, directory: 'CACHE', encoding: 'utf8'
    });
    try {
      await P.Share.share({ title: name, files: [uri], dialogTitle: 'Save or send ' + name });
    } catch (e) {
      if (!/cancel/i.test(String((e && e.message) || ''))) throw e;
    }
  }

  function pickBackup() {
    return new Promise((resolve, reject) => {
      const input = document.getElementById('file-restore');
      if (!input) { reject(new Error('No file picker available.')); return; }
      const onChange = () => {
        input.removeEventListener('change', onChange);
        const file = input.files && input.files[0];
        input.value = '';
        if (file) resolve(file); else reject(new Error('cancelled'));
      };
      input.addEventListener('change', onChange);
      input.click();
    });
  }

  async function checkForUpdate() {
    if (!isApp || !P.App || !navigator.onLine) return null;
    try {
      const current = await appInfo();
      const response = await fetch(API, { cache: 'no-cache' });
      if (!response.ok) return null;
      const release = await response.json();
      const match = /^edge-notes-android-(\d+)$/.exec(release.tag_name || '');
      const latest = match ? Number(match[1]) : 0;
      const mine = Number(current.build) || 0;
      if (latest > mine) return { version: latest, apk: APK, url: release.html_url };
    } catch (e) { /* offline or rate limited: try again next launch */ }
    return null;
  }

  // `onBack` may consume the press (a dialog, menu or photo viewer) by returning true.
  function initBackButton(onBack) {
    if (!isApp || !P.App) return;
    P.App.addListener('backButton', () => {
      if (typeof onBack === 'function' && onBack()) return;
      if (location.hash && location.hash !== '#/' && location.hash !== '#') {
        history.back();
      } else if (P.App.minimizeApp) {
        P.App.minimizeApp();
      }
    });
  }

  return { isApp, appInfo, pickImage, saveFile, pickBackup, checkForUpdate, initBackButton, vibrate, haptic };
})();
