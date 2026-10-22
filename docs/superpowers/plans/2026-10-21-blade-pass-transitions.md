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

- 2026-10-21: A `drop-shadow` on a clipped **normal** element paints outside the clip (probe: `.toolchains/rim-probe.html`, left panel glowing, right panel hard). That result does not transfer to a view-transition snapshot: see the next entry.
- 2026-10-21 (Task 1, prototype): **the filter rim does not work.** On `::view-transition-new(root)`, `filter: invert(1)` visibly applies, but a drop-shadow is clipped by the same pseudo's `clip-path` (filter runs first, then the clip). It also costs real frames: with the filter, 215 frames / 4.65 s (worst 50.1 ms, p95 33.4 ms, 16 frames over 33 ms); without it, 264 frames / 4.4 s (worst 16.8 ms) — a locked 60 fps on the same headless software raster. The rim is therefore a dedicated named element moved by its own group (Task 5), never a filter on the root snapshot.
- 2026-10-21 (Task 1, prototype): a 400 ms cut whose end vertices are 140%/126% leaves the viewport after ~110 ms; the remaining 290 ms is off-screen travel. Ending at 116%/102% keeps the edge visible for ~250 ms and still clears at the end. Task 4 uses the corrected keyframes.
- 2026-10-21 (Task 1, prototype): the written carry timings (old 120 ms, new 180 ms delayed 120 ms) empty the readout at ~120 ms while the cut is still on screen, and the cut's ease-out covers ~70% of the group's travel in the first 100 ms, so the number darts and vanishes. Task 6 uses an ease-in-out group over the full 400 ms, fades the old over 260 ms, and fades the new in over 140 ms at 260 ms: the number stays readable through the cut and the hero lands as the old fades.
- 2026-10-21 (Task 1, prototype): the back pass needs the **mirrored** geometry. The blade stripe's bottom is 14% left of its top, so moving left the *bottom* leads. Back therefore starts at top 114% / bottom 100% and ends at top -2% / bottom -16%. Starting at 100/114 put the line up to 14% inside the revealed page.
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
- Produces: a recorded verdict on the carried number, the rim's construction (a named blade, not a filter), the corrected cut and carry numbers, and the worst frame delta. Tasks 4–6 consume them.

- [x] **Step 1: Build the prototype**

Two full-screen views swapped by a tap that wraps the swap in `document.startViewTransition`. View A: a dark list with a 28 px brass `17.5°` and a row to tap. View B: a dark detail page with the same number at 44 px. Working shape, as measured below:

```css
::view-transition-new(root) { animation: blade-cut-in 400ms cubic-bezier(.22, 1, .36, 1) both; }
:root[data-pass="out"]::view-transition-new(root) { animation-name: blade-cut-out; }
@keyframes blade-cut-in {
  from { clip-path: polygon(-40% 0%, 0% 0%, -14% 100%, -40% 100%); }
  to   { clip-path: polygon(-40% 0%, 116% 0%, 102% 100%, -40% 100%); }
}
@keyframes blade-cut-out {
  from { clip-path: polygon(114% 0%, 140% 0%, 140% 100%, 100% 100%); }
  to   { clip-path: polygon(-2% 0%, 140% 0%, 140% 100%, -16% 100%); }
}
.blade { position: fixed; inset: 0; pointer-events: none; opacity: 0; view-transition-name: blade; }
:root[data-pass] .blade { opacity: 1; }
.blade i { position: absolute; top: 0; left: 0; width: 2px; height: 100%;
  background: #E8EDF0; transform-origin: 0 0; transform: skewX(-3.7deg);
  box-shadow: 0 0 2px #fff, 0 0 12px rgba(232, 237, 240, .5); }
::view-transition-group(blade) { animation: none; }
:root[data-pass="in"]::view-transition-group(blade) { animation: blade-in 400ms cubic-bezier(.22, 1, .36, 1) both; }
:root[data-pass="out"]::view-transition-group(blade) { animation: blade-out 400ms cubic-bezier(.22, 1, .36, 1) both; }
@keyframes blade-in { from { transform: translateX(0); } to { transform: translateX(116%); } }
@keyframes blade-out { from { transform: translateX(114%); } to { transform: translateX(-2%); } }
::view-transition-group(probe-angle) {
  animation-duration: 400ms; animation-timing-function: cubic-bezier(.4, 0, .2, 1);
}
::view-transition-old(probe-angle) { animation-duration: 260ms; }
::view-transition-new(probe-angle) { animation-duration: 140ms; animation-delay: 260ms; }
```

The first prototype used a root-qualified pseudo with a space — `:root[data-pass="out"] ::view-transition-new(root)` — which silently matches nothing; the back pass ran the forward cut because of it. Qualify the pseudo directly.

- [x] **Step 2: Serve and open it**

Run: `python -m http.server 8765 -d .toolchains` (8765 was free; 4323 was never needed).
Open: `http://127.0.0.1:8765/blade-pass.html`. The app's preview panel could not draw because its window is covered, so frames were captured with `.toolchains/shoot.mjs`, a throwaway CDP script that pauses the transition at an exact millisecond and screenshots it. The live page still exposes `?slow`, `?carry=plan`, `?carry=delay` and `?carry=none`.

- [x] **Step 3: Inspect the rim**

Result: the drop-shadow on the snapshot never paints — `filter: invert(1)` on the same pseudo visibly applies, so filters run, but the pseudo's `clip-path` clips the filtered result. Replaced with the named `.blade` above: a 2 px skewed steel bar with its own group, painted above both snapshots, its shadow unclipped. Verified on the boundary in both directions (forward at 100 and 250 ms, back at 120 and 220 ms): the line's translate equals the cut's percentage to the pixel (365.544 px at 88.7243% of 412).

