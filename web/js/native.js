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

  async function appInfo() {
    if (!isApp || !P.App) return { build: 0, version: 'web' };
    if (cachedInfo) return cachedInfo;
    try { cachedInfo = await P.App.getInfo(); }
    catch (e) { cachedInfo = { build: 0, version: 'app' }; }
    return cachedInfo;
  }

  async function photoBlob(photo) {
    const uri = photo && (photo.uri || photo.webPath || photo.path);
    if (!uri) throw new Error('The camera did not return a photo.');
    if (uri.startsWith('data:') || uri.startsWith('blob:')) return (await fetch(uri)).blob();
    if (P.Filesystem) {
      const result = await P.Filesystem.readFile({ path: uri });
      const bytes = Uint8Array.from(atob(result.data), c => c.charCodeAt(0));
      return new Blob([bytes], { type: 'image/jpeg' });
    }
    return (await fetch(uri)).blob();
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

  return { isApp, appInfo, pickImage, saveFile, pickBackup, checkForUpdate, initBackButton, vibrate };
})();
