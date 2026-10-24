'use strict';

/* Edge Notes - router, views and event wiring. No framework: the whole app is
   five files of plain JavaScript that also run in a desktop browser. */

(function () {
  const app = document.getElementById('app');
  const toastEl = document.getElementById('toast');
  const dialogEl = document.getElementById('dialog');

  // The house knife: a gyuto in profile, steel and walnut, with the edge in
  // brass. It holds the frame wherever a photo is missing.
  const GLYPH =
    '<svg viewBox="0 0 64 40" width="100%" height="100%" preserveAspectRatio="xMidYMid meet" ' +
    'aria-hidden="true" focusable="false">' +
    '<path d="M3 24 C18 29.5 32 28 44 24.5 L44 10 L42 10 C30 11.5 16 17 3 24 Z" fill="url(#steel-fill)"/>' +
    '<path d="M3 24 C18 29.5 32 28 44 24.5" fill="none" stroke="#D8A34A" stroke-width="1.3"/>' +
    '<path d="M5 22.7 C18 27 31 25.5 42 22" fill="none" stroke="#EAF4F8" stroke-opacity=".32" stroke-width=".9"/>' +
    '<rect x="44" y="12" width="4" height="11" fill="#C79A4E"/>' +
    '<path d="M48 12.5 L60 14 L60 22 L48 23.5 Z" fill="#4E3527"/>' +
    '<path d="M48 15 L60 16.6" fill="none" stroke="#C89A6A" stroke-opacity=".35" stroke-width=".9"/>' +
    '<path d="M60 14 L60 22" stroke="#2A1B13" stroke-width=".9"/>' +
    '</svg>';

  // One drawn icon family: 24 px, 2 px round strokes.
  const ICON_BACK =
    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" ' +
    'stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false">' +
    '<path d="M15 4.5 7.5 12 15 19.5"/></svg>';
  const ICON_MORE =
    '<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" focusable="false">' +
    '<circle cx="12" cy="5.5" r="1.9"/><circle cx="12" cy="12" r="1.9"/>' +
    '<circle cx="12" cy="18.5" r="1.9"/></svg>';
  const ICON_CLOSE =
    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" ' +
    'stroke-linecap="round" aria-hidden="true" focusable="false">' +
    '<path d="M6.5 6.5 17.5 17.5M17.5 6.5 6.5 17.5"/></svg>';
  const ICON_CHEV =
    '<svg class="chev" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" ' +
    'stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false">' +
    '<path d="M9 5l7 7-7 7"/></svg>';
  const ICON_FIND =
    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" ' +
    'stroke-linecap="round" aria-hidden="true" focusable="false">' +
    '<circle cx="10.5" cy="10.5" r="5.8"/><path d="m15 15 4.3 4.3"/></svg>';

  // The hamon: the temper line along a hand-forged edge. It is drawn once on
  // each arrival, the way a blade is revealed under the lamp.
  const HAMON =
    '<svg class="hamon" viewBox="0 0 390 15" preserveAspectRatio="none" aria-hidden="true" focusable="false">' +
    '<path class="glow" d="M0 9.5 C22 5.5 40 11 60 8.5 S98 4.5 120 9.5 S158 13.5 180 7.5 ' +
    'S220 3.5 242 8.5 S278 12.5 300 7.5 S340 4 362 9 S382 7 390 8"/>' +
    '<path class="line" d="M0 9 C22 5 40 10.5 60 8 S98 4 120 9 S158 13 180 7 ' +
    'S220 3 242 8 S278 12 300 7 S340 3.5 362 8.5 S382 6.5 390 7.5"/>' +
    '<path class="ashi" d="M79 7.5l0 3M146 10l0 2.5M213 4.5l0 3M265 9l0 2.5M331 5l0 3M354 8l0 2"/>' +
    '</svg>';

  // A gyuto in profile, drawn flat: steel, hamon, edge and an octagonal wa
  // handle. Used only when the library is empty or a search finds nothing.
  const KNIFE_ART =
    '<svg class="empty-art" viewBox="0 0 300 96" aria-hidden="true" focusable="false">' +
    '<defs><linearGradient id="art-steel" x1="0" y1="0" x2="0" y2="1">' +
    '<stop offset="0" stop-color="#5E6E77"/><stop offset=".55" stop-color="#2C3A42"/>' +
    '<stop offset="1" stop-color="#18232A"/></linearGradient></defs>' +
    '<path d="M12 57 C76 67 150 65 204 57 L204 28 L196 28 C130 30 62 42 12 57 Z" fill="url(#art-steel)"/>' +
    '<path d="M14 55 C76 60 142 58 200 51" fill="none" stroke="#E8F2F6" stroke-opacity=".24" stroke-width="1"/>' +
    '<path d="M12 57 C76 67 150 65 204 57" fill="none" stroke="#D8A34A" stroke-opacity=".9" stroke-width="1.5"/>' +
    '<path d="M20 54 C62 58 112 57 152 54 S184 52 198 50" fill="none" stroke="#E8F2F6" stroke-opacity=".3" stroke-width="1"/>' +
    '<rect x="204" y="32" width="10" height="24" fill="#C79A4E"/>' +
    '<path d="M214 32 L288 37 L288 51 L214 55 Z" fill="#4E3527"/>' +
    '<path d="M214 37 L288 41" stroke="#C89A6A" stroke-opacity=".4" stroke-width="1"/>' +
    '<path d="M214 52 L288 48" stroke="#2A1B13" stroke-width="1"/>' +
    '<path d="M288 37 L288 51" stroke="#2A1B13" stroke-width="1"/>' +
    '</svg>';

  // Brushed steel is a real surface here, so it is drawn once as irregular
  // hairlines and shared by the plates. No stripe pattern pretending to be metal.
  function brushSteel() {
    try {
      const size = 256;
      const canvas = document.createElement('canvas');
      canvas.width = size;
      canvas.height = size;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;
      let seed = 20261022;
      const rand = function () { seed = (seed * 1664525 + 1013904223) >>> 0; return seed / 4294967296; };
      for (let y = 0; y < size; y++) {
        const alpha = 0.0025 + rand() * 0.009;
        ctx.fillStyle = 'rgba(235, 244, 248, ' + alpha.toFixed(3) + ')';
        ctx.fillRect(0, y, size, 1);
        if (rand() > 0.9) {
          const x = Math.floor(rand() * size);
          ctx.fillStyle = 'rgba(255, 255, 255, ' + (alpha * 1.6).toFixed(3) + ')';
          ctx.fillRect(x, y, 8 + Math.floor(rand() * 18), 1);
        }
      }
      document.documentElement.style.setProperty('--brushed', 'url(' + canvas.toDataURL('image/png') + ')');
    } catch (e) { /* the linear gradient alone carries the surface */ }
  }

  const PHOTO_CACHE = new Map();
  const pendingDeletes = new Map();
  let routeSeq = 0;
  let db = Store.load();
  db.knives = (db.knives || []).map(Core.sanitizeKnife).filter(Boolean);

  const state = {
    query: '',
    info: { build: 0, version: 'web' },
    update: null,
    updateDismissed: false,
    menu: false,
    dialog: null,
    dialogReturn: null,
    draft: null,
    form: null,
    busy: false,
    read: null,
    strike: null,
    lastHash: null,
    currentPath: null,
    previousPath: null,
    passPending: null,
    passing: false
  };

  /* ---------- small helpers ---------- */

  function esc(value) {
    return String(value === null || value === undefined ? '' : value)
      .replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  }

  function plural(n, one, many) {
    return n + ' ' + (n === 1 ? one : many);
  }

  // Relative dates are captions in the library and sentences on the knife page.
  function upperFirst(text) {
    return text ? text.charAt(0).toUpperCase() + text.slice(1) : text;
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
      else {
        node.innerHTML = '<img alt="" src="' + url + '">';
        const img = node.firstElementChild;
        if (img) img.addEventListener('error', function () {
          node.innerHTML = GLYPH;
          node.removeAttribute('data-photo');
        }, { once: true });
      }
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

  // `angle` names what was just recorded, set in brass like every other angle
  // in the app, so a save confirms the number and not only the action.
  function toast(message, actionLabel, action, angle) {
    clearTimeout(toastTimer);
    toastEl.innerHTML = '';
    const text = document.createElement('span');
    text.textContent = message;
    if (angle) {
      const mark = document.createElement('b');
      mark.className = 'toast-angle';
      mark.textContent = angle;
      text.append(' \u00b7 ', mark);
    }
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

  function buildView(route) {
    let view = null;
    let m;
    if ((m = /^\/$/.exec(route.path))) view = libraryView();
    else if (route.path === '/new') view = knifeFormView(null);
    else if ((m = /^\/knife\/([A-Za-z0-9-]+)$/.exec(route.path))) view = knifeView(m[1]);
    else if ((m = /^\/knife\/([A-Za-z0-9-]+)\/edit$/.exec(route.path))) view = knifeFormView(m[1]);
    else if ((m = /^\/knife\/([A-Za-z0-9-]+)\/photo$/.exec(route.path))) view = knifeView(m[1], true);
    else if ((m = /^\/knife\/([A-Za-z0-9-]+)\/log$/.exec(route.path))) view = logView(m[1], null, route.query);
    else if ((m = /^\/knife\/([A-Za-z0-9-]+)\/log\/([A-Za-z0-9-]+)$/.exec(route.path))) view = logView(m[1], m[2], route.query);
    return view || notFoundView();
  }

  // Painting is separate from building so a pass can build the next view first,
  // while the old DOM is still mounted, then swap it inside the transition.
  function paint(view, route, wasRouteChange, enter) {
    app.innerHTML = '<div class="screen' + (enter ? ' enter' : '') + '">' + view.html + '</div>';
    document.title = (view.title ? view.title + ' - ' : '') + 'Edge Notes';
    if (view.after) view.after();
    hydratePhotos(app);
    renderDialog();
    state.currentPath = route.path;
    if (wasRouteChange) window.scrollTo(0, 0);
  }

  function supportsPass() {
    return typeof document.startViewTransition === 'function' &&
      !window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  }

  // The angle a pass carries is named on the old page before the swap and on
  // the new page while it is built, so both snapshots share one element.
  function nameCarry(el) {
    el.style.viewTransitionName = 'knife-angle';
    el.setAttribute('data-vt-angle', '');
  }

  function prepareCarry(fromPath, toPath) {
    if (!state.passPending) return;
    if (toPath === '/' && /^\/knife\/[A-Za-z0-9-]+$/.test(fromPath)) {
      const hero = app.querySelector('.last .num');
      if (hero) nameCarry(hero);
      return;
    }
    if (state.read && state.read.id) {
      const row = app.querySelector('[data-knife="' + state.read.id + '"] .row-angle b, ' +
        '[data-knife="' + state.read.id + '"] .angle .num');
      if (row && !row.classList.contains('none')) nameCarry(row);
    }
  }

  // Names must not outlive the pass that used them, or the next transition
  // would try to carry a number that no longer has a partner.
  function clearCarry() {
    for (const el of app.querySelectorAll('[data-vt-angle]')) {
      el.style.viewTransitionName = '';
      el.removeAttribute('data-vt-angle');
    }
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

    // The first paint has no page behind it, so it never cuts.
    const pass = state.currentPath !== null && wasRouteChange && supportsPass() && !state.passing;
    const fromPath = state.currentPath || '/';
    const token = wasRouteChange ? ++routeSeq : routeSeq;

    state.passPending = pass;
    // Before buildView: knifeView consumes state.read, which prepareCarry needs.
    prepareCarry(fromPath, route.path);
    const view = buildView(route);
    state.passPending = false;

    function arrive() {
      if (token === routeSeq && view.afterArrival) view.afterArrival();
    }

    if (!pass) {
      paint(view, route, wasRouteChange, wasRouteChange);
      arrive();
      return;
    }

    state.passing = true;
    document.documentElement.dataset.pass = Route.direction(fromPath, route.path);
    const transition = document.startViewTransition(function () {
      paint(view, route, wasRouteChange, false);
    });
    // A newer route makes this view's arrival stale, but the transition still
    // owns data-pass and state.passing until it finishes.
    function finish() {
      state.passing = false;
      delete document.documentElement.dataset.pass;
      arrive();
      clearCarry();
    }
    transition.finished.then(finish, finish);
  }

  /* ---------- the wedge: the angle, drawn to scale ---------- */

  // A blade's cross-section at the recorded angle. The apex sits on the left;
  // the two bevels open to the right at one per-side angle each, so the figure
  // is a true reading and changes shape with the knife. Everything is derived
  // from the angle, which is why 10° and 25° do not look alike.
  function wedgeSvg(perSide, opts) {
    const o = opts || {};
    const angle = Core.parseAngle(perSide);
    const t = angle === null ? 0.05 : Math.tan(angle * Math.PI / 180);
    const run = 88;
    const half = run * t;
    const pad = 7;
    const apexX = 9;
    const apexY = half + pad;
    const farX = apexX + run;
    const bottom = half * 2 + pad;
    const height = half * 2 + pad * 2;
    const arm = Math.hypot(run, half);
    const radius = Math.min(arm * 0.64, 64);
    const cos = run / arm;
    const sin = half / arm;
    const arcX = apexX + radius * cos;
    const arcY = apexY - radius * sin;
    const arcY2 = apexY + radius * sin;
    const label = angle === null
      ? 'No angle yet'
      : Core.fmtAngle(angle) + ' per side, ' + Core.fmtIncluded(angle) + ' included';
    const gauge = o.gauge ? ' data-gauge="' + esc(o.gauge) + '"' : '';
    return '<svg class="wedge' + (o.live ? ' live' : '') + (angle === null ? ' is-empty' : '') + '"' +
      gauge + ' viewBox="0 0 104 ' + height.toFixed(1) + '" preserveAspectRatio="xMinYMid meet" ' +
      'role="img" aria-label="' + esc(label) + '">' +
      '<g class="body">' +
      '<path class="fill" d="M' + apexX + ' ' + apexY.toFixed(1) + ' L' + farX + ' ' + pad + ' L' + farX + ' ' + bottom.toFixed(1) + ' Z"/>' +
      '<line class="axis" x1="' + apexX + '" y1="' + apexY.toFixed(1) + '" x2="' + (farX + 5) + '" y2="' + apexY.toFixed(1) + '"/>' +
      '<path class="arc" pathLength="1" d="M' + arcX.toFixed(1) + ' ' + arcY.toFixed(1) + ' A' +
      radius.toFixed(1) + ' ' + radius.toFixed(1) + ' 0 0 1 ' + arcX.toFixed(1) + ' ' + arcY2.toFixed(1) + '"/>' +
      '<line class="arm upper" pathLength="1" x1="' + apexX + '" y1="' + apexY.toFixed(1) + '" x2="' + farX + '" y2="' + pad + '"/>' +
      '<line class="arm lower" pathLength="1" x1="' + apexX + '" y1="' + apexY.toFixed(1) + '" x2="' + farX + '" y2="' + bottom.toFixed(1) + '"/>' +
      '</g>' +
      '<circle class="edge-glow" cx="' + apexX + '" cy="' + apexY.toFixed(1) + '" r="5.4"/>' +
      '<circle class="edge" cx="' + apexX + '" cy="' + apexY.toFixed(1) + '" r="2.1"/>' +
      '</svg>';
  }

  /* ---------- library ---------- */

  function rowHtml(knife, carryId) {
    const latest = Core.latestSession(knife);
    const carried = latest && knife.id === carryId
      ? ' style="view-transition-name:knife-angle" data-vt-angle'
      : '';
    const angle = latest
      ? '<b' + carried + '>' + Core.fmtAngle(latest.angle) + '</b><small>' + esc(Core.relativeDate(latest.date)) + '</small>'
      : '<b class="none">&mdash;</b>';
    const meta = latest ? Core.fmtIncluded(latest.angle) + ' included' : 'Not sharpened yet';
    return '<li><a class="row" href="#/knife/' + encodeURIComponent(knife.id) + '" data-knife="' + esc(knife.id) + '">' +
      photoSlot(knife.photoId, 'thumb') +
      '<span class="row-main"><span class="row-name">' + esc(knife.name) + '</span>' +
      '<span class="row-meta">' + esc(meta) + '</span></span>' +
      '<span class="row-angle">' + angle + '</span></a></li>';
  }

  function emptyHtml() {
    if (!db.knives.length) {
      return '<div class="empty">' + KNIFE_ART + '<h2>No knives yet</h2>' +
        '<p>Add a knife to remember its angle. Everything stays on this phone.</p></div>';
    }
    return '<div class="empty">' + KNIFE_ART + '<h2>No knives match &ldquo;' + esc(state.query.trim()) + '&rdquo;</h2>' +
      '<p>Try a shorter name, or clear the search.</p>' +
      '<button class="btn" type="button" data-act="clear-search">Clear search</button></div>';
  }

  // The most recently sharpened knife gets the bench: its angle at reading size
  // and the blade's cross-section drawn at that angle. It is not repeated in
  // the list below, which keeps the root screen from being a plain feed.
  function benchHtml(knife, carryId) {
    const latest = Core.latestSession(knife);
    if (!latest) return '';
    const carry = knife.id === carryId
      ? ' style="view-transition-name:knife-angle" data-vt-angle'
      : '';
    return '<section class="bench"><a class="bench-link" href="#/knife/' + encodeURIComponent(knife.id) +
      '" data-knife="' + esc(knife.id) + '">' +
      '<span class="bench-top"><span class="label">Last on the bench</span></span>' +
      '<span class="bench-id">' + (knife.photoId ? photoSlot(knife.photoId, 'bench-photo') : '') +
      '<span class="bench-name">' + esc(knife.name) + '</span></span>' +
      '<span class="bench-main">' +
      '<span class="bench-angle"><span class="angle">' +
      '<span class="num"' + carry + '>' + Core.fmtNum(latest.angle) + '<span class="deg">&deg;</span></span>' +
      '</span><small>per side</small></span>' +
      '<span class="bench-figure">' + wedgeSvg(latest.angle) +
      '<span class="bench-inc">' + Core.fmtIncluded(latest.angle) + ' included</span></span>' +
      '</span>' +
      '<span class="bench-when">' + esc(upperFirst(Core.relativeDate(latest.date))) + ' &middot; ' +
      esc(Core.fmtDate(latest.date)) + '</span>' +
      '</a></section>';
  }

  function listRegion() {
    const knives = Core.searchKnives(db.knives, state.query);
    if (!knives.length) return emptyHtml();
    const searching = !!state.query.trim();
    // Coming back from a knife, its row's angle is the incoming half of the carry.
    const leaving = state.passPending && state.currentPath
      ? /^\/knife\/([A-Za-z0-9-]+)$/.exec(state.currentPath)
      : null;
    const carryId = leaving ? leaving[1] : null;
    const top = searching ? null : knives[0];
    // A never-sharpened knife cannot hold the bench; it stays in the list.
    const featured = top && Core.latestSession(top) ? top : null;
    const rest = featured ? knives.slice(1) : knives;
    let html = featured ? benchHtml(featured, carryId) : '';
    if (rest.length) {
      const count = searching
        ? plural(knives.length, 'match', 'matches')
        : plural(knives.length, 'knife', 'knives');
      html += '<div class="rack-head"><span>' + (searching ? 'Matches' : 'Library') +
        '</span><span class="count">' + esc(count) + '</span></div><ul class="list">';
      for (const knife of rest) html += rowHtml(knife, carryId);
      html += '</ul>';
    }
    return html;
  }

  function libraryView() {
    return {
      title: '',
      html:
        '<header class="masthead"><div class="appbar"><span class="brand-mark" aria-hidden="true">EN</span>' +
        '<h1>Edge Notes</h1></div>' + HAMON + '</header>' +
        '<div class="search"><div class="search-field">' + ICON_FIND +
        '<input id="search" type="search" placeholder="Find a knife" ' +
        'aria-label="Search knives" autocomplete="off" value="' + esc(state.query) + '"></div></div>' +
        '<div class="content">' +
        (state.update && !state.updateDismissed ? updateBar() : '') +
        '<div id="list-region">' + listRegion() + '</div>' + footer() + '</div>' +
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
      '<button class="icon-btn" type="button" data-act="dismiss-update" aria-label="Dismiss update">' +
      ICON_CLOSE + '</button></div>';
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

  function openDialog(dialog, trigger, returnSelector) {
    state.dialogReturn = returnSelector || (trigger ? '[data-act="' + trigger + '"]' : null);
    state.dialog = dialog;
    render(true);
  }

  // Closing returns focus to the control that opened the dialog, so a keyboard
  // or screen-reader user is not dropped at the top of the page.
  function closeDialog() {
    const selector = state.dialogReturn;
    state.dialog = null;
    state.dialogReturn = null;
    render(true);
    if (!selector) return;
    const opener = document.querySelector(selector);
    const fallback = document.querySelector('[data-act="menu"]') || document.getElementById('search');
    if (opener) opener.focus();
    else if (fallback) fallback.focus();
  }

  function renderDialog() {
    const d = state.dialog;
    document.body.classList.toggle('modal-open', !!d);
    dialogEl.classList.toggle('is-sheet', !!d && d.type === 'session');
    if (!d) {
      app.inert = false;
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
    } else if (d.type === 'session') {
      const knife = findKnife(d.knifeId);
      const session = knife ? findSession(knife, d.sessionId) : null;
      if (!knife || !session) {
        state.dialog = null;
        state.dialogReturn = null;
        renderDialog();
        return;
      }
      const rating = session.rating ? Core.RATINGS[session.rating] : '';
      const flags = (session.burr ? '<span class="flag">Burr raised</span>' : '') +
        (session.stropped ? '<span class="flag">Stropped</span>' : '');
      html = '<div class="sheet" role="dialog" aria-modal="true" aria-labelledby="session-title">' +
        '<div class="sheet-grip" aria-hidden="true"></div>' +
        '<div class="sheet-top">' +
        '<span class="label">Sharpening session</span>' +
        '<button class="icon-btn sheet-close" type="button" data-act="cancel-dialog" aria-label="Close session details">' + ICON_CLOSE + '</button>' +
        '</div>' +
        '<div class="sheet-body">' +
        '<h2 class="sheet-date" id="session-title">' + esc(Core.fmtDate(session.date)) + '</h2>' +
        '<div class="sheet-angle"><span class="sheet-num">' + Core.fmtNum(session.angle) +
        '<span class="sheet-deg">&deg;</span></span><span class="sheet-per">per side</span></div>' +
        '<div class="sheet-meta"><span>' + Core.fmtIncluded(session.angle) + ' included</span>' +
        (rating ? '<span class="sheet-rating">' + esc(rating) + '</span>' : '') + '</div>' +
        (flags ? '<div class="sheet-flags">' + flags + '</div>' : '') +
        '<p class="sheet-note' + (session.notes ? '' : ' is-empty') + '">' +
        esc(session.notes || 'No note recorded for this session.') + '</p>' +
        '<div class="sheet-actions"><button class="btn" type="button" data-act="edit-session" data-session="' +
        esc(session.id) + '">Edit sharpening</button></div>' +
        '</div></div>';
    }
    app.inert = true;
    dialogEl.innerHTML = html;
    dialogEl.hidden = !html;
    const first = dialogEl.querySelector('button');
    if (first) first.focus();
  }

  function notFoundView() {
    return {
      title: 'Not found',
      html: '<header class="masthead"><div class="appbar"><button class="icon-btn" type="button" data-act="back-to-library" ' +
        'aria-label="Back to library">' + ICON_BACK + '</button>' +
        '<h1>Not here</h1></div></header>' +
        '<div class="empty">' + KNIFE_ART + '<h2>That page is gone</h2><p>The knife may have been deleted.</p>' +
        '<a class="btn" href="#/">Back to the library</a></div>'
    };
  }

  /* ---------- knife page ---------- */

  function knifeMenu(knife) {
    return '<div class="menu" role="menu">' +
      (knife.photoId ? '<button type="button" role="menuitem" data-act="view-photo">View photo</button>' : '') +
      '<button type="button" role="menuitem" data-act="edit-knife">Edit knife</button>' +
      '<button class="danger" type="button" role="menuitem" data-act="delete-knife">Delete knife</button>' +
      '</div>';
  }

  // The house photograph, not the owner's stored photo. Every knife shows this
  // same band; the stored photo lives in the library thumbnail and the viewer.
  function currentEdge() {
    return '<div class="edge-photo" role="img" aria-label="The house knife on a black surface"></div>';
  }

  function lastSection(knife, latest, gauge, carry) {
    const head = '<div class="last-top"><span class="label">Current edge</span></div>' + currentEdge();
    if (!latest) {
      return '<section class="last">' + head +
        '<p class="note muted">Not sharpened yet. Log the first angle and it will live here.</p></section>';
    }
    const rating = latest.rating ? Core.RATINGS[latest.rating] : '';
    const flags = (latest.burr ? '<span class="flag">Burr raised</span>' : '') +
      (latest.stropped ? '<span class="flag">Stropped</span>' : '');
    return '<section class="last">' + head +
      '<div class="last-main">' +
      '<span class="angle"><span class="num"' +
      (carry ? ' style="view-transition-name:knife-angle" data-vt-angle' : '') + '>' + Core.fmtNum(latest.angle) +
      '<span class="deg">&deg;</span></span><span class="per">per side</span></span>' +
      '<span class="last-figure">' + wedgeSvg(latest.angle, { gauge: gauge }) +
      '<span class="inc">' + Core.fmtIncluded(latest.angle) + ' included</span></span>' +
      '</div>' +
      '<p class="last-when"><b>Last sharpened</b> &middot; ' +
      esc(upperFirst(Core.relativeDate(latest.date))) + ', ' + esc(Core.fmtDate(latest.date)) + '</p>' +
      (rating || flags ? '<div class="rating-line">' +
        (rating ? '<span>' + esc(rating) + '</span>' : '') + flags + '</div>' : '') +
      (latest.notes ? '<p class="note">' + esc(latest.notes) + '</p>' : '') +
      '</section>';
  }

  function historyHead(info) {
    return '<div class="history-head"><h2>Sharpening History</h2>' +
      '<span class="history-count">' + plural(info.count, 'session', 'sessions') + '</span></div>' +
      '<p class="history-range">' + esc(Core.rangeText(info.min, info.max)) + '</p>';
  }

  function knifeView(id, viewer) {
    const knife = findKnife(id);
    if (!knife) return notFoundView();
    const latest = Core.latestSession(knife);
    const info = Core.stats(knife);
    const sessions = Core.sortSessions(knife.sessions);
    // One gauge animation per arrival: a strike just landed here, or this knife
    // was picked out of the library and the instrument is being read.
    const strike = state.strike && state.strike.id === knife.id ? state.strike : null;
    const reading = !strike && state.read && state.read.id === knife.id && Date.now() - state.read.at < 2000;
    state.strike = null;
    state.read = null;
    let gauge = null;
    if (strike && strike.affectsLatest) {
      if (strike.from === null) gauge = 'first';
      else if (strike.from !== strike.to) gauge = 'travel';
    } else if (reading) {
      gauge = 'read';
    }
    const carry = !!(state.passPending && reading);
    const history = sessions.map(session => {
      const rating = session.rating ? '<span class="s-rating">' + esc(Core.RATINGS[session.rating]) + '</span>' : '';
      return '<li><button class="session" type="button" data-act="open-session" aria-haspopup="dialog" data-session="' +
        esc(session.id) + '"><span class="date">' + esc(Core.fmtDate(session.date)) + rating + '</span>' +
        '<span class="s-angle">' + Core.fmtNum(session.angle) + '<span class="deg">&deg;</span></span>' +
        ICON_CHEV + '</button></li>';
    }).join('');

    let html = '<header class="masthead knife-head"><div class="appbar">' +
      '<button class="icon-btn" type="button" data-act="back-to-library" aria-label="Back to library">' + ICON_BACK + '</button>' +
      '<span class="title">' + esc(knife.name) + '</span>' +
      '<button class="icon-btn right" type="button" data-act="menu" aria-label="More options" ' +
      'aria-haspopup="menu" aria-expanded="' + (state.menu ? 'true' : 'false') + '">' + ICON_MORE + '</button>' +
      (state.menu ? knifeMenu(knife) : '') +
      '</div></header>' +
      '<main class="content">' +
      (state.update && !state.updateDismissed ? updateBar() : '') +
      lastSection(knife, latest, gauge, carry) +
      (sessions.length ? historyHead(info) + '<ul class="history">' + history + '</ul>' : '') +
      '</main>' +
      '<div class="actionbar"><a class="btn primary' + (latest ? ' plate' : '') + '" href="#/knife/' + encodeURIComponent(knife.id) + '/log' +
      (latest ? '?angle=' + encodeURIComponent(Core.fmtNum(latest.angle)) : '') + '"' +
      (latest ? ' aria-label="Log sharpening at ' + Core.fmtNum(latest.angle) + ' degrees per side"' : '') + '>' +
      (latest
        ? '<span class="plate-label">Log Sharpening</span>' +
          '<span class="plate-rule" aria-hidden="true"></span>' +
          '<span class="plate-angle">' + Core.fmtNum(latest.angle) + '<span class="plate-deg">&deg;</span></span>'
        : 'Log first sharpening') + '</a></div>';

    if (viewer && knife.photoId) {
      // The glyph holds the frame until the stored photo loads, so the viewer
      // never paints an image element without a source.
      html += '<div class="viewer" data-act="close-viewer">' +
        '<span class="viewer-photo" role="img" aria-label="Photo of ' + esc(knife.name) + '" ' +
        'data-photo="' + esc(knife.photoId) + '">' + GLYPH + '</span>' +
        '<button class="close" type="button" data-act="close-viewer" aria-label="Close photo">' + ICON_CLOSE + '</button></div>';
    }
    return {
      title: knife.name,
      html: html,
      // The gauge and the pip wait for the cut to finish so none of the
      // ceremony is frozen inside a transition snapshot.
      afterArrival: function () {
        const wedge = document.querySelector('.last .wedge[data-gauge]');
        if (wedge) {
          wedge.classList.add('is-drawn');
          delete wedge.dataset.gauge;
        }
        const plate = document.querySelector('.actionbar .plate');
        if (plate) {
          plate.addEventListener('pointerdown', function () {
            plate.classList.remove('is-sweeping');
            void plate.offsetWidth;
            plate.classList.add('is-sweeping');
          });
          plate.addEventListener('animationend', function (event) {
            if (event.animationName === 'plate-sweep') plate.classList.remove('is-sweeping');
          });
        }
        // The second tap lands with the drop, one beat after the save itself.
        if (strike) setTimeout(function () { Native.haptic('land'); }, 420);
      }
    };
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

    const html = '<header class="masthead"><div class="appbar">' +
      '<button class="icon-btn" type="button" data-act="back-to-knife" aria-label="Back to knife">' + ICON_BACK + '</button>' +
      '<h1>' + (existing ? 'Edit sharpening' : 'Log sharpening') + '</h1></div></header>' +
      '<form class="form" id="session-form" novalidate>' +
      '<label class="field"><span class="label">Date</span>' +
      '<input id="f-date" type="date" value="' + esc(draft.date) + '" max="' + today + '" required></label>' +
      '<div class="field"><label class="label" for="f-angle">Angle per side</label>' +
      '<div class="measure">' +
      '<input class="input" id="f-angle" type="text" inputmode="decimal" ' +
      'autocomplete="off" placeholder="17.5" value="' + esc(draft.angle) + '" aria-describedby="f-angle-hint">' +
      '<span class="measure-figure">' + wedgeSvg(parsed, { live: true }) +
      '<span class="inc" id="f-included">' + (parsed === null ? 'No angle yet' : Core.fmtIncluded(parsed) + ' included') + '</span></span>' +
      '</div>' +
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
    const wedge = document.querySelector('.measure-figure .wedge');
    const save = document.getElementById('f-save');
    const error = document.getElementById('f-error');
    if (wedge) wedge.outerHTML = wedgeSvg(angle, { live: true });
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
    const before = Core.latestSession(knife);
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
    let savedId = draft.sessionId;
    if (draft.sessionId) {
      const session = findSession(knife, draft.sessionId);
      if (!session) return;
      Object.assign(session, payload);
      edited = true;
    } else {
      const created = Object.assign({ id: Core.newId('s'), createdAt: now }, payload);
      knife.sessions.push(created);
      savedId = created.id;
    }
    knife.updatedAt = now;
    if (!Store.save(db).ok) {
      showLogError('Could not save on this phone. Its storage may be full. Free some space, then try again.');
      return;
    }
    const latestAfter = Core.latestSession(knife);
    const target = '#/knife/' + encodeURIComponent(knife.id);
    const fromKnife = draft.fromKnife;
    state.draft = null;
    state.strike = {
      id: knife.id,
      sessionId: savedId,
      from: before ? before.angle : null,
      to: check.value.angle,
      affectsLatest: !!latestAfter && latestAfter.id === savedId
    };
    Native.haptic('save');
    if (fromKnife) backFromSheet(target);
    else replaceRoute(target);
    toast(edited ? 'Sharpening updated' : 'Sharpening logged', null, null,
      Core.fmtAngle(check.value.angle) + ' per side');
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

    const html = '<header class="masthead"><div class="appbar">' +
      '<button class="icon-btn" type="button" data-act="close-knife-form" aria-label="Back">' + ICON_BACK + '</button>' +
      '<h1>' + (existing ? 'Edit knife' : 'New knife') + '</h1></div></header>' +
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
      '<div class="actionbar"><button class="btn primary" id="k-save" type="submit"' +
      (f.name.trim() ? '' : ' disabled') + '>Save</button></div>' +
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
        const name = document.getElementById('k-name');
        if (name) name.addEventListener('input', syncKnifeSave);
      }
    };
  }

  function syncKnifeSave() {
    const name = document.getElementById('k-name');
    const save = document.getElementById('k-save');
    const error = document.getElementById('f-error');
    const filled = !!(name && name.value.trim());
    if (save) save.disabled = !filled;
    if (filled && error) error.hidden = true;
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
    state.dialogReturn = null;
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
      openDialog({ type: 'restore', merged: merged, source: file.name || 'backup.json' }, 'restore');
    } catch (e) {
      const message = String((e && e.message) || e || '');
      if (/cancel/i.test(message)) return;
      openDialog({ type: 'restore-error', message: message || 'That backup could not be read.' }, 'restore');
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
    state.dialogReturn = null;
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
    state.dialogReturn = null;
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
      closeDialog();
      return;
    }
    // A library row is a plain link, so it keeps its own navigation; this only
    // records that a knife was picked and answers with a tap under the thumb.
    const row = event.target.closest ? event.target.closest('a[data-knife]') : null;
    if (row) {
      const opened = /^#\/knife\/([A-Za-z0-9-]+)$/.exec(row.getAttribute('href') || '');
      if (opened) state.read = { id: opened[1], at: Date.now() };
      Native.haptic('select');
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
      case 'view-photo':
        state.menu = false;
        go('#/knife/' + encodeURIComponent(knifeId) + '/photo');
        break;
      case 'edit-knife':
        state.menu = false;
        go('#/knife/' + encodeURIComponent(knifeId) + '/edit');
        break;
      case 'delete-knife':
        state.menu = false;
        openDialog({ type: 'delete-knife', id: knifeId }, 'delete-knife');
        break;
      case 'confirm-delete-knife':
        if (state.dialog && state.dialog.id) deleteKnife(state.dialog.id);
        break;
      case 'open-session': {
        const sessionId = el.getAttribute('data-session');
        openDialog({ type: 'session', knifeId: knifeId, sessionId: sessionId }, null,
          '[data-act="open-session"][data-session="' + sessionId + '"]');
        break;
      }
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
      case 'clear-search': {
        state.query = '';
        const input = document.getElementById('search');
        const region = document.getElementById('list-region');
        if (input) { input.value = ''; input.focus(); }
        if (region) { region.innerHTML = listRegion(); hydratePhotos(region); }
        break;
      }
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
        openDialog({ type: 'erase' }, 'erase');
        break;
      case 'confirm-erase':
        eraseEverything();
        break;
      case 'cancel-dialog':
        closeDialog();
        break;
    }
  }

  /* ---------- start ---------- */

  function trapDialogFocus(event) {
    if (event.key !== 'Tab' || !state.dialog) return;
    const items = dialogEl.querySelectorAll('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])');
    if (!items.length) return;
    const first = items[0];
    const last = items[items.length - 1];
    if (!dialogEl.contains(document.activeElement)) {
      event.preventDefault();
      first.focus();
      return;
    }
    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  }

  function onKeydown(event) {
    trapDialogFocus(event);
    if (event.key !== 'Escape') return;
    if (state.dialog) {
      closeDialog();
    } else if (state.menu) {
      state.menu = false;
      render(true);
    } else if (/\/photo$/.test(location.hash || '')) {
      replaceRoute('#/knife/' + encodeURIComponent(currentKnifeId()));
    }
  }

  function init() {
    brushSteel();
    if (!location.hash) history.replaceState(null, '', '#/');
    document.addEventListener('click', onClick);
    document.addEventListener('keydown', onKeydown);
    window.addEventListener('hashchange', function () { render(); });
    render(true);
    Native.initBackButton(function () {
      if (state.dialog) {
        closeDialog();
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
