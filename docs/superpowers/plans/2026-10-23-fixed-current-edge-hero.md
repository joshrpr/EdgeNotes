# Fixed Current-Edge Hero Implementation Plan

**Status:** Ready to implement. The hero image is the still the user already supplied; no regeneration is required.

**Project root:** `C:\Users\joshr\Projects\Edgenotes2` (migrated 2026-10-23). The old `C:\Users\joshr\Projects\EdgeNotes` folder is backup-only.

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make the knife page's current-edge hero the same fixed house photograph on every knife. The owner's stored photo remains a library thumbnail, an add/edit form preview, and the full-screen viewer, but it never controls the hero.

**Architecture:** No data model change. Remove `photoSlot(knife.photoId, ...)` from `lastSection` and render a fixed `.edge-photo` band whose image is the bundled `web/assets/current-edge.jpg`. Add a conditional "View photo" item to the existing overflow menu so the stored photo stays reachable through the existing `/knife/:id/photo` route. Correct the design record and add a superseded banner to the old plan so the `photoId` hero cannot be reintroduced.

**Tech Stack:** Vanilla HTML/CSS/JS in `web/`, no framework or build step; `node:test`; Capacitor 8 Android WebView; existing `npm test`, `npm run sync` and Gradle.

**Approved visual:** [prototypes/overdrive/photo.html](../../../prototypes/overdrive/photo.html) and [prototypes/overdrive/shots/photo-refined.png](../../../prototypes/overdrive/shots/photo-refined.png). The shipped still is [prototypes/overdrive/art/knife-hero.jpg](../../../prototypes/overdrive/art/knife-hero.jpg), the 1600×475 crop of the Gemini still the user supplied. The retry note in [prototypes/overdrive/art-prompt.md](../../../prototypes/overdrive/art-prompt.md) is optional future art direction, not a blocker.

## Global Constraints

- **Every command runs from the Edge Notes app root, `C:\Users\joshr\Projects\Edgenotes2`.** This is the migrated project. The old `C:\Users\joshr\Projects\EdgeNotes` folder is backup-only and must not be edited.
- **No data model change.** Keep `localStorage` `edge-notes-v1`, IndexedDB `edge-notes-photos`, and the existing session shape. Do not add fields, routes, storage or npm dependencies.
- **The log form and its save/edit/delete path are untouched.** Keep one-tap repeat, undo, backup/restore and the blade pass.
- **No `photoId` in the hero.** The current-edge DOM must contain no `[data-photo]` and no stored-photo `<img>`.
- **`GLYPH` stays for thumbnails, the form preview and the viewer.** It must never appear in the current-edge band.
- **Design tokens only.** Use the existing `--ground`, `--surface`, `--line`, `--line-hi`, `--text`, `--muted`, `--quiet`, `--brass`, `--brass-hi`, `--steel` and `--radius`. No new colours.
- **The prototype is reference only.** Copy the one still into `web/assets/`; do not ship `prototypes/` or its `art/` directory.
- **No new test harness.** `node:test` covers pure modules only; the view is verified in the browser and on Android.
- **Commit each task's own diff. Do not push.** Leave the branch for review.

## Review Focus

1. **A photo knife, a knife with no photo, a knife after Remove photo, and a knife with an orphaned `photoId`** all show the same `assets/current-edge.jpg` hero, with no blob URL and no glyph.
2. **The owner's photo is still reachable** from the overflow menu when `photoId` exists; the menu hides "View photo" when it does not. The existing viewer and its Back/Escape handling still work.
3. **320, 390 and 640 px, Android font scale 1.3 and reduced motion:** the hero crop stays legible, the page does not overflow horizontally, and the mask still fades into the ground.
4. **The library thumbnail and add/edit form** still show the owner's photo, and still fall back to the glyph when it is missing.
5. **The Android bundle contains the asset** after `npm run sync`, and the hero loads from `assets/current-edge.jpg` inside the WebView.

## File Structure

