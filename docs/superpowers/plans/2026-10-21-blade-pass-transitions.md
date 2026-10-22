# Blade-Pass Transitions Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Every route change cuts the incoming screen in behind a honed, slanted edge, carries the knife's angle between its library row and the hero readout, and starts the gauge ceremony exactly when the cut finishes.

**Architecture:** The router keeps its hash-based structure but splits building a view from painting it. Route changes paint inside `document.startViewTransition`, which snapshots the old and new pages; CSS animates the new snapshot's `clip-path` into a blade cut and the tapped angle into a shared-element group. Reduced motion and old WebViews paint immediately with today's fade, and the ceremony is triggered from a single arrival hook in both paths.

**Tech Stack:** Vanilla JavaScript (no framework, no bundler), CSS View Transitions (Chromium 111+; emulator WebView is 133), Capacitor 8 Android, `node:test` for the pure route model.

**Spec:** [docs/design-brief.md](../../design-brief.md) §7 Motion, with the brand commitments in [PRODUCT.md](../../../PRODUCT.md): brass is reserved for angles and the one primary action, voice stays plain, no sound.

## Global Constraints

- No new npm dependencies. The transition uses the platform API and CSS only.
- Cut duration 400 ms, easing `cubic-bezier(.22, 1, .36, 1)`. Never block input.
- The rim is steel (`#E8EDF0` as `rgba`), never brass `#D8A34A`.
- The slant between the top and bottom of the cut is 14% of viewport width.
- `prefers-reduced-motion: reduce` and browsers without `document.startViewTransition` paint immediately; the existing 170 ms `.screen.enter` fade remains the only fallback motion.
- Passes fire only for `wasRouteChange` renders. Menus, dialogs, search filtering, photo hydration and toasts paint synchronously as they do today.
- 48 dp touch targets, focus restoration and scroll-to-top behavior are unchanged.
- Local device builds use `-PbuildNumber=10`; the published build number belongs to CI.
- Every command runs from the EdgeNotes project root, `C:\Users\joshr\Projects\EdgeNotes`. The session's worktree root is a different repository and is not used.

## Review Focus

1. **Rapid navigation** — tapping a second row, or Back, while a pass is running must land on the last requested route with no stuck snapshot, no stale `data-pass`, and no permanent `view-transition-name`.
2. **Back from the log sheet** — `backFromSheet` can fall back to `replaceRoute` when history has no entry; exactly one pass runs, in the `out` direction.
3. **A scrolled library** — opening a knife from far down a 20-knife list must not flash the top of the old list during the cut; the snapshot has to preserve scroll and sticky bars.
4. **A knife with no history** — there is no angle to carry; no name may be left on the page that would ghost into the next transition.
5. **Reduced motion / no View Transitions** — immediate paint, ceremony still plays, no `data-pass` or `data-vt-angle` residue, no double fade.

## Decision Log

- 2026-10-21: A `drop-shadow` on a clipped element paints outside the clip (probe: `.toolchains/rim-probe.html`, left panel glowing, right panel hard). The rim can therefore be a filter on the snapshot; no extra top-layer element is needed. Re-confirm in Task 1 on the real snapshot.
- 2026-10-21: Direction comes from route depth, not from which function navigated: deeper is `in`, shallower is `out`, equal is `in`.

## File Structure

| File | Responsibility |
|---|---|
| `web/js/route.js` (new) | Pure route depth and pass direction; no DOM. |
| `tests/route.test.js` (new) | `node:test` coverage for the route model. |
| `web/index.html` | Loads `route.js` before `app.js`. |
| `web/js/app.js` | Build/paint split, pass lifecycle, arrival hook, carry names. |
| `web/style.css` | Cut keyframes, rim, carry group, reduced-motion guards. |
| `docs/design-brief.md` | Records the pass in §7 Motion. |
| `.toolchains/blade-pass.html` (throwaway) | Task 1 prototype; gitignored, deleted in Task 7. |

