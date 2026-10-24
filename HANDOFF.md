# EdgeNotes — handoff for a fresh chat

**Date:** 2026-10-23
**Project root:** `C:\Users\joshr\Projects\Edgenotes2`
**Git:** `main`, origin `https://github.com/joshrpr/EdgeNotes.git`, HEAD `bbbfb3e`
**App:** Edge Notes — a vanilla HTML/CSS/JS sharpening log packaged with Capacitor 8 for Android.

## Read first

1. `README.md` — what the app does and the development commands.
2. `docs/superpowers/plans/2026-10-23-fixed-current-edge-hero.md` — the pending implementation plan.
3. `DESIGN.md` and `docs/design-brief.md` — the visual contract.
4. `web/js/app.js` and `web/style.css` — the current implementation.

## Current state

- This folder is a fresh clone migrated from `C:\Users\joshr\Projects\EdgeNotes`.
- `npm ci` has run; `npm test` passes **17/17**.
- `npx cap sync android` has run successfully and copied the web assets.
- The web build serves with `python -m http.server 4321 -d web`; `index.html`, `app.js`, and `style.css` all returned 200.
- **No application source has been changed for the pending feature.**
- The working tree is clean except for the new plan, which is still untracked:
  `docs/superpowers/plans/2026-10-23-fixed-current-edge-hero.md`

## Pending work

Implement `docs/superpowers/plans/2026-10-23-fixed-current-edge-hero.md` task by task:

1. Add the fixed hero asset.
2. Make the current edge fixed.
3. Keep the owner's photo reachable through a “View photo” menu item.
4. Correct the design record and mark the older photo-led plan as superseded.
5. Verify the shipped behavior in the browser and on Android.

The plan contains the exact code, commands, expected outputs, and acceptance criteria. Do not redesign it.

## Decisions already settled

- The knife-page “current edge” hero is **one fixed house photograph**, the same on every knife.
- Source: `prototypes/overdrive/art/knife-hero.jpg` — the 1600×475 crop of the Gemini still the user supplied. Copy it as-is to `web/assets/current-edge.jpg`. Do not regenerate, re-crop, or re-encode it.
- The hero is a CSS background on `.edge-photo`. It is **not** an `<img>`, has no `data-photo`, and is not tied to `photoId`.
- The owner's stored photo remains in the library thumbnail, the add/edit form preview, and the full-screen viewer.
- Add a **“View photo”** item to the knife overflow menu only when `photoId` exists.
- No new dependencies, data fields, routes, storage, or test harness.
- `GLYPH` stays for thumbnails, the form preview, and the viewer, but must never appear in the current-edge band.
- The plan's project-root line has been updated to `C:\Users\joshr\Projects\Edgenotes2`.

## Constraints and gotchas

- Work only in `C:\Users\joshr\Projects\Edgenotes2`. Do not edit `C:\Users\joshr\Projects\EdgeNotes`; that is the backup and the only copy of the local `.toolchains` (JDK, Android SDK, Gradle cache, AVD).
- The new folder has **no `.toolchains`**. `cap sync` works without Java, but an APK build needs JDK 21 and the Android SDK installed or pointed to separately.
- Do not copy `node_modules`, `.toolchains`, `android/.gradle`, `android/build`, or `android/app/build` from the old folder.
- The plan calls for one commit per task. Confirm the user's commit/push preference before committing; do not push.
- Some archived `.superpowers` notes still contain the old absolute path. Ignore those references; `Edgenotes2` is the canonical root now.
- The older `docs/superpowers/plans/2026-10-22-photo-knife-page.md` is the superseded design. Do not reintroduce its `photoId`-driven hero.

## First step

The previous thread was paused before implementation. When the user says to proceed, start at Task 1 of the fixed-hero plan. Do not change code before that instruction.
