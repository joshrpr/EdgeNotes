# Edge Notes — Design Brief

**Status:** implemented (v2, Honyaki)
**Date:** 2026-10-22
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

## 3. Selected direction — Honyaki

The world is a hand-forged blade at night: brushed sumi-black steel, a hamon temper
line, brass for the measurement, and one vermilion chop for a record. The Japanese
cue comes from the metallurgy, the Mincho lettering and the chop — not from costume:
no kanji, no blossoms, no rising sun, no faux-wood decoration. On an Operate surface
the world changes type, light, material and one signature instrument; the one-stack
navigation, touch sizes and plain voice stay.

### Palette

| Role | Value |
|---|---|
| Ground | `#090D10` |
| Ground deep | `#06090B` |
| Steel surface | `#121A1F` |
| Steel raised | `#182227` |
| Inset well | `#0B1114` |
| Hairline | `#243138` |
| Strong line | `#35464E` |
| Text | `#E9EFF2` |
| Text muted | `#9BA9B0` |
| Text quiet | `#7E8D94` |
| Brass (angles, primary action) | `#D8A34A` |
| Brass pressed | `#F2C776` |
| Steel light | `#C9D5DB` |
| Seal vermilion (records only) | `#B23A2E` |
| Error | `#F07B62` |

Brass marks the angle and the one primary action, and nothing else. The vermilion
chop appears only where a sharpening is recorded; it is never decorative. Steel is
the material, not a third accent. All text pairs used clear 4.5:1 against their
grounds; quiet labels clear 5:1.

### Type

| Role | Face and size |
|---|---|
| Hero angle, knife page | Shippori Mincho 600, 66 sp, tabular-free |
| Bench angle, library | Shippori Mincho 600, 54 sp |
| Row angle | Shippori Mincho 600, 29 sp |
| Knife name / screen title | Shippori Mincho 600, 23–25 sp |
| Body, notes, fields | Roboto / system sans, 14.5–16 sp |
| Meta (dates, recency) | system sans, 12–13 sp |
| Section label | system sans 10.5 sp, 600, tracked caps |

Shippori Mincho is bundled as a Latin subset (two weights, 28 KB each, OFL). The
system sans handles all scanning text, so a user-entered Japanese knife name falls
back to the platform's serif rather than a bundled CJK face.

### Signature move

The **true-angle wedge**: a blade cross-section with its apex at the edge, drawn
from the recorded angle itself. The two bevels open at one per-side angle each, and
the included angle is the apex. The figure is derived from the number, not
decorated with it: 10°, 17.5° and 25° are visibly different instruments. It appears
small on the bench plate, large on the knife page, and live in the log sheet as the
angle is typed. It is a readout, not a dial or a slider; the angle is still entered
with a keyboard.

### Density and form

2 sp radii; one hairline border per plate; 64–84 sp rows, 54 sp photo thumbnails;
48 sp minimum touch targets with 12 sp gaps; 16 sp gutters; a 640 sp reading column
on wide screens. Elevation is declared once per element: hairline or shadow, not
both. The one full-bleed steel band is the last-sharpened certificate.

## 4. Structure — one stack

Library → Knife → full-screen Log sheet, with Add/Edit knife and the photo viewer as
routes. System Back returns one step and is never trapped. No tab bar, no drawer, no
FAB. The primary action sits in a fixed bottom bar above the Android navigation inset.

### Library (root)

- Steel masthead: the EN maker's mark, "Edge Notes" in Mincho, and a single hamon
  line drawn across the bottom edge.
- Search well directly beneath it, sticky with the masthead: "Find a knife".
- **Last on the bench:** the most recently sharpened knife gets a steel plate with
  its name, a 54 sp angle, the live wedge and "35° included", plus recency. The
  plate is the row for that knife; it is not repeated in the list below. With an
  active search the plate gives way to results.
- Library rows: 54 sp thumbnail (photo or the house knife), name, included angle and
  recency, with the angle in brass at reading size.
- Sorted by most recent sharpening; never-sharpened knives last, by date added.
  Their angle is an em dash and their meta reads "Not sharpened yet".
- Search filters by name; no matches keeps the query in place and offers a clear.
- Footer, quiet: backup, restore, last backup and build, and a muted erase behind a
  second confirmation.

### Knife