---

### Task 1: Prove the cut and choose its edge

**Files:**
- Create: `.toolchains/blade-pass.html` (throwaway, gitignored)

**Interfaces:**
- Produces: a recorded verdict on the carried number over the cut, the rim's shadow values, and the worst frame delta. Task 6 consumes the verdict; Task 5 consumes the rim values.

- [ ] **Step 1: Build the prototype**

Two full-screen views swapped by a button that sets `location.hash` and wraps the swap in `document.startViewTransition`. View A: a dark list with a 28 px brass `17.5°` and a row to tap. View B: a dark detail page with the same number at 44 px. Include the slanted clip on `::view-transition-new(root)`, the rim below, and `view-transition-name: probe-angle` on both numbers.

```css
::view-transition-new(root) {
  animation: cut 400ms cubic-bezier(.22, 1, .36, 1) both;
  filter: drop-shadow(0 0 1.5px rgba(232, 237, 240, .9))
          drop-shadow(0 0 12px rgba(232, 237, 240, .22));
}
@keyframes cut {
  from { clip-path: polygon(-40% 0%, -26% 0%, -40% 100%, -40% 100%); }
  to   { clip-path: polygon(-40% 0%, 140% 0%, 126% 100%, -40% 100%); }
}
```

- [ ] **Step 2: Serve and open it**

Run: `python -m http.server 4323 -d .toolchains`
Open: `http://127.0.0.1:4323/blade-pass.html`

- [ ] **Step 3: Inspect the rim**

Add a temporary override `::view-transition-new(root) { animation-duration: 4s !important; }`, trigger a pass, screenshot around 2 s.
Expected: a 1–2 px steel line on the slanted boundary with a soft falloff, no wash over the outgoing page. If the line is invisible or clipped, record that and keep the bare cut.

- [ ] **Step 4: Inspect the carried number**

Trigger the pass and watch the 28 px number become the 44 px one.
Expected: one number, readable throughout, no ghost left after the snapshot clears. If it floats detached over the outgoing page for most of the cut, record "delay" and test `::view-transition-group(probe-angle) { animation-delay: 180ms; }`.

- [ ] **Step 5: Measure frames**

In the console, run this once, then trigger a pass:

```js
const gaps = []; let last = performance.now();
(function tick(now) { gaps.push(now - last); last = now;
  if (gaps.length < 90) requestAnimationFrame(tick);
  else console.log('worst frame', Math.max(...gaps).toFixed(1), 'ms'); })(last);
```

Expected: worst ≤ 34 ms on the desktop browser. Record the number; the emulator is measured in Task 5.

- [ ] **Step 6: Record and stop**

Append the verdicts to the Decision Log in this file (rim on/off, carry as-is or delayed, worst frame). No commit; `.toolchains/` is ignored.
**Gate:** show the prototype and stop for the owner's approval of the look before Task 2.

---

### Task 2: Route depth model (TDD)

**Files:**
- Create: `web/js/route.js`
- Create: `tests/route.test.js`
- Modify: `web/index.html` (add `<script src="js/route.js"></script>` before `js/app.js`)
- Test: `tests/route.test.js`

**Interfaces:**
- Produces: `Route.depth(path: string): number` and `Route.direction(fromPath: string, toPath: string): 'in' | 'out'`. Task 3 consumes both.

- [ ] **Step 1: Write the failing tests**

