'use strict';
// Run with: node --test tests/*.test.js
const test = require('node:test');
const assert = require('node:assert');
const C = require('../web/js/core.js');

test('parses angles the way people type them', () => {
  assert.strictEqual(C.parseAngle('17.5'), 17.5);
  assert.strictEqual(C.parseAngle('17,5'), 17.5);
  assert.strictEqual(C.parseAngle('17.5°'), 17.5);
  assert.strictEqual(C.parseAngle(' 17 '), 17);
  assert.strictEqual(C.parseAngle('17,5°'), 17.5);
  assert.strictEqual(C.parseAngle(17), 17);
  assert.strictEqual(C.parseAngle('17.55'), 17.6);
});

test('rejects angles outside 1-45 or not numeric', () => {
  for (const bad of ['', 'abc', '0', '46', '-2', '1.0.0', null, undefined, '17°5']) {
    assert.strictEqual(C.parseAngle(bad), null, String(bad));
  }
  assert.strictEqual(C.parseAngle('1'), 1);
  assert.strictEqual(C.parseAngle('45'), 45);
});

test('shows both angle conventions', () => {
  assert.strictEqual(C.included(17.5), 35);
  assert.strictEqual(C.fmtAngle(17.5), '17.5°');
  assert.strictEqual(C.fmtIncluded(17.5), '35°');
  assert.strictEqual(C.angleText(17.5), '17.5° per side · 35° included');
});

test('formats and validates dates without timezone drift', () => {
  assert.strictEqual(C.fmtDate('2026-10-04'), '4 Oct 2026');
  assert.strictEqual(C.fmtDate('2026-01-31'), '31 Jan 2026');
  assert.strictEqual(C.parseISODate('2026-02-29'), null);
  assert.ok(C.parseISODate('2024-02-29') instanceof Date);
  assert.strictEqual(C.dayDiff('2026-10-01', '2026-10-21'), 20);
});

test('describes recency in words', () => {
  const now = '2026-10-21';
  assert.strictEqual(C.relativeDate('2026-10-21', now), 'today');
  assert.strictEqual(C.relativeDate('2026-10-20', now), 'yesterday');
  assert.strictEqual(C.relativeDate('2026-10-18', now), '3 days ago');
  assert.strictEqual(C.relativeDate('2026-10-13', now), 'last week');
  assert.strictEqual(C.relativeDate('2026-10-01', now), '3 weeks ago');
  assert.strictEqual(C.relativeDate('2026-09-01', now), 'last month');
  assert.strictEqual(C.relativeDate('2026-06-01', now), '5 months ago');
  assert.strictEqual(C.relativeDate('2025-06-01', now), 'last year');
  assert.strictEqual(C.relativeDate('2026-10-22', now), 'in the future');
});

const session = (id, date, angle, createdAt) => ({ id, date, angle, createdAt: createdAt || date + 'T12:00:00.000Z' });
const knife = (id, name, sessions, createdAt) => ({ id, name, sessions: sessions || [], createdAt: createdAt || '2026-01-01T00:00:00.000Z' });

test('orders sessions newest first, breaking ties by creation', () => {
  const list = [session('a', '2026-10-01', 15), session('b', '2026-10-03', 17, '2026-10-03T09:00:00.000Z'),
    session('c', '2026-10-03', 18, '2026-10-03T10:00:00.000Z')];
  assert.deepStrictEqual(C.sortSessions(list).map(s => s.id), ['c', 'b', 'a']);
});

test('orders knives by last sharpening, unsharpened last', () => {
  const old = knife('old', 'Old', [session('s1', '2026-05-01', 15)], '2026-01-01T00:00:00.000Z');
  const fresh = knife('fresh', 'Fresh', [session('s2', '2026-10-01', 17)], '2026-02-01T00:00:00.000Z');
  const never = knife('never', 'Never', [], '2026-03-01T00:00:00.000Z');
  const newer = knife('newer', 'Newer', [], '2026-04-01T00:00:00.000Z');
  assert.deepStrictEqual(C.sortKnives([never, old, fresh, newer]).map(k => k.id), ['fresh', 'old', 'never', 'newer']);
  assert.strictEqual(C.latestSession(fresh).id, 's2');
  assert.strictEqual(C.latestSession(never), null);
});

test('searches names only, ignoring case and accents', () => {
  const a = knife('a', 'Crème brûlée knife', []);
  const b = knife('b', 'Cleaver', []);
  b.notes = 'creme';
  assert.deepStrictEqual(C.searchKnives([a, b], 'creme').map(k => k.id), ['a']);
  assert.deepStrictEqual(C.searchKnives([a, b], '  KNIFE ').map(k => k.id), ['a']);
  assert.strictEqual(C.searchKnives([a, b], '').length, 2);
});

