# Photo-Led Knife Page Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Bring the approved photo-led knife page into the existing Edge Notes app: a photographic current-edge block, a quieter history with a session detail sheet, and a brass Log Sharpening plate, without changing stored records or the log flow.

**Architecture:** The existing hash router and string views stay. `lastSection` becomes a photo-led current-edge block; the history gains a derived header and row affordances; the session sheet is a new `state.dialog` variant in the existing modal layer, so the knife hero and system Back keep working. One new pure formatter goes in `core.js` and is tested with `node:test`; the view and CSS are checked in the browser and on Android.

**Tech Stack:** Vanilla HTML/CSS/JS in `web/`, no framework or build step; `node:test`; Capacitor 8 Android WebView; existing `npm test` and `npm run sync`.

**Spec:** [docs/design-brief.md](../../design-brief.md), with the approved visual reference [prototypes/overdrive/photo.html](../../../prototypes/overdrive/photo.html) and the product commitments in [PRODUCT.md](../../../PRODUCT.md). The 2026-10-22 refinement overrides the brief's vermilion seal and steel certificate: the knife page is photo-led and red-free.

## Global Constraints

- **Every command runs from the Edge Notes app root, `C:\Users\joshr\Projects\EdgeNotes`.** The Freebuff session worktree is a different repository and is not used.
- **No data model change.** Keep `localStorage` `edge-notes-v1`, IndexedDB `edge-notes-photos`, and the existing session shape. A session's "type" is its existing `rating`; do not add fields, routes, storage or npm dependencies.
- **The log form and its save/edit/delete path are untouched.** Keep one-tap repeat, the photo viewer, backup/restore, Undo and the blade pass.
- **Design tokens only.** Use the existing `--ground #090D10`, `--surface #121A1E`, `--line #243138`, `--line-hi #35464E`, `--text #E9EFF2`, `--muted #9BA9B0`, `--quiet #7E8D94`, `--brass #D8A34A`, `--brass-hi #F2C776`, `--steel #C9D5DB`, `--radius 2px`. No new colours. Retire vermilion; brass remains for angles and the one primary action.
- **Exact copy:** "Current edge", "Sharpening History", "Past range 17.5°–21° per side", "No note recorded for this session.", "Log Sharpening", "Edit sharpening", "Log first sharpening", "Not sharpened yet". No exclamation marks, no praise.
- **Accessibility:** 48 px minimum touch targets; visible focus; the sheet closes with its X, the scrim, Escape and Android Back; focus returns to the row that opened it; `prefers-reduced-motion` removes the sheet and plate animations.
- **The current working tree contains the uncommitted Honyaki reskin and the untracked prototype.** Commit or stash it before Task 1; each task commit must contain only that task's diff. If it is already committed, ignore this.
- **The prototype is reference only.** Do not ship `prototypes/` or its `art/`; a knife shows its own photo or the house knife. No sample records are added to empty installs.
- **Verification:** `npm test` after each pure task; browser checks at 390 px; the final Android check with `npm run sync` and `./gradlew assembleDebug`. Do not add a test harness.

## Review Focus

1. **A stored photo is missing or unreadable** (orphaned `photoId`, revoked blob): the hero and the viewer show the house knife, with no broken image.
2. **A long note and 20 sessions**: the sheet body scrolls; the fixed CTA never covers the last row; closing the sheet leaves the page where it was.
3. **Two sharpenings on the same date**: the sheet identifies the right session by id; rows distinguish them by angle and rating; no stamp or "selected" row appears.
4. **A knife with no history**: the photo or house knife still leads; the block reads "Not sharpened yet"; the CTA reads "Log first sharpening"; no empty "Sharpening History" heading appears.
5. **Back, 320 px and Android font scale 1.3**: Back closes the sheet before leaving the knife; the close and CTA stay reachable; there is no horizontal overflow.

## File Structure

