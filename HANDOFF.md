# EdgeNotes — handoff for a fresh chat

**Date:** 2026-10-23
**Project root:** `C:\Users\joshr\Projects\Edgenotes2`
**Git:** `main`, origin `https://github.com/joshrpr/EdgeNotes.git`
**App:** Edge Notes — a vanilla HTML/CSS/JS sharpening log packaged with Capacitor 8 for Android.

## Read first

1. `README.md` — what the app does and the development commands.
2. `docs/superpowers/plans/2026-10-23-fixed-current-edge-hero.md` — the implemented plan, with the evidence in its **Implementation record**.
3. `DESIGN.md` and `docs/design-brief.md` — the visual contract.
4. `web/js/app.js` and `web/style.css` — the current implementation.

## Current state

The fixed current-edge hero is implemented, verified and committed. `npm test` passes **17/17**.

| Commit | What it did |
|---|---|
| `77559c5` | Add the house knife hero photograph as `web/assets/current-edge.jpg`. |
| `ad33ed3` | Fix the current edge to the house photograph (CSS background, `currentEdge()`). |
| `4d8a6b5` | Keep the stored photo reachable from the knife overflow menu. |
| `02c8416` | Record the fixed house hero in the design brief, `DESIGN.md`, the old plan and the art prompt. |
| `3b62cd2` | Add the plan and this handoff. |

## What shipped

- Every knife — with a stored photo, with no photo, after Remove photo, or with an orphaned `photoId` — shows the same full-bleed 120 px house photograph on `.edge-photo`.
- The hero is a CSS background (`url("assets/current-edge.jpg")` on the existing `--ground`), not an `<img>` and not tied to `photoId`. It carries no `[data-photo]`, so `hydratePhotos()` cannot replace it, and a missing asset leaves a plain dark band rather than a broken image or the glyph.
- The owner's stored photo still lives in three places: the library thumbnail/bench, the add/edit form preview, and the full-screen `/knife/:id/photo` viewer.
- **View photo** appears in the knife overflow menu only when `photoId` exists and opens that existing viewer; X, Escape and Android Back all return to the knife page.
- At 320 px `cover` cropped both the handle butt and the tip, so `@media (max-width: 360px) { .edge-photo { background-size: contain } }` ships. 390 and 640 px keep the wider `cover` crop.
- `web/assets/current-edge.jpg` is a byte-identical copy of `prototypes/overdrive/art/knife-hero.jpg` (1600×475, ~60 KB, matching SHA-256). Do not regenerate, re-crop or re-encode it.

## Verification already done

- `npm test`: 17/17.
- Browser: the four hero states return `bg` containing `current-edge.jpg`, `stored: false`, label “Current edge”, no horizontal overflow; menu shows **View photo** only for the photo and orphan knives; the orphan viewer falls back to the glyph; library bench/thumbnail, form preview and Remove photo unchanged.
- Widths 320/390/640: hero stays 120 px and full-bleed, no horizontal scroll, angle/wedge/action bar unmoved.
- Android: `npm run sync` copied the asset (hash matches), the debug APK built from the local `.toolchains` JDK 21 and SDK in the backup folder, contains `assets/public/assets/current-edge.jpg`, and ran on the emulator. Photo and plain knives show the same hero; the menu opens the stored photo; Back returns to the knife. Font scale 1.3 and reduced motion both render the hero and angle.

## Open item

- **Real camera/gallery path on a physical phone.** The emulator covers rendering, the menu, Back, font scale and reduced motion, but not adding a knife from a real camera or gallery. This is craft item #2 in the design brief and the only unverified surface.

## Constraints and gotchas

- Work only in `C:\Users\joshr\Projects\Edgenotes2`. `C:\Users\joshr\Projects\EdgeNotes` is backup-only and holds the local `.toolchains` (JDK 21, Android SDK, Gradle cache, AVD); point at it, never copy it in.
- This folder has no `.toolchains`. `cap sync` and `npm test` need no Java; an APK build needs JDK 21 and the Android SDK from the backup folder.
- Do not copy `node_modules`, `.toolchains`, `android/.gradle`, `android/build` or `android/app/build` between the folders.
- Pushing `main` is a release: `.github/workflows/android.yml` runs on every push to `main`, builds a signed release APK with `versionCode` = the Actions run number, and publishes `edge-notes-android-<run>`.
- The older `docs/superpowers/plans/2026-10-22-photo-knife-page.md` is superseded. Do not reintroduce its `photoId`-driven hero.
- Some archived `.superpowers` notes still contain the old absolute path. Ignore those; `Edgenotes2` is the canonical root.