- [x] **Step 4: Inspect the carried number**

Result: the morph is a crossfade inside a resizing group, not a real scale. The written timings (old 120 ms, new 180 ms at 120 ms) leave the readout empty at ~120 ms while the cut is still on screen; the cut's ease-out also spends the first 100 ms covering ~70% of the travel. The working version above uses an ease-in-out group over the full 400 ms, fades the old to 260 ms and fades the new in at 260 ms for 140 ms: the number stays readable through the cut, then the hero lands. Back carries the hero into its row with the same timings.

- [x] **Step 5: Measure frames**

Result: headless Chromium, 412×892, software raster, ten passes, `requestAnimationFrame` deltas under 200 ms: median 16.7 ms, p95 16.8 ms, worst **16.8 ms**, 0 frames over 33.4 ms. With the abandoned root filter on the same run: worst 50.1 ms, p95 33.4 ms, 16 frames over 33.4 ms. This is the desktop browser, not the emulator; Task 5 owns that number.

- [x] **Step 6: Record and stop**

Verdicts are in the Decision Log. No commit; `.toolchains/` is ignored.
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
  :root[data-pass="out"]::view-transition-new(root) {
    animation-name: blade-cut-out;
  }
}
@keyframes blade-cut-in {
  from { clip-path: polygon(-40% 0%, 0% 0%, -14% 100%, -40% 100%); }
  to   { clip-path: polygon(-40% 0%, 116% 0%, 102% 100%, -40% 100%); }
}
@keyframes blade-cut-out {
  from { clip-path: polygon(114% 0%, 140% 0%, 140% 100%, 100% 100%); }
  to   { clip-path: polygon(-2% 0%, 140% 0%, 140% 100%, -16% 100%); }
}
```

The leading edge must be on screen for the whole 400 ms. `in` starts with its top at 0% (just revealed) and its bottom at -14% (still hidden); it ends with the bottom at 102%, the last vertex to clear. `out` is mirrored because the blade bar's bottom is 14% left of its top: moving left, the bottom leads, so `out` starts at top 114% / bottom 100% and ends at -2% / -16%. The old 140%/126% end left the viewport at ~110 ms.

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
- Modify: `web/index.html`
- Modify: `web/style.css`

**Interfaces:**
- Consumes: `data-pass` from Task 3 and the cut geometry from Task 4.
- Produces: the final edge treatment; no later task changes it.

- [ ] **Step 1: Add one blade, outside every view**

In `web/index.html`, after `#app` and before the scripts:

```html
<div class="blade" aria-hidden="true"><i></i></div>
```

It lives outside the views so it exists in every state; it is named permanently, so it is captured into its own group and painted above the root snapshots rather than inside them.

- [ ] **Step 2: Style it and move it with the cut**

```css
.blade {
  position: fixed; inset: 0; pointer-events: none; opacity: 0;
  view-transition-name: blade;
}
:root[data-pass] .blade { opacity: 1; }
.blade i {
  position: absolute; top: 0; left: 0; width: 2px; height: 100%;
  background: #E8EDF0; transform-origin: 0 0; transform: skewX(-3.7deg);
  box-shadow: 0 0 2px #fff, 0 0 12px rgba(232, 237, 240, .5);
}
::view-transition-group(blade) { animation: none; }
:root[data-pass="in"]::view-transition-group(blade) {
  animation: blade-in 400ms cubic-bezier(.22, 1, .36, 1) both;
}
:root[data-pass="out"]::view-transition-group(blade) {
  animation: blade-out 400ms cubic-bezier(.22, 1, .36, 1) both;
}
@keyframes blade-in { from { transform: translateX(0); } to { transform: translateX(116%); } }
@keyframes blade-out { from { transform: translateX(114%); } to { transform: translateX(-2%); } }
```

The bar's `translateX` values are the cut's **top-edge** percentages: 0→116 for `in`, 114→-2 for `out`. The skew puts its bottom 14% of the viewport width to the left, matching the cut. If the two drift, the line sits inside the revealed page; verify at 100 ms and 250 ms.

- [ ] **Step 3: Inspect the edge**

Slow the animation to 4 s and screenshot mid-pass, both directions and at both edges.
Expected: a 2 px steel line with a soft falloff exactly on the boundary; no brass; no line left at the screen edge after the pass; nothing visible at rest.

- [ ] **Step 4: Measure on the emulator**

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

Expected: worst delta ≤ 50 ms on the software-rendered emulator. The blade is transform-only, so if frames fall, drop the 12 px box-shadow first and keep the 2 px bar; a hard 1–2 px line with no glow still reads as steel. Remove the probe before committing.

- [ ] **Step 5: Commit**

```bash
git add web/index.html web/style.css
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
  animation-timing-function: cubic-bezier(.4, 0, .2, 1);
}
::view-transition-old(knife-angle) { animation-duration: 260ms; }
::view-transition-new(knife-angle) { animation-duration: 140ms; animation-delay: 260ms; }
```

The group must not use the cut's ease-out: it would spend ~70% of the travel in the first 100 ms and the number would be gone before the eye follows it. Ease-in-out spreads the morph over the full 400 ms; the old fades at 260 ms and the new lands in the readout at the same moment.

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
- Delete: `.toolchains/blade-pass.html`, `.toolchains/rim-probe.html`, `.toolchains/shoot.mjs`, `.toolchains/shots/`

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
rm -r .toolchains/blade-pass.html .toolchains/rim-probe.html .toolchains/shoot.mjs .toolchains/shots
git add docs/design-brief.md
git commit -m "Record the blade pass in the motion brief."
```

---