| File | Responsibility |
|---|---|
| `web/js/core.js` | `rangeText(min, max)` for the history range. |
| `tests/core.test.js` | `node:test` coverage for the range copy. |
| `web/js/app.js` | Current-edge view, photo hero, history head/rows, session sheet, plate CTA, app-bar simplification, seal removal. |
| `web/style.css` | Photo hero, current edge, history, sheet, plate, knife app bar; remove seal/chop/stamp styles. |
| `docs/design-brief.md` | Record the photo-led knife page and retired seal. |
| `DESIGN.md` | Update the implementation reference and token roles. |
| `prototypes/overdrive/photo.html` | Approved visual reference; do not edit. |

---

### Task 1: History range copy

**Files:**
- Modify: `web/js/core.js` (angle helpers, around line 36; export around line 250)
- Test: `tests/core.test.js`

**Interfaces:**
- Consumes: `fmtNum(n)`, `fmtAngle(perSide)` in `core.js`.
- Produces: `Core.rangeText(min: number|null, max: number|null): string`.

- [ ] **Step 1: Write the failing test**

Append to `tests/core.test.js`:

```js
test('writes the range of a knife history', () => {
  assert.strictEqual(C.rangeText(17.5, 21), 'Past range 17.5°–21° per side');
  assert.strictEqual(C.rangeText(21, 21), 'Past range 21° per side');
  assert.strictEqual(C.rangeText(null, null), '');
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `node --test tests/core.test.js`
Expected: FAIL with `C.rangeText is not a function`.

- [ ] **Step 3: Implement `rangeText` in `web/js/core.js`**

Add beside the angle formatters and include it in the returned object:

```js
function rangeText(min, max) {
  if (min === null || min === undefined || max === null || max === undefined) return '';
  if (min === max) return 'Past range ' + fmtAngle(min) + ' per side';
  return 'Past range ' + fmtNum(min) + '°–' + fmtAngle(max) + ' per side';
}
```

- [ ] **Step 4: Run the tests to verify they pass**

Run: `npm test`
Expected: all tests pass, including the new range test.

- [ ] **Step 5: Commit**

```bash
git add web/js/core.js tests/core.test.js
git commit -m "feat: describe a knife's sharpening range"
```

---

### Task 2: Photo-led current edge

**Files:**
- Modify: `web/js/app.js` (`lastSection` around line 664; `knifeView` around line 689; `hydratePhotos` around line 205; `afterArrival` around line 759)
- Modify: `web/style.css` (`.last` around line 593; `.avatar` around line 535)

**Interfaces:**
- Consumes: `photoSlot(id, cls)`, `wedgeSvg(perSide, opts)`, `Core.fmtNum`, `Core.fmtIncluded`, `Core.relativeDate`, `Core.fmtDate`, `Core.RATINGS`, `esc`, `upperFirst`, `GLYPH`.
- Produces: `lastSection(knife, latest, gauge, carry)` returns the current-edge section; `knifeView` calls it with the knife first. The section keeps the `last` class so the gauge arrival hook still finds `.last .wedge`.

- [ ] **Step 1: Run the failing visual check**

Serve the app from the app root:

```bash
python -m http.server 4321 -d web
```

Open `http://127.0.0.1:4321/`, add a knife named "Gallery Knife" with a photo from the gallery (the prototype image is a fine stand-in), then add three sessions: 17.5° on 21 Oct rated Working edge, 19° on 21 Oct, and 21° on 22 Oct with the note `Finished on a 3k stone, stropped once on leather.`. Run this in the console:

```js
({
  label: document.querySelector('.last .label')?.textContent,
  hasPhoto: !!document.querySelector('.last .edge-photo img'),
  hasSeal: !!document.querySelector('.last .seal'),
  avatar: !!document.querySelector('.appbar .avatar')
})
```

Expected before the change: `label: "Last sharpened"`, `hasPhoto: false`, `hasSeal: true`, `avatar: true`.