| File | Responsibility |
|---|---|
| `web/assets/current-edge.jpg` | The fixed 1600×475 house hero. |
| `web/js/app.js` | Fixed `currentEdge()`; remove `edgePhoto()`; add `View photo` menu item and its click case. |
| `web/style.css` | Fixed background image on `.edge-photo`; remove the unused `.edge-photo-frame` rules. |
| `docs/design-brief.md` | Record the fixed house hero and the owner's photo's real homes. |
| `DESIGN.md` | Update the current-edge description and guardrail. |
| `docs/superpowers/plans/2026-10-22-photo-knife-page.md` | Superseded banner pointing at this plan. |
| `prototypes/overdrive/art-prompt.md` | Record the shipped asset and mark the retry as optional. |

---

### Task 1: Add the fixed hero asset

**Files:**
- Add: `web/assets/current-edge.jpg`

**Interfaces:**
- Produces: the static file `assets/current-edge.jpg`, resolved relative to `web/style.css`.

- [ ] **Step 1: Confirm the source is the approved crop**

Run:

```bash
powershell.exe -NoProfile -Command "Add-Type -AssemblyName System.Drawing; \$i=[System.Drawing.Image]::FromFile((Resolve-Path 'prototypes/overdrive/art/knife-hero.jpg')); try { '{0}x{1} {2} bytes' -f \$i.Width,\$i.Height,(Get-Item 'prototypes/overdrive/art/knife-hero.jpg').Length } finally { \$i.Dispose() }"
```

Expected: `1600x475` and roughly 60 KB. This is the same crop used by `photo-refined.png`; use it as-is. Do not re-crop, re-encode, or regenerate it.

- [ ] **Step 2: Copy it into the web bundle**

Run:

```bash
mkdir -p web/assets
cp prototypes/overdrive/art/knife-hero.jpg web/assets/current-edge.jpg
```

- [ ] **Step 3: Verify the copy**

Run:

```bash
powershell.exe -NoProfile -Command "Add-Type -AssemblyName System.Drawing; \$i=[System.Drawing.Image]::FromFile((Resolve-Path 'web/assets/current-edge.jpg')); try { '{0}x{1} {2} bytes' -f \$i.Width,\$i.Height,(Get-Item 'web/assets/current-edge.jpg').Length } finally { \$i.Dispose() }"
```

Expected: `1600x475`, roughly 60 KB.

- [ ] **Step 4: Commit the asset alone**

```bash
git add web/assets/current-edge.jpg
git commit -m "feat: add the house knife hero photograph"
```

---

### Task 2: Make the current edge fixed

**Files:**
- Modify: `web/js/app.js` (`edgePhoto` around line 704; `lastSection` around line 711)
- Modify: `web/style.css` (`.edge-photo` around line 591; `.edge-photo-frame` around line 601)

**Interfaces:**
- Consumes: nothing; the house hero is not tied to a knife.
- Produces: `currentEdge(): string` and a `.edge-photo` block whose background is `assets/current-edge.jpg`. `photoSlot(id, cls)` stays unchanged for the library, bench and form.

- [ ] **Step 1: Run the failing browser check**

Serve the app from the app root:

```bash
python -m http.server 4321 -d web
```

Open `http://127.0.0.1:4321/`, add a knife with a photo, open its page, and run:

```js
({
  bg: getComputedStyle(document.querySelector('.edge-photo')).backgroundImage,
  stored: !!document.querySelector('.edge-photo [data-photo], .edge-photo img'),
  html: document.querySelector('.edge-photo').outerHTML.slice(0, 160)
})
```

Expected before the change: `bg: "none"`, `stored: true`, and the HTML starts with `<a class="edge-photo" ... data-photo=...>`.

- [ ] **Step 2: Replace `edgePhoto` with `currentEdge` in `app.js`**

Delete the whole `edgePhoto(knife)` function and add:

```js
  // The house photograph, not the owner's stored photo. Every knife shows this
  // same band; the stored photo lives in the library thumbnail and the viewer.
  function currentEdge() {
    return '<div class="edge-photo" role="img" aria-label="The house knife on a black surface"></div>';
  }
```

In `lastSection`, change:

```js
const head = '<div class="last-top"><span class="label">Current edge</span></div>' + edgePhoto(knife);
```

to:

```js
const head = '<div class="last-top"><span class="label">Current edge</span></div>' + currentEdge();
```