test('summarises a knife history', () => {
  const k = knife('k', 'K', [session('1', '2026-10-01', 17), session('2', '2026-06-01', 15), session('3', '2026-10-03', 17.5)]);
  const st = C.stats(k);
  assert.strictEqual(st.count, 3);
  assert.strictEqual(st.min, 15);
  assert.strictEqual(st.max, 17.5);
  assert.strictEqual(st.latest.id, '3');
  assert.deepStrictEqual(C.stats(knife('e', 'E', [])), { count: 0, latest: null, min: null, max: null });
});

test('validates knife names and sharpening entries', () => {
  assert.strictEqual(C.validateKnife({ name: '  ' }).ok, false);
  assert.strictEqual(C.validateKnife({ name: 'Chef' }).value, 'Chef');
  assert.strictEqual(C.validateKnife({ name: 'x'.repeat(81) }).ok, false);

  const ok = C.validateSession({ angle: '17,5', date: '2026-10-20' }, '2026-10-21');
  assert.strictEqual(ok.ok, true);
  assert.strictEqual(ok.value.angle, 17.5);

  const bad = C.validateSession({ angle: '46', date: '2026-10-22', rating: 6 }, '2026-10-21');
  assert.strictEqual(bad.ok, false);
  assert.ok(bad.errors.angle);
  assert.ok(bad.errors.date);
  assert.ok(bad.errors.rating);
});

test('refuses files that are not backups', () => {
  assert.throws(() => C.parseBackup('not json'), /not valid JSON/);
  assert.throws(() => C.parseBackup(JSON.stringify({ app: 'other', knives: [] })), /not an Edge Notes backup/);
  assert.throws(() => C.parseBackup(JSON.stringify({ app: 'edge-notes' })), /no knives/);
});

test('sanitises a backup, dropping impossible entries', () => {
  const parsed = C.parseBackup(JSON.stringify({
    app: 'edge-notes', exportedAt: '2026-10-01T00:00:00.000Z',
    knives: [{ id: 'k1', name: ' Chef ', notes: 'n', sessions: [
      { id: 's1', date: '2026-10-01', angle: '17,5', rating: 4, burr: true },
      { id: 's2', date: '2026-10-02', angle: '99' },
      { id: 's3', date: 'nope', angle: 17 }
    ] }],
    photos: { p1: 'data:image/jpeg;base64,abc', p2: 'http://example.com/x.jpg' }
  }));
  assert.strictEqual(parsed.knives.length, 1);
  assert.strictEqual(parsed.knives[0].name, 'Chef');
  assert.strictEqual(parsed.knives[0].sessions.length, 1);
  assert.strictEqual(parsed.knives[0].sessions[0].angle, 17.5);
  assert.deepStrictEqual(Object.keys(parsed.photos), ['p1']);
});

test('merges a backup without duplicating, twice is a no-op', () => {
  const local = { version: 1, knives: [knife('k1', 'Chef', [session('s1', '2026-10-01', 17)])] };
  const incoming = {
    knives: [
      knife('k1', 'Chef', [session('s1', '2026-10-01', 17), session('s2', '2026-09-01', 15)]),
      knife('k2', 'Paring', [session('s3', '2026-08-01', 20)])
    ],
    photos: { p1: 'data:image/jpeg;base64,a', p2: 'data:image/jpeg;base64,b' }
  };
  const first = C.mergeBackup(local, incoming, ['p1']);
  assert.deepStrictEqual(first.added, { knives: 1, sessions: 2, photos: 1 });
  assert.deepStrictEqual(first.already, { knives: 1, sessions: 1, photos: 1 });
  assert.deepStrictEqual(Object.keys(first.photos), ['p2']);
  assert.strictEqual(first.data.knives.length, 2);

  const second = C.mergeBackup(first.data, incoming, ['p1', 'p2']);
  assert.deepStrictEqual(second.added, { knives: 0, sessions: 0, photos: 0 });
  assert.deepStrictEqual(second.already, { knives: 2, sessions: 3, photos: 2 });
  assert.strictEqual(second.data.knives.length, 2);
});

test('builds a backup with the expected envelope', () => {
  const out = C.buildBackup({ knives: [knife('k', 'K', [])] }, { p: 'data:image/png;base64,x' }, '2026-10-21T00:00:00.000Z');
  assert.strictEqual(out.app, 'edge-notes');
  assert.strictEqual(out.version, 1);
  assert.strictEqual(out.exportedAt, '2026-10-21T00:00:00.000Z');
  assert.strictEqual(out.knives.length, 1);
  assert.ok(out.photos.p);
});

test('writes the range of a knife history', () => {
  assert.strictEqual(C.rangeText(17.5, 21), 'Past range 17.5°–21° per side');
  assert.strictEqual(C.rangeText(21, 21), 'Past range 21° per side');
  assert.strictEqual(C.rangeText(null, null), '');
});