- [ ] **Step 2: Implement the photo hero and current-edge structure**

In `app.js`:

- Add `function edgePhoto(knife)` that returns `<a class="edge-photo" href="#/knife/<id>/photo" aria-label="Open photo of <name>">` when `knife.photoId` exists, otherwise `<div class="edge-photo is-empty">`, wrapping `photoSlot(knife.photoId, 'edge-photo-frame')`. Do not build a viewer link for a missing photo.
- Change `lastSection` to `lastSection(knife, latest, gauge, carry)` and start the section with `<span class="label">Current edge</span>`, then `edgePhoto(knife)`, then the existing angle/gauge block.
- In the no-history branch keep the photo and the label, and keep the existing "Not sharpened yet. Log the first angle and it will live here." copy.
- In the dated branch render `<p class="last-when"><b>Last sharpened</b> &middot; <relative>, <full date></p>`, then the rating/flags line and the note. Keep the note only when `latest.notes` is present.
- Remove `seal()` from the knife section and the `has-glint` line in `afterArrival`; the steel certificate is gone.
- In `knifeView`, remove the `avatar-link`/`photoSlot(knife.photoId, 'avatar')` from the app bar, keep back / title / overflow, and give the header `class="masthead knife-head"`.
- In `hydratePhotos`, attach a one-shot `error` listener to the generated `<img>`; on error restore `node.innerHTML = GLYPH` and remove `data-photo` so the frame falls back to the house knife.

- [ ] **Step 3: Style the current edge**

In `style.css`:

- `.knife-head { background: var(--ground); border-bottom: 1px solid var(--line); box-shadow: none; }` with a 54 px app bar.
- Add `--edge: max(16px, calc((100vw - 640px) / 2))` to `:root` beside `--inset-top`, so the current edge and the history share one gutter. `.last` uses `padding: 12px var(--edge) 18px`, no steel background, no bottom border, no shadow; remove `.last::before` and `.last::after`.
- `.edge-photo` is a 120 px full-bleed block with `margin: 8px calc(-1 * var(--edge)) 0`, `overflow: hidden`, and the top/bottom mask from the reference. `.edge-photo-frame` fills it; `img` uses `width: 100%; height: 100%; object-fit: cover; display: block`. The fallback glyph is centred at about 120 × 75 px, not a grey box.
- Raise the hero degree: `.last .angle .deg { font-size: .31em; vertical-align: 1.62em; margin-left: -.28em; letter-spacing: 0; }`.
- Remove the rule above the note (`.last .note::before { display: none; }`) and cap the note at `max-width: 36ch`.
- Remove the `.last` entry from the wide-screen media rule; `:root`'s `--edge` now handles its column. Delete the now-unused `.avatar`/`.avatar-link` rules (the library and form keep their own photo styles).

- [ ] **Step 4: Re-run the visual check**

The same console expression, run after the photo hydrates, must return `label: "Current edge"`, `hasPhoto: true`, `hasSeal: false`, `avatar: false`. Check a knife without a photo shows the house knife in the hero, not an `<img>`, and that tapping a photo hero opens the existing full-screen viewer.

- [ ] **Step 5: Run the tests**

Run: `npm test`
Expected: all tests pass.

- [ ] **Step 6: Commit**

```bash
git add web/js/app.js web/style.css
git commit -m "feat: lead the knife page with the current edge photo"
```

---

### Task 3: History header and session rows

**Files:**
- Modify: `web/js/app.js` (`knifeView` history block, around line 689)
- Modify: `web/style.css` (`.summary` around line 663; `.history` and `.session` around line 664; `.chop` around line 692)

**Interfaces:**
- Consumes: `Core.rangeText`, `Core.stats`, `Core.fmtDate`, `Core.fmtNum`, `Core.RATINGS`, `plural`, `ICON_CHEV` (new).
- Produces: a `historyHead(info)` string and row markup with a `.chev` affordance. Rows keep the existing `data-act="edit-session"` until Task 4 switches them to the sheet, so the history stays editable after this task.