```js
'use strict';
const test = require('node:test');
const assert = require('node:assert');
const R = require('../web/js/route.js');

test('measures how deep a route sits', () => {
  assert.strictEqual(R.depth('/'), 0);
  assert.strictEqual(R.depth('/nope'), 0);
  assert.strictEqual(R.depth('/new'), 1);
  assert.strictEqual(R.depth('/knife/k1'), 1);
  assert.strictEqual(R.depth('/knife/k1/edit'), 2);
  assert.strictEqual(R.depth('/knife/k1/log'), 2);
  assert.strictEqual(R.depth('/knife/k1/log/s1'), 2);
  assert.strictEqual(R.depth('/knife/k1/photo'), 2);
});

test('cuts in when going deeper and out when coming back', () => {
  assert.strictEqual(R.direction('/', '/knife/k1'), 'in');
  assert.strictEqual(R.direction('/knife/k1', '/knife/k1/log'), 'in');
  assert.strictEqual(R.direction('/knife/k1/log', '/knife/k1'), 'out');
  assert.strictEqual(R.direction('/knife/k1', '/'), 'out');
  assert.strictEqual(R.direction('/knife/k1', '/new'), 'in');
  assert.strictEqual(R.direction('/', '/'), 'in');
});
```

- [ ] **Step 2: Run them and watch them fail**

Run: `node --test tests/route.test.js`
Expected: FAIL, `Cannot find module '../web/js/route.js'`.

- [ ] **Step 3: Implement the model**

```js
'use strict';
const Route = (() => {
  const DEPTHS = [
    [/^\/$/, 0],
    [/^\/new$/, 1],
    [/^\/knife\/[A-Za-z0-9-]+$/, 1],
    [/^\/knife\/[A-Za-z0-9-]+\/edit$/, 2],
    [/^\/knife\/[A-Za-z0-9-]+\/log$/, 2],
    [/^\/knife\/[A-Za-z0-9-]+\/log\/[A-Za-z0-9-]+$/, 2],
    [/^\/knife\/[A-Za-z0-9-]+\/photo$/, 2]
  ];
  function depth(path) {
    for (const [re, d] of DEPTHS) if (re.test(String(path || ''))) return d;
    return 0;
  }
  function direction(fromPath, toPath) {
    return depth(toPath) >= depth(fromPath) ? 'in' : 'out';
  }
  return { depth, direction };
})();
if (typeof module !== 'undefined') module.exports = Route;
```

- [ ] **Step 4: Run the tests and the suite**

Run: `node --test tests/route.test.js && npm test`
Expected: 2 new tests pass, 16 total pass, 0 fail.

- [ ] **Step 5: Commit**

```bash
git add web/js/route.js tests/route.test.js web/index.html
git commit -m "Model route depth so the pass knows its direction."
```

---

### Task 3: Paint inside a view transition

**Files:**
- Modify: `web/js/app.js`

**Interfaces:**
- Consumes: `Route.direction`.
- Produces: `supportsPass(): boolean`, `paint(view, route, wasRouteChange, enter: boolean)`, and an optional `view.afterArrival()` hook that every later task uses. `state.passPending: boolean` is true only while a view is built for an animated arrival; `state.passing: boolean` is true while a transition runs. Add both to the `state` object with `null`/`false` defaults.

- [ ] **Step 1: Split building from painting**

Move the current tail of `render()` — `app.innerHTML`, title, `view.after()`, `hydratePhotos`, `renderDialog`, `state.currentPath`, `scrollTo` — into `paint(view, route, wasRouteChange, enter)`. `render()` builds the view, then calls `paint`.

Verification: the whole navigation matrix still works and no console error appears: library → knife, knife → log, log → Back, knife → photo, photo → Back, menu, delete dialog, search, and the bottom action bars.

- [ ] **Step 2: Add the pass wrapper**

```js
function supportsPass() {
  return typeof document.startViewTransition === 'function' &&
    !window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}
```

In `render()`, after `wasRouteChange` is known:

```js
const pass = wasRouteChange && supportsPass() && !state.passing;
const fromPath = state.currentPath || '/';
state.passPending = pass;
const view = buildView(route);   // knifeView/logView read passPending here
state.passPending = false;
```

Then:

```js
function arrive() {
  if (view.afterArrival) view.afterArrival();
}

if (!pass) {
  paint(view, route, wasRouteChange, wasRouteChange);
  arrive();
} else {
  state.passing = true;
  document.documentElement.dataset.pass = Route.direction(fromPath, route.path);
  const transition = document.startViewTransition(function () {
    paint(view, route, wasRouteChange, false);
  });
  transition.finished.then(function () {
    state.passing = false;
    delete document.documentElement.dataset.pass;
    arrive();
  }, function () {
    state.passing = false;
    delete document.documentElement.dataset.pass;
    arrive();
  });
}
```

`paint`'s fourth argument controls the `.screen enter` class; a pass never adds it, so the fade cannot double up. When `!pass`, `render` keeps today's behavior.

- [ ] **Step 3: Stage the gauge and the stamp**

`scaleSvg` stops emitting `has-*`: it emits `data-gauge="reading|first|travel"` on the `<svg>`, keeps the punch circle, and keeps the `--travel` style when the kind is `travel`. History rows emit `data-stamped` instead of `is-stamped`.

`knifeView` returns `afterArrival`:

```js
afterArrival: function () {
  const scale = document.querySelector('.scale[data-gauge]');
  if (scale) scale.classList.add('has-' + scale.dataset.gauge);
  const stamped = document.querySelector('[data-stamped]');
  if (stamped) stamped.classList.add('is-stamped');
  if (strike) setTimeout(function () { Native.haptic('land'); }, 500);
}
```

Remove the haptic timeout from `view.after()`. With no pass, `afterArrival` runs in the same frame as the paint, so the ceremony looks and times exactly as it does today.

- [ ] **Step 4: Verify the fallback**

In the console: `document.startViewTransition = undefined`. Navigate library → knife → Back.
Expected: no pass animation, the 170 ms fade still runs, `document.documentElement.dataset.pass` stays undefined, and the gauge still draws.

- [ ] **Step 5: Verify the guard and the sheet fallback**

Click a library row and immediately press Back, twice.
Expected: the final hash is the last requested route; within a second `dataset.pass` is gone, `state.passing` is false (check by navigating again, which must animate), and no `[data-vt-angle]` attributes remain.

Then open a knife's log sheet directly by pasting `#/knife/<id>/log` into a fresh tab and press Back.
Expected: `backFromSheet`'s fallback lands on the knife page in one `out` pass, never on the library.

- [ ] **Step 6: Run checks and commit**

Run: `node --check web/js/app.js && npm test`
Expected: clean, 16 passing.

```bash
git add web/js/app.js
git commit -m "Paint route changes inside a view transition."
```

---

### Task 4: The cut

**Files:**
- Modify: `web/style.css`

**Interfaces:**
- Consumes: `data-pass="in" | "out"` set by Task 3.
- Produces: `blade-cut-in` / `blade-cut-out` animations used by every later pass.

- [ ] **Step 1: Add the cut**

```css
@media (prefers-reduced-motion: no-preference) {
  ::view-transition-old(root) { animation: none; }
  ::view-transition-new(root) {
    animation: blade-cut-in 400ms cubic-bezier(.22, 1, .36, 1) both;
  }
  :root[data-pass="out"] ::view-transition-new(root) {
    animation-name: blade-cut-out;
  }
}
@keyframes blade-cut-in {
  from { clip-path: polygon(-40% 0%, -26% 0%, -40% 100%, -40% 100%); }
  to   { clip-path: polygon(-40% 0%, 140% 0%, 126% 100%, -40% 100%); }
}
@keyframes blade-cut-out {
  from { clip-path: polygon(140% 0%, 140% 0%, 140% 100%, 140% 100%); }
  to   { clip-path: polygon(-26% 0%, 140% 0%, 140% 100%, -40% 100%); }
}
```

- [ ] **Step 2: Look at both directions, slowly**

Set a temporary `::view-transition-new(root) { animation-duration: 4s !important; }`. Open a knife (`in`) and press Back (`out`), screenshotting mid-pass.
Expected: the slanted edge enters from the leading corner, travels 14% of the width between top and bottom, and the new page is fully revealed at 400 ms. The old page never moves.

- [ ] **Step 3: Check the scrolled library**

