'use strict';

/* Edge Notes - router, views and event wiring. No framework: the whole app is
   five files of plain JavaScript that also run in a desktop browser. */

(function () {
  const app = document.getElementById('app');
  const toastEl = document.getElementById('toast');
  const dialogEl = document.getElementById('dialog');

  const GLYPH =
    '<svg viewBox="0 0 64 64" width="100%" height="100%" fill="none" stroke="currentColor" ' +
    'stroke-width="2.5" stroke-linejoin="round" stroke-linecap="round" aria-hidden="true">' +
    '<path d="M3 31h17v12H3a2.5 2.5 0 0 1-2.5-2.5v-7A2.5 2.5 0 0 1 3 31z"/>' +
    '<path d="M20 31h30c4.5 0 8.5 1.2 11 3.5-8 5.5-24 8.5-41 8.5z"/>' +
    '<circle cx="9" cy="37" r="1.4" fill="currentColor" stroke="none"/>' +
    '<circle cx="15" cy="37" r="1.4" fill="currentColor" stroke="none"/></svg>';

  const PHOTO_CACHE = new Map();
  const pendingDeletes = new Map();
  let db = Store.load();
  db.knives = (db.knives || []).map(Core.sanitizeKnife).filter(Boolean);

  const state = {
    query: '',
    info: { build: 0, version: 'web' },
    update: null,
    updateDismissed: false,
    menu: false,
    dialog: null,
    draft: null,
    form: null,
    busy: false,
    lastHash: null,
    currentPath: null,
    previousPath: null
  };

  /* ---------- small helpers ---------- */

  function esc(value) {
    return String(value === null || value === undefined ? '' : value)
      .replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  }

  function plural(n, one, many) {
    return n + ' ' + (n === 1 ? one : many);
  }

  function findKnife(id) {
    return db.knives.find(k => k.id === id) || null;
  }

  function findSession(knife, id) {
    return knife ? (knife.sessions || []).find(s => s.id === id) || null : null;
  }

  function persist() {
    const result = Store.save(db);
    if (!result.ok) toast(result.message);
    return result.ok;
  }

  function go(hash) {
    if (location.hash === hash) render(true);
    else location.hash = hash;
  }

  function back(fallback) {
    if (state.previousPath) history.back();
    else go(fallback || '#/');
  }

  // A sheet's own Back goes to its parent: pop when that is where we came from,
  // otherwise swap the sheet out so it leaves no dead entry behind.
  function backTo(hash) {
    if (state.previousPath === hash) history.back();
    else replaceRoute(hash);
  }

  // Pops back to a route we know we came from, and repairs the sheet if the
  // browser had no entry to pop.
  function backFromSheet(fallback) {
    history.back();
    setTimeout(function () {
      if (location.hash !== fallback) replaceRoute(fallback);
    }, 250);
  }

  function photoSlot(id, cls) {
    if (!id) return '<span class="' + cls + '">' + GLYPH + '</span>';
    return '<span class="' + cls + '" data-photo="' + esc(id) + '">' + GLYPH + '</span>';
  }

  /* ---------- photos ---------- */

  async function photoUrl(id) {
    if (!id) return null;
    if (PHOTO_CACHE.has(id)) return PHOTO_CACHE.get(id);
    try {
      const blob = await Photos.get(id);
      if (!blob) return null;
      const url = URL.createObjectURL(blob);
      PHOTO_CACHE.set(id, url);
      return url;
    } catch (e) {
      return null;
    }
  }

  async function hydratePhotos(root) {
    if (!root) return;
    const nodes = Array.from(root.querySelectorAll('[data-photo]'));
    await Promise.all(nodes.map(async node => {
      const url = await photoUrl(node.getAttribute('data-photo'));
      if (!url || !node.isConnected || node.dataset.hydrated === url) return;
      if (node.tagName === 'IMG') node.src = url;
      else node.innerHTML = '<img alt="" src="' + url + '">';
      node.dataset.hydrated = url;
    }));
  }

  function dropPhoto(id) {
    if (!id) return;
    const url = PHOTO_CACHE.get(id);
    if (url) { URL.revokeObjectURL(url); PHOTO_CACHE.delete(id); }
    Photos.del(id).catch(() => {});
  }

  // A deleted knife can be undone for four seconds, so its photo waits.
  function delayPhotoDelete(id) {
    if (!id) return;
    if (pendingDeletes.has(id)) clearTimeout(pendingDeletes.get(id));
    pendingDeletes.set(id, setTimeout(() => { pendingDeletes.delete(id); dropPhoto(id); }, 5000));
  }

  function cancelPhotoDelete(id) {
    if (!id || !pendingDeletes.has(id)) return;
    clearTimeout(pendingDeletes.get(id));
    pendingDeletes.delete(id);
  }

  /* ---------- toast ---------- */

  let toastTimer = null;

  function hideToast() {
    clearTimeout(toastTimer);
    toastEl.hidden = true;
    toastEl.innerHTML = '';
  }

  function toast(message, actionLabel, action) {
    clearTimeout(toastTimer);
    toastEl.innerHTML = '';
    const text = document.createElement('span');
    text.textContent = message;
    toastEl.appendChild(text);
    if (actionLabel && action) {
      const button = document.createElement('button');
      button.type = 'button';
      button.textContent = actionLabel;
      button.addEventListener('click', () => { hideToast(); action(); });
      toastEl.appendChild(button);
    }
    toastEl.hidden = false;
    toastTimer = setTimeout(hideToast, 4000);
  }

  /* ---------- router ---------- */

  function parseRoute() {
    const raw = location.hash || '#/';
    const [path, query] = raw.slice(1).split('?');
    return { path: path || '/', query: new URLSearchParams(query || '') };
  }

  function render(force) {
    const route = parseRoute();
    const key = route.path + '?' + route.query.toString();
    if (!force && key === state.lastHash) return;
    const wasRouteChange = key !== state.lastHash;
    state.lastHash = key;
    if (wasRouteChange) state.previousPath = state.currentPath;
    if (wasRouteChange) {
      state.menu = false;
      state.dialog = null;
      if (!/\/log(\/|$)/.test(route.path)) state.draft = null;
      if (route.path !== '/new' && !/\/edit$/.test(route.path)) state.form = null;
    }

    let view = null;
    let m;
    if ((m = /^\/$/.exec(route.path))) view = libraryView();
    else if (route.path === '/new') view = knifeFormView(null);
    else if ((m = /^\/knife\/([A-Za-z0-9-]+)$/.exec(route.path))) view = knifeView(m[1]);
    else if ((m = /^\/knife\/([A-Za-z0-9-]+)\/edit$/.exec(route.path))) view = knifeFormView(m[1]);
    else if ((m = /^\/knife\/([A-Za-z0-9-]+)\/photo$/.exec(route.path))) view = knifeView(m[1], true);
    else if ((m = /^\/knife\/([A-Za-z0-9-]+)\/log$/.exec(route.path))) view = logView(m[1], null, route.query);
    else if ((m = /^\/knife\/([A-Za-z0-9-]+)\/log\/([A-Za-z0-9-]+)$/.exec(route.path))) view = logView(m[1], m[2], route.query);

    if (!view) { view = notFoundView(); }
    app.innerHTML = view.html;
    document.title = (view.title ? view.title + ' - ' : '') + 'Edge Notes';
    if (view.after) view.after();
    hydratePhotos(app);
    renderDialog();
    state.currentPath = route.path;
    if (wasRouteChange) window.scrollTo(0, 0);
  }

  /* ---------- library ---------- */

  function rowHtml(knife) {
    const latest = Core.latestSession(knife);
    const angle = latest
      ? '<b>' + Core.fmtAngle(latest.angle) + '</b><small>' + esc(Core.relativeDate(latest.date)) + '</small>'
      : '<b class="none">&mdash;</b><small>not yet</small>';
    const meta = latest ? Core.fmtIncluded(latest.angle) + ' included' : 'No sharpenings yet';
    return '<li><a class="row" href="#/knife/' + encodeURIComponent(knife.id) + '">' +
      photoSlot(knife.photoId, 'thumb') +
      '<span class="row-main"><span class="row-name">' + esc(knife.name) + '</span>' +
      '<span class="row-meta">' + esc(meta) + '</span></span>' +
      '<span class="row-angle">' + angle + '</span></a></li>';
  }

  function emptyHtml() {
    if (!db.knives.length) {
      return '<div class="empty">' + GLYPH + '<h2>No knives yet</h2>' +
        '<p>Add a knife to remember its angle. Everything stays on this phone.</p></div>';
    }
    return '<div class="empty">' + GLYPH + '<h2>No knives match &ldquo;' + esc(state.query.trim()) + '&rdquo;</h2>' +
      '<p>Try a shorter name, or clear the search.</p></div>';
  }

  function listRegion() {
    const knives = Core.searchKnives(db.knives, state.query);
    if (!knives.length) return emptyHtml();
    let html = '<ul class="list">';
    for (const knife of knives) html += rowHtml(knife);
    return html + '</ul>';
  }

  function libraryView() {
    return {
      title: '',
      html:
        '<header class="appbar"><h1>Edge Notes</h1></header>' +
        (state.update && !state.updateDismissed ? updateBar() : '') +
        '<div class="search"><input id="search" type="search" placeholder="Search knives" ' +
        'aria-label="Search knives" autocomplete="off" value="' + esc(state.query) + '"></div>' +
        '<div class="content"><div id="list-region">' + listRegion() + '</div>' + footer() + '</div>' +
        '<div class="actionbar"><a class="btn primary" href="#/new">Add knife</a></div>',
      after: function () {
        const input = document.getElementById('search');
        if (!input) return;
        input.addEventListener('input', function () {
          state.query = input.value;
          const region = document.getElementById('list-region');
          if (!region) return;
          region.innerHTML = listRegion();
          hydratePhotos(region);
        });
      }
    };
  }

  function updateBar() {
    return '<div class="update"><span>Build ' + esc(state.update.version) + ' is ready.</span>' +
      '<a href="' + esc(state.update.apk) + '" data-act="update-download" rel="noopener">Download</a>' +
      '<button class="icon-btn" type="button" data-act="dismiss-update" aria-label="Dismiss update">&times;</button></div>';
  }

  function footer() {
    const build = Number(state.info && state.info.build) || 0;
    const last = db.lastBackupAt ? Core.relativeDate(String(db.lastBackupAt).slice(0, 10)) : 'never';
    return '<footer class="footer">' +
      '<h2>Backup</h2>' +
      '<button class="linkbtn" type="button" data-act="backup">Back up to a file</button>' +
      '<button class="linkbtn" type="button" data-act="restore">Restore from a backup</button>' +
      '<p class="muted">Last backup: ' + esc(last) + ' &middot; ' + (build ? 'Build ' + build : 'Web build') + '</p>' +
      '<button class="linkbtn danger" type="button" data-act="erase">Erase everything</button>' +
      '</footer>';
  }

  function dialogBox(label, body, actions) {
    return '<div class="dialog-box" role="dialog" aria-modal="true" aria-label="' + esc(label) + '">' +
      body + '<div class="row-actions">' + actions + '</div></div>';
  }

  function renderDialog() {
    const d = state.dialog;
    document.body.classList.toggle('modal-open', !!d);
    if (!d) {
      dialogEl.hidden = true;
      dialogEl.innerHTML = '';
      return;
    }
    const cancel = '<button class="btn" type="button" data-act="cancel-dialog">Cancel</button>';
    let html = '';
    if (d.type === 'restore') {
      const a = d.merged.added;
      const b = d.merged.already;
      const total = a.knives + a.sessions + a.photos;
      const have = b.knives + b.sessions + b.photos;
      const parts = [];
      if (a.knives) parts.push(plural(a.knives, 'knife', 'knives'));
      if (a.sessions) parts.push(plural(a.sessions, 'sharpening', 'sharpenings'));
      if (a.photos) parts.push(plural(a.photos, 'photo', 'photos'));
      const haveParts = [];
      if (b.knives) haveParts.push(plural(b.knives, 'knife', 'knives'));
      if (b.sessions) haveParts.push(plural(b.sessions, 'sharpening', 'sharpenings'));
      if (b.photos) haveParts.push(plural(b.photos, 'photo', 'photos'));
      const counts = (total ? parts.join(' &middot; ') + ' to add.' : 'Nothing new in this backup.') +
        (have ? ' ' + haveParts.join(' &middot; ') + ' already here.' : '');
      html = dialogBox('Restore backup',
        '<h2 class="dialog-title">Restore backup</h2>' +
        '<p class="dialog-file">' + esc(d.source) + '</p><p>' + counts + '</p>',
        cancel + (total
          ? '<button class="btn primary" type="button" data-act="confirm-restore">Restore</button>'
          : '<button class="btn" type="button" data-act="cancel-dialog">Close</button>'));
    } else if (d.type === 'restore-error') {
      html = dialogBox('Backup not read',
        '<h2 class="dialog-title">That file could not be read</h2><p>' + esc(d.message) + '</p>',
        '<button class="btn" type="button" data-act="cancel-dialog">Close</button>');
    } else if (d.type === 'erase') {
      html = dialogBox('Erase everything',
        '<h2 class="dialog-title">Erase everything?</h2>' +
        '<p>Every knife, sharpening and photo on this phone will be removed. ' +
        'Backup files you saved elsewhere are not affected.</p>',
        cancel + '<button class="btn danger" type="button" data-act="confirm-erase">Erase all</button>');
    } else if (d.type === 'delete-knife') {
      const knife = findKnife(d.id);
      if (!knife) { state.dialog = null; renderDialog(); return; }
      const count = knife.sessions.length;
      html = dialogBox('Delete knife',
        '<h2 class="dialog-title">Delete this knife?</h2>' +
        '<p>&ldquo;' + esc(knife.name) + '&rdquo;' + (count ? ' and ' + plural(count, 'sharpening', 'sharpenings') : '') +
        ' will be removed. You can undo this for a few seconds.</p>',
        cancel + '<button class="btn danger" type="button" data-act="confirm-delete-knife">Delete</button>');
    }
    dialogEl.innerHTML = html;
    dialogEl.hidden = !html;
    const first = dialogEl.querySelector('button');
    if (first) first.focus();
  }

  function notFoundView() {
    return {
      title: 'Not found',
      html: '<header class="appbar"><button class="icon-btn" type="button" data-act="back-to-library" ' +
        'aria-label="Back to library">&lsaquo;</button>' +
        '<h1>Not here</h1></header>' +
        '<div class="empty">' + GLYPH + '<h2>That page is gone</h2><p>The knife may have been deleted.</p>' +
        '<a class="btn" href="#/">Back to the library</a></div>'
    };
  }

  /* ---------- knife page ---------- */

  function scaleSvg(perSide) {
    const from = 10, to = 25, width = 96, pad = 3;
    const x = v => pad + (Math.min(to, Math.max(from, v)) - from) / (to - from) * (width - pad * 2);
    let ticks = '';
    for (const value of [10, 15, 20, 25]) {
      const tall = value === 10 || value === 25;
      ticks += '<line x1="' + x(value) + '" y1="' + (tall ? 1 : 2.5) + '" x2="' + x(value) +
        '" y2="' + (tall ? 9 : 7.5) + '" stroke="var(--brass)" stroke-opacity=".55" stroke-width="1"/>';
    }
    return '<svg class="scale" viewBox="0 0 96 10" role="img" aria-label="' +
      esc(Core.fmtAngle(perSide)) + ' on a scale from 10 to 25 degrees per side">' +
      '<line x1="' + pad + '" y1="5" x2="' + (width - pad) + '" y2="5" stroke="var(--brass)" ' +
      'stroke-opacity=".35" stroke-width="1"/>' +
      ticks + '<circle cx="' + x(perSide) + '" cy="5" r="2.6" fill="var(--brass)"/></svg>';
  }

  function knifeMenu(knife) {
    return '<div class="menu" role="menu">' +
      '<button type="button" role="menuitem" data-act="edit-knife">Edit knife</button>' +
      '<button class="danger" type="button" role="menuitem" data-act="delete-knife">Delete knife</button>' +
      '</div>';
  }

  function latestCard(knife, latest) {
    if (!latest) {
      return '<section class="card"><span class="label">Last sharpened</span>' +
        '<p class="note muted">Not sharpened yet. Log the first angle and it will live here.</p></section>';
    }
    const rating = latest.rating ? Core.RATINGS[latest.rating] : '';
    const flags = (latest.burr ? '<span class="flag">Burr raised</span>' : '') +
      (latest.stropped ? '<span class="flag">Stropped</span>' : '');
    return '<section class="card">' +
      '<span class="label">Last sharpened</span>' +
      '<div class="readout"><span class="angle">' + Core.fmtNum(latest.angle) +
      '<span class="deg">&deg;</span></span>' +
      '<span class="inc">' + Core.fmtIncluded(latest.angle) + ' included</span></div>' +
      scaleSvg(latest.angle) +
      '<div class="when">' + esc(Core.relativeDate(latest.date)) + ' &middot; ' + esc(Core.fmtDate(latest.date)) + '</div>' +
      (rating || flags ? '<div class="rating-line">' +
        (rating ? '<span>' + esc(rating) + '</span>' : '') + flags + '</div>' : '') +
      (latest.notes ? '<p class="note">' + esc(latest.notes) + '</p>' : '') +
      '</section>';
  }

  function knifeView(id, viewer) {
    const knife = findKnife(id);
    if (!knife) return notFoundView();
    const latest = Core.latestSession(knife);
    const info = Core.stats(knife);
    const sessions = Core.sortSessions(knife.sessions);
    const summary = info.count
      ? (info.count === 1 ? 'Sharpened once' : 'Sharpened ' + info.count + ' times') +
        (info.min === info.max
          ? ' &middot; ' + Core.fmtAngle(info.min) + ' per side'
          : ' &middot; ' + Core.fmtNum(info.min) + '&deg;&ndash;' + Core.fmtAngle(info.max) + ' per side')
      : '';
    const history = sessions.map(session => {
      const rating = session.rating ? '<span class="s-rating">' + esc(Core.RATINGS[session.rating]) + '</span>' : '';
      return '<li><button class="session" type="button" data-act="edit-session" data-session="' +
        esc(session.id) + '"><span class="date">' + esc(Core.fmtDate(session.date)) + rating + '</span>' +
        '<span class="s-angle">' + Core.fmtAngle(session.angle) + '</span></button></li>';
    }).join('');

    let html = '<header class="appbar">' +
      '<button class="icon-btn" type="button" data-act="back-to-library" aria-label="Back to library">&lsaquo;</button>' +
      (knife.photoId
        ? '<a href="#/knife/' + encodeURIComponent(knife.id) + '/photo" aria-label="Open photo">' + photoSlot(knife.photoId, 'avatar') + '</a>'
        : photoSlot(null, 'avatar')) +
      '<span class="title">' + esc(knife.name) + '</span>' +
      '<button class="icon-btn right" type="button" data-act="menu" aria-label="More options" aria-expanded="' +
      (state.menu ? 'true' : 'false') + '">&vellip;</button>' +
      (state.menu ? knifeMenu(knife) : '') +
      '</header>' +
      '<main class="content">' +
      (state.update && !state.updateDismissed ? updateBar() : '') +
      latestCard(knife, latest) +
      (summary ? '<p class="summary">' + summary + '</p>' : '') +
      (sessions.length ? '<ul class="history">' + history + '</ul>' : '') +
      '</main>' +
      '<div class="actionbar"><a class="btn primary" href="#/knife/' + encodeURIComponent(knife.id) + '/log' +
      (latest ? '?angle=' + encodeURIComponent(Core.fmtNum(latest.angle)) : '') + '">' +
      (latest ? 'Sharpen again &middot; ' + Core.fmtAngle(latest.angle) : 'Log first sharpening') + '</a></div>';

    if (viewer && knife.photoId) {
      html += '<div class="viewer" data-act="close-viewer">' +
        '<img data-photo="' + esc(knife.photoId) + '" alt="Photo of ' + esc(knife.name) + '">' +
        '<button class="close" type="button" data-act="close-viewer" aria-label="Close photo">&times;</button></div>';
    }
    return { title: knife.name, html: html };
  }

  /* ---------- log sheet ---------- */

  function logKey(knifeId, sessionId) {
    return knifeId + '/' + (sessionId || 'new');
  }

  function logView(knifeId, sessionId, query) {
    const knife = findKnife(knifeId);
    if (!knife) return notFoundView();
    const existing = sessionId ? findSession(knife, sessionId) : null;
    if (sessionId && !existing) return notFoundView();
    const key = logKey(knifeId, sessionId);
    if (!state.draft || state.draft.key !== key) {
      const prefill = query.get('angle');
      const parsed = prefill !== null ? Core.parseAngle(prefill) : null;
      state.draft = {
        key: key,
        knifeId: knifeId,
        sessionId: sessionId || null,
        date: existing ? existing.date : Core.todayISO(),
        angle: existing ? Core.fmtNum(existing.angle) : (parsed !== null ? Core.fmtNum(parsed) : ''),
        rating: existing ? existing.rating : null,
        burr: existing ? !!existing.burr : false,
        stropped: existing ? !!existing.stropped : false,
        notes: existing ? existing.notes || '' : '',
        fromKnife: state.previousPath === '/knife/' + knifeId
      };
    }
    const draft = state.draft;
    const parsed = Core.parseAngle(draft.angle);
    const today = Core.todayISO();
    const ratingRows = Core.RATINGS.slice(1).map(function (label, index) {
      const n = index + 1;
      return '<button class="rating" type="button" data-act="rating" data-rating="' + n +
        '" aria-pressed="' + (draft.rating === n) + '"><span class="n">' + n + '</span>' + esc(label) + '</button>';
    }).join('');

    const html = '<header class="appbar">' +
      '<button class="icon-btn" type="button" data-act="back-to-knife" aria-label="Back to knife">&lsaquo;</button>' +
      '<h1>' + (existing ? 'Edit sharpening' : 'Log sharpening') + '</h1></header>' +
      '<form class="form" id="session-form" novalidate>' +
      '<label class="field"><span class="label">Date</span>' +
      '<input id="f-date" type="date" value="' + esc(draft.date) + '" max="' + today + '" required></label>' +
      '<div class="field"><label class="label" for="f-angle">Angle per side</label>' +
      '<div class="angle-row"><input class="input" id="f-angle" type="text" inputmode="decimal" ' +
      'autocomplete="off" value="' + esc(draft.angle) + '" aria-describedby="f-angle-hint"></div>' +
      '<span class="inc" id="f-included">' + (parsed === null ? 'No angle yet' : Core.fmtIncluded(parsed) + ' included') + '</span>' +
      '<span class="hint" id="f-angle-hint">1&ndash;45&deg; per side. A comma works too.</span></div>' +
      '<div class="field"><span class="label">How did it cut?</span><div class="ratings">' + ratingRows + '</div></div>' +
      '<div class="switches">' +
      '<label class="switch"><span>Burr raised</span><input id="f-burr" type="checkbox"' + (draft.burr ? ' checked' : '') + '></label>' +
      '<label class="switch"><span>Stropped</span><input id="f-stropped" type="checkbox"' + (draft.stropped ? ' checked' : '') + '></label>' +
      '</div>' +
      '<label class="field"><span class="label">Notes</span>' +
      '<textarea id="f-notes" maxlength="2000" placeholder="Anything worth remembering">' + esc(draft.notes) + '</textarea></label>' +
      '<p class="error" id="f-error" role="alert" hidden></p>' +
      (existing ? '<div class="field"><button class="linkbtn danger" type="button" data-act="delete-session">Delete this sharpening</button></div>' : '') +
      '<div class="actionbar"><button class="btn primary" id="f-save" type="submit"' +
      (parsed === null ? ' disabled' : '') + '>Save</button></div>' +
      '</form>';

    return {
      title: existing ? 'Edit sharpening' : 'Log sharpening',
      html: html,
      after: function () {
        const angle = document.getElementById('f-angle');
        const form = document.getElementById('session-form');
        if (angle) angle.addEventListener('input', syncLogAngle);
        if (form) form.addEventListener('submit', function (event) {
          event.preventDefault();
          saveSessionForm();
        });
      }
    };
  }

  function syncLogAngle() {
    const draft = state.draft;
    const input = document.getElementById('f-angle');
    if (!draft || !input) return;
    draft.angle = input.value;
    const angle = Core.parseAngle(input.value);
    const included = document.getElementById('f-included');
    const save = document.getElementById('f-save');
    const error = document.getElementById('f-error');
    if (included) included.textContent = angle === null ? 'No angle yet' : Core.fmtIncluded(angle) + ' included';
    if (save) save.disabled = angle === null;
    if (error && angle !== null) error.hidden = true;
  }

  function showLogError(message) {
    const error = document.getElementById('f-error');
    if (!error) { toast(message); return; }
    error.textContent = message;
    error.hidden = false;
    error.scrollIntoView({ block: 'center', behavior: 'smooth' });
  }

  function saveSessionForm() {
    const draft = state.draft;
    if (!draft) return;
    const knife = findKnife(draft.knifeId);
    if (!knife) return;
    const angleEl = document.getElementById('f-angle');
    const dateEl = document.getElementById('f-date');
    const notesEl = document.getElementById('f-notes');
    const check = Core.validateSession({
      angle: angleEl ? angleEl.value : draft.angle,
      date: dateEl ? dateEl.value : draft.date,
      rating: draft.rating
    });
    if (!check.ok) {
      showLogError(check.errors.angle || check.errors.date || check.errors.rating || 'Check the details.');
      return;
    }
    const now = new Date().toISOString();
    const burrEl = document.getElementById('f-burr');
    const stroppedEl = document.getElementById('f-stropped');
    const payload = {
      date: check.value.date,
      angle: check.value.angle,
      rating: draft.rating,
      burr: burrEl ? burrEl.checked : !!draft.burr,
      stropped: stroppedEl ? stroppedEl.checked : !!draft.stropped,
      notes: notesEl ? notesEl.value.trim().slice(0, 2000) : draft.notes,
      updatedAt: now
    };
    let edited = false;
    if (draft.sessionId) {
      const session = findSession(knife, draft.sessionId);
      if (!session) return;
      Object.assign(session, payload);
      edited = true;
    } else {
      knife.sessions.push(Object.assign({ id: Core.newId('s'), createdAt: now }, payload));
    }
    knife.updatedAt = now;
    if (!Store.save(db).ok) {
      showLogError('Could not save on this phone. Its storage may be full. Free some space, then try again.');
      return;
    }
    const target = '#/knife/' + encodeURIComponent(knife.id);
    const fromKnife = draft.fromKnife;
    state.draft = null;
    if (fromKnife) backFromSheet(target);
    else replaceRoute(target);
    toast(edited ? 'Sharpening updated.' : 'Sharpening logged.');
  }

  function deleteSession() {
    const draft = state.draft;
    if (!draft || !draft.sessionId) return;
    const knife = findKnife(draft.knifeId);
    if (!knife) return;
    const index = knife.sessions.findIndex(s => s.id === draft.sessionId);
    if (index < 0) return;
    const removed = knife.sessions[index];
    knife.sessions.splice(index, 1);
    knife.updatedAt = new Date().toISOString();
    state.dialog = null;
    if (!Store.save(db).ok) {
      knife.sessions.splice(index, 0, removed);
      toast('Could not save on this phone.');
      return;
    }
    const target = '#/knife/' + encodeURIComponent(knife.id);
    const fromKnife = draft.fromKnife;
    state.draft = null;
    if (fromKnife) backFromSheet(target);
    else replaceRoute(target);
    toast('Sharpening deleted.', 'Undo', function () {
      knife.sessions.push(removed);
      Store.save(db);
      render(true);
    });
  }

  /* ---------- add / edit knife ---------- */

  function captureKnifeForm() {
    const f = state.form;
    if (!f) return;
    const name = document.getElementById('k-name');
    const notes = document.getElementById('k-notes');
    if (name) f.name = name.value;
    if (notes) f.notes = notes.value;
  }

  function showFormError(message) {
    const error = document.getElementById('f-error');
    if (!error) { toast(message); return; }
    error.textContent = message;
    error.hidden = false;
  }

  function knifeFormView(knifeId) {
    const existing = knifeId ? findKnife(knifeId) : null;
    if (knifeId && !existing) return notFoundView();
    const key = knifeId || 'new';
    if (!state.form || state.form.key !== key) {
      state.form = {
        key: key,
        name: existing ? existing.name : '',
        notes: existing ? existing.notes || '' : '',
        photoId: existing ? existing.photoId : null,
        pending: null,
        remove: false,
        fromKnife: existing ? state.previousPath === '/knife/' + knifeId : false
      };
    }
    const f = state.form;
    let preview;
    if (f.pending) preview = '<span class="preview"><img alt="" src="' + f.pending.url + '"></span>';
    else if (f.photoId && !f.remove) preview = photoSlot(f.photoId, 'preview');
    else preview = '<span class="preview">' + GLYPH + '</span>';
    const hasPhoto = !!f.pending || (!!f.photoId && !f.remove);

    const html = '<header class="appbar">' +
      '<button class="icon-btn" type="button" data-act="close-knife-form" aria-label="Back">&lsaquo;</button>' +
      '<h1>' + (existing ? 'Edit knife' : 'New knife') + '</h1></header>' +
      '<form class="form" id="knife-form" novalidate>' +
      '<label class="field"><span class="label">Name</span>' +
      '<input id="k-name" type="text" maxlength="80" autocomplete="off" placeholder="Chef&rsquo;s knife" ' +
      'value="' + esc(f.name) + '" required></label>' +
      '<div class="field"><span class="label">Photo</span><div class="photo-row">' + preview +
      '<div class="photo-actions">' +
      '<button class="btn small" type="button" data-act="photo-camera">Take photo</button>' +
      '<button class="btn small" type="button" data-act="photo-gallery">Choose photo</button>' +
      (hasPhoto ? '<button class="btn small ghost" type="button" data-act="photo-remove">Remove photo</button>' : '') +
      '</div></div><span class="hint">Optional. A photo makes a knife easy to find.</span></div>' +
      '<label class="field"><span class="label">Notes</span>' +
      '<textarea id="k-notes" maxlength="2000" placeholder="Steel, handle, anything worth remembering">' +
      esc(f.notes) + '</textarea></label>' +
      '<p class="error" id="f-error" role="alert" hidden></p>' +
      '<div class="actionbar"><button class="btn primary" type="submit">Save</button></div>' +
      '</form>';

    return {
      title: existing ? 'Edit knife' : 'New knife',
      html: html,
      after: function () {
        const form = document.getElementById('knife-form');
        if (form) form.addEventListener('submit', function (event) {
          event.preventDefault();
          saveKnifeForm();
        });
      }
    };
  }

  async function pickKnifePhoto(source) {
    const f = state.form;
    if (!f) return;
    captureKnifeForm();
    try {
      const picked = await Native.pickImage(source);
      const blob = await Photos.shrink(picked);
      if (f.pending) URL.revokeObjectURL(f.pending.url);
      f.pending = { blob: blob, url: URL.createObjectURL(blob) };
      f.remove = false;
      render(true);
    } catch (e) {
      const message = String((e && e.message) || e || '');
      if (/cancel/i.test(message)) return;
      toast('That photo could not be added.');
    }
  }

  function removeKnifePhoto() {
    const f = state.form;
    if (!f) return;
    captureKnifeForm();
    if (f.pending) URL.revokeObjectURL(f.pending.url);
    f.pending = null;
    f.remove = true;
    render(true);
  }

  async function saveKnifeForm() {
    const f = state.form;
    if (!f || state.busy) return;
    captureKnifeForm();
    const check = Core.validateKnife({ name: f.name });
    if (!check.ok) {
      showFormError(check.error);
      const input = document.getElementById('k-name');
      if (input) input.focus();
      return;
    }
    state.busy = true;
    const now = new Date().toISOString();
    const existing = f.key === 'new' ? null : findKnife(f.key);
    const oldPhoto = existing ? existing.photoId : null;
    let photoId = existing ? existing.photoId : null;
    if (f.pending) photoId = Core.newId('p');
    if (f.remove) photoId = null;

    if (f.pending && photoId) {
      try {
        await Photos.put(photoId, f.pending.blob);
      } catch (e) {
        state.busy = false;
        showFormError('The photo could not be saved. Try again, or save without it.');
        return;
      }
    }

    let knife = existing;
    if (knife) {
      knife.name = check.value;
      knife.notes = f.notes.trim().slice(0, 2000);
      knife.photoId = photoId;
      knife.updatedAt = now;
    } else {
      knife = {
        id: Core.newId('k'),
        name: check.value,
        notes: f.notes.trim().slice(0, 2000),
        photoId: photoId,
        createdAt: now,
        updatedAt: now,
        sessions: []
      };
      db.knives.push(knife);
    }

    if (!Store.save(db).ok) {
      if (!existing) db.knives = db.knives.filter(k => k.id !== knife.id);
      if (f.pending && photoId) Photos.del(photoId).catch(() => {});
      state.busy = false;
      showFormError('Could not save on this phone. Its storage may be full.');
      return;
    }

    if (f.pending) URL.revokeObjectURL(f.pending.url);
    if (oldPhoto && oldPhoto !== photoId) dropPhoto(oldPhoto);
    const target = '#/knife/' + encodeURIComponent(knife.id);
    const fromKnife = f.fromKnife;
    state.form = null;
    state.busy = false;
    if (fromKnife) backFromSheet(target);
    else replaceRoute(target);
    toast(existing ? 'Knife updated.' : 'Knife added.');
  }

  /* ---------- actions ---------- */

  // Swaps the current history entry for another route, so saving a sheet leaves
  // no sheet behind to go back to. The back target is unchanged.
  function replaceRoute(hash) {
    const previousPath = state.previousPath;
    state.lastHash = null;
    state.menu = false;
    if (location.hash === hash) render(true);
    else {
      location.replace(location.pathname + location.search + hash);
      render(true);
    }
    state.previousPath = previousPath;
  }

  function currentKnifeId() {
    const m = /^#\/knife\/([A-Za-z0-9-]+)/.exec(location.hash || '');
    return m ? m[1] : null;
  }

  function isLibrary() {
    return parseRoute().path === '/';
  }

  function captureSessionFields() {
    const d = state.draft;
    if (!d) return;
    const angle = document.getElementById('f-angle');
    const date = document.getElementById('f-date');
    const notes = document.getElementById('f-notes');
    const burr = document.getElementById('f-burr');
    const stropped = document.getElementById('f-stropped');
    if (angle) d.angle = angle.value;
    if (date && date.value) d.date = date.value;
    if (notes) d.notes = notes.value;
    if (burr) d.burr = burr.checked;
    if (stropped) d.stropped = stropped.checked;
  }

  function deleteKnife(id) {
    const knife = findKnife(id);
    if (!knife) return;
    const index = db.knives.indexOf(knife);
    db.knives.splice(index, 1);
    state.dialog = null;
    state.menu = false;
    if (!Store.save(db).ok) {
      db.knives.splice(index, 0, knife);
      toast('Could not save on this phone.');
      return;
    }
    delayPhotoDelete(knife.photoId);
    replaceRoute('#/');
    toast('Deleted \u201c' + knife.name + '\u201d.', 'Undo', function () {
      cancelPhotoDelete(knife.photoId);
      db.knives.push(knife);
      Store.save(db);
      render(true);
    });
  }

  async function backupToFile() {
    if (state.busy) return;
    state.busy = true;
    try {
      const photos = await Photos.exportAll();
      const payload = Core.buildBackup(db, photos);
      const name = 'edge-notes-backup-' + Core.todayISO() + '.json';
      await Native.saveFile(name, JSON.stringify(payload), 'application/json');
      db.lastBackupAt = new Date().toISOString();
      persist();
      state.busy = false;
      render(true);
      toast('Backup saved as ' + name + '.');
    } catch (e) {
      state.busy = false;
      toast('The backup could not be saved. ' + ((e && e.message) || ''));
    }
  }

  async function beginRestore() {
    if (state.busy) return;
    try {
      const file = await Native.pickBackup();
      const text = await file.text();
      const parsed = Core.parseBackup(text);
      const existingPhotos = await Photos.keys();
      const merged = Core.mergeBackup(db, parsed, existingPhotos);
      state.dialog = { type: 'restore', merged: merged, source: file.name || 'backup.json' };
      render(true);
    } catch (e) {
      const message = String((e && e.message) || e || '');
      if (/cancel/i.test(message)) return;
      state.dialog = { type: 'restore-error', message: message || 'That backup could not be read.' };
      render(true);
    }
  }

  async function applyRestore() {
    const d = state.dialog;
    if (!d || d.type !== 'restore' || state.busy) return;
    state.busy = true;
    try {
      await Photos.importAll(d.merged.photos);
    } catch (e) {
      toast('Some photos could not be restored.');
    }
    db = d.merged.data;
    state.busy = false;
    state.dialog = null;
    if (!Store.save(db).ok) {
      toast('Could not save on this phone. Its storage may be full.');
      return;
    }
    render(true);
    const a = d.merged.added;
    const total = a.knives + a.sessions + a.photos;
    toast(total
      ? 'Restored ' + plural(a.knives, 'knife', 'knives') + ' and ' + plural(a.sessions, 'sharpening', 'sharpenings') + '.'
      : 'Nothing new to restore.');
  }

  async function eraseEverything() {
    const d = state.dialog;
    if (!d || d.type !== 'erase') return;
    state.dialog = null;
    for (const timer of pendingDeletes.values()) clearTimeout(timer);
    pendingDeletes.clear();
    try {
      await Photos.clear();
    } catch (e) { /* the metadata still goes */ }
    for (const url of PHOTO_CACHE.values()) URL.revokeObjectURL(url);
    PHOTO_CACHE.clear();
    db = Core.blankData();
    state.query = '';
    Store.save(db);
    render(true);
    toast('Everything erased.');
  }

  function onClick(event) {
    if (event.target === dialogEl) {
      state.dialog = null;
      render(true);
      return;
    }
    const el = event.target.closest('[data-act]');
    if (!el) {
      if (state.menu) {
        state.menu = false;
        render(true);
      }
      return;
    }
    const act = el.getAttribute('data-act');
    const knifeId = currentKnifeId();
    switch (act) {
      case 'menu':
        state.menu = !state.menu;
        render(true);
        break;
      case 'edit-knife':
        state.menu = false;
        go('#/knife/' + encodeURIComponent(knifeId) + '/edit');
        break;
      case 'delete-knife':
        state.menu = false;
        state.dialog = { type: 'delete-knife', id: knifeId };
        render(true);
        break;
      case 'confirm-delete-knife':
        if (state.dialog && state.dialog.id) deleteKnife(state.dialog.id);
        break;
      case 'edit-session': {
        const sessionId = el.getAttribute('data-session');
        go('#/knife/' + encodeURIComponent(knifeId) + '/log/' + encodeURIComponent(sessionId));
        break;
      }
      case 'delete-session':
        // A sharpening is cheap to restore with Undo, so it goes without a dialog.
        captureSessionFields();
        deleteSession();
        break;
      case 'back-to-knife':
        backTo(knifeId ? '#/knife/' + encodeURIComponent(knifeId) : '#/');
        break;
      case 'close-knife-form':
        backTo(knifeId ? '#/knife/' + encodeURIComponent(knifeId) : '#/');
        break;
      case 'rating': {
        if (!state.draft) return;
        const n = Number(el.getAttribute('data-rating'));
        state.draft.rating = state.draft.rating === n ? null : n;
        const all = document.querySelectorAll('.rating');
        all.forEach(function (button) {
          button.setAttribute('aria-pressed', String(Number(button.getAttribute('data-rating')) === state.draft.rating));
        });
        break;
      }
      case 'photo-camera':
        pickKnifePhoto('camera');
        break;
      case 'photo-gallery':
        pickKnifePhoto('gallery');
        break;
      case 'photo-remove':
        removeKnifePhoto();
        break;
      case 'close-viewer':
        replaceRoute('#/knife/' + encodeURIComponent(knifeId));
        break;
      case 'update-download':
        event.preventDefault();
        window.open(state.update.apk, Native.isApp ? '_system' : '_blank', 'noopener');
        break;
      case 'dismiss-update':
        state.updateDismissed = true;
        render(true);
        break;
      case 'back-to-library':
        back('#/');
        break;
      case 'backup':
        backupToFile();
        break;
      case 'restore':
        beginRestore();
        break;
      case 'confirm-restore':
        applyRestore();
        break;
      case 'erase':
        state.dialog = { type: 'erase' };
        render(true);
        break;
      case 'confirm-erase':
        eraseEverything();
        break;
      case 'cancel-dialog':
        state.dialog = null;
        render(true);
        break;
    }
  }

  /* ---------- start ---------- */

  function onKeydown(event) {
    if (event.key !== 'Escape') return;
    if (state.menu || state.dialog) {
      state.menu = false;
      state.dialog = null;
      render(true);
    } else if (/\/photo$/.test(location.hash || '')) {
      replaceRoute('#/knife/' + encodeURIComponent(currentKnifeId()));
    }
  }

  function init() {
    if (!location.hash) history.replaceState(null, '', '#/');
    document.addEventListener('click', onClick);
    document.addEventListener('keydown', onKeydown);
    window.addEventListener('hashchange', function () { render(); });
    render(true);
    Native.initBackButton(function () {
      if (state.dialog) {
        state.dialog = null;
        render(true);
        return true;
      }
      if (state.menu) {
        state.menu = false;
        render(true);
        return true;
      }
      if (/\/photo$/.test(location.hash || '')) {
        replaceRoute('#/knife/' + encodeURIComponent(currentKnifeId()));
        return true;
      }
      return false;
    });
    Native.appInfo().then(function (info) {
      state.info = info || state.info;
      if (isLibrary()) render(true);
    });
    Native.checkForUpdate().then(function (update) {
      if (update) {
        state.update = update;
        if (isLibrary()) render(true);
      }
    });
    if (db.recovered) {
      toast('Your saved record could not be read, so the app started empty. Restore a backup if you have one.');
    }
  }

  init();
})();