- [ ] **Step 1: Run the failing visual check**

With the three-session knife open, run:

```js
({
  summary: document.querySelector('.summary')?.textContent,
  head: document.querySelector('.history-head h2')?.textContent,
  count: document.querySelector('.history-count')?.textContent,
  range: document.querySelector('.history-range')?.textContent,
  chops: document.querySelectorAll('.chop').length,
  chevrons: document.querySelectorAll('.session .chev').length
})
```

Expected before: a single `.summary` line, no `.history-head`, `chops: 0` unless a save just happened, no chevrons.

- [ ] **Step 2: Implement the history header**

- Add `ICON_CHEV` in the icon family as a full `<svg class="chev" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false"><path d="M9 5l7 7-7 7"/></svg>`; the app has no icon sprite.
- Remove the `summary` variable and its `<p class="summary">`.
- Add `historyHead(info)` returning the heading "Sharpening History", the count from `plural(info.count, 'session', 'sessions')`, and `Core.rangeText(info.min, info.max)`.
- Render `historyHead(info)` only when `sessions.length` is non-zero; then the existing `.history` list.

- [ ] **Step 3: Simplify the rows**

- Remove the chop markup, the `stamped` variable, `data-stamped` and the `is-stamped` handling in `afterArrival`; a save no longer presses a stamp or draws a brass rule under the newest row.
- Keep the date and optional rating in `.date`; render the angle as `Core.fmtNum(session.angle)` plus `<span class="deg">°</span>`.
- Insert that `ICON_CHEV` constant as the third item. Do not use a sprite `<use>`, and do not add a new asset.
- Keep the existing `data-act="edit-session"` and `data-session` on the button.

- [ ] **Step 4: Style the history**

- `.history-head`: flex, baseline-aligned, `border-top: 1px solid var(--line-hi)`, top margin 24 px, padding-top 16 px; `h2` in Shippori 16 px/600; `.history-count` 10 px/600 tracked caps in `--muted`.
- `.history-range`: 12 px `--quiet`, 4 px below the head.
- `.history` uses `padding: 0 var(--edge)`; `.history-head` and `.history-range` use the same `--edge` margins. Remove `.history` (and the dead `.summary`) from the wide-screen max-width selector so all three align on the same 640 px column at every width.
- `.session` becomes a three-column grid (`1fr auto 16px`); `.chev` is 16 px, stroke `--quiet`, no fill. The row keeps its 62 px minimum and focus ring.
- Add `.session .s-angle .deg { font-size: .55em; vertical-align: .4em; margin-left: .02em; letter-spacing: 0; }` so the row degree is raised and smaller than the number.
- Remove `.session.is-stamped`, `.chop`, `@keyframes chop-press` and the stamp wash/rule keyframes.

- [ ] **Step 5: Re-run the visual check**

Expected after: `summary` undefined, `head: "Sharpening History"`, `count: "3 sessions"`, `range: "Past range 17.5°–21° per side"`, `chops: 0`, `chevrons: 3`. Clicking a row still opens the existing edit form until Task 4.

- [ ] **Step 6: Run the tests**

Run: `npm test`
Expected: all tests pass.

- [ ] **Step 7: Commit**

```bash
git add web/js/app.js web/style.css
git commit -m "feat: restate the knife history with count and range"
```

---

### Task 4: Session detail sheet

**Files:**
- Modify: `web/js/app.js` (`openDialog` around line 574; `closeDialog` around line 577; `renderDialog` around line 587; `onClick` around line 1292; `knifeView` row markup)
- Modify: `web/style.css` (`.dialog-layer` around line 972)