- App bar: back, 40 sp thumbnail, the name in Mincho, overflow (Edit, Delete).
- Full-bleed **last-sharpened certificate**: label, a small vermilion chop, the
  angle at 66 sp in brass with "per side", the wedge with "35° included", and the
  relative and exact date. Rating, burr/stropped chips and the note follow on the
  same steel.
- History: "Sharpened 4 times · 15°–17.5° per side", then every entry newest first
  with full date, angle and rating. Tapping an entry opens it for editing.
- Bottom bar: brass "Sharpen again · 17.5°"; for a knife with no history, the band
  becomes "Not sharpened yet" and the bar reads "Log first sharpening".

### Log sheet

- Full screen, one column, Save pinned at the bottom and disabled until the angle is
  valid.
- Date defaults to today and opens a date picker.
- **Measure well:** the angle field and a live true-angle wedge side by side. The
  numeric keypad is per side only, comma accepted, degree optional; the included
  angle updates under the wedge live; 1–45° is enforced with a clear message.
- Rating: five labelled rows (Dull, Working edge, Shaves, Push cuts newspaper, Hair
  whittling), one tap, optional; the selected row takes a brass border and wash.
- Burr raised and Stropped as two brass switches; notes as a multi-line field.

### Add/Edit knife

Name (required), photo sheet (Camera / Gallery / Remove), notes; Save in the bottom
bar. The photo frame holds the house knife until a photo arrives. Deleting a knife
confirms with the knife's name and a count of sharpenings.

### Supporting surfaces

Full-screen dimmed photo viewer, dismissible update bar below the masthead, and
snackbars (4 s) for Undo and save status. Dialogs are steel plates with a Mincho
title and one brass or danger action.

## 5. Entry flow

"Sharpen again" opens the sheet pre-filled with the previous angle and today's date,
without raising the keyboard or stealing focus; Save is the second tap. A first
sharpening opens the same sheet empty. Editing a past entry opens it pre-filled.
Deleting an entry closes the sheet and shows Undo; nothing else interrupts.

## 6. States

- **Empty library:** the house gyuto drawn flat in steel and walnut, "No knives yet",
  one add path in the fixed bar.
- **No history:** the knife band reads "Not sharpened yet" without a chop; the bar
  reads "Log first sharpening".
- **No photo:** the house knife at 36 × 24, never a grey box.
- **No search matches:** the house gyuto, a line naming the query and a clear action.
- **Long content:** names ellipsize in one line; notes wrap and the band grows; the
  app bar title ellipsizes.
- **Invalid angle:** the wedge collapses to its edge point, reads "No angle yet",
  and Save stays disabled until it is valid.
- **Restore:** summary counts before applying; result reports added versus already
  present.
- **Failures:** storage and photo errors in plain language with a next step.
- **Update available:** quiet bar, dismissible, never modal.

## 7. Motion

Route changes cut the next screen in behind a 400 ms blade: a 14% slant, a steel rim,
and the knife's angle carried between its row and the hero. The outgoing page never
moves.

On arrival the hamon draws across the masthead. On the knife page, the true-angle
wedge draws itself from the edge outward, and a single specular pass crosses the
steel once. A save redraws the wedge at the new angle, presses a vermilion chop into
the new history row and rules it in brass; the number never counts. Reduced motion
cuts instantly and shows the wedge and the chop at rest. A 120 ms press glint, the
snackbar and the existing haptics remain.

## 8. Boundaries

- No angle chart, dial or slider; the wedge is a readout and the angle is typed.
- No swipe gestures; no tab bar, drawer or FAB.
- No glass, stock photography, faux kanji or emoji as icons; one flat vector knife
  mark, drawn from geometry.
- Gradients are material light on steel only; no gradient text and no colored glow.
- No gamification, badges or streaks.
- The archery app and `docs/requirements.md` remain untouched.
- Fidelity: production-ready design intent and implemented code.

## 9. Open craft items

1. Launcher icon artwork that reads at 48 px through the adaptive-icon mask.
2. The camera/gallery path with a real photo has not been exercised since the
   reskin; verify the steel frame and the viewer on device.
3. Android system font scale at 1.3: the layout is tested at 320 and 390 px with
   the browser at 100%; re-check on the emulator before shipping.
4. The 45° wedge is geometrically true but visually extreme; watch it with real
   (unlikely) cleaver entries before deciding on a cap for the readout only.