Leave `photoSlot()` in place: `rowHtml`, `benchHtml` and `knifeFormView` still use it.

- [ ] **Step 3: Put the photograph on the fixed band**

In `style.css`, change the `background` line in `.edge-photo` from:

```css
  background: var(--ground);
```

to:

```css
  background: var(--ground) url("assets/current-edge.jpg") center / cover no-repeat;
```

Keep the existing `height: 120px`, full-bleed margin, `overflow: hidden` and top/bottom mask.

Delete the now-unused `.edge-photo-frame` block:

```css
.edge-photo-frame { ... }
.edge-photo-frame img { ... }
.edge-photo-frame > svg { ... }
```

The hero is deliberately a CSS background rather than an `<img>`: it cannot be mistaken for a stored photo, `hydratePhotos()` cannot replace it, and a missing asset leaves the plain ground colour instead of a broken-image icon or the glyph.

- [ ] **Step 4: Check the narrow crop**

At 320 px, confirm the handle butt and the tip are still both visible. If `cover` cuts either end, add this only at the narrow breakpoint:

```css
@media (max-width: 360px) {
  .edge-photo { background-size: contain; }
}
```

Do not stretch the image, and do not change the 390/640 crop if 320 already holds.

- [ ] **Step 5: Re-run the browser check**

The same console expression must return:

```js
{
  bg: 'url("http://127.0.0.1:4321/assets/current-edge.jpg")',
  stored: false,
  html: '<div class="edge-photo" role="img" aria-label="The house knife on a black surface"></div>'
}
```

`bg` may include a full URL; it must contain `current-edge.jpg`. Repeat on a knife with no photo, a knife after Remove photo, and an orphaned `photoId`: the result must be identical. The `Current edge` label, angle, wedge, history and action bar must not move.

- [ ] **Step 6: Run the tests**

```bash
npm test
```

Expected: 17 passing, 0 failing.

- [ ] **Step 7: Commit**

```bash
git add web/js/app.js web/style.css
git commit -m "feat: fix the current edge to the house photograph"
```

---

### Task 3: Keep the owner's photo reachable

**Files:**
- Modify: `web/js/app.js` (`knifeMenu` around line 697; `onClick` around line 1369)

**Interfaces:**
- Consumes: `knife.photoId`, `go(hash)`, `currentKnifeId()`.
- Produces: a conditional `data-act="view-photo"` menu item that opens the existing `/knife/:id/photo` route.

- [ ] **Step 1: Confirm the current gap**

On a knife with a photo, open the overflow menu. Before this task it contains only "Edit knife" and "Delete knife"; the hero link was the only photo viewer entry, and Task 2 removed it.

- [ ] **Step 2: Add the conditional menu item**

Change `knifeMenu(knife)` to:

```js
  function knifeMenu(knife) {
    return '<div class="menu" role="menu">' +
      (knife.photoId ? '<button type="button" role="menuitem" data-act="view-photo">View photo</button>' : '') +
      '<button type="button" role="menuitem" data-act="edit-knife">Edit knife</button>' +
      '<button class="danger" type="button" role="menuitem" data-act="delete-knife">Delete knife</button>' +
      '</div>';
  }
```

- [ ] **Step 3: Handle the click**

In the `onClick` switch, add before `case 'edit-knife':`:

```js
      case 'view-photo':
        state.menu = false;
        go('#/knife/' + encodeURIComponent(knifeId) + '/photo');
        break;
```

The existing `knifeView(id, true)` viewer, its close button, Escape and Android Back already handle the route; do not add a second viewer.

- [ ] **Step 4: Verify the three menu states**

- Photo knife: menu shows "View photo"; clicking it opens `.viewer`; the X, Escape and Android Back return to the knife page.
- No-photo knife: menu has no "View photo"; Edit and Delete are unchanged.
- Orphaned `photoId`: menu shows "View photo"; the viewer opens and falls back to the glyph, because the existing `hydratePhotos` error handler removes the failed source.

The hero must stay `assets/current-edge.jpg` in all three states.

- [ ] **Step 5: Run the tests**

```bash
npm test
```

Expected: 17 passing, 0 failing.