**Interfaces:**
- Consumes: `findKnife(id)`, `findSession(knife, id)`, `state.dialog`, `state.dialogReturn`, `openDialog`, `closeDialog`, `renderDialog`, `Core.fmtDate`, `Core.fmtNum`, `Core.fmtIncluded`, `Core.RATINGS`, `ICON_CLOSE`.
- Produces:
  - `openDialog(dialog, trigger, returnSelector)` where `returnSelector` optionally names the element to focus on close.
  - A dialog object `{ type: 'session', knifeId, sessionId }` and its sheet in `renderDialog`.
  - The row action `data-act="open-session"` with `aria-haspopup="dialog"`; the sheet's "Edit sharpening" button keeps `data-act="edit-session"`.

- [ ] **Step 1: Run the failing visual check**

Click the 19° row on the knife page and run:

```js
({
  sheet: !!document.querySelector('.sheet'),
  heroAngle: document.querySelector('.last .angle .num')?.textContent,
  focused: document.activeElement?.getAttribute('aria-label')
})
```

Expected before: no `.sheet`; the existing edit form appears; the hero is no longer visible.

- [ ] **Step 2: Extend the dialog helpers**

- `openDialog(dialog, trigger, returnSelector)` stores `state.dialogReturn = returnSelector || (trigger ? '[data-act="' + trigger + '"]' : null)`.
- `closeDialog()` reads that selector, clears `state.dialog` and `state.dialogReturn`, renders, then focuses `document.querySelector(selector)` and falls back to the menu/search as today.
- In `renderDialog`, set `app.inert = !!d` after rendering (and `false` when closing) so the page behind the sheet cannot receive focus.

- [ ] **Step 3: Render the sheet**

Add a `d.type === 'session'` branch to `renderDialog`, and toggle `dialogEl.classList.toggle('is-sheet', d.type === 'session')` before setting its HTML (clear the class for every other dialog and when closing):

```html
<div class="sheet" role="dialog" aria-modal="true" aria-labelledby="session-title">
  <div class="sheet-grip" aria-hidden="true"></div>
  <div class="sheet-top">
    <span class="label">Sharpening session</span>
    <button class="icon-btn sheet-close" type="button" data-act="cancel-dialog" aria-label="Close session details">[ICON_CLOSE]</button>
  </div>
  <div class="sheet-body">
    <h2 class="sheet-date" id="session-title">21 Oct 2026</h2>
    <div class="sheet-angle"><span class="sheet-num">19<span class="sheet-deg">°</span></span><span class="sheet-per">per side</span></div>
    <div class="sheet-meta"><span>38° included</span><span class="sheet-rating">Working edge</span></div>
    <div class="sheet-flags">Burr raised / Stropped chips when recorded</div>
    <p class="sheet-note">Note text, or the empty copy with class is-empty</p>
    <div class="sheet-actions"><button class="btn" type="button" data-act="edit-session" data-session="s-...">Edit sharpening</button></div>
  </div>
</div>
```

Resolve the knife and session with `findKnife(d.knifeId)` / `findSession(knife, d.sessionId)`; if either is gone, clear the dialog and close. The rating is `Core.RATINGS[session.rating]` (this is the session “type”); omit the rating element when null. Show `Core.fmtIncluded(session.angle) + ' included'`. Show flags only when true. Use `session.notes || 'No note recorded for this session.'` and toggle `.is-empty`. Do not invent a note, rating or flag.

- [ ] **Step 4: Open and close it**

- In `onClick`, add `case 'open-session'` that calls `openDialog({ type: 'session', knifeId, sessionId }, null, '[data-act="open-session"][data-session="' + sessionId + '"]')`.
- Change the history row to `data-act="open-session"` and add `aria-haspopup="dialog"`.
- Keep `edit-session` as it is: it navigates to `#/knife/<id>/log/<sessionId>`; the route change already clears `state.dialog`.
- The existing `cancel-dialog` case, scrim click (`event.target === dialogEl`), Escape handler and Android Back callback all close `state.dialog`; no new close path is needed.

- [ ] **Step 5: Style the sheet**

