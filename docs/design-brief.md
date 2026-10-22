# Edge Notes — Design Brief

**Status:** approved and implemented (v1)
**Date:** 2026-10-20
**Sources:** `PRODUCT.md`, `docs/requirements.md`
**Mode:** Operate — the user came to get a job done at the bench.

---

## 1. Job and audience

One owner sharpens their own knives (a library of roughly 5–20) at a bench, phone
held in one hand, knife or sharpener in the other, in dim or mixed light, sometimes
weeks between sessions. They arrive with one question: *what angle did I use on this
knife last time?*

## 2. Outcome and proof

The last angle is visible on its library row and monumental on the knife page, and a
repeat sharpening is logged without typing the angle again.

- Find any knife in about five seconds.
- Log a repeat sharpening in two taps.
- Adjust anything about the entry before it is saved.

## 3. Selected direction — Toolroom

The world is precision metrology: machinist's gauge blocks, engraved scales, brass
verniers, toolroom catalogues. On an Operate surface it contributes only type,
palette, density and one signature move — never layout, navigation or controls.

### Palette

| Role | Value |
|---|---|
| Ground | `#0F1214` |
| Surface | `#171C1F` |
| Surface raised | `#1E2529` |
| Hairline | `#2C353A` |
| Text | `#E8EDF0` |
| Text muted | `#93A1A8` |
| Brass (angles, primary action, tick pip) | `#D8A34A` |
| Brass pressed | `#F0C070` |
| Error | `#E2725B` |

Brass is not a decorative accent: it marks the angle and the one primary action,
and nothing else on a screen uses it.

### Type

System Roboto with tabular numerals; no bundled display face.

| Role | Size / weight |
|---|---|
| Angle, knife page | 44 sp / 600, tabular |
| Angle, library row | 28 sp / 600, tabular |
| Included angle | 13 sp / 400 muted |
| Screen title | 22 sp / 600 |
| Knife name | 20 sp / 600 |
| Body and notes | 16 sp / 400 |
| Section label | 12 sp / 600, tracked caps |
| Meta (dates, counts) | 13 sp / 400 muted |

### Signature move

The angle readout: a large tabular numeral with the included angle beneath it and a
96 × 6 dp tick scale marking 10–25°, with a brass pip at the current angle. Static
data graphic, not a dial or slider; it gives the number a sense of measure without
asking for a precision gesture.

### Density and form

76 dp library rows, 56 dp photo thumbnails, 48 dp minimum touch targets with 8 dp
gaps, 16 dp screen gutters, 4 dp corner radii, hairline dividers instead of shadows.

## 4. Structure — one stack

Library → Knife → full-screen Log sheet, with Add/Edit knife and the photo viewer as
routes. System Back returns one step and is never trapped. No tab bar, no drawer, no
FAB. The primary action sits in a fixed 64 dp bottom bar above the Android
navigation inset.

### Library (root)

- App bar "Edge Notes"; always-visible 48 dp search field directly beneath it.
- Rows: 56 dp photo thumbnail (or brass knife glyph), name in one line, included
  angle in muted 13 sp, then the angle in brass and relative recency ("3 weeks ago").
- Sorted by most recent sharpening; never-sharpened knives last, by date added.
- Search filters by name, case- and accent-insensitive; no matches shows a clear
  reset.
- Footer, visually quiet: Save backup, Restore, "Last backup: 2 months ago · Build
  42", and a muted "Erase everything" behind a second confirmation.

### Knife

- App bar: back, 56 dp thumbnail, name, overflow (Edit knife, Delete knife).
- Last-sharpening card first: label LAST SHARPENED, 44 sp angle, "35° included ·
  3 weeks ago", rating line, burr/stropped chips, note if present.
- History: "Sharpened 4 times · 15°–17.5°", then every entry newest first with full
  date, angle and rating. Tapping an entry opens it for editing.
- Bottom bar: brass "Sharpen again · 17.5°"; for a knife with no history, "Log first
  sharpening" in the same position.

### Log sheet

- Full screen, one column, Save pinned at the bottom and disabled until the angle is
  valid.
- Date defaults to today and opens a date picker.
- Angle field: numeric keypad, per side only, comma accepted, degree sign optional;
  the included angle updates live underneath; 1–45° enforced with a clear message.
- Rating: five labelled rows (Dull, Working edge, Shaves, Push cuts newspaper, Hair
  whittling), one tap, optional.
- Burr raised and Stropped as two switches; notes as a multi-line field.

### Add/Edit knife

Name (required), photo sheet (Camera / Gallery / Remove), notes; Save in the bottom
bar. Deleting a knife confirms with the knife's name and a count of sharpenings.

### Supporting surfaces

Full-screen dimmed photo viewer, dismissible update bar below the app bar, and
snackbars (4 s) for Undo and save status.

## 5. Entry flow

"Sharpen again" opens the sheet pre-filled with the previous angle and today's date,
without raising the keyboard or stealing focus; Save is the second tap. A first
sharpening opens the same sheet empty. Editing a past entry opens it pre-filled.
Deleting an entry closes the sheet and shows Undo; nothing else interrupts.

## 6. States

- **Empty library:** knife glyph, "No knives yet", one add button.
- **No history:** the last-sharpening card becomes "Not sharpened yet" with the
  log-first action.
- **No photo:** 40 dp brass knife glyph on graphite, never a grey box.
- **No search matches:** one line naming the query and a clear action.
- **Long content:** names ellipsize at one line; notes wrap and the card grows.
- **Restore:** summary counts before applying; result reports added versus already
  present.
- **Failures:** storage and photo errors in plain language with a next step.
- **Update available:** quiet bar, dismissible, never modal.

## 7. Motion

150–200 ms fade-through between routes, 120 ms press scale, snackbar slide-up. The
angle never animates while it is being read; no counting numbers. Reduced motion
collapses every transition to a cut.

Two moments earn a longer response, and the gauge carries both:

- **Opening a knife** draws the 10–25° rule, lighting each tick as the sweep passes
  it, and lands the pip on the angle with a punched witness mark (about half a
  second). The number itself stays still.
- **Logging a sharpening** carries the pip from the previous angle to the new one,
  then rules the new history entry in brass and lets the ink settle to the hairline.
  The confirmation names what was recorded ("Sharpening logged · 19° per side").

A short haptic answers a library row; a save gets two, the record and the pip
landing. No confetti, counts, badges or streaks: the acknowledgement is the
measurement being taken and written down.

## 8. Boundaries

- No angle chart, dial or slider; no swipe gestures; no tab bar, drawer or FAB.
- No glass, gradients, stock photography or decorative illustration.
- No gamification, badges or streaks.
- The archery app and `docs/requirements.md` remain untouched.
- Fidelity: production-ready design intent. No code and no implementation plan.

## 9. Open craft items

1. Launcher icon artwork that reads at 48 px through the adaptive-icon mask.
2. Exact empty-state and first-run wording.
3. Whether the search field collapses on scroll.
4. Date-picker presentation details.
