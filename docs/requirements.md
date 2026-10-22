# Edge Notes — Product Requirements

**Status:** requirements confirmed; interface designed; v1 built
**Date:** 2026-10-20
**Source:** requirement rounds (three grilling rounds + initial scoping)
**Scope:** product, UX and data requirements only. By request this document contains
no technical implementation plan and no application code.

---

## 1. Problem

I sharpen my own knives and want to remember the angle I used on each one, so that
next time I can set the sharpener up the same way without guessing.

**Job story:** When I'm at the sharpener with a knife from my drawer, I want to see
the angle I used last time in a couple of taps, so I can reset the setup exactly.

## 2. Success criteria

- Find any knife in a 15–20 knife library in about five seconds.
- See the last angle without opening a form or scrolling past other knives.
- Log a repeat sharpening in three taps or fewer.
- Restore everything, photos included, after a reinstall.
- Works fully offline, at the bench, with no account.

## 3. Users and distribution

- Single user, personal tool. Not shared, not multi-user.
- Android app installed by sideload from a GitHub release (APK), with install-over
  updates. Not on the Play Store.
- Own identity, independent of the existing archery app in this repository, which
  must keep working unchanged.

## 4. Product principles

1. **Bench-first.** One hand, dim light, sharpener in the other. Large touch
   targets, no precision gestures, no hover states.
2. **Recall over analysis.** The last angle is the hero number on every surface.
   Analysis that doesn't help the next setup doesn't belong in v1.
3. **Forgiving.** Everything can be edited or deleted. Destructive actions ask first.
4. **Private by default.** Data stays on the phone. No account, no analytics.
5. **Offline always.** No network dependency for any core action.

## 5. Domain model and terminology

| Term | Meaning |
|---|---|
| **Knife** | A tracked knife: name, optional photo, optional notes, date added. |
| **Sharpening** | One event: date, angle, optional edge rating, optional burr/stropped flags, optional notes. Belongs to exactly one knife. |
| **Angle per side** | The angle between the blade's centreline and the sharpened bevel on one side. This is the stored value. |
| **Included angle** | Twice the per-side angle, i.e. the total edge angle. Always derived, never stored separately. |
| **Edge rating** | Optional 1–5 judgement of how the edge came out (labels to be settled in design). |
| **Library** | The collection of knives: expected 5–20, never more than ~50. |

## 6. Functional requirements

### FR-1 Library list (must)

- Shows every knife, sorted by most recent sharpening, newest first; knives never
  sharpened fall to the end, ordered by when they were added.
- Each row shows: photo (or a neutral placeholder), name, the last angle in
  prominent type, and a relative recency such as "3 weeks ago".
- Tapping a row opens the knife.
- The last angle is shown in both conventions (e.g. "17.5° per side" plus
  "35° included") without crowding the row.

### FR-2 Search (must)

- A search field above the list; filters as you type, case- and accent-insensitive.
- Matches knife names only; notes are never searched.
- A "no matches" state that makes clearing the search obvious.
- Clearing the search restores the full list in its normal order.

### FR-3 Empty library (must)

- First launch explains in one short line what the app does and offers a single
  primary action to add the first knife.

### FR-4 Add a knife (must)

- Name is required; everything else is optional.
- Photo is optional. Tapping the photo area offers take a photo, choose from
  gallery, or remove; photos are straightened from their EXIF rotation and
  downscaled automatically, with no crop editor and no multiple photos.
- Saving returns somewhere useful (the new knife, or the list) with confirmation.

### FR-5 Edit or delete a knife (must)

- Name, photo and notes are editable at any time.
- Deleting a knife also deletes its sharpenings and its photo. It is the only
  delete that asks first, with a confirmation naming the knife and counting what
  will go.

### FR-6 Knife page (must)

- Photo (tap to view full screen), name, notes.
- A last-sharpening card, visually first: angle per side and included, date,
  edge rating if set, burr/stropped if set, note if any.
- The history of every sharpening, newest first, each with angle, date, rating
  and note, and with edit and delete actions.
- A one-line history summary: "Sharpened 4 times · 15°–17.5°".
- Dates read in full (e.g. "4 Oct 2026"); the last-sharpening card also says how
  long ago, e.g. "3 weeks ago".