- `.dialog-layer.is-sheet { align-items: flex-end; padding: 0; background: rgba(4, 7, 9, .64); backdrop-filter: blur(2px); }`.
- `.sheet` is full-width, max-height 78vh/78dvh, flex column, `background: linear-gradient(180deg, var(--surface), var(--ground))`, top border `--line-hi`, `border-radius: var(--radius) var(--radius) 0 0`, and a 240 ms `translateY(24px)` entrance.
- `.sheet-grip` 36 × 3 px in `--line-hi`; `.sheet-top` label + 48 px close; `.sheet-body` scrolls and pads `calc(20px + var(--inset-bottom))` at the bottom.
- `.sheet-date` Shippori 22 px/600; `.sheet-num` 48 px brass; `.sheet-deg` `.32em` raised; `.sheet-per` 10 px tracked caps `--quiet`; `.sheet-meta` 11.5 px with a hairline top and bottom, `.sheet-rating` in `--text`; the burr/stropped chips reuse the existing `.flag`; `.sheet-note` 14.5 px/1.6, `.is-empty` in `--quiet`; `.sheet-actions` holds a full-width steel `Edit sharpening` button with a 16 px top margin (`.sheet-actions .btn { width: 100%; }`).
- Under `prefers-reduced-motion: reduce`, remove the sheet animation.

- [ ] **Step 6: Re-run the visual check**

Click the 19° row. Expected: `.sheet` exists, the hero's `.last .angle .num` still reads `21`, the date is `21 Oct 2026`, the angle is `19`, included `38°`, the note is "No note recorded for this session.", and the close has focus. Close with X, scrim and Escape; focus returns to the 19° row. Open the 17.5° row and confirm "Working edge" appears. Tap "Edit sharpening" and confirm the existing form is prefilled with that 17.5° session. Android Back is checked on the device in Task 8.

- [ ] **Step 7: Run the tests**

Run: `npm test`
Expected: all tests pass.

- [ ] **Step 8: Commit**

```bash
git add web/js/app.js web/style.css
git commit -m "feat: show a sharpening session without leaving the knife"
```

---

### Task 5: Log Sharpening plate

**Files:**
- Modify: `web/js/app.js` (`knifeView` action bar around line 735; add the plate sheen in `knifeView.after` or the arrival hook)
- Modify: `web/style.css` (`.btn` around line 442; `.actionbar` around line 518)

**Interfaces:**
- Consumes: the existing `#/knife/<id>/log?angle=<angle>` route and `logView` prefill; `Core.fmtNum`.
- Produces: the `.plate` CTA with `.plate-label`, `.plate-rule`, `.plate-angle`, `.plate-deg`; the no-history label "Log first sharpening" with no angle; a one-shot `is-sweeping` sheen on pointerdown.

- [ ] **Step 1: Run the failing visual check**

Read the current CTA:

```js
({
  text: document.querySelector('.actionbar .btn')?.textContent,
  href: document.querySelector('.actionbar .btn')?.getAttribute('href'),
  plate: !!document.querySelector('.actionbar .plate')
})
```

Expected before: text `Sharpen again · 21°`, the log href, no plate.

- [ ] **Step 2: Implement the plate markup**

Replace the action-bar anchor’s contents with the label and, when a latest session exists, the rule and the angle:

```html
<a class="btn primary plate" href="#/knife/<id>/log?angle=21"
   aria-label="Log sharpening at 21 degrees per side">
  <span class="plate-label">Log Sharpening</span>
  <span class="plate-rule" aria-hidden="true"></span>
  <span class="plate-angle">21<span class="plate-deg">°</span></span>
</a>
```

For a knife with no history, render `Log first sharpening` with no rule or angle, keeping the existing no-query href. Keep the existing query so the log form prefills the previous angle.

- [ ] **Step 3: Style the plate**

