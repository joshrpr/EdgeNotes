'use strict';

/* Edge Notes - pure domain logic.
   No DOM, no storage: everything here is testable with node --test. */

const Core = (() => {
  const RATINGS = [null, 'Dull', 'Working edge', 'Shaves', 'Push cuts newspaper', 'Hair whittling'];
  const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const MIN_ANGLE = 1;
  const MAX_ANGLE = 45;

  const round1 = n => Math.round(n * 10) / 10;

  /* ---------- angles ---------- */

  // Accepts 17.5, "17,5", "17.5°", " 17 "; rejects anything outside 1-45.
  function parseAngle(raw) {
    if (raw === null || raw === undefined) return null;
    const s = String(raw).trim().replace(/°/g, '').replace(/\s+/g, '').replace(',', '.');
    if (!/^\d+(\.\d+)?$/.test(s)) return null;
    const n = Number(s);
    if (!Number.isFinite(n) || n < MIN_ANGLE || n > MAX_ANGLE) return null;
    return round1(n);
  }

  const included = perSide => round1(perSide * 2);
  const fmtNum = n => String(round1(n));
  const fmtAngle = perSide => fmtNum(perSide) + '°';
  const fmtIncluded = perSide => fmtNum(included(perSide)) + '°';
  const angleText = perSide => fmtAngle(perSide) + ' per side · ' + fmtIncluded(perSide) + ' included';
  function rangeText(min, max) {
    if (min === null || min === undefined || max === null || max === undefined) return '';
    if (min === max) return 'Past range ' + fmtAngle(min) + ' per side';
    return 'Past range ' + fmtNum(min) + '°–' + fmtAngle(max) + ' per side';
  }

  /* ---------- dates ---------- */

  const pad = n => String(n).padStart(2, '0');
  const toISODate = d => d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate());

  function todayISO(now) {
    const d = now ? new Date(now) : new Date();
    return toISODate(d);
  }

  function parseISODate(iso) {
    const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(String(iso || ''));
    if (!m) return null;
    const y = Number(m[1]), mo = Number(m[2]), da = Number(m[3]);
    const d = new Date(y, mo - 1, da);
    if (d.getFullYear() !== y || d.getMonth() !== mo - 1 || d.getDate() !== da) return null;
    return d;
  }

  function fmtDate(iso) {
    const d = parseISODate(iso);
    if (!d) return '';
    return d.getDate() + ' ' + MONTHS[d.getMonth()] + ' ' + d.getFullYear();
  }

  function dayDiff(fromISO, toISO) {
    const a = parseISODate(fromISO), b = parseISODate(toISO);
    if (!a || !b) return null;
    return Math.round((b - a) / 86400000);
  }

  function relativeDate(iso, nowISO) {
    const days = dayDiff(iso, nowISO || todayISO());
    if (days === null) return '';
    if (days < 0) return 'in the future';
    if (days === 0) return 'today';
    if (days === 1) return 'yesterday';
    if (days < 7) return days + ' days ago';
    if (days < 14) return 'last week';
    if (days < 45) return Math.round(days / 7) + ' weeks ago';
    if (days < 60) return 'last month';
    if (days < 365) return Math.round(days / 30) + ' months ago';
    const years = Math.floor(days / 365);
    return years === 1 ? 'last year' : years + ' years ago';
  }

  /* ---------- ordering ---------- */

  function sortSessions(list) {
    return (list || []).slice().sort((a, b) => {
      if (a.date !== b.date) return a.date < b.date ? 1 : -1;
      return String(b.createdAt || '').localeCompare(String(a.createdAt || ''));
    });
  }

  function latestSession(knife) {
    const sessions = knife && knife.sessions;
    if (!Array.isArray(sessions) || !sessions.length) return null;
    return sortSessions(sessions)[0];
  }

  // Most recent sharpening first; knives never sharpened last, oldest added first.
  function sortKnives(knives) {
    return (knives || []).slice().sort((a, b) => {
      const sa = latestSession(a), sb = latestSession(b);
      if (sa && sb) {
        if (sa.date !== sb.date) return sa.date < sb.date ? 1 : -1;
        const c = String(sb.createdAt || '').localeCompare(String(sa.createdAt || ''));
        return c !== 0 ? c : String(a.name || '').localeCompare(String(b.name || ''));
      }
      if (sa) return -1;
      if (sb) return 1;
      return String(a.createdAt || '').localeCompare(String(b.createdAt || ''));
    });
  }

  /* ---------- lookup ---------- */

  function normalize(value) {
    return String(value === null || value === undefined ? '' : value)
      .normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim();
  }

  function matches(knife, query) {
    const q = normalize(query);
    if (!q) return true;
    return normalize(knife && knife.name).includes(q);
  }

  function searchKnives(knives, query) {
    return sortKnives((knives || []).filter(k => matches(k, query)));
  }

  function stats(knife) {
    const sessions = sortSessions(knife && knife.sessions);
    if (!sessions.length) return { count: 0, latest: null, min: null, max: null };
    let min = Infinity, max = -Infinity;
    for (const s of sessions) { if (s.angle < min) min = s.angle; if (s.angle > max) max = s.angle; }
    return { count: sessions.length, latest: sessions[0], min, max };
  }

  /* ---------- validation ---------- */

  function validateKnife(input) {
    const name = String((input && input.name) || '').trim();
    if (!name) return { ok: false, error: 'Give the knife a name.' };
    if (name.length > 80) return { ok: false, error: 'Keep the name under 80 characters.' };
    return { ok: true, value: name };
  }

  function validateSession(input, nowISO) {
    const errors = {};
    const angle = parseAngle(input && input.angle);
    if (angle === null) errors.angle = 'Enter an angle between 1 and 45° per side.';
    const date = String((input && input.date) || '');
    if (!parseISODate(date)) errors.date = 'Pick a valid date.';
    else if (dayDiff(date, nowISO || todayISO()) < 0) errors.date = 'The date cannot be in the future.';
    const rating = input && input.rating;
    if (rating !== null && rating !== undefined &&
        !(Number.isInteger(rating) && rating >= 1 && rating <= 5)) {
      errors.rating = 'Pick a rating from 1 to 5.';
    }
    return {
      ok: Object.keys(errors).length === 0,
      errors,
      value: { angle, date, rating: rating || null }
    };
  }

  /* ---------- identity ---------- */

  let idCounter = 0;
  function newId(prefix) {
    idCounter += 1;
    return (prefix || 'id') + '-' + Date.now().toString(36) + '-' +
      idCounter.toString(36) + Math.random().toString(36).slice(2, 8);
  }

  function blankData() {
    return { version: 1, knives: [], lastBackupAt: null };
  }

  /* ---------- backup ---------- */

  function sanitizeKnife(raw) {
    if (!raw || typeof raw !== 'object') return null;
    const name = String(raw.name || '').trim().slice(0, 80);
    if (!name) return null;
    const now = new Date().toISOString();
    const knife = {
      id: String(raw.id || newId('k')),
      name,
      notes: String(raw.notes || ''),
      photoId: raw.photoId ? String(raw.photoId) : null,
      createdAt: String(raw.createdAt || now),
      updatedAt: String(raw.updatedAt || raw.createdAt || now),
      sessions: []
    };
    const seen = new Set();
    for (const s of Array.isArray(raw.sessions) ? raw.sessions : []) {
      if (!s || typeof s !== 'object') continue;
      const angle = parseAngle(s.angle);
      if (angle === null || !parseISODate(s.date)) continue;
      let id = String(s.id || newId('s'));
      if (seen.has(id)) id = newId('s');
      seen.add(id);
      knife.sessions.push({
        id,
        date: s.date,
        angle,
        rating: Number.isInteger(s.rating) && s.rating >= 1 && s.rating <= 5 ? s.rating : null,
        burr: !!s.burr,
        stropped: !!s.stropped,
        notes: String(s.notes || ''),
        createdAt: String(s.createdAt || s.date + 'T12:00:00.000Z'),
        updatedAt: String(s.updatedAt || s.createdAt || s.date + 'T12:00:00.000Z')
      });
    }
    return knife;
  }

  function parseBackup(text) {
    let raw;
    try {
      raw = JSON.parse(String(text));
    } catch (e) {
      throw new Error('That file is not valid JSON, so it cannot be an Edge Notes backup.');
    }
    if (!raw || raw.app !== 'edge-notes') throw new Error('That file is not an Edge Notes backup.');
    if (!Array.isArray(raw.knives)) throw new Error('The backup has no knives in it.');
    const knives = raw.knives.map(sanitizeKnife).filter(Boolean);
    const photos = {};
    if (raw.photos && typeof raw.photos === 'object') {
      for (const [id, url] of Object.entries(raw.photos)) {
        if (typeof url === 'string' && /^data:image\//.test(url)) photos[String(id)] = url;
      }
    }
    return { exportedAt: raw.exportedAt || null, knives, photos };
  }

  function mergeBackup(current, incoming, existingPhotoIds) {
    const base = current && Array.isArray(current.knives) ? current : blankData();
    const data = {
      version: 1,
      lastBackupAt: base.lastBackupAt || null,
      knives: base.knives.map(k => ({
        ...k,
        sessions: Array.isArray(k.sessions) ? k.sessions.slice() : []
      }))
    };
    const added = { knives: 0, sessions: 0, photos: 0 };
    const already = { knives: 0, sessions: 0, photos: 0 };
    const byId = new Map(data.knives.map(k => [k.id, k]));

    for (const knife of (incoming && incoming.knives) || []) {
      const existing = byId.get(knife.id);
      if (!existing) {
        data.knives.push(knife);
        byId.set(knife.id, knife);
        added.knives += 1;
        added.sessions += knife.sessions.length;
        continue;
      }
      already.knives += 1;
      const seen = new Set(existing.sessions.map(s => s.id));
      for (const session of knife.sessions) {
        if (seen.has(session.id)) { already.sessions += 1; continue; }
        existing.sessions.push(session);
        seen.add(session.id);
        added.sessions += 1;
      }
      if (!existing.photoId && knife.photoId) existing.photoId = knife.photoId;
    }

    const havePhotos = new Set(existingPhotoIds || []);
    const photos = {};
    for (const [id, url] of Object.entries((incoming && incoming.photos) || {})) {
      if (havePhotos.has(id) || photos[id]) { already.photos += 1; continue; }
      photos[id] = url;
      added.photos += 1;
    }
    return { data, photos, added, already };
  }

  function buildBackup(data, photos, exportedAt) {
    return {
      app: 'edge-notes',
      version: 1,
      exportedAt: exportedAt || new Date().toISOString(),
      knives: (data && data.knives) || [],
      photos: photos || {}
    };
  }

  return {
    RATINGS, MONTHS, MIN_ANGLE, MAX_ANGLE,
    round1, parseAngle, included, fmtNum, fmtAngle, fmtIncluded, angleText, rangeText,
    todayISO, parseISODate, fmtDate, dayDiff, relativeDate,
    sortSessions, latestSession, sortKnives, normalize, matches, searchKnives, stats,
    validateKnife, validateSession, newId, blankData, sanitizeKnife,
    parseBackup, mergeBackup, buildBackup
  };
})();

if (typeof module !== 'undefined') module.exports = Core;