### FR-7 Log a sharpening (must)

- Date defaults to today and can be changed.
- Angle is required and entered as **per-side only**, with the included angle
  shown live underneath. Accepts decimals, a comma decimal separator and an
  optional degree sign. Valid range 1–45° per side; out-of-range values are
  rejected with a clear message rather than silently corrected.
- Edge rating is optional and single tap, with five levels: Dull, Working edge,
  Shaves, Push cuts newspaper, Hair whittling.
- Burr raised and stropped are optional flags.
- Notes are optional and multi-line.

### FR-8 Repeat the last sharpening (must)

- The primary action on the knife page offers to log a new sharpening at the
  previous angle, dated today, in one tap.
- The prefilled angle is editable before saving; the prefill is a default, not a
  constraint. Saving always creates a new history entry.

### FR-9 Edit or delete a sharpening (must)

- Any past sharpening can be edited with the same form used to log it, or deleted
  immediately with a brief Undo — no confirmation dialog.

### FR-10 Photos (must)

- One photo per knife, not per sharpening.
- Photos are downscaled and compressed on import, stored on the device, and never
  uploaded anywhere.
- A failed or unreadable photo must never prevent the knife or sharpening from
  saving; the user is told and can retry.
- Photos are included in backups.

### FR-11 Backup (must)

- Lives in a quiet section at the foot of the library, together with the build
  number and a muted "Last backup: 2 months ago" line. It never interrupts.
- Exports every knife, every sharpening, every note and every photo as one file.
- Saved through Android's share sheet so it can go to Drive, Files or a message.
- The filename identifies the app and the date.
- A backup taken today must be restorable on a fresh install tomorrow.

### FR-12 Restore (must)

- Reads a backup file, shows what it contains before changing anything, and merges
  by identity rather than replacing.
- Restoring the same file twice changes nothing (idempotent merge).
- Never deletes existing data. Reports what was added and what was already there.
- Refuses files that are not Edge Notes backups, explaining why.

### FR-13 Erase everything (must)

- Available but deliberately hard to reach; requires an explicit second
  confirmation that states the loss is permanent.

### FR-14 Update check (must)

- On launch, asynchronously, compares the installed build with the newest
  published Edge Notes release.
- If a newer build exists, shows a dismissible, non-blocking bar with a link to
  the new APK. Never installs anything itself.
- Silent and harmless when offline or rate-limited.
- This is the app's only network call.

### FR-15 Version visibility (must)

- The installed build number is visible somewhere sensible (e.g. alongside
  backup options).

### FR-16 Feedback (must)

- Saving, editing and deleting are confirmed by brief, non-blocking feedback.
- Storage failures (full device, photo too large) and restore failures are
  explained in plain language with a suggested next step, never as a raw error.

## 7. Data requirements

- Comfortable with 0–20 knives and dozens of sharpenings each.
- Photos at roughly 1400 px on the long edge, JPEG-compressed; a full library
  should cost megabytes, not hundreds of megabytes.
- All data lives on the device and survives restarts and app updates.
- Uninstalling erases the data; the backup/restore path is the documented remedy.
- Corrupt or partially written local data must not crash the app; the app should
  recover to a usable state and say what happened.
- No data leaves the device apart from the update check (which sends no content).

## 8. Surfaces and states for the design pass

Every surface below needs default, empty, error and long-content behaviour
(long names, long notes, missing photo, many sharpenings):

1. **Library** — empty, populated, search focused, searching with results, no matches.
2. **Knife** — with photo / without photo, with history / no history yet, long notes.
3. **Add or edit knife** — blank, photo attached, validation error.
4. **Log or edit sharpening** — blank, prefilled repeat, validation error.
5. **Photo viewer** — full-screen, dismiss behaviour.
6. **Backup and restore** — idle, file chosen with summary, success, refusal, failure.
7. **Erase everything** — confirm.
8. **Update bar** — visible, dismissed.
9. **Transient feedback** — saved, deleted, storage error.

## 9. Out of scope for v1

Angle-over-time chart; knife categories or types; photos per sharpening; grit,
stone or method tracking; multiple photos per knife; measurement or angle tools;
accounts or cloud sync; multi-user; Play Store release; iOS; a web/PWA build;
CSV export; reminders or notifications; barcode/QR scanning.