Scroll the library to its last rows, open a knife, screenshot mid-pass.
Expected: the uncovered part of the old page shows the same rows and the stuck app bar, not the top of the list.

- [ ] **Step 4: Check the staging**

Save a sharpening from the log sheet.
Expected: no gauge animation is visible during the cut; the pip travel and the stamped rule begin the moment the cut ends.

- [ ] **Step 5: Commit**

```bash
git add web/style.css
git commit -m "Cut the next screen in on a honed edge."
```

---

### Task 5: The rim

**Files:**
- Modify: `web/style.css`

**Interfaces:**
- Consumes: the rim verdict and values from Task 1.
- Produces: the final edge treatment; no later task changes it.

- [ ] **Step 1: Add the rim**

```css
@media (prefers-reduced-motion: no-preference) {
  ::view-transition-new(root) {
    filter: drop-shadow(0 0 1.5px rgba(232, 237, 240, .9))
            drop-shadow(0 0 12px rgba(232, 237, 240, .22));
  }
}
```

If Task 1 found the rim clipped or too heavy, apply the values it recorded instead and keep the same two-shadow shape.

- [ ] **Step 2: Inspect the edge**

Slow the animation to 4 s and screenshot mid-pass.
Expected: a thin bright line along the cut with a soft falloff; no halo over the old page beyond ~12 px; no brass.

- [ ] **Step 3: Measure on the emulator**

Add a temporary probe that records `requestAnimationFrame` deltas between `transition.ready` and `transition.finished` and paints the worst value in a fixed corner element when `location.search.indexOf('probe') !== -1`. Build, install and sample ten passes:

```bash
npx cap sync android
export JAVA_HOME="$PWD/.toolchains/jdk/jdk-21.0.12.1+1"
export ANDROID_HOME="$PWD/.toolchains/sdk"
export ANDROID_SDK_ROOT="$ANDROID_HOME"
export GRADLE_USER_HOME="$PWD/.toolchains/gradle-home"
(cd android && ./gradlew assembleRelease -PbuildNumber=10)
.toolchains/sdk/platform-tools/adb.exe install -r android/app/build/outputs/apk/release/app-release.apk
.toolchains/sdk/platform-tools/adb.exe shell am start -n com.joshrpr.edgenotes/.MainActivity
```

Expected: worst delta ≤ 50 ms on the software-rendered emulator; if it is worse, keep the 1.5 px shadow and drop the 12 px one. Remove the probe before committing.

- [ ] **Step 4: Commit**

```bash
git add web/style.css
git commit -m "Light the cut along its edge."
```

---

### Task 6: Carry the angle

**Files:**
- Modify: `web/js/app.js`
- Modify: `web/style.css`

**Interfaces:**
- Consumes: `state.passPending`, `state.read`, `state.currentPath`.
- Produces: `prepareCarry(fromPath, toPath)` and `clearCarry()`. Names are `knife-angle` and every named node carries `data-vt-angle` for cleanup.

- [ ] **Step 1: Name the outgoing angle**

```js
function prepareCarry(fromPath, toPath) {
  if (!state.passPending) return;
  const leavingKnife = /^\/knife\/([A-Za-z0-9-]+)$/.exec(fromPath);
  if (toPath === '/' && leavingKnife) {
    const hero = app.querySelector('.card .angle');
    if (hero) nameCarry(hero);
    return;
  }
  if (state.read && state.read.id) {
    const row = app.querySelector('a.row[data-knife="' + state.read.id + '"] .row-angle b');
    if (row) nameCarry(row);
  }
}

function nameCarry(el) {
  el.style.viewTransitionName = 'knife-angle';
  el.setAttribute('data-vt-angle', '');
}

function clearCarry() {
  for (const el of app.querySelectorAll('[data-vt-angle]')) {
    el.style.viewTransitionName = '';
    el.removeAttribute('data-vt-angle');
  }
}
```