- `.btn.plate`: a brass gradient built from `--brass` and `--brass-hi` (no new colours), dark ink label, 52 px height, Shippori for the label/angle.
- `.plate-label` 16 px/600; `.plate-rule` 1 × 17 px dark rule with a light right edge; `.plate-angle` 19 px/600; `.plate-deg` 11 px raised `.42em`.
- Add the one-shot `::after` light sweep and `@keyframes plate-sweep` (440–480 ms, `cubic-bezier(.2, .7, .3, 1)`); disable it under reduced motion. In the view’s `after` hook, on `pointerdown` remove `is-sweeping`, force `offsetWidth`, then add it; remove it on `animationend`.
- Keep the existing `.actionbar` safe-area padding and fixed position.

- [ ] **Step 4: Re-run the visual check**

Expected: `text` contains `Log Sharpening` and `21°`, `plate: true`, the href still carries `angle=21`. Tapping it opens the log form with 21 prefilled; saving creates a new session and returns to the knife page. A knife with no history shows `Log first sharpening` and no angle.

- [ ] **Step 5: Run the tests**

Run: `npm test`
Expected: all tests pass.

- [ ] **Step 6: Commit**

```bash
git add web/js/app.js web/style.css
git commit -m "feat: make the log action a brass plate"
```

---

### Task 6: Retire the vermilion record marks

**Files:**
- Modify: `web/js/app.js` (`seal()` helper around line 92; `benchHtml` around line 499; remove remaining stamp references)
- Modify: `web/style.css` (`--seal` around line 42; `.brand-mark.vermilion` around line 125; `.seal` around line 128; `.chop` around line 692; stamp keyframes)

**Interfaces:**
- Consumes: the seal/chop/stamp markup left by Tasks 2 and 3, and the library bench’s `seal('sm')`.
- Produces: no UI use of vermilion, no `.seal`/`.chop`/`is-stamped` markup or CSS, no `--seal` token. The library bench label "Last on the bench" stays; the saved gauge and toast remain.

- [ ] **Step 1: Run the failing visual check**

On the library and knife page:

```js
({
  seals: document.querySelectorAll('.seal').length,
  chops: document.querySelectorAll('.chop').length,
  sealToken: getComputedStyle(document.documentElement).getPropertyValue('--seal').trim()
})
```

Expected before: a library bench seal and a seal token; a chop only after a save. After: `seals: 0`, `chops: 0`, `sealToken: ""`.

- [ ] **Step 2: Remove the marks**

- Delete the `seal(cls)` helper and its call in `benchHtml`.
- Remove the `.seal`, `.seal.sm`, `.brand-mark.vermilion`, `.chop`, `.session.is-stamped*` rules and the `chop-press`, `stamp-wash`, `stamp-draw`, `stamp-settle` keyframes from `style.css`.
- Delete the `--seal` token and any `--seal` reference.
- Remove the unused `.avatar`/`.avatar-link` rules if Task 2 left any, and remove the `summary` selector from the wide-screen media rule.
- Run `grep -nE "seal|chop|is-stamped|summary" web/js/app.js web/style.css` and remove only the remaining dead references; the word "sharpening" must not be touched.

- [ ] **Step 3: Re-run the visual check**

Expected: `seals: 0`, `chops: 0`, `sealToken: ""`; the library bench still reads "Last on the bench"; saving a sharpening still draws the gauge and shows the toast; no vermilion record mark remains. The functional `--error` colour stays for destructive actions and errors.

- [ ] **Step 4: Run the tests**

Run: `npm test`
Expected: all tests pass.

- [ ] **Step 5: Commit**

```bash
git add web/js/app.js web/style.css
git commit -m "refactor: retire the vermilion record marks"
```

---

### Task 7: Record the refinement

**Files:**
- Modify: `DESIGN.md` (Material, Colour roles, Components, Motion, Copy)
- Modify: `docs/design-brief.md` (Palette, Knife, States, Motion, Open craft items)