- [ ] **Step 6: Commit**

```bash
git add web/js/app.js
git commit -m "feat: keep the stored photo reachable from the knife menu"
```

---

### Task 4: Correct the record

**Files:**
- Modify: `docs/design-brief.md` (status/date, §3, §4 Knife, §6)
- Modify: `DESIGN.md` (intro date, Current edge, Guardrails)
- Modify: `docs/superpowers/plans/2026-10-22-photo-knife-page.md` (superseded banner)
- Modify: `prototypes/overdrive/art-prompt.md` (shipped asset note)

- [ ] **Step 1: Update the design brief**

In `docs/design-brief.md`:

- Change the status line to `**Status:** implemented (v3.1, fixed house hero)` and the date to `**Date:** 2026-10-23`.
- In §3, replace `The knife's own photo leads the current edge.` with: `The house knife's photograph leads the current edge, the same on every knife; the owner's photo is a thumbnail and a full-screen viewer, never the hero.`
- In §4 Knife, change the app bar line to: `- App bar: back, the name in Mincho, overflow (View photo when a photo exists, Edit, Delete). No thumbnail; the house photograph belongs to the edge, not the chrome.`
- Replace the Current edge bullet with: `- **Current edge:** the same full-bleed 120 sp house photograph on every knife (masked at the top and bottom); the "Current edge" label; the angle at 66 sp in brass with a raised degree and "per side"; the wedge with "35° included"; and the relative and exact date. Rating, burr/stropped chips and the note follow on the same ground, the note capped at 36 ch.`
- In §6 No history, keep the photo: `- **No history:** the current edge still shows the house photograph and "Not sharpened yet. Log the first angle and it will live here."; the bar reads "Log first sharpening" with no angle.`
- Replace the No photo bullet with: `- **No photo:** the current edge still shows the house photograph; the library thumbnail and viewer fall back to the house knife, never a grey box.`

- [ ] **Step 2: Update the design system**

In `DESIGN.md`:

- Change `Built from the shipped interface on 2026-10-22` to `Built from the shipped interface on 2026-10-23`.
- Replace the Current edge bullet with: `- **Current edge:** the knife page's photo-led block. The same 120 px full-bleed house photograph on every knife (masked at the top and bottom); never the owner's stored photo. The "Current edge" label; 66 px angle with a raised .31em degree and 10 px "per side"; wedge at 94 × 82; the last-sharpened relative and exact date; rating, burr/stropped chips and the note capped at 36 ch. The app bar carries no thumbnail.`
- Replace the guardrail with: `- The current-edge photograph is the house image, identical on every knife; the owner's photo is a library thumbnail and a full-screen viewer. Never put the owner's stored photo in the hero, and never invent new knife photography.`

- [ ] **Step 3: Mark the old plan superseded**

At the top of `docs/superpowers/plans/2026-10-22-photo-knife-page.md`, immediately after the title, add:

```markdown
> **Superseded (2026-10-23):** The hero is now the fixed house photograph in [2026-10-23-fixed-current-edge-hero.md](2026-10-23-fixed-current-edge-hero.md), not `photoSlot(knife.photoId)`. The owner's photo stays a thumbnail and viewer. Do not reintroduce `photoId` into the hero.
```

Leave the rest of the old plan intact; it is a record of what was executed, not a live instruction.

- [ ] **Step 4: Record the shipped still**

Add this section to `prototypes/overdrive/art-prompt.md`, after the intro and before the first `---`:

```markdown
## Shipped asset

The fixed hero is `web/assets/current-edge.jpg`, copied from
`prototypes/overdrive/art/knife-hero.jpg` (1600×475). That still is the approved
house photograph. The retry note below is optional future art direction; it is
not a blocker for the hero.
```

In the Hand-off section, add one line: `The shipped asset is already web/assets/current-edge.jpg; a replacement still would replace that file, not the fixed-hero behavior.`

- [ ] **Step 5: Check for stale claims**

Run:

```bash
grep -nE "user's own|knife's own photo|own photo|photo leads|current-edge photo|current edge photo|photo or the house|house knife is the fallback" DESIGN.md docs/design-brief.md PRODUCT.md README.md
```