## 10. Constraints and environment facts

- Android only, own package identity, own APK and release channel.
- Built with the repository's existing Capacitor toolchain; the APK is produced by
  GitHub Actions because this computer has no JDK or Android SDK installed.
- Sideloaded and updated by installing a newer APK over the old one; the signing
  key must stay stable for updates to install.
- The repository publishes GitHub Pages from its root, so the app's web files are
  publicly readable at that address. They contain no data and carry a noindex tag.
- This working copy has no git remote configured and no GitHub CLI, so publishing
  to `main` may require a one-time sign-in.

## 11. Definition of done

Done means installed on the phone and used for real:

- The APK is built by CI, installs, and launches.
- A real knife is added with a real photo, and at least two sharpenings are logged.
- Repeat sharpening logs a new entry at the previous angle in one tap.
- A backup is exported, the app data is erased, and the backup restores everything,
  photos included.
- A second restore of the same file reports that nothing was added.
- Data is still there after closing and reopening the app.
- The update check is silent when offline and does not block launch.

## 12. Decision log

| # | Decision | Made in |
|---|---|---|
| 1 | Standalone app, own icon, name, package, APK and release channel; archery app untouched | scoping |
| 2 | Build route: Capacitor app in this repository | round 1 |
| 3 | Job is bench-side recall of the last angle, not analytics | round 1 |
| 4 | Audience: just the owner; sideload, no Play Store | round 1 |
| 5 | One record per sharpening: date, per-side angle, optional rating, burr/stropped, notes | round 1 |
| 6 | Manual backup including photos; merge-based restore; no cloud | round 1 |
| 7 | Done means installed and used with real data | round 1 |
| 8 | Fast path: recency-sorted list, last-angle-first knife page, one-tap repeat | round 2 |
| 9 | Keep full sharpening history, newest first | round 2 |
| 10 | Single per-side angle field with included angle displayed | round 2 |
| 11 | No knife type/category field | round 2 |
| 12 | Edge rating kept, optional, one tap | round 2 |
| 13 | No angle chart in v1 | round 3 |
| 14 | Library of 15–20 knives; search above recency-ordered list; no pins or alphabetical sections | round 3 |
| 15 | Photo optional on a knife | round 3 |
| 16 | Past sharpenings editable in place | round 3 |
| 17 | In-app update check retained | round 3 |
| 18 | App name **Edge Notes** | round 3 |
| 19 | Package id `com.joshrpr.edgenotes` | round 4 |
| 20 | Dark charcoal surfaces with a brass accent on angles and the primary action | round 4 |
| 21 | Backup, restore, erase and the build number sit in a quiet library footer | round 4 |
| 22 | One-line history summary replaces the chart | round 4 |
| 23 | Edge rating: Dull, Working edge, Shaves, Push cuts newspaper, Hair whittling | round 4 |
| 24 | Relative recency on the list; full dates in history | round 4 |
| 25 | Search matches knife names only | round 4 |
| 26 | Knife deletes confirm; sharpening deletes offer Undo | round 4 |
| 27 | Camera-first photo sheet with gallery option; no cropping | round 4 |
| 28 | Last-backup line only; no reminders or interruptions | round 4 |
| 29 | Web files stay public on GitHub Pages, noindex, as a live preview | round 4 |
| 30 | Publish by committing and pushing to main; sign in if Git prompts | round 4 |

## 13. Open items for design

No product decisions remain open. What is left is craft for the design pass, not
questions for the owner:

1. **Icon artwork** — a knife glyph that reads at 48 px and survives the adaptive
   icon's circular mask.
2. **Empty-state and first-run copy** — one line of purpose plus the add action.
3. **Type scale and touch targets** — sized for one-handed use in poor light.
4. **Search field placement** — visible at rest or revealed on scroll, given only
   15–20 knives.
5. **Transitions** — how the last-sharpening card and the Undo affordance appear
   without delay or fuss.

## 14. Next step

The design pass and the v1 build are done; see `docs/design-brief.md` and
`README.md`. What remains is the definition of done in section 11: install the
CI-built APK on the phone and use it with real knives.