`rowHtml` gains `data-knife="<id>"` on the anchor. Insert `prepareCarry(fromPath, route.path);` in `render` between the `buildView` call and `state.passPending = false;`, while the old DOM is still mounted and the flag is true. Call `clearCarry()` in both `finished` handlers after `arrive()`.

- [ ] **Step 2: Name the incoming angle**

`knifeView` passes `state.passPending && reading` as a fourth `carry` argument to `latestCard(knife, latest, gauge, carry)`; when true, the `.angle` span gets `style="view-transition-name:knife-angle" data-vt-angle`. `rowHtml` gains an optional `carryId`; when `knife.id === carryId`, its `<b>` gets the same attributes. `listRegion()` computes `carryId` as the id in `state.currentPath` when `state.passPending` is true and that path matches `/knife/<id>`.

- [ ] **Step 3: Style the group**

```css
::view-transition-group(knife-angle) {
  animation-duration: 400ms;
  animation-timing-function: cubic-bezier(.22, 1, .36, 1);
}
::view-transition-old(knife-angle) { animation-duration: 200ms; }
::view-transition-new(knife-angle) { animation-duration: 200ms; animation-delay: 120ms; }
```

If Task 1 recorded "delay", add that delay to the group rule instead.

- [ ] **Step 4: Verify both directions**

Open a knife from the library, then press Back. Expected: one number travels and resizes each way, no duplicate number, and after each pass no `[data-vt-angle]` remains.

- [ ] **Step 5: Verify the no-history knife and the leak**

Open the knife with no sharpening, then navigate to the log sheet.
Expected: no carry (nothing to carry), and no named ghost of any angle during the second transition.

- [ ] **Step 6: Verify reduced motion**

Force `document.startViewTransition = undefined` and repeat. Expected: no carry names are added, no residue, the pages simply swap.

- [ ] **Step 7: Commit**

```bash
git add web/js/app.js web/style.css
git commit -m "Carry the angle between the library and its knife."
```

---

### Task 7: Verify, document, clean up

**Files:**
- Modify: `docs/design-brief.md`
- Delete: `.toolchains/blade-pass.html`, `.toolchains/rim-probe.html`

- [ ] **Step 1: Record the motion in the brief**

In §7, replace the 150–200 ms fade-through sentence with the pass and replace the two-moment paragraph with the blade cut, keeping the whole section under ten lines: 400 ms, the 14% slant, the steel rim, the carried angle, and that reduced motion cuts instantly. The 120 ms press scale and the snackbar remain.

- [ ] **Step 2: Run every check**

```bash
node --check web/js/app.js
npm test
```

Expected: 16 passing, no syntax error.

```bash
"C:/Users/joshr/.config/freebuff-desktop/account-skills/a72e059e6073a861b5d552c03f6595856a7a7b141075dc0a8ac2f517b093adc0/7a4b67c20c88fdedf064e489b15e5cfa07ac365d5a97a989dd764bd2a720cbba/impeccable/scripts/impeccable.cmd" detect --json web/js/app.js web/js/route.js web/style.css
```

Expected: only the `overused-font` finding for Roboto, which the brief pins.

- [ ] **Step 3: Walk the device**

```bash
ADB=.toolchains/sdk/platform-tools/adb.exe
$ADB shell settings put system font_scale 1.3
$ADB shell settings put global animator_duration_scale 0   # Android's Reduce Motion; prefers-reduced-motion must report reduce
```

Navigate library → knife → log → save → Back, then restore:

```bash
$ADB shell settings put system font_scale 1.0
$ADB shell settings put global animator_duration_scale 1
```

Expected: no clipping at 1.3, no pass under Reduce Motion, the ceremony still runs, no `Capacitor/Console` errors in logcat.

- [ ] **Step 4: Delete the throwaway files and commit**

```bash
rm .toolchains/blade-pass.html .toolchains/rim-probe.html
git add docs/design-brief.md
git commit -m "Record the blade pass in the motion brief."
```

---