Expected: no hits that say the owner's photo leads the current edge. Hits about the library thumbnail or the form preview are fine.

- [ ] **Step 6: Commit**

```bash
git add docs/design-brief.md DESIGN.md docs/superpowers/plans/2026-10-22-photo-knife-page.md prototypes/overdrive/art-prompt.md
git commit -m "docs: record the fixed house hero"
```

---

### Task 5: Verify the shipped behavior

**Files:** none.

- [ ] **Step 1: Run the unit tests**

```bash
npm test
```

Expected: 17 passing, 0 failing. There is no new unit test; the DOM behavior is checked below.

- [ ] **Step 2: Check the four hero states in the browser**

Serve `web/` and create:

1. **Photo knife** — add a knife and choose a photo.
2. **Plain knife** — add a knife with no photo.
3. **Removed photo** — add a knife with a photo, then edit it and use Remove photo.
4. **Orphan** — in the console, append a knife whose `photoId` points at a missing blob and reload:

```js
const db = JSON.parse(localStorage.getItem('edge-notes-v1'));
db.knives.push({ id: 'orphan', name: 'Orphan', notes: '', photoId: 'p-missing', sessions: [] });
localStorage.setItem('edge-notes-v1', JSON.stringify(db));
location.hash = '#/knife/orphan';
location.reload();
```

For each knife, run:

```js
({
  bg: getComputedStyle(document.querySelector('.edge-photo')).backgroundImage,
  stored: !!document.querySelector('.edge-photo [data-photo], .edge-photo img'),
  label: document.querySelector('.last .label')?.textContent,
  overflow: getComputedStyle(document.documentElement).overflowX
})
```

Expected on all four: `bg` contains `assets/current-edge.jpg`, `stored: false`, `label: "Current edge"`, `overflow: "visible"` (or no horizontal scroll). The photo and orphan knives show "View photo" in the menu; the plain and removed-photo knives do not.

- [ ] **Step 3: Check the viewer and the unchanged photo surfaces**

- Open the photo knife's menu, choose "View photo", confirm the image fills the viewer, then close with X, Escape and Android Back.
- Confirm the library thumbnail still shows the chosen photo; the no-photo row still shows the glyph.
- Open Edit knife and confirm the photo preview still shows the chosen photo; Remove photo still falls back to the glyph.
- Confirm the log sheet, session sheet, history, plate and blade pass are unchanged.

- [ ] **Step 4: Check widths and text scale**

At 320, 390 and 640 px, and with Android font scale 1.3:

- The hero remains 120 px and full-bleed; the handle and tip are both visible or the 320 px `contain` rule is applied.
- No horizontal scrolling: `document.documentElement.scrollWidth <= window.innerWidth`.
- The angle, wedge, label and action bar keep their positions.
- With `prefers-reduced-motion: reduce`, the page still renders the fixed hero and the angle without the blade pass.

- [ ] **Step 5: Check the Android bundle**

```bash
npm run sync
ls -l android/app/src/main/assets/public/assets/current-edge.jpg
cd android && ./gradlew assembleDebug
```

Install `android/app/build/outputs/apk/debug/app-debug.apk` on the emulator or phone. Open a photo knife and a plain knife: both heroes are the same house photograph; the photo knife's menu still opens the viewer; Back returns to the knife. If no device is available, report the Android check as blocked, not passed.

- [ ] **Step 6: Final review**

```bash
git status --short
git log --oneline -5
```

The working tree should be clean. Do not push. The branch is ready for review when the four hero states, the viewer, the 320/390/640 widths and the Android bundle all pass.

## Acceptance

- Every knife, with or without a stored photo, shows the same `assets/current-edge.jpg` hero.
- The current-edge DOM has no `[data-photo]` and no `<img>`; `photoId` cannot influence it.
- A missing or failed hero asset leaves a plain dark band, never the glyph and never a broken image.
- The owner's photo is still available in the library thumbnail, the add/edit form and the viewer; "View photo" appears only when `photoId` exists.
- `DESIGN.md` and `docs/design-brief.md` say the hero is the house photograph; the old plan is marked superseded.
- `npm test` is 17/17; the browser and Android checks above pass.