**Interfaces:**
- Consumes: the implemented markup and CSS from Tasks 2–6.
- Produces: one design record that matches the app; no code.

- [ ] **Step 1: Update DESIGN.md**

- Replace the "one vermilion chop for a record" framing with the photo-led current edge and no red marks. Note that vermilion was retired on 2026-10-22.
- Remove `--seal` from the colour table and the sentence "Vermilion is a record"; state that brass is the only accent, for angles and the primary action.
- In Components: the knife app bar has no thumbnail; the current edge is a photo (or house knife), label, 66 px angle with the raised degree, gauge, date, rating/flags and note; history has "Sharpening History", count, past range and chevron rows; the session sheet is a read-only detail with an Edit action; the Log Sharpening plate is the primary action.
- In Motion: remove the chop and stamp rule; keep the gauge, the page pass and the sheet entrance; note reduced motion.
- In Guardrails: no decorative red or vermilion; the functional `--error` stays for destructive actions and errors; the photo is the user’s, the house knife is the fallback.

- [ ] **Step 2: Update the design brief**

- In §3 Palette, mark vermilion retired with the date and keep the brass role.
- In §4 Knife, replace the steel certificate description with the current-edge photo block, the history head/range, the sheet rows and the "Log Sharpening" plate; keep the no-history, no-photo and long-content states.
- In §6 States, make the session sheet’s "No note recorded for this session." explicit and keep the house-knife fallback.
- In §7 Motion, remove the chop/stamp and steel glint, add the 240 ms sheet entrance, and keep the gauge and reduced motion.
- Leave §9’s open craft items in place; Task 8 reports which checks were actually run. Do not claim a device check that did not happen.

- [ ] **Step 3: Verify the docs**

Run: `grep -nE "seal|chop|vermilion" DESIGN.md docs/design-brief.md`
Expected: only the retirement note remains; no instruction to add a seal or chop.

- [ ] **Step 4: Commit**

```bash
git add DESIGN.md docs/design-brief.md
git commit -m "docs: record the photo-led knife page"
```

---

### Task 8: End-to-end verification

**Files:**
- Verify only; no code changes unless a check fails.

- [ ] **Step 1: Run the full test suite**

Run: `npm test`
Expected: all tests pass.

- [ ] **Step 2: Check the complete flow in the browser**

From the app root, serve `python -m http.server 4321 -d web` and verify at 390 px:

1. Empty library → add the first knife → the hero shows the house knife, "Not sharpened yet", "Log first sharpening".
2. Add 17.5°, 19° and 21° sessions (two on the same date) with one long note (2,000 characters) → the history count, range and three rows are correct; no chop or stamp.
3. Open each row → the right date, angle, included angle, rating/flags and note; the empty note state; the hero angle never changes; close returns focus to the row.
4. Edit the 17.5° session → the form is prefilled; save → the history updates and the toast appears.
5. Log Sharpening → the form is prefilled with 21° → save → a new session is created and the knife page returns.
6. Photo: add a photo, open the viewer from the hero, remove the photo, and reload with an orphaned `photoId` → the house knife appears, no broken image.
7. Reduced motion, keyboard Tab/Shift-Tab, and Escape with the sheet open.
8. Widths 320, 390 and 640 px; browser text zoom 130%; no horizontal overflow, the close and CTA stay reachable.

- [ ] **Step 3: Check the Android build**

Run: `npm run sync`
Then: `cd android && ./gradlew assembleDebug`
Expected: `BUILD SUCCESSFUL`; `android/app/build/outputs/apk/debug/app-debug.apk` exists.

If a device or emulator is available, install the debug APK and repeat the sheet, Android Back, photo and safe-area checks on the device; if not, report the device checks as not run.

- [ ] **Step 4: Report and commit any fixes**

If a check required a code change, add it to the owning task’s files and commit with a `fix:` prefix. Do not leave uncommitted changes in the app root.
